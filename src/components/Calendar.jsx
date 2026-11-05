import { useMemo } from 'react';
import { PASS_TYPES, typeById, activeOn, endOfPass, statusOf } from '../passes';
import { ymd, fromYmd, todayYmd, diffDays, formatDate, cap } from '../dateUtils';

const WEEKDAYS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

export default function Calendar({ passes, month, onMonthChange, selected, onSelect }) {
  const today = todayYmd();
  const year = month.getFullYear();
  const mIdx = month.getMonth();

  const title = cap(month.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' }).replace(/\s*г\./, ''));

  const cells = useMemo(() => {
    const offset = (new Date(year, mIdx, 1).getDay() + 6) % 7; // Пн = 0
    const daysInMonth = new Date(year, mIdx + 1, 0).getDate();
    const out = [];
    for (let i = 0; i < offset; i++) out.push(null);
    for (let d = 1; d <= daysInMonth; d++) out.push(ymd(new Date(year, mIdx, d, 12)));
    while (out.length % 7 !== 0) out.push(null);
    return out;
  }, [year, mIdx]);

  function shift(n) {
    onMonthChange(new Date(year, mIdx + n, 1));
  }
  function goToday() {
    const t = fromYmd(today);
    onMonthChange(new Date(t.getFullYear(), t.getMonth(), 1));
    onSelect(today);
  }

  return (
    <section className="card cal-card">
      <div className="cal-head">
        <button type="button" className="icon-btn" onClick={() => shift(-1)} aria-label="Предыдущий месяц">
          ‹
        </button>
        <div className="cal-title">
          <h2 className="card-title">{title}</h2>
          <button type="button" className="link-btn" onClick={goToday}>
            сегодня
          </button>
        </div>
        <button type="button" className="icon-btn" onClick={() => shift(1)} aria-label="Следующий месяц">
          ›
        </button>
      </div>

      <div className="cal-grid" role="grid">
        {WEEKDAYS.map((w, i) => (
          <div key={w} className={`cal-wd ${i >= 5 ? 'is-weekend' : ''}`}>
            {w}
          </div>
        ))}
        {cells.map((day, i) =>
          day ? (
            <DayCell
              key={day}
              day={day}
              col={i % 7}
              passes={passes}
              today={today}
              selected={selected}
              onSelect={onSelect}
            />
          ) : (
            <div key={`e${i}`} className="cal-cell is-empty" />
          )
        )}
      </div>

      <div className="legend">
        {PASS_TYPES.map((t) => (
          <span key={t.id} className="legend-item">
            <i className="dot" style={{ background: t.color }} />
            {t.label}
          </span>
        ))}
        <span className="legend-item">
          <i className="dot dot-ring" style={{ color: '#4f46e5' }} />
          день окончания
        </span>
      </div>

      <DayDetail day={selected} passes={passes} today={today} />
    </section>
  );
}

function DayCell({ day, col, passes, today, selected, onSelect }) {
  const active = passes.filter((p) => activeOn(p, day));
  const ending = active.filter((p) => endOfPass(p) === day);
  const isToday = day === today;
  const isPast = diffDays(day, today) < 0;

  const cls = [
    'cal-cell',
    isToday ? 'is-today' : '',
    isPast ? 'is-past' : '',
    selected === day ? 'is-selected' : '',
    ending.length ? 'has-end' : '',
    col >= 5 ? 'is-weekend' : ''
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={cls}
      style={ending.length ? { borderColor: ending[0] ? typeById(ending[0].type).color : undefined } : undefined}
      onClick={() => onSelect(day)}
      aria-label={formatDate(day)}
      aria-pressed={selected === day}
    >
      <span className="daynum">{Number(day.slice(8))}</span>
      <span className="dots">
        {active.slice(0, 3).map((p) => (
          <i
            key={p.id}
            className={`dot ${endOfPass(p) === day ? 'dot-ring' : ''}`}
            style={{ background: typeById(p.type).color, color: typeById(p.type).color }}
          />
        ))}
        {active.length > 3 && <span className="more">+{active.length - 3}</span>}
      </span>
    </button>
  );
}

function DayDetail({ day, passes, today }) {
  if (!day) return null;
  const active = passes.filter((p) => activeOn(p, day));
  const rel = diffDays(day, today);

  return (
    <div className="day-detail">
      <div className="day-detail-title">{cap(formatDate(day, { weekday: 'long', day: 'numeric', month: 'long' }))}</div>
      {active.length === 0 ? (
        <div className="day-detail-empty">
          {rel < 0 ? 'Проездных не было' : rel === 0 ? 'Сегодня проездных нет' : 'Проездных не запланировано'}
        </div>
      ) : (
        <ul className="day-detail-list">
          {active.map((p) => {
            const t = typeById(p.type);
            const isEnd = endOfPass(p) === day;
            let note;
            if (isEnd && rel === 0) note = 'заканчивается сегодня';
            else if (isEnd && rel < 0) note = 'закончился в этот день';
            else if (isEnd) note = 'заканчивается в этот день';
            else if (rel === 0) note = statusOf(p, today).text;
            else if (rel < 0) note = 'был активен';
            else note = 'будет действовать';
            return (
              <li key={p.id} className="day-detail-item">
                <span className="dot" style={{ background: t.color }} />
                <b>{p.name}</b>
                <span className="day-detail-note">{note}</span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
