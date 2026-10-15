// Teste de ponta a ponta: sobe o servidor com banco temporário e percorre o fluxo do cliente e do painel.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'grafica-test-'));
process.env.DATA_DIR = dir;
process.env.PORT = '3197';
process.env.ADMIN_PASSWORD = 'senha-de-teste';
const BASE = 'http://localhost:3197';

let server;
let cookie = '';
before(async () => {
  ({ server } = await import('../server.js'));
  await new Promise((r) => (server.listening ? r() : server.once('listening', r)));
});
after(async () => {
  await new Promise((r) => server.close(r));
  (await import('../src/db.js')).db.close(); // no Windows o arquivo só pode ser apagado depois de fechar o banco
  rmSync(dir, { recursive: true, force: true });
});

const call = async (path, { method = 'GET', body, auth = false } = {}) => {
  const res = await fetch(BASE + path, {
    method,
    headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}), ...(auth ? { Cookie: cookie } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const type = res.headers.get('content-type') || '';
  return { status: res.status, data: type.includes('json') ? await res.json() : Buffer.from(await res.arrayBuffer()), res };
};
const say = (phone, text, name = 'Maria Silva') => call('/api/sim/send', { method: 'POST', body: { phone, text, name } });
const thread = async (phone) => (await call(`/api/sim/messages?phone=${phone}`)).data;
const lastBot = async (phone) => (await thread(phone)).messages.filter((m) => m.direction === 'out').at(-1)?.body;

test('painel exige login', async () => {
  assert.equal((await call('/api/admin/orders')).status, 401);
  assert.equal((await call('/api/admin/login', { method: 'POST', body: { password: 'errada' } })).status, 401);
  const ok = await call('/api/admin/login', { method: 'POST', body: { password: 'senha-de-teste' } });
  assert.equal(ok.status, 200);
  cookie = ok.res.headers.get('set-cookie').split(';')[0];
  assert.equal((await call('/api/admin/orders', { auth: true })).status, 200);
});

test('preço: banner 1 x 0,80 m = R$ 120 e adesivo 1 m² = R$ 100', async () => {
  const { data: cat } = await call('/api/public/catalog');
  const banner = cat.products.find((p) => p.name.startsWith('Banner'));
  const adesivo = cat.products.find((p) => p.name.startsWith('Adesivo'));
  const q = await call('/api/public/quote', { method: 'POST', body: { items: [
    { product_id: banner.id, width_cm: '100', height_cm: '80', qty: 1 },
    { product_id: adesivo.id, width_cm: '100', height_cm: '100', qty: 1 },
  ] } });
  assert.equal(q.data.lines[0].total, 12000);
  assert.equal(q.data.lines[1].total, 10000);
  assert.equal(q.data.subtotal, 22000);
  assert.equal(q.data.entry, 11000);
  // medida inválida é recusada pelo servidor
  const bad = await call('/api/public/quote', { method: 'POST', body: { items: [{ product_id: banner.id, width_cm: '0', height_cm: '80', qty: 1 }] } });
  assert.equal(bad.status, 400);
});

test('robô: saudação com tabela e link, produto, atendente humano', async () => {
  const phone = '5511988887777';
  await say(phone, 'Oi, queria um orçamento');
  const hi = await lastBot(phone);
  assert.match(hi, /Banner em lona/);
  assert.match(hi, /R\$\s150,00/);
  assert.match(hi, /\/orcamento\?c=/);

  await say(phone, 'vocês fazem adesivo?');
  assert.match(await lastBot(phone), /Adesivo vinil/);

  await say(phone, 'quero falar com o atendente');
  const t = await thread(phone);
  assert.equal(t.human, true);
  const before = t.messages.length;
  await say(phone, 'alguém aí?');
  assert.equal((await thread(phone)).messages.length, before + 1, 'robô deve ficar quieto com atendente humano');
});

test('pedido pelo link: cria OS, PDF válido, aparece no painel e avisa o cliente', async () => {
  const phone = '5511977776666';
  await say(phone, 'oi');
  const link = (await lastBot(phone)).match(/c=([\w-]+)/)[1];
  const { data: cat } = await call(`/api/public/catalog?c=${link}`);
  assert.equal(cat.customer.phone, phone);
  const banner = cat.products.find((p) => p.name.startsWith('Banner'));

  const sig = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  const order = await call('/api/public/order', { method: 'POST', body: {
    conversation_token: link, name: 'Maria Silva', phone, email: 'maria@exemplo.com', delivery_type: 'retirada',
    payment_method: 'PIX', accept: true, signature: sig,
    items: [{ product_id: banner.id, width_cm: '100', height_cm: '80', qty: 2, finishes: ['ilhos'] }],
  } });
  assert.equal(order.status, 200, JSON.stringify(order.data));
  assert.equal(order.data.total, 12000 * 2 + 1000 * 2);

  // confirmação enviada no WhatsApp
  assert.match(await lastBot(phone), /Pedido \*#\d{4}\* recebido/);

  // PDF
  const pdf = await call(order.data.pdf_url);
  assert.equal(pdf.status, 200);
  assert.equal(pdf.data.subarray(0, 4).toString(), '%PDF');
  assert.ok(pdf.data.length > 2000);

  // painel
  const list = await call('/api/admin/orders', { auth: true });
  const row = list.data.orders.find((o) => o.number === order.data.number);
  assert.ok(row);
  assert.equal(row.status, 'novo');

  // mudar etapa => cliente é avisado
  const patched = await call(`/api/admin/orders/${row.id}`, { method: 'PATCH', auth: true, body: { status: 'producao', payment_status: 'sinal' } });
  assert.equal(patched.data.status, 'producao');
  assert.equal(patched.data.paid_amount, patched.data.entry_amount);
  assert.match(await lastBot(phone), /produção/);

  // status pelo WhatsApp
  await say(phone, 'como está meu pedido?');
  assert.match(await lastBot(phone), /Produção/);

  const dash = await call('/api/admin/dashboard', { auth: true });
  assert.equal(dash.data.byStatus.producao, 1);
});

test('validações do pedido', async () => {
  const { data: cat } = await call('/api/public/catalog');
  const p = cat.products[0];
  const base = { name: 'Zé', phone: '11999990000', payment_method: 'PIX', accept: true, items: [{ product_id: p.id, width_cm: 10, height_cm: 10, qty: 1 }] };
  assert.equal((await call('/api/public/order', { method: 'POST', body: { ...base, accept: false } })).status, 400);
  assert.equal((await call('/api/public/order', { method: 'POST', body: { ...base, payment_method: 'Fiado' } })).status, 400);
  assert.equal((await call('/api/public/order', { method: 'POST', body: { ...base, phone: '123' } })).status, 400);
  assert.equal((await call('/api/public/order', { method: 'POST', body: { ...base, delivery_type: 'entrega' } })).status, 400);
  assert.equal((await call('/api/public/order', { method: 'POST', body: { ...base, items: [] } })).status, 400);
});

test('catálogo ampliado: robô escolhe o produto mais específico', async () => {
  const { data: cat } = await call('/api/public/catalog');
  assert.ok(cat.products.length >= 25, `esperava 25+ produtos, veio ${cat.products.length}`);
  const phone = '5511966665555';
  const ask = async (text) => { await say(phone, text); return lastBot(phone); };
  assert.match(await ask('quanto custa um banner roll-up?'), /Banner roll-up/);
  assert.match(await ask('quero um banner'), /Banner em lona/);
  assert.match(await ask('vocês fazem plotagem de carro?'), /Plotagem de veículo/);
  assert.match(await ask('quanto é caneca?'), /Caneca personalizada/);
  assert.match(await ask('preciso encadernar um tcc'), /Encadernação/);
  assert.match(await ask('cartão fidelidade'), /fidelidade/i);
  // orçamento de item por unidade com faixa de quantidade e item de opção fixa
  const caneca = cat.products.find((p) => p.name.startsWith('Caneca'));
  const rollup = cat.products.find((p) => p.name.startsWith('Banner roll-up'));
  const q = await call('/api/public/quote', { method: 'POST', body: { items: [
    { product_id: caneca.id, qty: 30 },
    { product_id: rollup.id, variant: 1, qty: 2 },
  ] } });
  assert.equal(q.data.lines[0].total, 30 * 2400);
  assert.equal(q.data.lines[1].total, 2 * 26000);
});
