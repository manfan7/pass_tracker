import { addDays, diffDays, todayYmd, formatDate, pluralDays, pluralSutki } from './dateUtils';

export const PASS_TYPES = [
  { id: 'bus', label: 'Автобус', emoji: '🚌', color: '#2563eb', soft: '#dbeafe' },
  { id: 'combo', label: 'Комбо', emoji: '🎫', color: '#7c3aed', soft: '#ede9fe' },
  { id: 'tourist', label: 'Турист', emoji: '🧳', color: '#ea580c', soft: '#ffedd5' }
];

export const typeById = (id) => PASS_TYPES.find((t) => t.id === id) || PASS_TYPES[0];

export const DURATIONS_MIN = 1;
export const DURATIONS_MAX = 30;

// Проездной действует ровно N суток: с даты покупки
// по дату покупки + N - 1 включительно (не календарный месяц).
export const endOfPass = (p) => addDays(p.start, p.duration - 1);

export function statusOf(p, today = todayYmd()) {
  const end = endOfPass(p);
  const startsIn = diffDays(p.start, today);
  if (startsIn > 0) {
    return {
      code: 'upcoming',
      label: 'Не начался',
      text: startsIn === 1 ? 'начнётся завтра' : `начнётся через ${startsIn} ${pluralDays(startsIn)}`
    };
  }
  const left = diffDays(end, today); // сколько полных дней после сегодня ещё действует
  if (left === 0) return { code: 'last', label: 'Последний день', text: 'сегодня — последний день действия' };
  if (left > 0) {
    return {
      code: 'active',
      label: 'Активен',
      text: left === 1 ? 'остался 1 день' : `осталось ${left} ${pluralDays(left)}`
    };
  }
  return { code: 'expired', label: 'Просрочен', text: `закончился ${formatDate(end)}` };
}

// Активен ли проездной в конкретный день (включая день покупки и день окончания)
export function activeOn(p, day) {
  const d = diffDays(day, p.start);
  return d >= 0 && d < p.duration;
}

const ORDER = { active: 0, last: 0, upcoming: 1, expired: 2 };

export function sortPasses(list) {
  return [...list].sort((a, b) => {
    const sa = statusOf(a);
    const sb = statusOf(b);
    if (ORDER[sa.code] !== ORDER[sb.code]) return ORDER[sa.code] - ORDER[sb.code];
    if (sa.code === 'expired') return diffDays(endOfPass(b), endOfPass(a)); // просроченные: свежие сверху
    if (sa.code === 'upcoming') return diffDays(a.start, b.start);
    return diffDays(endOfPass(a), endOfPass(b));
  });
}

export function sutkiLabel(n) {
  return `${n} ${pluralSutki(n)}`;
}

const KEY = 'pass-tracker:v1';
const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function loadPasses() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .filter(
        (p) =>
          p &&
          typeof p.id === 'string' &&
          typeof p.name === 'string' &&
          PASS_TYPES.some((t) => t.id === p.type) &&
          typeof p.start === 'string' &&
          YMD_RE.test(p.start) &&
          Number.isInteger(p.duration)
      )
      .map((p) => ({
        id: p.id,
        name: p.name,
        type: p.type,
        start: p.start,
        duration: Math.min(DURATIONS_MAX, Math.max(DURATIONS_MIN, p.duration))
      }));
  } catch {
    return [];
  }
}

export function savePasses(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // хранилище недоступно — работаем в памяти
  }
}

export function newId() {
  try {
    return crypto.randomUUID();
  } catch {
    return `p${Date.now()}${Math.random().toString(16).slice(2)}`;
  }
}
