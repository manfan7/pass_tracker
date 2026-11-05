// Работа с датами в формате "YYYY-MM-DD" без часовых поясов и DST:
// все вычисления идут через локальный полдень.
const MS_DAY = 86400000;

export function ymd(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function fromYmd(s) {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0, 0);
}

export function addDays(ymdStr, n) {
  return ymd(new Date(fromYmd(ymdStr).getTime() + n * MS_DAY));
}

export function todayYmd() {
  return ymd(new Date());
}

// a - b, в целых днях
export function diffDays(a, b) {
  return Math.round((fromYmd(a) - fromYmd(b)) / MS_DAY);
}

export function formatDate(ymdStr, opts) {
  return fromYmd(ymdStr).toLocaleDateString('ru-RU', opts || { day: 'numeric', month: 'short', year: 'numeric' });
}

export function cap(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// 1 день / 2 дня / 5 дней
export function pluralDays(n) {
  const a = Math.abs(n);
  const m10 = a % 10;
  const m100 = a % 100;
  if (m10 === 1 && m100 !== 11) return 'день';
  if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return 'дня';
  return 'дней';
}

// 1 сутки / 21 сутки / 2 суток / 11 суток
export function pluralSutki(n) {
  const a = Math.abs(n);
  const m100 = a % 100;
  if (m100 >= 11 && m100 <= 14) return 'суток';
  if (a % 10 === 1) return 'сутки';
  return 'суток';
}
