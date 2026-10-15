import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
export const dataDir = process.env.DATA_DIR || join(raiz, 'data');
mkdirSync(dataDir, { recursive: true });

export const db = new DatabaseSync(process.env.DB_FILE || join(dataDir, 'grafica.db'));
db.exec('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');

db.exec(`
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'Geral',
  pricing_type TEXT NOT NULL CHECK (pricing_type IN ('m2','unit','fixed')),
  price INTEGER NOT NULL DEFAULT 0,          -- centavos: por m² (m2) ou por unidade (unit)
  min_price INTEGER NOT NULL DEFAULT 0,      -- centavos: valor mínimo por peça (m2)
  tiers TEXT NOT NULL DEFAULT '[]',          -- unit: [{min, price}] preço por unidade conforme quantidade
  variants TEXT NOT NULL DEFAULT '[]',       -- fixed: [{label, price}]
  finishes TEXT NOT NULL DEFAULT '[]',       -- acabamentos: [{id, label, price, mode: item|m2|ml}]
  description TEXT NOT NULL DEFAULT '',
  keywords TEXT NOT NULL DEFAULT '',         -- palavras que o robô reconhece, separadas por vírgula
  production_days INTEGER NOT NULL DEFAULT 2,
  active INTEGER NOT NULL DEFAULT 1,
  position INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  phone TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL DEFAULT '',
  doc TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT '',
  token TEXT NOT NULL UNIQUE,
  human INTEGER NOT NULL DEFAULT 0,          -- 1 = atendente assumiu, robô fica quieto
  unread INTEGER NOT NULL DEFAULT 0,
  last_message_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('in','out')),
  sender TEXT NOT NULL CHECK (sender IN ('client','bot','human')),
  body TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_messages_conv ON messages(conversation_id, id);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  public_token TEXT NOT NULL UNIQUE,
  customer_id INTEGER NOT NULL REFERENCES customers(id),
  conversation_id INTEGER REFERENCES conversations(id),
  status TEXT NOT NULL DEFAULT 'novo',
  payment_method TEXT NOT NULL DEFAULT '',
  payment_status TEXT NOT NULL DEFAULT 'pendente',   -- pendente | sinal | pago
  delivery_type TEXT NOT NULL DEFAULT 'retirada',    -- retirada | entrega
  delivery_address TEXT NOT NULL DEFAULT '',
  art_link TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  subtotal INTEGER NOT NULL DEFAULT 0,
  discount INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  entry_amount INTEGER NOT NULL DEFAULT 0,
  due_date TEXT NOT NULL DEFAULT '',
  client_signature TEXT NOT NULL DEFAULT '',          -- PNG em data URL
  source TEXT NOT NULL DEFAULT 'link',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  description TEXT NOT NULL,
  detail TEXT NOT NULL DEFAULT '',
  width_cm REAL,
  height_cm REAL,
  qty INTEGER NOT NULL DEFAULT 1,
  unit_price INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS order_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`);

// --- helpers -----------------------------------------------------------

export function getSetting(key, fallback = null) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : fallback;
}

export function setSetting(key, value) {
  db.prepare(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value'
  ).run(key, JSON.stringify(value));
}

export function allSettings() {
  const out = {};
  for (const r of db.prepare('SELECT key, value FROM settings').all()) out[r.key] = JSON.parse(r.value);
  return out;
}

/** Roda várias queries como uma transação. */
export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const r = fn();
    db.exec('COMMIT');
    return r;
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/** Datas do SQLite vêm em UTC sem fuso ("2026-10-15 12:00:00"); isto devolve ISO de verdade. */
export function toIso(sqlDate) {
  return sqlDate ? sqlDate.replace(' ', 'T') + 'Z' : null;
}
