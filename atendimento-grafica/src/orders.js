// Pedidos / ordens de serviço: criação a partir do link de orçamento, edição no painel e notificações.
import { randomBytes } from 'node:crypto';
import { db, getSetting, transaction } from './db.js';
import { addBusinessDays, baseUrl } from './config.js';
import { fill, getConversationByToken, getOrCreateConversation, normPhone, reply } from './chat.js';
import { STATUSES, statusLabel } from './bot.js';
import { brl, entryAmount, hydrateProduct, priceItem, PricingError } from './pricing.js';

export class ValidationError extends Error {}

const clean = (v, max = 200) => String(v ?? '').trim().slice(0, max);
export const orderNumber = (id) => String(id).padStart(4, '0');

const loadProduct = (id) => hydrateProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(Number(id)));

/** Calcula as linhas no servidor. Usado pelo preview ao vivo e na criação do pedido. */
export function quote(items) {
  if (!Array.isArray(items) || !items.length) throw new ValidationError('Adicione pelo menos um item ao orçamento.');
  if (items.length > 30) throw new ValidationError('Máximo de 30 itens por pedido.');
  const lines = items.map((it, i) => {
    const product = loadProduct(it.product_id);
    try {
      return { product, ...priceItem(product, it) };
    } catch (e) {
      if (e instanceof PricingError) throw new ValidationError(`Item ${i + 1}: ${e.message}`);
      throw e;
    }
  });
  const subtotal = lines.reduce((s, l) => s + l.total, 0);
  const days = Math.max(...lines.map((l) => l.product.production_days || 1));
  return {
    lines: lines.map(({ product, ...l }) => ({ ...l, product_id: product.id })),
    subtotal,
    entry: entryAmount(subtotal, getSetting('entry_percent', 50)),
    production_days: days,
    due_date: addBusinessDays(new Date(), days),
  };
}

function upsertCustomer({ name, phone, email, doc }) {
  const found = db.prepare('SELECT * FROM customers WHERE phone = ?').get(phone);
  if (found) {
    db.prepare('UPDATE customers SET name = ?, email = COALESCE(NULLIF(?, \'\'), email), doc = COALESCE(NULLIF(?, \'\'), doc) WHERE id = ?').run(
      name,
      email,
      doc,
      found.id
    );
    return found.id;
  }
  return Number(
    db.prepare('INSERT INTO customers (name, phone, email, doc) VALUES (?, ?, ?, ?)').run(name, phone, email, doc).lastInsertRowid
  );
}

const MAX_SIGNATURE = 600_000; // caracteres do data URL

export async function createOrder(body) {
  const name = clean(body.name, 120);
  const phone = normPhone(body.phone);
  if (name.length < 2) throw new ValidationError('Informe seu nome.');
  if (phone.length < 10 || phone.length > 15) throw new ValidationError('Informe um WhatsApp válido com DDD.');
  if (!body.accept) throw new ValidationError('É preciso aceitar os termos para enviar o pedido.');

  const delivery_type = body.delivery_type === 'entrega' ? 'entrega' : 'retirada';
  const delivery_address = clean(body.delivery_address, 300);
  if (delivery_type === 'entrega' && delivery_address.length < 8) throw new ValidationError('Informe o endereço de entrega.');

  const methods = getSetting('payment_methods', []);
  const payment_method = clean(body.payment_method, 60);
  if (!methods.includes(payment_method)) throw new ValidationError('Escolha uma forma de pagamento.');

  let signature = '';
  if (body.signature) {
    signature = String(body.signature);
    if (!signature.startsWith('data:image/png;base64,') || signature.length > MAX_SIGNATURE) {
      throw new ValidationError('Assinatura inválida.');
    }
  }

  const q = quote(body.items);
  const token = randomBytes(12).toString('base64url');

  const orderId = transaction(() => {
    const customerId = upsertCustomer({
      name,
      phone,
      email: clean(body.email, 120),
      doc: clean(body.doc, 30),
    });
    const conv =
      getConversationByToken(body.conversation_token) ||
      getOrCreateConversation(phone, name);
    const id = Number(
      db
        .prepare(
          `INSERT INTO orders (public_token, customer_id, conversation_id, payment_method, delivery_type, delivery_address,
             art_link, notes, subtotal, total, entry_amount, due_date, client_signature)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          token,
          customerId,
          conv.id,
          payment_method,
          delivery_type,
          delivery_address,
          clean(body.art_link, 300),
          clean(body.notes, 1000),
          q.subtotal,
          q.subtotal,
          q.entry,
          q.due_date,
          signature
        ).lastInsertRowid
    );
    const ins = db.prepare(
      `INSERT INTO order_items (order_id, product_id, description, detail, width_cm, height_cm, qty, unit_price, total)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );
    for (const l of q.lines) ins.run(id, l.product_id, l.description, l.detail, l.width_cm, l.height_cm, l.qty, l.unit_price, l.total);
    db.prepare('INSERT INTO order_events (order_id, text) VALUES (?, ?)').run(id, 'Pedido criado pelo cliente (link de orçamento)');
    return id;
  });

  const order = getOrder(orderId);
  const conv = db.prepare('SELECT * FROM conversations WHERE id = ?').get(order.conversation_id);
  const msg = fill(getSetting('messages', {}).order_received, {
    numero: order.number,
    nome: name.split(/\s+/)[0],
    total: brl(order.total),
    sinal: brl(order.entry_amount),
    pagamento: order.payment_method,
    pdf: `${baseUrl()}/pedido/${order.public_token}.pdf`,
  });
  await reply(conv, msg);
  return order;
}

export function getOrder(id) {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
  return o ? decorate(o) : null;
}

export function getOrderByToken(token) {
  const o = db.prepare('SELECT * FROM orders WHERE public_token = ?').get(String(token));
  return o ? decorate(o) : null;
}

function paidAmount(o) {
  if (o.payment_status === 'pago') return o.total;
  if (o.payment_status === 'sinal') return Math.min(o.entry_amount, o.total);
  return 0;
}

function decorate(o) {
  const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(o.customer_id);
  const paid = paidAmount(o);
  return {
    ...o,
    number: orderNumber(o.id),
    status_label: statusLabel(o.status),
    customer,
    items: db.prepare('SELECT * FROM order_items WHERE order_id = ? ORDER BY id').all(o.id),
    events: db.prepare('SELECT * FROM order_events WHERE order_id = ? ORDER BY id DESC').all(o.id),
    paid_amount: paid,
    balance: o.total - paid,
    pdf_url: `/pedido/${o.public_token}.pdf`,
  };
}

/** Lista leve para o quadro do painel (sem assinatura, que é pesada). */
export function listOrders({ status, q } = {}) {
  const where = [];
  const args = [];
  if (status) {
    where.push('o.status = ?');
    args.push(status);
  }
  if (q) {
    where.push('(c.name LIKE ? OR c.phone LIKE ? OR CAST(o.id AS TEXT) LIKE ?)');
    args.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }
  const rows = db
    .prepare(
      `SELECT o.id, o.public_token, o.status, o.payment_status, o.payment_method, o.delivery_type, o.total, o.entry_amount,
              o.due_date, o.created_at, c.name AS customer_name, c.phone AS customer_phone,
              (SELECT GROUP_CONCAT(description, ', ') FROM order_items WHERE order_id = o.id) AS summary
       FROM orders o JOIN customers c ON c.id = o.customer_id
       ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
       ORDER BY o.id DESC LIMIT 500`
    )
    .all(...args);
  return rows.map((r) => ({
    ...r,
    number: orderNumber(r.id),
    paid_amount: paidAmount(r),
    balance: r.total - paidAmount(r),
    late: !!r.due_date && !['entregue', 'cancelado', 'pronto'].includes(r.status) && r.due_date < new Date().toLocaleDateString('sv-SE'),
  }));
}

const PAYMENT_STATUS = ['pendente', 'sinal', 'pago'];

export async function patchOrder(id, patch) {
  const before = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(id));
  if (!before) throw new ValidationError('Pedido não encontrado.');
  const sets = [];
  const args = [];
  const events = [];
  let total = before.total;

  if (patch.status !== undefined && patch.status !== before.status) {
    if (!STATUSES.some((s) => s.key === patch.status)) throw new ValidationError('Status inválido.');
    sets.push('status = ?');
    args.push(patch.status);
    events.push(`Status: ${statusLabel(before.status)} → ${statusLabel(patch.status)}`);
  }
  if (patch.payment_status !== undefined && patch.payment_status !== before.payment_status) {
    if (!PAYMENT_STATUS.includes(patch.payment_status)) throw new ValidationError('Situação de pagamento inválida.');
    sets.push('payment_status = ?');
    args.push(patch.payment_status);
    events.push(`Pagamento: ${before.payment_status} → ${patch.payment_status}`);
  }
  if (patch.payment_method !== undefined) {
    sets.push('payment_method = ?');
    args.push(clean(patch.payment_method, 60));
  }
  if (patch.due_date !== undefined) {
    if (patch.due_date && !/^\d{4}-\d{2}-\d{2}$/.test(patch.due_date)) throw new ValidationError('Data inválida.');
    if (patch.due_date !== before.due_date) events.push(`Prazo: ${patch.due_date || 'sem prazo'}`);
    sets.push('due_date = ?');
    args.push(patch.due_date || '');
  }
  for (const f of ['notes', 'art_link', 'delivery_address']) {
    if (patch[f] !== undefined) {
      sets.push(`${f} = ?`);
      args.push(clean(patch[f], f === 'notes' ? 1000 : 300));
    }
  }
  if (patch.delivery_type !== undefined) {
    sets.push('delivery_type = ?');
    args.push(patch.delivery_type === 'entrega' ? 'entrega' : 'retirada');
  }
  if (patch.discount !== undefined) {
    const discount = Math.round(Number(patch.discount));
    if (!Number.isFinite(discount) || discount < 0 || discount > before.subtotal) throw new ValidationError('Desconto inválido.');
    total = before.subtotal - discount;
    sets.push('discount = ?', 'total = ?', 'entry_amount = ?');
    args.push(discount, total, entryAmount(total, getSetting('entry_percent', 50)));
    if (discount !== before.discount) events.push(`Desconto: ${brl(discount)}`);
  }

  if (sets.length) {
    transaction(() => {
      db.prepare(`UPDATE orders SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = ?`).run(...args, before.id);
      for (const text of events) db.prepare('INSERT INTO order_events (order_id, text) VALUES (?, ?)').run(before.id, text);
    });
  }

  if (patch.status && patch.status !== before.status && getSetting('notify_status', true)) {
    const tpl = (getSetting('messages', {}).status || {})[patch.status];
    const conv = before.conversation_id ? db.prepare('SELECT * FROM conversations WHERE id = ?').get(before.conversation_id) : null;
    if (tpl && conv) await reply(conv, fill(tpl, { numero: orderNumber(before.id) }), 'bot');
  }
  return getOrder(before.id);
}

export function listCustomers() {
  return db
    .prepare(
      `SELECT c.*, COUNT(o.id) AS orders_count,
              COALESCE(SUM(CASE WHEN o.status != 'cancelado' THEN o.total END), 0) AS total_spent,
              MAX(o.created_at) AS last_order_at
       FROM customers c LEFT JOIN orders o ON o.customer_id = c.id
       GROUP BY c.id ORDER BY last_order_at DESC, c.id DESC`
    )
    .all();
}

export function dashboard() {
  const orders = db.prepare("SELECT * FROM orders WHERE status != 'cancelado'").all();
  const today = new Date().toLocaleDateString('sv-SE');
  const month = today.slice(0, 7);
  const localDate = (sql) => new Date(sql.replace(' ', 'T') + 'Z').toLocaleDateString('sv-SE');
  const byStatus = Object.fromEntries(STATUSES.map((s) => [s.key, 0]));
  let receivable = 0;
  let revenueMonth = 0;
  let ordersToday = 0;
  let late = 0;
  for (const o of orders) {
    byStatus[o.status]++;
    const created = localDate(o.created_at);
    if (created === today) ordersToday++;
    if (created.startsWith(month)) revenueMonth += o.total;
    receivable += o.total - paidAmount(o);
    if (o.due_date && o.due_date < today && !['entregue', 'pronto'].includes(o.status)) late++;
  }
  const waiting = db.prepare('SELECT COUNT(*) AS n FROM conversations WHERE human = 1').get().n;
  const unread = db.prepare('SELECT COALESCE(SUM(unread), 0) AS n FROM conversations').get().n;
  return { ordersToday, revenueMonth, receivable, late, byStatus, waiting, unread };
}
