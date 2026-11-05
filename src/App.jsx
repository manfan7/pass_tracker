import { useEffect, useMemo, useState } from 'react';
import PassForm from './components/PassForm';
import PassList from './components/PassList';
import Calendar from './components/Calendar';
import NotificationSettings from './components/NotificationSettings';
import { loadPasses, savePasses, newId, endOfPass, statusOf } from './passes';
import { todayYmd, fromYmd, formatDate } from './dateUtils';

// Кнопка «Установить» появляется, когда браузер сам разрешает установку PWA
function useInstallPrompt() {
  const [event, setEvent] = useState(null);
  useEffect(() => {
    const onPrompt = (e) => {
      e.preventDefault();
      setEvent(e);
    };
    const onInstalled = () => setEvent(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);
  const promptInstall = () => {
    if (event) {
      event.prompt();
      setEvent(null);
    }
  };
  return [Boolean(event), promptInstall];
}

export default function App() {
  const [passes, setPasses] = useState(loadPasses);
  const [editingId, setEditingId] = useState(null);
  const [canInstall, promptInstall] = useInstallPrompt();
  const [month, setMonth] = useState(() => {
    const t = fromYmd(todayYmd());
    return new Date(t.getFullYear(), t.getMonth(), 1);
  });
  const [selected, setSelected] = useState(todayYmd());

  useEffect(() => {
    savePasses(passes);
  }, [passes]);

  const editing = useMemo(() => passes.find((p) => p.id === editingId) || null, [passes, editingId]);
  const activeCount = passes.filter((p) => ['active', 'last'].includes(statusOf(p).code)).length;

  function handleSubmit(data) {
    if (editingId) {
      setPasses((list) => list.map((p) => (p.id === editingId ? { ...p, ...data } : p)));
    } else {
      setPasses((list) => [...list, { id: newId(), ...data }]);
    }
    const t = fromYmd(data.start);
    setMonth(new Date(t.getFullYear(), t.getMonth(), 1));
    setSelected(data.start);
    setEditingId(null);
  }

  function handleDelete(pass) {
    if (window.confirm(`Удалить проездной «${pass.name}»?`)) {
      setPasses((list) => list.filter((p) => p.id !== pass.id));
      if (editingId === pass.id) setEditingId(null);
    }
  }

  function handleEdit(pass) {
    setEditingId(pass.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="logo">🎫</div>
        <div className="topbar-text">
          <h1>Проездные</h1>
          <p>
            учёт сроков действия
            {passes.length > 0 && (
              <>
                {' · '}
                <b>{activeCount}</b> {activeCount === 1 ? 'действует' : 'действуют'}
              </>
            )}
          </p>
        </div>
        {canInstall && (
          <button type="button" className="install-btn" onClick={promptInstall}>
            ⬇ Установить
          </button>
        )}
      </header>

      <div className="layout">
        <div className="col">
          <PassForm
            key={editingId ?? 'new'}
            editing={editing}
            onSubmit={handleSubmit}
            onCancel={() => setEditingId(null)}
          />
          <NotificationSettings passes={passes} />
          <PassList passes={passes} onEdit={handleEdit} onDelete={handleDelete} />
        </div>

        <div className="col">
          <Calendar
            passes={passes}
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
          />
        </div>
      </div>

      <footer className="footer">
        Данные хранятся только на этом устройстве · срок действия считается по суткам, не по месяцам
      </footer>
    </div>
  );
}
