// Conversas e mensagens. O "canal" é a ponte com o WhatsApp.
//
// Hoje o canal é o SIMULADOR (as mensagens ficam só no banco e a tela /simulador as exibe).
// Para ligar o WhatsApp de verdade, troque o canal com setChannel() por um adaptador que
// implemente deliver(telefone, texto) — ver docs/atendimento-grafica.md.
import { randomBytes } from 'node:crypto';
import { db } from './db.js';

let channel = { name: 'simulador', async deliver() {} };

export function setChannel(c) {
  channel = c;
}

export const channelName = () => channel.name;

export const normPhone = (p) => String(p ?? '').replace(/\D/g, '');

export function getConversation(id) {
  return db.prepare('SELECT * FROM conversations WHERE id = ?').get(id);
}

export function getConversationByToken(token) {
  if (!token) return null;
  return db.prepare('SELECT * FROM conversations WHERE token = ?').get(String(token)) ?? null;
}

export function getOrCreateConversation(phone, name = '') {
  const p = normPhone(phone);
  if (!p) throw new Error('Telefone inválido.');
  let conv = db.prepare('SELECT * FROM conversations WHERE phone = ?').get(p);
  if (!conv) {
    db.prepare('INSERT INTO conversations (phone, name, token) VALUES (?, ?, ?)').run(
      p,
      String(name).trim(),
      randomBytes(9).toString('base64url')
    );
    conv = db.prepare('SELECT * FROM conversations WHERE phone = ?').get(p);
  } else if (name && !conv.name) {
    db.prepare('UPDATE conversations SET name = ? WHERE id = ?').run(String(name).trim(), conv.id);
    conv.name = String(name).trim();
  }
  return conv;
}

export function addMessage(convId, direction, sender, body) {
  const info = db
    .prepare('INSERT INTO messages (conversation_id, direction, sender, body) VALUES (?, ?, ?, ?)')
    .run(convId, direction, sender, body);
  db.prepare(
    `UPDATE conversations SET last_message_at = datetime('now'),
       unread = CASE WHEN ? = 'in' THEN unread + 1 ELSE unread END WHERE id = ?`
  ).run(direction, convId);
  return Number(info.lastInsertRowid);
}

/** Envia uma mensagem ao cliente: grava no histórico e entrega pelo canal. */
export async function reply(conv, body, sender = 'bot') {
  if (!body) return;
  addMessage(conv.id, 'out', sender, body);
  try {
    await channel.deliver(conv.phone, body);
  } catch (err) {
    console.error(`[canal ${channel.name}] falha ao entregar para ${conv.phone}:`, err.message);
  }
}

export function messagesSince(convId, afterId = 0) {
  return db
    .prepare('SELECT id, direction, sender, body, created_at FROM messages WHERE conversation_id = ? AND id > ? ORDER BY id')
    .all(convId, afterId);
}

/** Substitui {chave} no modelo. Chaves desconhecidas viram vazio. */
export function fill(template, vars) {
  return String(template ?? '').replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}
