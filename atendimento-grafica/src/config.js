import { getSetting } from './db.js';

export const PORT = Number(process.env.PORT) || 3100;

export function baseUrl() {
  return (process.env.PUBLIC_URL || getSetting('public_url') || `http://localhost:${PORT}`).replace(/\/+$/, '');
}

const DIAS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

const hhmm = (d) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

export function isOpenNow(date = new Date()) {
  const h = (getSetting('hours') || [])[date.getDay()];
  if (!h) return false;
  const now = hhmm(date);
  return now >= h.open && now < h.close;
}

/** "seg a sex 08:00–18:00, sáb 08:00–12:00" */
export function hoursText() {
  const hours = getSetting('hours') || [];
  // reordena para começar na segunda
  const order = [1, 2, 3, 4, 5, 6, 0];
  const groups = [];
  for (const d of order) {
    const h = hours[d];
    if (!h) continue;
    const label = `${h.open}–${h.close}`;
    const last = groups[groups.length - 1];
    if (last && last.label === label && last.days[last.days.length - 1] === (d === 0 ? 7 : d) - 1) {
      last.days.push(d === 0 ? 7 : d);
    } else {
      groups.push({ label, days: [d === 0 ? 7 : d] });
    }
  }
  if (!groups.length) return 'consulte nossos horários';
  return groups
    .map((g) => {
      const first = DIAS[g.days[0] % 7];
      const lastDay = DIAS[g.days[g.days.length - 1] % 7];
      return `${g.days.length > 1 ? `${first} a ${lastDay}` : first} ${g.label}`;
    })
    .join(', ');
}

/** Soma dias úteis (dias em que a gráfica abre). Devolve 'YYYY-MM-DD' no horário local. */
export function addBusinessDays(from, days) {
  const hours = getSetting('hours') || [];
  const anyOpen = hours.some(Boolean);
  const d = new Date(from);
  let left = Math.max(0, days);
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    if (!anyOpen || hours[d.getDay()]) left--;
  }
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
