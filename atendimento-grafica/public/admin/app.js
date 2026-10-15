import { $, $$, api, ApiError, brl, chatHtml, esc, fmtDateTime, fmtDay, fmtTime, fromCents, toast, toCents } from '/shared.js';

const view = $('#view');
const STATUS_COLOR = { novo: 'var(--cyan)', arte: 'var(--violet)', aprovacao: 'var(--yellow)', producao: 'var(--accent)', pronto: 'var(--green)', entregue: '#8a8f97', cancelado: 'var(--red)' };
const PAY_LABEL = { pendente: 'Pagamento pendente', sinal: 'Sinal pago', pago: 'Pago' };
const TYPE_LABEL = { m2: 'Por m²', unit: 'Por unidade', fixed: 'Opções fixas' };
let statuses = [];
let timer = null;
let settingsCache = null;

const badge = (cls, text) => `<span class="badge ${cls}">${esc(text)}</span>`;
const stLabel = (k) => statuses.find((s) => s.key === k)?.label || k;
const waLink = (phone) => `https://wa.me/${phone}`;

// ---------------------------------------------------------------- login / rotas

async function boot() {
  try {
    await api('/api/admin/me');
    $('#login').hidden = true;
    $('#app').hidden = false;
    const d = await api('/api/admin/dashboard');
    statuses = d.statuses;
    settingsCache = await api('/api/admin/settings');
    $('#brandName').textContent = settingsCache.business?.name || 'Gráfica';
    route();
    refreshCounts();
    setInterval(refreshCounts, 8000);
  } catch (e) {
    $('#app').hidden = true;
    $('#login').hidden = false;
  }
}

$('#loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  $('#loginErr').textContent = '';
  try {
    await api('/api/admin/login', { method: 'POST', body: { password: $('#pw').value } });
    $('#pw').value = '';
    boot();
  } catch (err) {
    $('#loginErr').textContent = err.message;
  }
});

$('#logout').addEventListener('click', async () => {
  await api('/api/admin/logout', { method: 'POST' });
  location.hash = '';
  location.reload();
});

async function refreshCounts() {
  try {
    const d = await api('/api/admin/dashboard');
    const open = d.byStatus.novo;
    const c1 = $('#cPedidos');
    c1.hidden = !open;
    c1.textContent = open;
    const c2 = $('#cConv');
    const n = d.unread;
    c2.hidden = !n;
    c2.textContent = n;
  } catch (e) {
    if (e instanceof ApiError && e.status === 401) location.reload();
  }
}

const VIEWS = { painel: renderPainel, pedidos: renderPedidos, conversas: renderConversas, produtos: renderProdutos, clientes: renderClientes, config: renderConfig };

function route() {
  clearInterval(timer);
  timer = null;
  const name = (location.hash.replace(/^#\//, '').split('?')[0]) || 'painel';
  const fn = VIEWS[name] || renderPainel;
  $$('.side a[data-r]').forEach((a) => a.classList.toggle('on', a.dataset.r === name));
  view.innerHTML = '<p class="muted">Carregando…</p>';
  fn().catch((err) => {
    console.error(err);
    if (err.status === 401) return location.reload();
    view.innerHTML = `<div class="card">Não foi possível carregar: ${esc(err.message)}</div>`;
  });
  view.focus({ preventScroll: true });
}
window.addEventListener('hashchange', route);

// ---------------------------------------------------------------- modal

function modal({ title, body, footer = '', wide = false }) {
  const ov = document.createElement('div');
  ov.className = 'overlay';
  ov.innerHTML = `<div class="modal" role="dialog" aria-modal="true" aria-label="${esc(title)}" ${wide ? 'style="width:min(900px,100%)"' : ''}>
    <header><h2 class="grow">${title}</h2><button class="btn ghost sm" data-close aria-label="Fechar">✕</button></header>
    <div class="body">${body}</div><footer>${footer}</footer></div>`;
  const close = () => {
    ov.remove();
    document.removeEventListener('keydown', onKey);
  };
  const onKey = (e) => e.key === 'Escape' && close();
  document.addEventListener('keydown', onKey);
  ov.addEventListener('mousedown', (e) => e.target === ov && close());
  ov.querySelector('[data-close]').addEventListener('click', close);
  document.body.append(ov);
  return { el: ov, close };
}

// ---------------------------------------------------------------- painel

async function renderPainel() {
  const [d, o, st] = await Promise.all([api('/api/admin/dashboard'), api('/api/admin/orders'), Promise.resolve(settingsCache)]);
  statuses = d.statuses;
  const quoteUrl = `${st.base_url}/orcamento/`;
  const pipe = statuses.filter((s) => s.key !== 'cancelado');
  view.innerHTML = `
    <header class="top"><h1 class="grow">Painel</h1>
      ${d.open_now ? badge('pronto', 'Aberto agora') : badge('cancelado', 'Fechado agora')}
    </header>
    ${d.waiting ? `<a class="alert" href="#/conversas" style="margin-bottom:14px">🙋 <strong>${d.waiting}</strong> conversa(s) com atendente humano. Veja se o cliente espera resposta.</a>` : ''}
    <div class="kpis">
      <div class="card kpi"><div class="l">Pedidos hoje</div><div class="v">${d.ordersToday}</div></div>
      <div class="card kpi"><div class="l">Vendido no mês</div><div class="v">${brl(d.revenueMonth)}</div></div>
      <div class="card kpi"><div class="l">A receber</div><div class="v">${brl(d.receivable)}</div></div>
      <div class="card kpi ${d.late ? 'warn' : ''}"><div class="l">Pedidos atrasados</div><div class="v">${d.late}</div></div>
    </div>
    <div class="pipeline">${pipe
      .map((s) => `<button class="pipe" style="--c:${STATUS_COLOR[s.key]}" data-st="${s.key}"><b>${d.byStatus[s.key]}</b><span>${esc(s.label)}</span></button>`)
      .join('')}</div>
    <div class="two">
      <div class="card"><h2 style="margin-bottom:10px">Últimos pedidos</h2>
        ${o.orders.length ? `<table class="t"><tbody>${o.orders
          .slice(0, 7)
          .map(
            (x) => `<tr data-open="${x.id}" style="cursor:pointer"><td><b>#${x.number}</b></td><td>${esc(x.customer_name)}<div class="small muted">${esc(x.summary || '')}</div></td><td>${badge(x.status, stLabel(x.status))}</td><td class="right nowrap">${brl(x.total)}</td></tr>`
          )
          .join('')}</tbody></table>` : '<p class="empty">Nenhum pedido ainda. Teste no simulador de WhatsApp e monte um orçamento.</p>'}
      </div>
      <div class="stack">
        <div class="card stack"><h2>Link do orçamento</h2>
          <p class="small muted">Já vai automático no WhatsApp. Cole também no Instagram, cartão e Google Meu Negócio.</p>
          <div class="linkbox"><input type="text" readonly value="${esc(quoteUrl)}" id="qurl" aria-label="Link do orçamento"><button class="btn" id="copyq" type="button">Copiar</button></div>
        </div>
        <div class="card stack"><h2>WhatsApp</h2>
          <p class="small">Canal atual: <strong>${d.channel === 'simulador' ? 'Simulador (de teste)' : esc(d.channel)}</strong></p>
          ${d.channel === 'simulador' ? '<p class="small muted">O robô e o painel já funcionam. Falta ligar um número real de WhatsApp (veja docs/atendimento-grafica.md).</p>' : ''}
          <a class="btn" href="/simulador/" target="_blank" rel="noopener">Abrir simulador</a>
        </div>
      </div>
    </div>`;
  $('#copyq').addEventListener('click', async () => {
    await navigator.clipboard?.writeText(quoteUrl).catch(() => $('#qurl').select());
    toast('Link copiado');
  });
  $$('[data-st]').forEach((b) => b.addEventListener('click', () => (location.hash = `#/pedidos?status=${b.dataset.st}`)));
  $$('[data-open]').forEach((r) => r.addEventListener('click', () => openOrder(r.dataset.open)));
}

// ---------------------------------------------------------------- pedidos

async function renderPedidos() {
  let mode = localStorage.getItem('gz-mode') || 'board';
  let q = '';
  const filter = new URLSearchParams(location.hash.split('?')[1] || '').get('status') || '';
  if (filter) mode = 'list';

  view.innerHTML = `
    <header class="top"><h1 class="grow">Pedidos</h1>
      <input type="search" id="q" placeholder="Buscar cliente, telefone ou nº" style="width:240px" aria-label="Buscar pedidos">
      <div class="tabs" style="margin:0">
        <button class="tab" data-mode="board">Quadro</button><button class="tab" data-mode="list">Lista</button>
      </div></header>
    <div id="body"></div>`;

  async function load() {
    const qs = new URLSearchParams({ ...(filter ? { status: filter } : {}), ...(q ? { q } : {}) });
    const r = await api(`/api/admin/orders?${qs}`);
    statuses = r.statuses;
    $$('.tab[data-mode]').forEach((t) => t.classList.toggle('on', t.dataset.mode === mode));
    mode === 'board' ? drawBoard(r.orders) : drawList(r.orders);
  }

  const card = (o) => `<div class="ocard" draggable="true" data-id="${o.id}">
      <div class="h"><span>#${o.number}</span><span>${brl(o.total)}</span></div>
      <div><b>${esc(o.customer_name)}</b></div>
      <div class="s">${esc(o.summary || '')}</div>
      <div class="f">${badge(o.payment_status, PAY_LABEL[o.payment_status])}<span class="${o.late ? 'late' : 'muted'}">${o.due_date ? '📅 ' + fmtDay(o.due_date).slice(0, 5) : ''}</span></div></div>`;

  function drawBoard(orders) {
    const cols = statuses.filter((s) => s.key !== 'cancelado');
    $('#body').innerHTML = `<div class="board">${cols
      .map((s) => {
        const list = orders.filter((o) => o.status === s.key);
        return `<section class="col" data-col="${s.key}" style="--c:${STATUS_COLOR[s.key]}"><h3><i></i>${esc(s.label)}<span class="n">${list.length}</span></h3>${list.map(card).join('')}</section>`;
      })
      .join('')}</div>
      <p class="small muted">Arraste um pedido para a próxima etapa. O cliente é avisado no WhatsApp automaticamente (dá para desligar em Configurações).</p>`;
    let dragId = null;
    $$('.ocard').forEach((c) => {
      c.addEventListener('click', () => openOrder(c.dataset.id));
      c.addEventListener('dragstart', (e) => {
        dragId = c.dataset.id;
        c.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', dragId);
      });
      c.addEventListener('dragend', () => c.classList.remove('dragging'));
    });
    $$('.col').forEach((col) => {
      col.addEventListener('dragover', (e) => { e.preventDefault(); col.classList.add('over'); });
      col.addEventListener('dragleave', () => col.classList.remove('over'));
      col.addEventListener('drop', async (e) => {
        e.preventDefault();
        col.classList.remove('over');
        if (!dragId) return;
        try {
          await api(`/api/admin/orders/${dragId}`, { method: 'PATCH', body: { status: col.dataset.col } });
          toast(`Movido para ${stLabel(col.dataset.col)}`);
        } catch (err) { toast(err.message, 'error'); }
        load();
      });
    });
  }

  function drawList(orders) {
    $('#body').innerHTML = `
      <div class="tabs"><a class="tab ${!filter ? 'on' : ''}" href="#/pedidos" style="text-decoration:none">Todos</a>${statuses
        .map((s) => `<a class="tab ${filter === s.key ? 'on' : ''}" href="#/pedidos?status=${s.key}" style="text-decoration:none">${esc(s.label)}</a>`)
        .join('')}</div>
      <div class="card" style="padding:0;overflow-x:auto">${orders.length ? `<table class="t"><thead><tr><th>Nº</th><th>Cliente</th><th>Itens</th><th>Status</th><th>Pagamento</th><th>Prazo</th><th class="right">Total</th></tr></thead><tbody>${orders
        .map(
          (o) => `<tr data-open="${o.id}" style="cursor:pointer"><td><b>#${o.number}</b></td><td>${esc(o.customer_name)}<div class="small muted">${esc(o.customer_phone)}</div></td><td class="small">${esc(o.summary || '')}</td><td>${badge(o.status, stLabel(o.status))}</td><td>${badge(o.payment_status, PAY_LABEL[o.payment_status])}</td><td class="${o.late ? 'late' : ''}">${fmtDay(o.due_date)}</td><td class="right nowrap">${brl(o.total)}</td></tr>`
        )
        .join('')}</tbody></table>` : '<p class="empty">Nenhum pedido encontrado.</p>'}</div>`;
    $$('[data-open]').forEach((r) => r.addEventListener('click', () => openOrder(r.dataset.open)));
  }

  $$('.tab[data-mode]').forEach((t) =>
    t.addEventListener('click', () => {
      mode = t.dataset.mode;
      localStorage.setItem('gz-mode', mode);
      if (filter) location.hash = '#/pedidos';
      else load();
    })
  );
  let deb;
  $('#q').addEventListener('input', (e) => {
    clearTimeout(deb);
    deb = setTimeout(() => { q = e.target.value.trim(); load(); }, 250);
  });
  await load();
  timer = setInterval(() => { if (!document.querySelector('.overlay')) load().catch(() => {}); }, 10000);
}

async function openOrder(id) {
  const o = await api(`/api/admin/orders/${id}`);
  const st = settingsCache;
  const methods = st.payment_methods || [];
  const m = modal({
    title: `Pedido #${o.number} ${badge(o.status, o.status_label)}`,
    wide: true,
    body: `
      <div class="grid2" style="margin-bottom:14px">
        <div><h3>Cliente</h3><p><b>${esc(o.customer.name)}</b></p>
          <p class="small"><a href="${waLink(o.customer.phone)}" target="_blank" rel="noopener">💬 ${esc(o.customer.phone)}</a>${o.customer.email ? ' · ' + esc(o.customer.email) : ''}${o.customer.doc ? ' · ' + esc(o.customer.doc) : ''}</p>
          <p class="small muted">Criado em ${fmtDateTime(o.created_at)}</p></div>
        <div><h3>Entrega</h3><p>${o.delivery_type === 'entrega' ? '🚚 Entrega' : '🏬 Retirada na gráfica'}</p>
          ${o.delivery_address ? `<p class="small">${esc(o.delivery_address)}</p>` : ''}
          ${o.art_link ? `<p class="small">Arte: <a href="${esc(o.art_link)}" target="_blank" rel="noopener noreferrer">${esc(o.art_link)}</a></p>` : '<p class="small muted">Cliente não enviou link da arte.</p>'}</div>
      </div>
      <table class="t items"><thead><tr><th>Item</th><th class="right">Qtd</th><th class="right">Unit.</th><th class="right">Total</th></tr></thead><tbody>${o.items
        .map((i) => `<tr><td><b>${esc(i.description)}</b><div class="small muted">${esc(i.detail)}</div></td><td class="right">${i.qty}</td><td class="right">${brl(i.unit_price)}</td><td class="right">${brl(i.total)}</td></tr>`)
        .join('')}</tbody></table>
      <div class="sum"><span class="muted">Subtotal</span><span class="right">${brl(o.subtotal)}</span>
        ${o.discount ? `<span class="muted">Desconto</span><span class="right">− ${brl(o.discount)}</span>` : ''}
        <b>Total</b><b class="right">${brl(o.total)}</b>
        <span class="muted">Sinal (${st.entry_percent}%)</span><span class="right">${brl(o.entry_amount)}</span>
        <span class="muted">Falta receber</span><span class="right"><b>${brl(o.balance)}</b></span></div>
      <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">
      <div class="grid3">
        <label class="field"><span>Etapa</span><select id="fSt">${statuses.map((s) => `<option value="${s.key}" ${s.key === o.status ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select></label>
        <label class="field"><span>Pagamento</span><select id="fPay">${Object.entries(PAY_LABEL).map(([k, v]) => `<option value="${k}" ${k === o.payment_status ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Forma</span><select id="fMeth">${[...new Set([o.payment_method, ...methods])].filter(Boolean).map((x) => `<option ${x === o.payment_method ? 'selected' : ''}>${esc(x)}</option>`).join('')}</select></label>
        <label class="field"><span>Previsão de entrega</span><input type="date" id="fDue" value="${esc(o.due_date)}"></label>
        <label class="field"><span>Desconto (R$)</span><input type="text" inputmode="decimal" id="fDisc" value="${fromCents(o.discount)}"></label>
        <label class="field"><span>Link da arte</span><input type="url" id="fArt" value="${esc(o.art_link)}" placeholder="https://drive.google.com/…"></label>
      </div>
      <label class="field" style="margin-top:12px"><span>Observações internas / do cliente</span><textarea id="fNotes">${esc(o.notes)}</textarea></label>
      <h3 style="margin:16px 0 6px">Histórico</h3>
      <ul class="timeline">${o.events.map((e) => `<li>${esc(e.text)} <span class="muted small">· ${fmtDateTime(e.created_at)}</span></li>`).join('')}</ul>`,
    footer: `<a class="btn" href="${o.pdf_url}" target="_blank" rel="noopener">📄 Abrir PDF</a>
      <button class="btn danger" id="cancelOrder" type="button" ${o.status === 'cancelado' ? 'hidden' : ''}>Cancelar pedido</button>
      <span class="grow"></span><button class="btn primary" id="saveOrder" type="button">Salvar</button>`,
  });
  const save = async (extra = {}) => {
    try {
      await api(`/api/admin/orders/${o.id}`, {
        method: 'PATCH',
        body: {
          status: $('#fSt', m.el).value,
          payment_status: $('#fPay', m.el).value,
          payment_method: $('#fMeth', m.el).value,
          due_date: $('#fDue', m.el).value,
          discount: toCents($('#fDisc', m.el).value),
          art_link: $('#fArt', m.el).value,
          notes: $('#fNotes', m.el).value,
          ...extra,
        },
      });
      toast('Pedido atualizado');
      m.close();
      route();
      refreshCounts();
    } catch (err) { toast(err.message, 'error'); }
  };
  $('#saveOrder', m.el).addEventListener('click', () => save());
  $('#cancelOrder', m.el).addEventListener('click', () => confirm('Cancelar este pedido? O cliente será avisado.') && save({ status: 'cancelado' }));
}

// ---------------------------------------------------------------- conversas

async function renderConversas() {
  let current = null;
  let after = 0;
  view.innerHTML = `<header class="top"><h1 class="grow">Conversas</h1><span class="muted small">Quando você responde, o robô para de falar naquela conversa até você devolver.</span></header>
    <div class="card chat"><div class="clist" id="clist"></div><div class="thread" id="thread"><div class="empty">Escolha uma conversa à esquerda.</div></div></div>`;

  async function loadList() {
    const r = await api('/api/admin/conversations');
    $('#clist').innerHTML = r.conversations.length
      ? r.conversations
          .map(
            (c) => `<button class="citem ${current === c.id ? 'on' : ''}" data-id="${c.id}"><div class="n"><span>${esc(c.name || c.phone)}</span>${c.unread ? `<span class="dotu">${c.unread}</span>` : ''}</div>
              <div class="p">${c.human ? '🙋 ' : ''}${esc((c.last_body || '').replace(/\n/g, ' '))}</div></button>`
          )
          .join('')
      : '<p class="empty">Nenhuma conversa ainda.<br>Mande uma mensagem pelo simulador.</p>';
    $$('.citem').forEach((b) => b.addEventListener('click', () => open(Number(b.dataset.id))));
  }

  async function open(id) {
    current = id;
    after = 0;
    const r = await api(`/api/admin/conversations/${id}/messages`);
    const c = r.conversation;
    const link = `${settingsCache.base_url}/orcamento?c=${c.token}`;
    $('#thread').innerHTML = `
      <header><div class="grow"><b>${esc(c.name || c.phone)}</b><div class="small muted">${esc(c.phone)}</div></div>
        <span id="who">${c.human ? badge('aprovacao', 'Atendente') : badge('pronto', 'Robô ativo')}</span>
        <button class="btn sm" id="release" type="button" ${c.human ? '' : 'hidden'}>Devolver ao robô</button></header>
      <div class="msgs" id="msgs"></div>
      <div class="quick">${[
        ['Enviar link do orçamento', `Segue o link para montar seu orçamento: ${link}`],
        ['Pedir a arte', 'Pode enviar a arte em PDF ou o link do Drive? Se ainda não tem, a gente cria pra você.'],
        ['Pedido pronto', 'Seu pedido está pronto! Pode retirar quando quiser. 😊'],
      ].map(([l, t]) => `<button type="button" class="btn sm" data-q="${esc(t)}">${l}</button>`).join('')}</div>
      <form id="reply"><textarea id="txt" placeholder="Escreva a resposta (Enter envia, Shift+Enter quebra linha)" aria-label="Resposta"></textarea><button class="btn primary" type="submit">Enviar</button></form>`;
    $$('.citem').forEach((b) => b.classList.toggle('on', Number(b.dataset.id) === id));
    draw(r.messages, true);
    $('#reply').addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = $('#txt').value.trim();
      if (!text) return;
      $('#txt').value = '';
      try { await api(`/api/admin/conversations/${id}/send`, { method: 'POST', body: { text } }); await poll(); } catch (err) { toast(err.message, 'error'); }
    });
    $('#txt').addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); $('#reply').requestSubmit(); } });
    $$('[data-q]').forEach((b) => b.addEventListener('click', () => { $('#txt').value = b.dataset.q; $('#txt').focus(); }));
    $('#release').addEventListener('click', async () => { await api(`/api/admin/conversations/${id}/release`, { method: 'POST' }); toast('Robô voltou a atender'); open(id); loadList(); });
  }

  function draw(messages, first) {
    const box = $('#msgs');
    if (!box) return;
    const stick = first || box.scrollTop + box.clientHeight >= box.scrollHeight - 50;
    for (const m of messages) {
      const d = document.createElement('div');
      d.className = `bubble ${m.direction}`;
      d.innerHTML = `${m.sender === 'human' ? '<div class="who">Você</div>' : m.sender === 'bot' ? '<div class="who">Robô</div>' : ''}${chatHtml(m.body)}<time>${fmtTime(m.created_at)}</time>`;
      box.append(d);
      after = m.id;
    }
    if (stick) box.scrollTop = box.scrollHeight;
  }

  async function poll() {
    await loadList();
    if (!current) return;
    const r = await api(`/api/admin/conversations/${current}/messages?after=${after}`);
    draw(r.messages, false);
    const who = $('#who');
    if (who) who.innerHTML = r.conversation.human ? badge('aprovacao', 'Atendente') : badge('pronto', 'Robô ativo');
    const rel = $('#release');
    if (rel) rel.hidden = !r.conversation.human;
  }

  await loadList();
  timer = setInterval(() => poll().catch(() => {}), 2500);
}

// ---------------------------------------------------------------- produtos

async function renderProdutos() {
  const r = await api('/api/admin/products');
  view.innerHTML = `<header class="top"><h1 class="grow">Produtos e preços</h1><button class="btn primary" id="newP" type="button">+ Novo produto</button></header>
    <p class="muted small" style="margin-bottom:12px">Estes preços aparecem na tabela enviada no WhatsApp e no cálculo do orçamento. Mudou o valor aqui, muda em tudo.</p>
    <div class="card" style="padding:0;overflow-x:auto"><table class="t"><thead><tr><th>Produto</th><th>Cobrança</th><th>Preço</th><th>Prazo</th><th>Situação</th><th></th></tr></thead><tbody>${r.products
      .map(
        (p) => `<tr ${p.active ? '' : 'style="opacity:.55"'}><td><b>${esc(p.name)}</b><div class="small muted">${esc(p.category)}</div></td><td>${TYPE_LABEL[p.pricing_type]}</td><td class="small">${esc(p.price_label)}</td><td>${p.production_days} dia(s) útil(eis)</td><td>${p.active ? badge('pronto', 'No ar') : badge('entregue', 'Oculto')}</td><td class="right"><button class="btn sm" data-edit="${p.id}">Editar</button></td></tr>`
      )
      .join('')}</tbody></table></div>`;
  $('#newP').addEventListener('click', () => editProduct(null));
  $$('[data-edit]').forEach((b) => b.addEventListener('click', () => editProduct(r.products.find((p) => p.id === Number(b.dataset.edit)))));
}

function editProduct(p) {
  const isNew = !p;
  p = p || { name: '', category: 'Comunicação visual', pricing_type: 'm2', price: 0, min_price: 0, tiers: [], variants: [], finishes: [], description: '', keywords: '', production_days: 2, active: true };
  const m = modal({
    title: isNew ? 'Novo produto' : 'Editar produto',
    wide: true,
    body: `
      <div class="grid2">
        <label class="field"><span>Nome</span><input type="text" id="pName" value="${esc(p.name)}" required></label>
        <label class="field"><span>Categoria</span><input type="text" id="pCat" value="${esc(p.category)}"></label>
        <label class="field"><span>Como cobrar</span><select id="pType">${Object.entries(TYPE_LABEL).map(([k, v]) => `<option value="${k}" ${k === p.pricing_type ? 'selected' : ''}>${v}</option>`).join('')}</select></label>
        <label class="field"><span>Prazo de produção (dias úteis)</span><input type="number" min="1" max="60" id="pDays" value="${p.production_days}"></label>
      </div>
      <div id="secM2" class="grid2" style="margin-top:12px">
        <label class="field"><span>Preço por m² (R$)</span><input type="text" inputmode="decimal" id="pPrice" value="${fromCents(p.price)}"></label>
        <label class="field"><span>Valor mínimo por peça (R$)</span><input type="text" inputmode="decimal" id="pMin" value="${fromCents(p.min_price)}"></label>
        <p class="small muted" style="grid-column:1/-1">Ex.: banner 1,00 x 0,80 m a R$ 150/m² = R$ 120,00.</p>
      </div>
      <div id="secUnit" style="margin-top:12px">
        <label class="field" style="max-width:260px"><span>Preço por unidade (R$) — 1 a poucas unidades</span><input type="text" inputmode="decimal" id="pUnit" value="${fromCents(p.price)}"></label>
        <h3 style="margin:12px 0 6px">Descontos por quantidade</h3><div class="mini" id="tiers"></div>
        <button class="btn sm" type="button" id="addTier" style="margin-top:6px">+ Faixa</button>
      </div>
      <div id="secFixed" style="margin-top:12px"><h3 style="margin-bottom:6px">Opções (ex.: 1000 un, 500 un…)</h3><div class="mini" id="variants"></div>
        <button class="btn sm" type="button" id="addVar" style="margin-top:6px">+ Opção</button></div>
      <h3 style="margin:18px 0 6px">Acabamentos opcionais</h3>
      <p class="small muted" style="margin-bottom:6px">Cobrança: <b>por peça</b> (ilhós, bastão), <b>por m²</b> (laminação) ou <b>por metro linear</b> (reforço na borda).</p>
      <div class="mini" id="fins"></div><button class="btn sm" type="button" id="addFin" style="margin-top:6px">+ Acabamento</button>
      <label class="field" style="margin-top:14px"><span>Descrição (aparece para o cliente)</span><textarea id="pDesc">${esc(p.description)}</textarea></label>
      <label class="field" style="margin-top:12px"><span>Palavras que o robô reconhece (separadas por vírgula)</span><input type="text" id="pKw" value="${esc(p.keywords)}" placeholder="banner, lona, faixa"></label>
      <label class="row" style="margin-top:12px"><input type="checkbox" id="pActive" ${p.active ? 'checked' : ''}> Mostrar este produto para os clientes</label>`,
    footer: `${isNew ? '' : '<button class="btn danger" id="delP" type="button">Excluir</button>'}<span class="grow"></span><button class="btn primary" id="saveP" type="button">Salvar</button>`,
  });
  const el = m.el;
  const tiers = p.tiers.map((t) => ({ ...t }));
  const variants = p.variants.map((v) => ({ ...v }));
  const fins = p.finishes.map((f) => ({ ...f }));

  const drawLists = () => {
    $('#tiers', el).innerHTML = tiers.map((t, i) => `<div class="line tier"><input type="number" min="1" data-k="tiers.${i}.min" value="${t.min}" aria-label="A partir de (un)"><input type="text" inputmode="decimal" data-k="tiers.${i}.price" value="${fromCents(t.price)}" aria-label="Preço unitário"><button class="btn sm ghost" data-rm="tiers.${i}" aria-label="Remover">✕</button></div>`).join('') || '<p class="small muted">Sem faixas: vale sempre o preço base.</p>';
    if (tiers.length) $('#tiers', el).insertAdjacentHTML('afterbegin', '<div class="small muted line tier"><span>A partir de (un)</span><span>Preço unit. (R$)</span></div>');
    $('#variants', el).innerHTML = variants.map((v, i) => `<div class="line two"><input type="text" data-k="variants.${i}.label" value="${esc(v.label)}" placeholder="1000 un - couchê 300g" aria-label="Opção"><input type="text" inputmode="decimal" data-k="variants.${i}.price" value="${fromCents(v.price)}" aria-label="Preço"><button class="btn sm ghost" data-rm="variants.${i}" aria-label="Remover">✕</button></div>`).join('');
    $('#fins', el).innerHTML = fins.map((f, i) => `<div class="line"><input type="text" data-k="fins.${i}.label" value="${esc(f.label)}" placeholder="Ilhós nos cantos" aria-label="Acabamento"><input type="text" inputmode="decimal" data-k="fins.${i}.price" value="${fromCents(f.price)}" aria-label="Preço"><select data-k="fins.${i}.mode" aria-label="Cobrança"><option value="item" ${f.mode === 'item' ? 'selected' : ''}>por peça</option><option value="m2" ${f.mode === 'm2' ? 'selected' : ''}>por m²</option><option value="ml" ${f.mode === 'ml' ? 'selected' : ''}>por metro linear</option></select><button class="btn sm ghost" data-rm="fins.${i}" aria-label="Remover">✕</button></div>`).join('');
  };
  const lists = { tiers, variants, fins };
  const sections = () => {
    const t = $('#pType', el).value;
    $('#secM2', el).hidden = t !== 'm2';
    $('#secUnit', el).hidden = t !== 'unit';
    $('#secFixed', el).hidden = t !== 'fixed';
  };
  el.addEventListener('input', (e) => {
    const k = e.target.dataset?.k;
    if (!k) return;
    const [list, i, field] = k.split('.');
    const v = e.target.value;
    lists[list][i][field] = field === 'price' ? toCents(v) : field === 'min' ? Math.max(1, Number(v) || 1) : v;
  });
  el.addEventListener('click', (e) => {
    const rm = e.target.closest('[data-rm]')?.dataset.rm;
    if (!rm) return;
    const [list, i] = rm.split('.');
    lists[list].splice(Number(i), 1);
    drawLists();
  });
  $('#addTier', el).addEventListener('click', () => { tiers.push({ min: 100, price: 0 }); drawLists(); });
  $('#addVar', el).addEventListener('click', () => { variants.push({ label: '', price: 0 }); drawLists(); });
  $('#addFin', el).addEventListener('click', () => { fins.push({ id: 'a' + Date.now().toString(36), label: '', price: 0, mode: 'item' }); drawLists(); });
  $('#pType', el).addEventListener('change', sections);
  drawLists();
  sections();

  $('#saveP', el).addEventListener('click', async () => {
    const type = $('#pType', el).value;
    const body = {
      name: $('#pName', el).value,
      category: $('#pCat', el).value,
      pricing_type: type,
      price: type === 'unit' ? toCents($('#pUnit', el).value) : toCents($('#pPrice', el).value),
      min_price: toCents($('#pMin', el).value),
      tiers: type === 'unit' ? tiers : [],
      variants: type === 'fixed' ? variants : [],
      finishes: fins,
      description: $('#pDesc', el).value,
      keywords: $('#pKw', el).value,
      production_days: Number($('#pDays', el).value),
      active: $('#pActive', el).checked,
      position: p.position ?? 99,
    };
    try {
      await api(isNew ? '/api/admin/products' : `/api/admin/products/${p.id}`, { method: isNew ? 'POST' : 'PUT', body });
      toast('Produto salvo');
      m.close();
      route();
    } catch (err) { toast(err.message, 'error'); }
  });
  $('#delP', el)?.addEventListener('click', async () => {
    if (!confirm(`Excluir "${p.name}"?`)) return;
    const r = await api(`/api/admin/products/${p.id}`, { method: 'DELETE' });
    toast(r.archived ? 'Já tem pedidos: o produto foi ocultado, não excluído.' : 'Produto excluído');
    m.close();
    route();
  });
}

// ---------------------------------------------------------------- clientes

async function renderClientes() {
  const r = await api('/api/admin/customers');
  view.innerHTML = `<header class="top"><h1 class="grow">Clientes</h1><span class="muted small">${r.customers.length} cadastrado(s) automaticamente pelos pedidos</span></header>
    <div class="card" style="padding:0;overflow-x:auto">${r.customers.length ? `<table class="t"><thead><tr><th>Nome</th><th>WhatsApp</th><th class="right">Pedidos</th><th class="right">Total comprado</th><th>Último pedido</th><th></th></tr></thead><tbody>${r.customers
      .map(
        (c) => `<tr><td><b>${esc(c.name)}</b>${c.notes ? `<div class="small muted">${esc(c.notes)}</div>` : ''}</td><td><a href="${waLink(c.phone)}" target="_blank" rel="noopener">${esc(c.phone)}</a></td><td class="right">${c.orders_count}</td><td class="right">${brl(c.total_spent)}</td><td>${c.last_order_at ? fmtDateTime(c.last_order_at) : '—'}</td><td class="right"><button class="btn sm" data-note="${c.id}">Anotar</button></td></tr>`
      )
      .join('')}</tbody></table>` : '<p class="empty">Os clientes aparecem aqui quando fizerem o primeiro pedido.</p>'}</div>`;
  $$('[data-note]').forEach((b) =>
    b.addEventListener('click', () => {
      const c = r.customers.find((x) => x.id === Number(b.dataset.note));
      const m = modal({
        title: `Anotações de ${esc(c.name)}`,
        body: `<label class="field"><span>Ex.: paga sempre no PIX, quer nota fiscal, cor da marca…</span><textarea id="nn">${esc(c.notes)}</textarea></label>`,
        footer: '<button class="btn primary" id="sn" type="button">Salvar</button>',
      });
      $('#sn', m.el).addEventListener('click', async () => {
        await api(`/api/admin/customers/${c.id}`, { method: 'PATCH', body: { notes: $('#nn', m.el).value } });
        m.close();
        route();
      });
    })
  );
}

// ---------------------------------------------------------------- configurações

const DIAS = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

async function renderConfig() {
  const s = await api('/api/admin/settings');
  settingsCache = s;
  const b = s.business;
  let signature = s.signature || '';
  const msg = s.messages;
  const field = (id, label, val, type = 'text') => `<label class="field"><span>${label}</span><input type="${type}" id="${id}" value="${esc(val)}"></label>`;
  const area = (id, label, val, rows = 5) => `<label class="field"><span>${label}</span><textarea id="${id}" rows="${rows}">${esc(val)}</textarea></label>`;

  view.innerHTML = `<header class="top"><h1 class="grow">Configurações</h1></header>
    <div class="stack" style="max-width:860px">
      <section class="card stack"><h2>Dados da gráfica</h2>
        <p class="small muted">Aparecem no cabeçalho do pedido em PDF.</p>
        <div class="grid2">${field('bName', 'Nome da gráfica', b.name)}${field('bOwner', 'Responsável (abaixo da assinatura)', b.owner)}
        ${field('bCnpj', 'CNPJ', b.cnpj)}${field('bPhone', 'Telefone / WhatsApp', b.phone)}${field('bEmail', 'E-mail', b.email, 'email')}${field('bInsta', 'Instagram', b.instagram)}
        ${field('bPix', 'Chave PIX (sai no PDF quando o cliente escolhe PIX)', b.pix_key)}</div>
        ${field('bAddr', 'Endereço', b.address)}
      </section>

      <section class="card stack"><h2>Sua assinatura</h2>
        <p class="small muted">Sai no campo da gráfica em todo pedido em PDF. Use uma foto/PNG da assinatura em fundo branco ou transparente.</p>
        <div class="sigprev" id="sigPrev"></div>
        <div class="row"><input type="file" id="sigFile" accept="image/png,image/jpeg" aria-label="Enviar imagem da assinatura"><button class="btn sm danger" id="sigClear" type="button">Remover</button></div>
      </section>

      <section class="card stack"><h2>Horário de atendimento</h2>
        <p class="small muted">Fora do horário o robô avisa o cliente, mas continua atendendo e recebendo orçamentos.</p>
        <div id="hours">${DIAS.map((d, i) => {
          const h = s.hours[i];
          return `<div class="hours"><span>${d}</span><label class="row"><input type="checkbox" data-hd="${i}" ${h ? 'checked' : ''}> abre</label><input type="time" data-ho="${i}" value="${h?.open || '08:00'}" ${h ? '' : 'disabled'} aria-label="Abre ${d}"><input type="time" data-hc="${i}" value="${h?.close || '18:00'}" ${h ? '' : 'disabled'} aria-label="Fecha ${d}"></div>`;
        }).join('')}</div>
      </section>

      <section class="card stack"><h2>Pagamento</h2>
        <div class="grid2"><label class="field"><span>Sinal para iniciar a produção (%)</span><input type="number" min="0" max="100" id="entry" value="${s.entry_percent}"></label>
        ${area('methods', 'Formas de pagamento (uma por linha)', s.payment_methods.join('\n'), 5)}</div>
      </section>

      <section class="card stack"><h2>Mensagens do robô</h2>
        <p class="small muted">Use {nome}, {grafica}, {tabela}, {link}, {horario}, {endereco}. Nos avisos de pedido: {numero}, {total}, {sinal}, {pagamento}, {pdf}.</p>
        ${area('mGreeting', 'Primeira resposta (saudação + tabela + link)', msg.greeting, 8)}
        ${area('mMenu', 'Menu quando o robô não entende', msg.menu, 7)}
        ${area('mClosed', 'Aviso fora do horário', msg.outside_hours, 3)}
        ${area('mHandoff', 'Ao chamar atendente', msg.handoff, 3)}
        ${area('mQuote', 'Link de orçamento', msg.quote_link, 3)}
        ${area('mOrder', 'Confirmação do pedido', msg.order_received, 6)}
        <label class="row"><input type="checkbox" id="notify" ${s.notify_status ? 'checked' : ''}> Avisar o cliente no WhatsApp quando o pedido mudar de etapa</label>
        <details><summary>Mensagens de cada etapa</summary><div class="stack" style="margin-top:10px">${statuses
          .filter((x) => x.key !== 'novo')
          .map((x) => area('ms_' + x.key, x.label, msg.status[x.key] || '', 2))
          .join('')}</div></details>
      </section>

      <section class="card stack"><h2>Termos do pedido</h2>
        ${area('terms', 'Texto que o cliente aceita e que sai no PDF', s.terms, 6)}
      </section>

      <section class="card stack"><h2>Endereço público</h2>
        <p class="small muted">Endereço (domínio) em que o site fica no ar. Os links enviados no WhatsApp usam ele.</p>
        ${field('pubUrl', 'Endereço do site', s.public_url, 'url')}
        <p class="small muted">Em uso agora: <code>${esc(s.base_url)}</code></p>
      </section>
    </div>
    <div class="sticky-save"><button class="btn primary" id="saveCfg" type="button">Salvar configurações</button></div>`;

  const drawSig = () => ($('#sigPrev').innerHTML = signature ? `<img src="${signature}" alt="Assinatura da gráfica">` : '<span class="muted small">Nenhuma assinatura enviada</span>');
  drawSig();
  $('#sigClear').addEventListener('click', () => { signature = ''; drawSig(); });
  $('#sigFile').addEventListener('change', async (e) => {
    const f = e.target.files[0];
    if (!f) return;
    try {
      signature = await shrinkImage(f);
      drawSig();
    } catch { toast('Não consegui ler essa imagem.', 'error'); }
  });
  $$('[data-hd]').forEach((c) =>
    c.addEventListener('change', () => {
      $(`[data-ho="${c.dataset.hd}"]`).disabled = !c.checked;
      $(`[data-hc="${c.dataset.hd}"]`).disabled = !c.checked;
    })
  );

  $('#saveCfg').addEventListener('click', async () => {
    const v = (id) => $('#' + id).value;
    const status = {};
    statuses.filter((x) => x.key !== 'novo').forEach((x) => (status[x.key] = v('ms_' + x.key)));
    const body = {
      business: { name: v('bName'), owner: v('bOwner'), cnpj: v('bCnpj'), phone: v('bPhone'), email: v('bEmail'), instagram: v('bInsta'), pix_key: v('bPix'), address: v('bAddr') },
      signature,
      hours: DIAS.map((_, i) => ($(`[data-hd="${i}"]`).checked ? { open: $(`[data-ho="${i}"]`).value, close: $(`[data-hc="${i}"]`).value } : null)),
      entry_percent: Number(v('entry')),
      payment_methods: v('methods').split('\n').map((x) => x.trim()).filter(Boolean),
      messages: { greeting: v('mGreeting'), menu: v('mMenu'), outside_hours: v('mClosed'), handoff: v('mHandoff'), quote_link: v('mQuote'), order_received: v('mOrder'), status },
      notify_status: $('#notify').checked,
      terms: v('terms'),
      public_url: v('pubUrl'),
    };
    try {
      await api('/api/admin/settings', { method: 'PUT', body });
      settingsCache = await api('/api/admin/settings');
      $('#brandName').textContent = settingsCache.business.name;
      toast('Configurações salvas');
    } catch (err) { toast(err.message, 'error'); }
  });
}

/** Reduz a imagem da assinatura para caber no limite do servidor (PNG até 700 px de largura). */
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 700 / img.width);
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(url);
      let out = c.toDataURL('image/png');
      if (out.length > 550_000) out = c.toDataURL('image/jpeg', 0.85);
      out.length > 580_000 ? reject(new Error('grande')) : resolve(out);
    };
    img.onerror = reject;
    img.src = url;
  });
}

boot();
