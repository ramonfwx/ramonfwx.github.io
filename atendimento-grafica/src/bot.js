// Robô de atendimento: entende a mensagem do cliente por palavras-chave (sem IA externa)
// e responde com tabela, link de orçamento, status do pedido, endereço etc.
import { db, getSetting } from './db.js';
import { baseUrl, hoursText, isOpenNow } from './config.js';
import { addMessage, fill, getOrCreateConversation, reply } from './chat.js';
import { hydrateProduct, priceLabel } from './pricing.js';

export const STATUSES = [
  { key: 'novo', label: 'Novo pedido' },
  { key: 'arte', label: 'Arte' },
  { key: 'aprovacao', label: 'Aprovação' },
  { key: 'producao', label: 'Produção' },
  { key: 'pronto', label: 'Pronto' },
  { key: 'entregue', label: 'Entregue' },
  { key: 'cancelado', label: 'Cancelado' },
];
export const statusLabel = (key) => STATUSES.find((s) => s.key === key)?.label ?? key;

/** minúsculas e sem acento, para comparar texto digitado */
export function norm(text) {
  return String(text ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

const has = (t, words) => words.some((w) => new RegExp(`(^|[^a-z0-9])${w}([^a-z0-9]|$)`).test(t));

const RE = {
  greeting: ['oi', 'ola', 'oie', 'opa', 'eae', 'bom dia', 'boa tarde', 'boa noite', 'hello', 'hey'],
  quote: ['orcamento', 'orcar', 'cotacao', 'pedido', 'encomendar', 'encomenda', 'quero fazer', 'queria fazer', 'comprar', 'fechar'],
  table: ['tabela', 'preco', 'precos', 'valor', 'valores', 'quanto', 'custa', 'cardapio', 'catalogo', 'servicos', 'servico', 'trabalham', 'fazem', 'voces fazem'],
  human: ['atendente', 'humano', 'pessoa', 'falar com', 'alguem', 'dono', 'responsavel', 'ligar'],
  status: ['status', 'meu pedido', 'andamento', 'ja ficou', 'ficou pronto', 'ta pronto', 'esta pronto', 'cade meu', 'previsao'],
  address: ['endereco', 'onde fica', 'localizacao', 'onde voces ficam', 'como chegar', 'mapa', 'retirar'],
  hours: ['horario', 'horarios', 'funcionamento', 'abre', 'fecha', 'aberto', 'ate que horas'],
  payment: ['pagamento', 'pagar', 'pix', 'cartao', 'parcela', 'parcelar', 'boleto', 'dinheiro', 'forma de pagamento'],
  deadline: ['prazo', 'entrega', 'demora', 'quanto tempo', 'pra quando', 'para quando'],
  thanks: ['obrigado', 'obrigada', 'valeu', 'agradeco', 'brigado', 'brigada'],
};

function products() {
  return db.prepare('SELECT * FROM products WHERE active = 1 ORDER BY position, id').all().map(hydrateProduct);
}

/** Produto cuja palavra-chave aparece no texto. Vale a palavra mais longa: "banner roll-up" ganha de "banner". */
function findProduct(text, list) {
  let best = null;
  let bestLen = 0;
  for (const p of list) {
    const words = [p.name, ...p.keywords.split(',')].map(norm).filter(Boolean);
    for (const w of words) {
      if (w.length > bestLen && has(text, [w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')])) {
        best = p;
        bestLen = w.length;
      }
    }
  }
  return best;
}

export function tableText() {
  const list = products();
  if (!list.length) return '(tabela em atualização)';
  const byCat = new Map();
  for (const p of list) {
    if (!byCat.has(p.category)) byCat.set(p.category, []);
    byCat.get(p.category).push(p);
  }
  return [...byCat.entries()]
    .map(([cat, items]) => `*${cat}*\n` + items.map((p) => `• ${p.name} — ${priceLabel(p)}`).join('\n'))
    .join('\n\n');
}

function link(conv, productId) {
  return `${baseUrl()}/orcamento?c=${conv.token}` + (productId ? `&p=${productId}` : '');
}

function vars(conv, extra = {}) {
  const b = getSetting('business', {});
  const first = (conv.name || '').trim().split(/\s+/)[0];
  return {
    nome: first ? ` ${first}` : '',
    grafica: b.name || 'nossa gráfica',
    tabela: tableText(),
    link: link(conv),
    horario: hoursText(),
    endereco: b.address || '',
    ...extra,
  };
}

function statusReply(conv) {
  const row = db
    .prepare(
      `SELECT o.* FROM orders o JOIN customers c ON c.id = o.customer_id
       WHERE c.phone = ? ORDER BY o.id DESC LIMIT 1`
    )
    .get(conv.phone);
  if (!row) {
    return `Não encontrei pedidos neste número. Quer montar um orçamento? ${link(conv)}`;
  }
  const num = String(row.id).padStart(4, '0');
  const prazo = row.due_date ? `\nPrevisão: *${row.due_date.split('-').reverse().join('/')}*` : '';
  return `📋 Pedido *#${num}*: *${statusLabel(row.status)}*${prazo}\nPagamento: ${row.payment_status}.\nPDF: ${baseUrl()}/pedido/${row.public_token}.pdf`;
}

/** Decide a resposta para uma mensagem. Devolve texto (ou null para ficar quieto). */
export function decide(conv, rawText, { isNew }) {
  const text = norm(rawText);
  const msgs = getSetting('messages', {});
  const v = vars(conv);
  const open = isOpenNow();
  const closedNote = open ? '' : '\n\n' + fill(msgs.outside_hours, v);

  // menu numérico
  const digit = /^[1-5]$/.test(text) ? text : null;
  if (digit === '1') return `${tableText()}\n\n👉 Monte seu orçamento: ${link(conv)}`;
  if (digit === '2') return fill(msgs.quote_link, v);
  if (digit === '3') return statusReply(conv);
  if (digit === '4') return `📍 ${v.endereco}\n🕗 ${v.horario}`;
  if (digit === '5') return 'HUMAN';

  if (has(text, RE.human)) return 'HUMAN';
  if (has(text, RE.status)) return statusReply(conv);

  const product = findProduct(text, products());
  if (product) {
    const extra = product.description ? `\n${product.description}` : '';
    return (
      `*${product.name}*\n${priceLabel(product)}${extra}\n\n` +
      `Para calcular com a sua medida e já gerar o pedido:\n${link(conv, product.id)}\n\n` +
      `Responda *tabela* para ver todos os valores.` +
      closedNote
    );
  }

  if (has(text, RE.address) && !has(text, RE.quote)) return `📍 ${v.endereco}\n🕗 Atendimento: ${v.horario}`;
  if (has(text, RE.hours)) return `🕗 Atendimento: ${v.horario}\n📍 ${v.endereco}`;
  if (has(text, RE.payment)) {
    const pay = (getSetting('payment_methods') || []).join(', ');
    const pct = getSetting('entry_percent', 50);
    return `💳 Aceitamos: ${pay}.\nPara iniciar a produção pedimos *${pct}% de sinal* e o restante na retirada/entrega.`;
  }
  if (has(text, RE.deadline) && !has(text, RE.quote))
    return 'O prazo depende do produto: banners e adesivos em geral 2 dias úteis; impressos 3 dias; fachadas 7 dias. O prazo exato aparece no seu orçamento.\n\n' + link(conv);

  const wantsQuote = has(text, RE.quote);
  const wantsTable = has(text, RE.table);
  const greeted = has(text, RE.greeting);
  if (isNew || greeted || wantsTable) return fill(msgs.greeting, v) + closedNote;
  if (wantsQuote) return fill(msgs.quote_link, v) + closedNote;
  if (has(text, RE.thanks)) return 'Por nada! Qualquer coisa é só chamar. 😊';

  return fill(msgs.menu, v);
}

/** Entrada única: o canal (simulador ou WhatsApp) chama isto quando o cliente escreve. */
export async function receive(phone, rawText, name = '') {
  const text = String(rawText ?? '').trim().slice(0, 2000);
  if (!text) return null;
  const conv = getOrCreateConversation(phone, name);
  const isNew = !db
    .prepare(
      `SELECT 1 FROM messages WHERE conversation_id = ? AND direction = 'in'
       AND created_at > datetime('now', '-12 hours') LIMIT 1`
    )
    .get(conv.id);
  addMessage(conv.id, 'in', 'client', text);
  const fresh = db.prepare('SELECT * FROM conversations WHERE id = ?').get(conv.id);
  if (fresh.human) return fresh; // atendente assumiu: robô não responde

  const answer = decide(fresh, text, { isNew });
  if (answer === 'HUMAN') {
    db.prepare('UPDATE conversations SET human = 1 WHERE id = ?').run(conv.id);
    await reply(fresh, fill(getSetting('messages', {}).handoff, vars(fresh)));
  } else if (answer) {
    await reply(fresh, answer);
  }
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(conv.id);
}
