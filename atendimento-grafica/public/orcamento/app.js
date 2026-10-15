import { $, $$, api, brl, esc, fmtDay, signaturePad } from '/shared.js';

const params = new URLSearchParams(location.search);
const convToken = params.get('c') || '';

let catalog = null;
let items = []; // { uid, product, width_cm, height_cm, qty, variant, finishes:Set }
let uid = 0;
let lastQuote = null;
let pad = null;
let calcTimer = null;
let calcSeq = 0;

// ------------------------------------------------------------------ início

async function init() {
  try {
    catalog = await api(`/api/public/catalog${convToken ? `?c=${encodeURIComponent(convToken)}` : ''}`);
  } catch (e) {
    $('#loading').textContent = 'Não foi possível carregar o orçamento. Tente de novo em instantes.';
    return;
  }
  document.title = `Orçamento — ${catalog.business.name}`;
  $('#biz').textContent = catalog.business.name;
  if (catalog.customer?.name) {
    $('#hello').textContent = `Olá, ${catalog.customer.name.split(' ')[0]}! Escolha o que precisa, informe as medidas e veja o valor na hora.`;
    $('#name').value = catalog.customer.name;
  }
  if (catalog.customer?.phone) {
    $('#phone').value = catalog.customer.phone;
    $('#phone').readOnly = true; // vem da conversa do WhatsApp
  }
  $('#loading').hidden = true;
  $('#form').hidden = false;

  const cats = [...new Set(catalog.products.map((p) => p.category))];
  $('#cats').innerHTML = cats.length > 1
    ? ['Todos', ...cats].map((c, i) => `<button type="button" class="cat ${i === 0 ? 'on' : ''}" data-cat="${i === 0 ? '' : esc(c)}">${esc(c)}</button>`).join('')
    : '';
  drawProducts('');
  $('#pay').insertAdjacentHTML(
    'beforeend',
    catalog.payment_methods
      .map((m, i) => `<label class="choice"><input type="radio" name="pay" value="${esc(m)}" ${i === 0 ? 'checked' : ''}> <span>${esc(m)}</span></label>`)
      .join('')
  );
  $('#termsText').textContent = catalog.terms;
  pad = signaturePad($('#sig'));

  const pre = Number(params.get('p'));
  if (pre && catalog.products.some((p) => p.id === pre)) addItem(pre);
  renderSummary();
}

// ------------------------------------------------------------------ itens

function drawProducts(cat) {
  $('#pgrid').innerHTML = catalog.products
    .filter((p) => !cat || p.category === cat)
    .map(
      (p) => `<button type="button" class="pbtn" data-p="${p.id}"><b>${esc(p.name)}</b><span>${esc(p.price_label)}</span><em>+ Adicionar</em></button>`
    )
    .join('');
}

$('#cats').addEventListener('click', (e) => {
  const b = e.target.closest('[data-cat]');
  if (!b) return;
  $$('.cat').forEach((x) => x.classList.toggle('on', x === b));
  drawProducts(b.dataset.cat);
});

function addItem(productId) {
  const product = catalog.products.find((p) => p.id === Number(productId));
  if (!product) return;
  items.push({ uid: ++uid, product, width_cm: '', height_cm: '', qty: 1, variant: product.pricing_type === 'fixed' ? 0 : '', finishes: new Set() });
  drawItems();
  scheduleCalc();
  $(`[data-uid="${uid}"] input, [data-uid="${uid}"] select`)?.focus();
}

function itemHtml(it) {
  const p = it.product;
  const fin = p.finishes
    .filter((f) => f.mode === 'item' || p.pricing_type === 'm2')
    .map(
      (f) => `<label><input type="checkbox" data-fin="${esc(f.id)}" ${it.finishes.has(String(f.id)) ? 'checked' : ''}> ${esc(f.label)} <span class="muted">(+ ${brl(f.price)}${f.mode === 'm2' ? '/m²' : f.mode === 'ml' ? '/m linear' : ''})</span></label>`
    )
    .join('');
  let fields = '';
  if (p.pricing_type === 'm2') {
    fields = `<div class="row4"><label class="field"><span>Largura (cm)</span><input type="text" inputmode="decimal" data-f="width_cm" value="${esc(it.width_cm)}" placeholder="100"></label>
      <label class="field"><span>Altura (cm)</span><input type="text" inputmode="decimal" data-f="height_cm" value="${esc(it.height_cm)}" placeholder="80"></label>
      <label class="field"><span>Quantidade</span><input type="number" min="1" max="100000" data-f="qty" value="${it.qty}"></label></div>`;
  } else if (p.pricing_type === 'fixed') {
    fields = `<div class="row4"><label class="field wide" style="grid-column:span 2"><span>Opção</span><select data-f="variant">${p.variants
      .map((v, i) => `<option value="${i}" ${Number(it.variant) === i ? 'selected' : ''}>${esc(v.label)} — ${brl(v.price)}</option>`)
      .join('')}</select></label>
      <label class="field"><span>Quantos pedidos</span><input type="number" min="1" max="1000" data-f="qty" value="${it.qty}"></label></div>`;
  } else {
    fields = `<div class="row4"><label class="field"><span>Quantidade</span><input type="number" min="1" max="100000" data-f="qty" value="${it.qty}"></label></div>
      ${p.tiers?.length ? `<p class="small muted" style="margin-top:6px">Quanto maior a quantidade, menor o valor de cada unidade.</p>` : ''}`;
  }
  return `<article class="item" data-uid="${it.uid}">
    <div class="head"><div class="grow"><b>${esc(p.name)}</b></div><span class="price" data-price>—</span>
      <button type="button" class="btn sm ghost" data-rm aria-label="Remover ${esc(p.name)}">✕</button></div>
    ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ''}
    ${fields}
    ${fin ? `<div class="fin">${fin}</div>` : ''}
    <p class="bad" data-bad hidden></p></article>`;
}

function drawItems() {
  $('#items').innerHTML = items.map(itemHtml).join('');
  $('#itemsHint').hidden = items.length > 0;
}

$('#pgrid').addEventListener('click', (e) => {
  const b = e.target.closest('[data-p]');
  if (b) addItem(b.dataset.p);
});

$('#items').addEventListener('input', (e) => {
  const card = e.target.closest('[data-uid]');
  if (!card) return;
  const it = items.find((x) => x.uid === Number(card.dataset.uid));
  if (e.target.dataset.f) it[e.target.dataset.f] = e.target.value;
  if (e.target.dataset.fin) {
    e.target.checked ? it.finishes.add(e.target.dataset.fin) : it.finishes.delete(e.target.dataset.fin);
  }
  scheduleCalc();
});
$('#items').addEventListener('click', (e) => {
  if (!e.target.closest('[data-rm]')) return;
  const uidv = Number(e.target.closest('[data-uid]').dataset.uid);
  items = items.filter((x) => x.uid !== uidv);
  drawItems();
  scheduleCalc();
});

// ------------------------------------------------------------------ cálculo (feito pelo servidor)

const num = (v) => Number(String(v).replace(',', '.'));
const ready = (it) => {
  const p = it.product;
  if (!(num(it.qty) > 0)) return false;
  if (p.pricing_type === 'm2') return num(it.width_cm) > 0 && num(it.height_cm) > 0;
  return true;
};
const payload = (it) => ({ product_id: it.product.id, qty: it.qty, width_cm: it.width_cm, height_cm: it.height_cm, variant: it.variant, finishes: [...it.finishes] });

function scheduleCalc() {
  clearTimeout(calcTimer);
  calcTimer = setTimeout(calc, 250);
  renderSummary(); // atualiza já com o último valor conhecido
}

async function calc() {
  const seq = ++calcSeq;
  const valid = items.filter(ready);
  for (const it of items) {
    const card = $(`[data-uid="${it.uid}"]`);
    if (card) {
      $('[data-price]', card).textContent = '—';
      const bad = $('[data-bad]', card);
      bad.hidden = ready(it);
      bad.textContent = ready(it) ? '' : it.product.pricing_type === 'm2' ? 'Informe largura e altura para calcular.' : 'Informe a quantidade.';
    }
  }
  if (!valid.length) {
    lastQuote = null;
    renderSummary();
    return;
  }
  try {
    const q = await api('/api/public/quote', { method: 'POST', body: { items: valid.map(payload) } });
    if (seq !== calcSeq) return; // resposta antiga
    valid.forEach((it, i) => {
      const card = $(`[data-uid="${it.uid}"]`);
      if (card) $('[data-price]', card).textContent = brl(q.lines[i].total);
      it.line = q.lines[i];
    });
    lastQuote = { ...q, used: valid };
  } catch (e) {
    if (seq !== calcSeq) return;
    lastQuote = null;
    $('#err').textContent = e.message;
  }
  renderSummary();
}

function renderSummary() {
  const q = lastQuote;
  $('#barTotal').textContent = brl(q ? q.subtotal : 0);
  if (!q) {
    $('#summary').innerHTML = '<p class="muted">Adicione um produto e preencha as medidas para ver o resumo.</p>';
    return;
  }
  $('#summary').innerHTML = `<table>${q.lines
    .map((l) => `<tr><td><b>${esc(l.description)}</b><div class="small muted">${esc(l.detail)}${l.qty > 1 ? ` · ${l.qty} un` : ''}</div></td><td>${brl(l.total)}</td></tr>`)
    .join('')}</table>
    <div class="tot"><span>Total</span><span class="t">${brl(q.subtotal)}</span>
      <span class="muted">Sinal para iniciar (${catalog.entry_percent}%)</span><span>${brl(q.entry)}</span>
      <span class="muted">Previsão de entrega</span><span>${fmtDay(q.due_date)}</span></div>`;
}

// ------------------------------------------------------------------ entrega / termos / assinatura

$('#deliv').addEventListener('change', () => {
  $('#addrWrap').hidden = $('input[name=delivery]:checked').value !== 'entrega';
});
$('#termsLink').addEventListener('click', (e) => {
  e.preventDefault();
  $('#termsText').hidden = !$('#termsText').hidden;
});
$('#sigClear').addEventListener('click', () => pad.clear());

// ------------------------------------------------------------------ envio

$('#form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const err = $('#err');
  err.textContent = '';
  const fail = (msg, focusSel) => {
    err.textContent = msg;
    (focusSel ? $(focusSel) : err).scrollIntoView({ block: 'center', behavior: 'smooth' });
    if (focusSel) $(focusSel).focus({ preventScroll: true });
  };

  if (!items.length) return fail('Adicione pelo menos um produto.', '#pgrid button');
  const incomplete = items.find((it) => !ready(it));
  if (incomplete) return fail('Complete as medidas e quantidades de todos os itens.', `[data-uid="${incomplete.uid}"] input`);
  if ($('#name').value.trim().length < 2) return fail('Informe seu nome.', '#name');
  if ($('#phone').value.replace(/\D/g, '').length < 10) return fail('Informe seu WhatsApp com DDD.', '#phone');
  const delivery = $('input[name=delivery]:checked').value;
  if (delivery === 'entrega' && $('#addr').value.trim().length < 8) return fail('Informe o endereço de entrega.', '#addr');
  if (!$('#accept').checked) return fail('Aceite as condições do pedido para continuar.', '#accept');

  const btn = $('#submit');
  btn.disabled = true;
  btn.textContent = 'Enviando…';
  try {
    const r = await api('/api/public/order', {
      method: 'POST',
      body: {
        conversation_token: convToken,
        name: $('#name').value,
        phone: $('#phone').value,
        email: $('#email').value,
        doc: $('#doc').value,
        delivery_type: delivery,
        delivery_address: $('#addr').value,
        payment_method: $('input[name=pay]:checked')?.value || '',
        art_link: $('#art').value,
        notes: $('#notes').value,
        accept: true,
        signature: pad.toDataUrl(),
        items: items.map(payload),
      },
    });
    showDone(r);
  } catch (ex) {
    fail(ex.message);
    btn.disabled = false;
    btn.textContent = 'Enviar pedido';
  }
});

function showDone(r) {
  $('#form').hidden = true;
  $('.hero').scrollIntoView();
  $('#dNum').textContent = `#${r.number}`;
  $('#dInfo').innerHTML = `<dt>Total</dt><dd>${brl(r.total)}</dd><dt>Sinal para iniciar</dt><dd>${brl(r.entry_amount)}</dd><dt>Pagamento</dt><dd>${esc(r.payment_method)}</dd><dt>Previsão</dt><dd>${fmtDay(r.due_date)}</dd>`;
  $('#dPdf').href = r.pdf_url;
  $('#done').hidden = false;
}

$('#dNew').addEventListener('click', () => {
  location.href = location.pathname + (convToken ? `?c=${encodeURIComponent(convToken)}` : '');
});

init();
