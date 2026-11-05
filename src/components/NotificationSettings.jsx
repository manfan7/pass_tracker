import { useCallback, useEffect, useState } from 'react';
import {
  notificationsSupported,
  permissionState,
  loadEnabled,
  saveEnabled,
  requestPermission,
  syncNotifications
} from '../notifications';

export default function NotificationSettings({ passes }) {
  const [supported] = useState(notificationsSupported);
  const [perm, setPerm] = useState(permissionState);
  const [enabled, setEnabled] = useState(loadEnabled);

  const sync = useCallback(() => {
    syncNotifications(passes, enabled);
  }, [passes, enabled]);

  useEffect(() => {
    sync();
  }, [sync]);

  // День мог смениться, пока приложение было свернуто — проверяем при возврате
  useEffect(() => {
    if (!supported) return undefined;
    const onVisible = () => {
      if (document.visibilityState === 'visible') sync();
    };
    document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(sync, 30 * 60 * 1000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    };
  }, [sync, supported]);

  if (!supported) return null;

  const active = enabled && perm === 'granted';
  const denied = perm === 'denied';

  async function handleToggle() {
    if (active) {
      setEnabled(false);
      saveEnabled(false);
      return;
    }
    const result = await requestPermission();
    setPerm(result);
    const on = result === 'granted';
    setEnabled(on);
    saveEnabled(on);
  }

  let desc;
  if (denied) {
    desc = 'Уведомления запрещены в настройках. Разрешите их для «Проездных» в настройках сайта или приложения, затем обновите страницу.';
  } else if (active) {
    desc = 'Напомним за 1 день до окончания срока. На Android напоминание придёт в 9:00, даже если приложение закрыто.';
  } else {
    desc = 'Предупредим за 1 день до окончания срока проездного.';
  }

  return (
    <section className="card notif-card">
      <div className="notif-row">
        <div className="notif-bell" aria-hidden="true">
          🔔
        </div>
        <div className="notif-main">
          <h2 className="card-title">Уведомления</h2>
          <p className="notif-desc">{desc}</p>
        </div>
        {!denied && (
          <button
            type="button"
            role="switch"
            aria-checked={active}
            aria-label="Напоминать за день до окончания проездного"
            className={`switch ${active ? 'is-on' : ''}`}
            onClick={handleToggle}
          />
        )}
      </div>
    </section>
  );
}
