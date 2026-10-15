// Gera o pedido / ordem de serviço em PDF (A4), com assinatura da gráfica e do cliente.
import PDFDocument from 'pdfkit';
import { getSetting } from './db.js';
import { brl } from './pricing.js';

// Helvetica do PDF só tem caracteres Latin-1: remove emojis e símbolos para não sair lixo.
const safe = (s) => String(s ?? '').replace(/[^ -ÿ–—‘-”•€]/g, '').trim();

const dataUrlToBuffer = (url) => {
  const m = /^data:image\/(?:png|jpeg);base64,(.+)$/.exec(url || '');
  return m ? Buffer.from(m[1], 'base64') : null;
};

const fmtDate = (sql) => (sql ? new Date(sql.replace(' ', 'T') + 'Z').toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '');
const fmtDay = (iso) => (iso ? iso.split('-').reverse().join('/') : 'a combinar');

const PAGO = { pendente: 'Pendente', sinal: 'Sinal pago', pago: 'Pago' };
const INK = '#16181d';
const GRAY = '#6b7280';
const LINE = '#d9dce1';
const ACCENT = '#c2185b';

export function buildOrderPdf(order) {
  const b = getSetting('business', {});
  const terms = getSetting('terms', '');
  const ownSignature = dataUrlToBuffer(getSetting('signature', ''));
  const clientSignature = dataUrlToBuffer(order.client_signature);

  const doc = new PDFDocument({ size: 'A4', margin: 40, info: { Title: `Pedido ${order.number}`, Author: safe(b.name) } });
  const chunks = [];
  doc.on('data', (c) => chunks.push(c));
  const done = new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const left = 40;
  const right = doc.page.width - 40;
  const width = right - left;
  const ensure = (h) => {
    if (doc.y + h > doc.page.height - 50) doc.addPage();
  };

  // cabeçalho
  doc.rect(left, 36, 6, 52).fill(ACCENT);
  doc.fillColor(INK).font('Helvetica-Bold').fontSize(18).text(safe(b.name) || 'Gráfica', left + 16, 36, { width: 330 });
  doc.font('Helvetica').fontSize(8.5).fillColor(GRAY);
  const contact = [b.cnpj && `CNPJ ${b.cnpj}`, b.phone, b.email].filter(Boolean).map(safe).join('  ·  ');
  if (contact) doc.text(contact, left + 16, doc.y + 1, { width: 330 });
  if (b.address) doc.text(safe(b.address), left + 16, doc.y, { width: 330 });

  doc.fillColor(INK).font('Helvetica-Bold').fontSize(9).text('PEDIDO / ORDEM DE SERVIÇO', 380, 38, { width: right - 380, align: 'right' });
  doc.fillColor(ACCENT).fontSize(24).text(`Nº ${order.number}`, 380, 52, { width: right - 380, align: 'right' });
  doc.fillColor(GRAY).font('Helvetica').fontSize(8.5).text(fmtDate(order.created_at), 380, 82, { width: right - 380, align: 'right' });

  doc.y = 106;
  doc.moveTo(left, doc.y).lineTo(right, doc.y).strokeColor(LINE).stroke();
  doc.moveDown(0.8);

  // cliente
  const sectionTitle = (t) => {
    ensure(40);
    doc.fillColor(ACCENT).font('Helvetica-Bold').fontSize(8.5).text(t.toUpperCase(), left, doc.y, { characterSpacing: 0.8 });
    doc.moveDown(0.35);
  };
  const kv = (k, v) => {
    if (!v) return;
    ensure(14);
    const y = doc.y;
    doc.fillColor(GRAY).font('Helvetica').fontSize(9).text(k, left, y, { width: 90 });
    doc.fillColor(INK).font('Helvetica').fontSize(9.5).text(safe(v), left + 92, y, { width: width - 92 });
  };

  sectionTitle('Cliente');
  const c = order.customer;
  kv('Nome', c.name);
  kv('WhatsApp', c.phone);
  kv('E-mail', c.email);
  kv('CPF / CNPJ', c.doc);
  doc.moveDown(0.8);

  // itens
  sectionTitle('Itens do pedido');
  const cols = { desc: left, qty: left + 290, unit: left + 340, total: left + 430 };
  const head = () => {
    const y = doc.y;
    doc.rect(left, y - 2, width, 17).fill('#f1f2f4');
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(8.5);
    doc.text('Descrição', cols.desc + 6, y + 2);
    doc.text('Qtd', cols.qty, y + 2, { width: 40, align: 'right' });
    doc.text('Unitário', cols.unit, y + 2, { width: 80, align: 'right' });
    doc.text('Total', cols.total, y + 2, { width: right - cols.total - 6, align: 'right' });
    doc.y = y + 20;
  };
  head();
  for (const it of order.items) {
    const desc = safe(it.description);
    const detail = safe(it.detail);
    doc.font('Helvetica').fontSize(8);
    const h = 16 + (detail ? doc.heightOfString(detail, { width: 275 }) + 2 : 0);
    if (doc.y + h > doc.page.height - 60) {
      doc.addPage();
      head();
    }
    const y = doc.y;
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(9.5).text(desc, cols.desc + 6, y, { width: 275 });
    let yy = doc.y;
    if (detail) {
      doc.fillColor(GRAY).font('Helvetica').fontSize(8).text(detail, cols.desc + 6, yy, { width: 275 });
      yy = doc.y;
    }
    doc.fillColor(INK).font('Helvetica').fontSize(9.5);
    doc.text(String(it.qty), cols.qty, y, { width: 40, align: 'right' });
    doc.text(brl(it.unit_price), cols.unit, y, { width: 80, align: 'right' });
    doc.font('Helvetica-Bold').text(brl(it.total), cols.total, y, { width: right - cols.total - 6, align: 'right' });
    doc.y = yy + 5;
    doc.moveTo(left, doc.y - 2).lineTo(right, doc.y - 2).strokeColor(LINE).lineWidth(0.5).stroke();
  }
  doc.moveDown(0.5);

  // totais
  ensure(90);
  const totalRow = (label, value, bold = false, color = INK) => {
    const y = doc.y;
    doc.fillColor(GRAY).font('Helvetica').fontSize(9.5).text(label, cols.qty - 60, y, { width: 190, align: 'right' });
    doc.fillColor(color).font(bold ? 'Helvetica-Bold' : 'Helvetica').fontSize(bold ? 12 : 9.5).text(value, cols.total, y, { width: right - cols.total - 6, align: 'right' });
    doc.y = y + (bold ? 18 : 14);
  };
  totalRow('Subtotal', brl(order.subtotal));
  if (order.discount) totalRow('Desconto', `- ${brl(order.discount)}`);
  totalRow('TOTAL', brl(order.total), true, ACCENT);
  totalRow('Sinal para iniciar', brl(order.entry_amount));
  totalRow('Saldo na entrega', brl(Math.max(0, order.total - order.entry_amount)));
  doc.moveDown(0.8);

  // pagamento e entrega
  sectionTitle('Pagamento e entrega');
  kv('Forma', order.payment_method);
  kv('Situação', PAGO[order.payment_status] || order.payment_status);
  if (order.payment_method === 'PIX' && b.pix_key) kv('Chave PIX', b.pix_key);
  kv('Entrega', order.delivery_type === 'entrega' ? `Entrega — ${order.delivery_address}` : 'Retirada na gráfica');
  kv('Previsão', fmtDay(order.due_date));
  kv('Arte / arquivos', order.art_link);
  kv('Observações', order.notes);
  doc.moveDown(0.8);

  // termos
  if (terms) {
    sectionTitle('Condições');
    ensure(50);
    doc.fillColor(GRAY).font('Helvetica').fontSize(7.8).text(safe(terms), left, doc.y, { width, align: 'justify' });
    doc.moveDown(1);
  }

  // assinaturas
  ensure(120);
  const baseY = doc.y + 8;
  const boxW = 220;
  const drawSig = (x, img, label, name) => {
    if (img) {
      try {
        doc.image(img, x + 10, baseY, { fit: [boxW - 20, 55], align: 'center' });
      } catch {
        /* imagem inválida: deixa a linha em branco para assinar à mão */
      }
    }
    doc.moveTo(x, baseY + 62).lineTo(x + boxW, baseY + 62).strokeColor(INK).lineWidth(0.7).stroke();
    doc.fillColor(INK).font('Helvetica-Bold').fontSize(9).text(label, x, baseY + 66, { width: boxW, align: 'center' });
    if (name) doc.fillColor(GRAY).font('Helvetica').fontSize(8.5).text(safe(name), x, baseY + 78, { width: boxW, align: 'center' });
  };
  drawSig(left, clientSignature, 'Cliente', c.name);
  drawSig(right - boxW, ownSignature, safe(b.name) || 'Gráfica', b.owner);

  doc.end();
  return done;
}
