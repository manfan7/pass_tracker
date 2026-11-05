import { useMemo, useState } from 'react';
import { PASS_TYPES, typeById, endOfPass, statusOf, sortPasses, sutkiLabel, activeOn } from '../passes';
import { todayYmd, formatDate, diffDays } from '../dateUtils';

const TABS = [
  { id: 'active', label: 'Действующие', codes: ['active', 'last'], empty: 'Нет действующих проездных' },
  { id: 'upcoming', label: 'Будущие', codes: ['upcoming'], empty: 'Нет проездных с датой покупки в будущем' },
  { id: 'expired', label: 'Просроченные', codes: ['expired'], empty: 'Просроченных нет — всё под контролем' }
];

export default function PassList({ passes, onEdit, onDelete }) {
  const [tab, setTab] = useState('active');
  const today = todayYmd();

  const grouped = useMemo(() => {
    const sorted = sortPasses(passes);
    const g = { active: [], upcoming: [], expired: [] };
    for (const p of sorted) {
      const st = statusOf(p, today);
      for (const t of TABS) {
        if (t.codes.includes(st.code)) g[t.id].push(p);
      }
    }
    return g;
  }, [passes, today]);

  const current = TABS.find((t) => t.id === tab);
  const list = grouped[tab];

  return (
    <section className="card list-card">
      <h2 className="card-title">Мои проездные</h2>

      {passes.length === 0 ? (
        <div className="empty">
          <div className="empty-emoji">🎫</div>
          <p>Пока нет ни одного проездного.</p>
          <p className="empty-sub">Заполните форму выше — он сразу появится в списке и календаре.</p>
        </div>
      ) : (
        <>
          <div className="tabs" role="tablist">
            {TABS.map((t) => (
              <button
                key={t.id}
                role="tab"
                aria-selected={tab === t.id}
                className={`tab ${tab === t.id ? 'is-active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
                <span className="tab-count">{grouped[t.id].length}</span>
              </button>
            ))}
          </div>

          {list.length === 0 ? (
            <div className="empty empty-small">{current.empty}</div>
          ) : (
            <ul className="pass-list">
              {list.map((p) => (
                <PassCard key={p.id} pass={p} today={today} onEdit={onEdit} onDelete={onDelete} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}

function PassCard({ pass, today, onEdit, onDelete }) {
  const t = typeById(pass.type);
  const st = statusOf(pass, today);
  const end = endOfPass(pass);

  return (
    <li className="pass-card" style={{ '--pc': t.color }}>
      <div className="pass-emoji" style={{ background: t.soft }} aria-hidden="true">
        {t.emoji}
      </div>
      <div className="pass-main">
        <div className="pass-name">{pass.name}</div>
        <div className="pass-sub">
          {t.label} · {sutkiLabel(pass.duration)}
        </div>
        <div className="pass-dates">
          {formatDate(pass.start)} — {formatDate(end)}
        </div>
      </div>
      <div className="pass-side">
        <span className={`badge b-${st.code}`}>{st.label}</span>
        <div className="pass-status">{st.text}</div>
        <div className="pass-actions">
          <button type="button" className="mini-btn" onClick={() => onEdit(pass)} title="Изменить">
            Изменить
          </button>
          <button
            type="button"
            className="mini-btn danger"
            onClick={() => onDelete(pass)}
            title="Удалить"
          >
            Удалить
          </button>
        </div>
      </div>
    </li>
  );
}
