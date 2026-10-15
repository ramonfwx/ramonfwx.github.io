import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedIfEmpty } from './src/seed.js';
import { PORT } from './src/config.js';
import { HttpError, routes } from './src/routes.js';
import { ValidationError } from './src/orders.js';

seedIfEmpty();

const PUBLIC_DIR = join(dirname(fileURLToPath(import.meta.url)), 'public');
const MAX_BODY = 1_500_000;

// --- login do painel ---------------------------------------------------------
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'grafica123';
if (!process.env.ADMIN_PASSWORD) {
  console.warn('[aviso] ADMIN_PASSWORD não definida: usando a senha de teste "grafica123". Defina a variável antes de publicar.');
}
const sessions = new Map(); // token -> expira em (ms)
const SESSION_MS = 1000 * 60 * 60 * 12;
const attempts = new Map(); // ip -> { n, until }

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a));
  const y = Buffer.from(String(b));
  return x.length === y.length && timingSafeEqual(x, y);
};

const cookie = (req, name) => {
  const m = new RegExp(`(?:^|; )${name}=([^;]*)`).exec(req.headers.cookie || '');
  return m ? decodeURIComponent(m[1]) : null;
};

const isLogged = (req) => {
  const t = cookie(req, 'sid');
  const exp = t && sessions.get(t);
  if (!exp) return false;
  if (exp < Date.now()) {
    sessions.delete(t);
    return false;
  }
  return true;
};

// --- helpers de resposta -----------------------------------------------------
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.webmanifest': 'application/manifest+json',
};

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'same-origin',
  'X-Frame-Options': 'SAMEORIGIN',
};

function send(res, status, body, headers = {}) {
  res.writeHead(status, { ...SECURITY_HEADERS, ...headers });
  res.end(body);
}
const sendJson = (res, status, data, headers = {}) =>
  send(res, status, JSON.stringify(data), { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers });

function readBody(req) {
  return new Promise((resolveBody, reject) => {
    let size = 0;
    const chunks = [];
    req.on('data', (c) => {
      size += c.length;
      if (size > MAX_BODY) {
        reject(new HttpError(413, 'Conteúdo grande demais.'));
        req.destroy();
      } else chunks.push(c);
    });
    req.on('end', () => {
      if (!chunks.length) return resolveBody({});
      try {
        resolveBody(JSON.parse(Buffer.concat(chunks).toString('utf8')));
      } catch {
        reject(new HttpError(400, 'JSON inválido.'));
      }
    });
    req.on('error', reject);
  });
}

async function serveStatic(res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  const file = resolve(join(PUBLIC_DIR, normalize(rel)));
  if (file !== PUBLIC_DIR && !file.startsWith(PUBLIC_DIR + sep)) return send(res, 403, 'Proibido');
  try {
    let target = file;
    const st = await stat(target);
    if (st.isDirectory()) target = join(target, 'index.html');
    const data = await readFile(target);
    return send(res, 200, data, {
      'Content-Type': MIME[extname(target)] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
  } catch {
    return send(res, 404, 'Página não encontrada', { 'Content-Type': 'text/plain; charset=utf-8' });
  }
}

// --- servidor ---------------------------------------------------------------
const server = createServer(async (req, res) => {
  const url = new URL(req.url, 'http://x');
  const { pathname } = url;
  try {
    // login / logout
    if (pathname === '/api/admin/login' && req.method === 'POST') {
      const ip = req.socket.remoteAddress;
      const a = attempts.get(ip) || { n: 0, until: 0 };
      if (a.until > Date.now()) throw new HttpError(429, 'Muitas tentativas. Aguarde um minuto.');
      const body = await readBody(req);
      if (!safeEqual(body.password ?? '', ADMIN_PASSWORD)) {
        a.n++;
        if (a.n >= 5) Object.assign(a, { n: 0, until: Date.now() + 60_000 });
        attempts.set(ip, a);
        throw new HttpError(401, 'Senha incorreta.');
      }
      attempts.delete(ip);
      const token = randomBytes(24).toString('base64url');
      sessions.set(token, Date.now() + SESSION_MS);
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': `sid=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_MS / 1000}` });
    }
    if (pathname === '/api/admin/logout' && req.method === 'POST') {
      const t = cookie(req, 'sid');
      if (t) sessions.delete(t);
      return sendJson(res, 200, { ok: true }, { 'Set-Cookie': 'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }
    if (pathname === '/api/admin/me') return sendJson(res, isLogged(req) ? 200 : 401, { logged: isLogged(req) });

    // API e PDF
    if (pathname.startsWith('/api/') || pathname.startsWith('/pedido/')) {
      for (const [method, re, route] of routes) {
        if (method !== req.method) continue;
        const m = re.exec(pathname);
        if (!m) continue;
        if (route.auth && !isLogged(req)) throw new HttpError(401, 'Faça login.');
        let body = {};
        if (method !== 'GET') {
          if (!String(req.headers['content-type'] || '').includes('application/json')) throw new HttpError(415, 'Use application/json.');
          body = await readBody(req);
        }
        const out = await route.handler({ params: m.slice(1), query: Object.fromEntries(url.searchParams), body });
        if (out && out.raw) return send(res, 200, out.raw, { 'Content-Type': out.type, 'Cache-Control': 'no-store', ...out.headers });
        return sendJson(res, 200, out ?? { ok: true });
      }
      throw new HttpError(404, 'Rota não encontrada.');
    }

    if (pathname === '/') return send(res, 302, '', { Location: '/admin/' });
    if (req.method !== 'GET' && req.method !== 'HEAD') throw new HttpError(405, 'Método não permitido.');
    return serveStatic(res, pathname);
  } catch (err) {
    if (err instanceof HttpError) return sendJson(res, err.status, { error: err.message });
    if (err instanceof ValidationError) return sendJson(res, 400, { error: err.message });
    console.error(err);
    return sendJson(res, 500, { error: 'Erro interno. Tente novamente.' });
  }
});

server.listen(PORT, () => {
  console.log(`Atendimento Gráfica rodando em http://localhost:${PORT}`);
  console.log(`  Painel:     http://localhost:${PORT}/admin/`);
  console.log(`  Simulador:  http://localhost:${PORT}/simulador/`);
});

export { server };
