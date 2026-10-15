// Tabela de rotas da API. Cada rota: [método, regex, { auth, handler }]
// handler({ params, query, body }) devolve um objeto (vira JSON) ou { raw, type, headers } para binários.
import { db, allSettings, getSetting, setSetting, transaction } from './db.js';
import { getConversation, getConversationByToken, messagesSince, reply, channelName } from './chat.js';
import { receive, STATUSES } from './bot.js';
import { hydrateProduct, priceLabel } from './pricing.js';
import { createOrder, dashboard, getOrder, getOrderByToken, listCustomers, listOrders, patchOrder, quote, ValidationError } from './orders.js';
import { buildOrderPdf } from './pdf.js';
import { baseUrl, hoursText, isOpenNow } from './config.js';

const SIMULATOR = process.env.SIMULATOR !== 'off';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

const notFound = (what = 'Não encontrado.') => new HttpError(404, what);
const num = (v, fallback = 0) => (Number.isFinite(Number(v)) ? Number(v) : fallback);

// --- produtos ------------------------------------------------------------

function productFields(b) {
  const name = String(b.name ?? '').trim().slice(0, 120);
  if (!name) throw new ValidationError('Informe o nome do produto.');
  if (!['m2', 'unit', 'fixed'].includes(b.pricing_type)) throw new ValidationError('Tipo de cobrança inválido.');
  const cents = (v) => Math.max(0, Math.round(num(v)));
  const list = (v) => (Array.isArray(v) ? v : []);
  const product = {
    name,
    category: String(b.category || 'Geral').trim().slice(0, 60),
    pricing_type: b.pricing_type,
    price: cents(b.price),
    min_price: cents(b.min_price),
    tiers: list(b.tiers)
      .map((t) => ({ min: Math.max(1, Math.round(num(t.min, 1))), price: cents(t.price) }))
      .slice(0, 20),
    variants: list(b.variants)
      .map((v) => ({ label: String(v.label ?? '').trim().slice(0, 100), price: cents(v.price) }))
      .filter((v) => v.label)
      .slice(0, 30),
    finishes: list(b.finishes)
      .map((f, i) => ({
        id: String(f.id || `a${i + 1}`).slice(0, 30),
        label: String(f.label ?? '').trim().slice(0, 100),
        price: cents(f.price),
        mode: ['item', 'm2', 'ml'].includes(f.mode) ? f.mode : 'item',
      }))
      .filter((f) => f.label)
      .slice(0, 20),
    description: String(b.description ?? '').trim().slice(0, 500),
    keywords: String(b.keywords ?? '').trim().slice(0, 300),
    production_days: Math.min(60, Math.max(1, Math.round(num(b.production_days, 2)))),
    active: b.active === false || b.active === 0 ? 0 : 1,
    position: Math.round(num(b.position, 0)),
  };
  if (product.pricing_type === 'fixed' && !product.variants.length) throw new ValidationError('Cadastre ao menos uma opção com preço.');
  // ids de acabamento precisam ser únicos
  const seen = new Set();
  product.finishes.forEach((f, i) => {
    while (seen.has(f.id)) f.id = `${f.id}_${i}`;
    seen.add(f.id);
  });
  return product;
}

const productRow = (p) => [
  p.name, p.category, p.pricing_type, p.price, p.min_price, JSON.stringify(p.tiers), JSON.stringify(p.variants),
  JSON.stringify(p.finishes), p.description, p.keywords, p.production_days, p.active, p.position,
];

const listProducts = (onlyActive) =>
  db
    .prepare(`SELECT * FROM products ${onlyActive ? 'WHERE active = 1' : ''} ORDER BY position, id`)
    .all()
    .map(hydrateProduct)
    .map((p) => ({ ...p, price_label: priceLabel(p) }));

// --- configurações --------------------------------------------------------

const MAX_IMG = 600_000;
function settingsPatch(b) {
  const out = {};
  if (b.business) {
    const s = (v, n = 200) => String(v ?? '').trim().slice(0, n);
    out.business = {
      name: s(b.business.name, 100),
      owner: s(b.business.owner, 100),
      cnpj: s(b.business.cnpj, 30),
      phone: s(b.business.phone, 30),
      email: s(b.business.email, 100),
      address: s(b.business.address, 200),
      instagram: s(b.business.instagram, 60),
      pix_key: s(b.business.pix_key, 100),
    };
    if (!out.business.name) throw new ValidationError('Informe o nome da gráfica.');
  }
  if (b.hours) {
    if (!Array.isArray(b.hours) || b.hours.length !== 7) throw new ValidationError('Horários inválidos.');
    out.hours = b.hours.map((h) => {
      if (!h) return null;
      if (!/^\d{2}:\d{2}$/.test(h.open) || !/^\d{2}:\d{2}$/.test(h.close)) throw new ValidationError('Horário inválido.');
      return { open: h.open, close: h.close };
    });
  }
  if (b.entry_percent !== undefined) out.entry_percent = Math.min(100, Math.max(0, Math.round(num(b.entry_percent, 50))));
  if (b.payment_methods) {
    out.payment_methods = b.payment_methods.map((m) => String(m).trim().slice(0, 40)).filter(Boolean).slice(0, 12);
    if (!out.payment_methods.length) throw new ValidationError('Mantenha ao menos uma forma de pagamento.');
  }
  if (b.public_url !== undefined) out.public_url = String(b.public_url).trim().replace(/\/+$/, '').slice(0, 200);
  if (b.notify_status !== undefined) out.notify_status = !!b.notify_status;
  if (b.terms !== undefined) out.terms = String(b.terms).slice(0, 3000);
  if (b.messages) {
    const cur = getSetting('messages', {});
    const m = { ...cur };
    for (const k of ['greeting', 'outside_hours', 'menu', 'handoff', 'quote_link', 'order_received']) {
      if (b.messages[k] !== undefined) m[k] = String(b.messages[k]).slice(0, 2000);
    }
    if (b.messages.status) {
      m.status = { ...cur.status };
      for (const s of STATUSES) if (b.messages.status[s.key] !== undefined) m.status[s.key] = String(b.messages.status[s.key]).slice(0, 500);
    }
    out.messages = m;
  }
  if (b.signature !== undefined) {
    if (b.signature && (!/^data:image\/(png|jpeg);base64,/.test(b.signature) || b.signature.length > MAX_IMG)) {
      throw new ValidationError('Assinatura inválida (use PNG ou JPG de até ~400 KB).');
    }
    out.signature = b.signature || '';
  }
  return out;
}

// --- conversas -----------------------------------------------------------

function conversationList() {
  return db
    .prepare(
      `SELECT c.id, c.phone, c.name, c.human, c.unread, c.last_message_at,
              (SELECT body FROM messages WHERE conversation_id = c.id ORDER BY id DESC LIMIT 1) AS last_body
       FROM conversations c ORDER BY c.last_message_at DESC, c.id DESC LIMIT 200`
    )
    .all();
}

// --- tabela de rotas -----------------------------------------------------

const admin = true;

export const routes = [
  // ---------- público: página de orçamento ----------
  ['GET', /^\/api\/public\/catalog$/, {
    handler: ({ query }) => {
      const b = getSetting('business', {});
      const conv = getConversationByToken(query.c);
      return {
        business: { name: b.name, phone: b.phone, address: b.address, instagram: b.instagram },
        products: listProducts(true).map(({ keywords, ...p }) => p),
        payment_methods: getSetting('payment_methods', []),
        entry_percent: getSetting('entry_percent', 50),
        terms: getSetting('terms', ''),
        open_now: isOpenNow(),
        hours: hoursText(),
        customer: conv ? { name: conv.name, phone: conv.phone } : null,
      };
    },
  }],
  ['POST', /^\/api\/public\/quote$/, { handler: ({ body }) => quote(body.items) }],
  ['POST', /^\/api\/public\/order$/, {
    handler: async ({ body }) => {
      const o = await createOrder(body);
      return { number: o.number, total: o.total, entry_amount: o.entry_amount, due_date: o.due_date, pdf_url: o.pdf_url, payment_method: o.payment_method };
    },
  }],
  ['GET', /^\/pedido\/([\w-]+)\.pdf$/, {
    handler: async ({ params }) => {
      const order = getOrderByToken(params[0]);
      if (!order) throw notFound('Pedido não encontrado.');
      const pdf = await buildOrderPdf(order);
      return { raw: pdf, type: 'application/pdf', headers: { 'Content-Disposition': `inline; filename="pedido-${order.number}.pdf"` } };
    },
  }],

  // ---------- simulador de WhatsApp (somente desenvolvimento) ----------
  ['POST', /^\/api\/sim\/send$/, {
    handler: async ({ body }) => {
      if (!SIMULATOR) throw notFound();
      const conv = await receive(body.phone, body.text, body.name);
      if (!conv) throw new ValidationError('Mensagem vazia.');
      return { ok: true };
    },
  }],
  ['GET', /^\/api\/sim\/messages$/, {
    handler: ({ query }) => {
      if (!SIMULATOR) throw notFound();
      const phone = String(query.phone || '').replace(/\D/g, '');
      const conv = phone ? db.prepare('SELECT * FROM conversations WHERE phone = ?').get(phone) : null;
      if (!conv) return { messages: [], human: false };
      return { messages: messagesSince(conv.id, num(query.after)), human: !!conv.human };
    },
  }],
  ['POST', /^\/api\/sim\/reset$/, {
    handler: ({ body }) => {
      if (!SIMULATOR) throw notFound();
      const phone = String(body.phone || '').replace(/\D/g, '');
      db.prepare('DELETE FROM conversations WHERE phone = ?').run(phone);
      return { ok: true };
    },
  }],

  // ---------- painel ----------
  ['GET', /^\/api\/admin\/dashboard$/, { auth: admin, handler: () => ({ ...dashboard(), statuses: STATUSES, channel: channelName(), open_now: isOpenNow() }) }],

  ['GET', /^\/api\/admin\/orders$/, { auth: admin, handler: ({ query }) => ({ orders: listOrders({ status: query.status, q: query.q }), statuses: STATUSES }) }],
  ['GET', /^\/api\/admin\/orders\/(\d+)$/, {
    auth: admin,
    handler: ({ params }) => {
      const o = getOrder(params[0]);
      if (!o) throw notFound('Pedido não encontrado.');
      return o;
    },
  }],
  ['PATCH', /^\/api\/admin\/orders\/(\d+)$/, { auth: admin, handler: ({ params, body }) => patchOrder(params[0], body) }],

  ['GET', /^\/api\/admin\/products$/, { auth: admin, handler: () => ({ products: listProducts(false) }) }],
  ['POST', /^\/api\/admin\/products$/, {
    auth: admin,
    handler: ({ body }) => {
      const p = productFields(body);
      const id = Number(
        db
          .prepare(`INSERT INTO products (name, category, pricing_type, price, min_price, tiers, variants, finishes, description, keywords, production_days, active, position)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(...productRow(p)).lastInsertRowid
      );
      return { id };
    },
  }],
  ['PUT', /^\/api\/admin\/products\/(\d+)$/, {
    auth: admin,
    handler: ({ params, body }) => {
      const p = productFields(body);
      const r = db
        .prepare(`UPDATE products SET name=?, category=?, pricing_type=?, price=?, min_price=?, tiers=?, variants=?, finishes=?, description=?, keywords=?, production_days=?, active=?, position=? WHERE id=?`)
        .run(...productRow(p), Number(params[0]));
      if (!r.changes) throw notFound('Produto não encontrado.');
      return { ok: true };
    },
  }],
  ['DELETE', /^\/api\/admin\/products\/(\d+)$/, {
    auth: admin,
    handler: ({ params }) => {
      const id = Number(params[0]);
      const used = db.prepare('SELECT 1 FROM order_items WHERE product_id = ? LIMIT 1').get(id);
      if (used) {
        db.prepare('UPDATE products SET active = 0 WHERE id = ?').run(id);
        return { ok: true, archived: true }; // já foi vendido: só desativa para manter o histórico
      }
      db.prepare('DELETE FROM products WHERE id = ?').run(id);
      return { ok: true, archived: false };
    },
  }],

  ['GET', /^\/api\/admin\/customers$/, { auth: admin, handler: () => ({ customers: listCustomers() }) }],
  ['PATCH', /^\/api\/admin\/customers\/(\d+)$/, {
    auth: admin,
    handler: ({ params, body }) => {
      const r = db.prepare('UPDATE customers SET notes = ? WHERE id = ?').run(String(body.notes ?? '').slice(0, 1000), Number(params[0]));
      if (!r.changes) throw notFound('Cliente não encontrado.');
      return { ok: true };
    },
  }],

  ['GET', /^\/api\/admin\/conversations$/, { auth: admin, handler: () => ({ conversations: conversationList() }) }],
  ['GET', /^\/api\/admin\/conversations\/(\d+)\/messages$/, {
    auth: admin,
    handler: ({ params, query }) => {
      const conv = getConversation(Number(params[0]));
      if (!conv) throw notFound();
      db.prepare('UPDATE conversations SET unread = 0 WHERE id = ?').run(conv.id);
      const cust = db.prepare('SELECT id, name FROM customers WHERE phone = ?').get(conv.phone);
      return { conversation: { ...conv, customer: cust ?? null }, messages: messagesSince(conv.id, num(query.after)) };
    },
  }],
  ['POST', /^\/api\/admin\/conversations\/(\d+)\/send$/, {
    auth: admin,
    handler: async ({ params, body }) => {
      const conv = getConversation(Number(params[0]));
      if (!conv) throw notFound();
      const text = String(body.text ?? '').trim().slice(0, 2000);
      if (!text) throw new ValidationError('Digite uma mensagem.');
      db.prepare('UPDATE conversations SET human = 1 WHERE id = ?').run(conv.id); // quem responde assume o atendimento
      await reply(conv, text, 'human');
      return { ok: true };
    },
  }],
  ['POST', /^\/api\/admin\/conversations\/(\d+)\/release$/, {
    auth: admin,
    handler: ({ params }) => {
      const r = db.prepare('UPDATE conversations SET human = 0 WHERE id = ?').run(Number(params[0]));
      if (!r.changes) throw notFound();
      return { ok: true };
    },
  }],

  ['GET', /^\/api\/admin\/settings$/, {
    auth: admin,
    handler: () => {
      const s = allSettings();
      return { ...s, base_url: baseUrl(), hours_text: hoursText(), channel: channelName() };
    },
  }],
  ['PUT', /^\/api\/admin\/settings$/, {
    auth: admin,
    handler: ({ body }) => {
      const patch = settingsPatch(body);
      transaction(() => {
        for (const [k, v] of Object.entries(patch)) setSetting(k, v);
      });
      return { ok: true };
    },
  }],
];
