// Локальные уведомления PWA: напоминание за 1 день до окончания проездного.
// Сервера нет, поэтому напоминание устраивается двумя способами:
//  1) планирование через Notification Triggers (Chrome/Android) — уведомление
//     приходит в 9:00 в нужный день, даже если приложение закрыто;
//  2) там, где триггеры не поддерживаются (iPhone и др.) — проверка при
//     каждом открытии приложения.
import { endOfPass, typeById } from './passes';
import { todayYmd, addDays, formatDate } from './dateUtils';

const ENABLED_KEY = 'pass-tracker:notif:enabled';
const SENT_KEY = 'pass-tracker:notif:sent'; // { passId: 'YYYY-MM-DD' } — проездной уже оповещён на эту дату окончания
const FIRE_HOUR = 9; // час, когда приходит запланированное уведомление
const TAG_PREFIX = 'pt-end-';

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'Notification' in window;
}

export function permissionState() {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export function loadEnabled() {
  try {
    return localStorage.getItem(ENABLED_KEY) === '1';
  } catch {
    return false;
  }
}

export function saveEnabled(value) {
  try {
    localStorage.setItem(ENABLED_KEY, value ? '1' : '0');
  } catch {
    // хранилище недоступно — настройка не сохранится
  }
}

export async function requestPermission() {
  if (!notificationsSupported()) return 'unsupported';
  try {
    return await Notification.requestPermission();
  } catch {
    return 'denied';
  }
}

function triggersSupported() {
  return typeof window !== 'undefined' && typeof window.TimestampTrigger === 'function';
}

// Некоторые окружения (встраиваемые браузеры, старые WebView) отвечают на API
// service worker не сразу — не даём вспомогательным операциям блокировать показ.
function withTimeout(promise, ms) {
  let timer;
  return Promise.race([
    promise,
    new Promise((resolve) => {
      timer = setTimeout(() => resolve(null), ms);
    })
  ]).finally(() => clearTimeout(timer));
}

async function getRegistration() {
  try {
    return (await navigator.serviceWorker.getRegistration()) || null;
  } catch {
    return null;
  }
}

function appUrl() {
  return new URL(import.meta.env.BASE_URL, window.location.origin).href;
}

function loadSent() {
  try {
    const obj = JSON.parse(localStorage.getItem(SENT_KEY) || '{}');
    return obj && typeof obj === 'object' ? obj : {};
  } catch {
    return {};
  }
}

function saveSent(map) {
  try {
    localStorage.setItem(SENT_KEY, JSON.stringify(map));
  } catch {
    // без хранилища уведомления могут повторяться — не страшно
  }
}

// Отмечаем оповещёнными только текущие проездные, чтобы записи удалённых не копились
function markSent(passes, ids) {
  const sent = loadSent();
  const keep = new Set(passes.map((p) => p.id));
  const next = {};
  for (const [id, end] of Object.entries(sent)) {
    if (keep.has(id)) next[id] = end;
  }
  for (const id of ids) {
    const p = passes.find((x) => x.id === id);
    if (p) next[id] = endOfPass(p);
  }
  saveSent(next);
}

function clearSent() {
  saveSent({});
}

// Текст уведомления. Один проездной — называем его, несколько — перечисляем все.
export function endingMessage(list, endDate) {
  const names = list.map((p) => `«${p.name}» (${typeById(p.type).label})`);
  const till = `действу${list.length === 1 ? 'ет' : 'ют'} до ${formatDate(endDate)}`;
  if (list.length === 1) {
    return {
      title: `🎫 Завтра заканчивается «${list[0].name}»`,
      body: `${typeById(list[0].type).label} · ${till} — не забудьте продлить`,
      tag: `${TAG_PREFIX}${list[0].id}-${endDate}`
    };
  }
  return {
    title: `🎫 Завтра заканчивается срок у ${list.length} проездных`,
    body: `${names.join(', ')} — ${till}, не забудьте продлить`,
    tag: `${TAG_PREFIX}${endDate}`
  };
}

// true — уведомление показано (или хотя бы передано системе), false — нет
async function showNotification(msg, extra = {}) {
  const options = {
    body: msg.body,
    tag: msg.tag,
    icon: 'pwa-192.png',
    badge: 'pwa-192.png',
    data: { url: appUrl() },
    ...extra
  };
  const reg = await withTimeout(getRegistration(), 1500);
  if (reg) {
    try {
      await withTimeout(reg.showNotification(msg.title, options), 2500);
      return true;
    } catch {
      // service worker не смог — покажем из страницы
    }
  }
  try {
    new Notification(msg.title, options);
    return true;
  } catch {
    return false;
  }
}

// Снять наши запланированные (и висящие) уведомления — расписание перестраивается
// заново при каждом изменении данных.
async function cancelOurNotifications(reg) {
  let list;
  try {
    list = await withTimeout(reg.getNotifications({ includeTriggered: true }), 2000);
  } catch {
    list = null;
  }
  if (!list) return;
  for (const n of list) {
    if (typeof n.tag === 'string' && n.tag.startsWith(TAG_PREFIX)) n.close();
  }
}

function fireTimestamp(end) {
  const [y, m, d] = addDays(end, -1).split('-').map(Number);
  return new Date(y, m - 1, d, FIRE_HOUR, 0, 0).getTime();
}

async function rescheduleTriggers(passes, reg) {
  await cancelOurNotifications(reg);
  if (!triggersSupported()) return;

  const today = todayYmd();
  const now = Date.now();
  const byEnd = new Map();
  for (const p of passes) {
    const end = endOfPass(p);
    if (end <= today) continue; // уже закончился или сегодня последний день
    const ts = fireTimestamp(end);
    if (ts <= now) continue; // день напоминания уже наступил — покажем при открытии
    const group = byEnd.get(end) || [];
    group.push(p);
    byEnd.set(end, group);
  }

  const scheduledIds = [];
  for (const [end, group] of byEnd) {
    const msg = endingMessage(group, end);
    const shown = await showNotification(msg, {
      showTrigger: new TimestampTrigger(fireTimestamp(end))
    });
    if (shown) scheduledIds.push(...group.map((p) => p.id));
  }
  // Для запланированных доставка уже обеспечена — при открытии не дублируем
  if (scheduledIds.length) markSent(passes, scheduledIds);
}

async function notifyEndingTomorrow(passes) {
  const tomorrow = addDays(todayYmd(), 1);
  const ending = passes.filter((p) => endOfPass(p) === tomorrow);
  const sent = loadSent();
  const fresh = ending.filter((p) => sent[p.id] !== tomorrow);
  if (fresh.length === 0) return;
  const shown = await showNotification(endingMessage(fresh, tomorrow));
  if (shown) markSent(passes, fresh.map((p) => p.id));
}

// Главная точка входа: приводим уведомления в соответствие списку проездных.
// Вызывается при изменении данных, открытии и возврате в приложение.
export async function syncNotifications(passes, enabled) {
  if (!notificationsSupported()) return;
  const reg = await withTimeout(getRegistration(), 1500);
  if (!enabled || Notification.permission !== 'granted') {
    if (reg) await cancelOurNotifications(reg);
    if (!enabled) clearSent();
    return;
  }
  if (reg) await rescheduleTriggers(passes, reg);
  await notifyEndingTomorrow(passes);
}
