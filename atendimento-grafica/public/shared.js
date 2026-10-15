// Funções usadas pelas três telas (painel, simulador e orçamento).

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export const brl = (cents) => (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

/** "1.234,56" | "150" | "R$ 12,5" -> centavos */
export function toCents(value) {
  let s = String(value ?? '').replace(/[R$\s]/g, '');
  if (!s) return 0;
  if (s.includes(',')) s = s.replace(/\./g, '').replace(',', '.');
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

/** centavos -> "1234,56" para preencher campos */
export const fromCents = (cents) => (Number(cents || 0) / 100).toFixed(2).replace('.', ',');

/** Datas do SQLite vêm em UTC sem fuso. */
export function sqlDate(sql) {
  return sql ? new Date(sql.replace(' ', 'T') + 'Z') : null;
}
export const fmtDateTime = (sql) => {
  const d = sqlDate(sql);
  return d ? d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '';
};
export const fmtTime = (sql) => {
  const d = sqlDate(sql);
  return d ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
};
export const fmtDay = (iso) => (iso ? iso.split('-').reverse().join('/') : '—');

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : method === 'GET' ? {} : { 'Content-Type': 'application/json' },
    body: body !== undefined ? JSON.stringify(body) : method === 'GET' ? undefined : '{}',
    credentials: 'same-origin',
  });
  let data = null;
  try {
    data = await res.json();
  } catch {
    /* sem corpo */
  }
  if (!res.ok) throw new ApiError(data?.error || `Erro ${res.status}`, res.status);
  return data;
}

export function toast(message, kind = 'ok') {
  let box = document.getElementById('toasts');
  if (!box) {
    box = document.createElement('div');
    box.id = 'toasts';
    box.setAttribute('role', 'status');
    document.body.append(box);
  }
  const el = document.createElement('div');
  el.className = `toast ${kind === 'error' ? 'error' : ''}`;
  el.textContent = message;
  box.append(el);
  setTimeout(() => el.remove(), kind === 'error' ? 6000 : 3000);
}

/** Texto do WhatsApp (*negrito*, links) -> HTML seguro */
export function chatHtml(text) {
  return esc(text)
    .replace(/\*([^*\n]+)\*/g, '<strong>$1</strong>')
    .replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener">$1</a>')
    .replace(/\n/g, '<br>');
}

/** Campo de assinatura desenhada com mouse/dedo. Devolve { clear, isEmpty, toDataUrl }. */
export function signaturePad(canvas) {
  const ctx = canvas.getContext('2d');
  let drawing = false;
  let empty = true;
  let last = null;

  const fit = () => {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.round(rect.width * ratio);
    canvas.height = Math.round(rect.height * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#111';
    empty = true;
  };
  const pos = (e) => {
    const r = canvas.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  canvas.addEventListener('pointerdown', (e) => {
    drawing = true;
    last = pos(e);
    canvas.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  canvas.addEventListener('pointermove', (e) => {
    if (!drawing) return;
    const p = pos(e);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    last = p;
    empty = false;
  });
  const stop = () => (drawing = false);
  canvas.addEventListener('pointerup', stop);
  canvas.addEventListener('pointercancel', stop);
  fit();
  return {
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      empty = true;
    },
    refit: fit,
    isEmpty: () => empty,
    toDataUrl: () => (empty ? '' : canvas.toDataURL('image/png')),
  };
}
