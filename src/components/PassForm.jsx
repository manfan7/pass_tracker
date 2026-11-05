import { useState } from 'react';
import { PASS_TYPES, typeById, endOfPass, sutkiLabel, DURATIONS_MIN, DURATIONS_MAX } from '../passes';

import { todayYmd, formatDate, pluralSutki } from '../dateUtils';

const QUICK_DURATIONS = [1, 3, 7, 14, 30];

export default function PassForm({ editing, onSubmit, onCancel }) {
  const [type, setType] = useState(editing?.type ?? 'bus');
  const [name, setName] = useState(editing?.name ?? '');
  const [duration, setDuration] = useState(editing?.duration ?? 30);
  const [start, setStart] = useState(editing?.start ?? todayYmd());
  const [error, setError] = useState('');

  const end = start ? endOfPass({ start, duration }) : null;

  function submit(e) {
    e.preventDefault();
    if (!start) {
      setError('Укажите дату покупки');
      return;
    }
    setError('');
    onSubmit({ name: name.trim() || typeById(type).label, type, start, duration });
    if (!editing) {
      // после добавления нового — чистим имя и дату, тип и длительность оставляем
      setName('');
      setStart(todayYmd());
    }
  }

  return (
    <section className="card form-card">
      <h2 className="card-title">{editing ? 'Изменить проездной' : 'Новый проездной'}</h2>

      <form onSubmit={submit}>
        <div className="field">
          <span className="field-label">Тип</span>
          <div className="type-row" role="radiogroup" aria-label="Тип проездного">
            {PASS_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                className={`type-btn ${type === t.id ? 'is-active' : ''}`}
                style={type === t.id ? { borderColor: t.color, background: t.soft } : undefined}
                onClick={() => setType(t.id)}
              >
                <span className="type-emoji">{t.emoji}</span>
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="pass-name">
            Имя проездного
          </label>
          <input
            id="pass-name"
            type="text"
            placeholder={`Например: Мой ${typeById(type).label.toLowerCase()}`}
            value={name}
            maxLength={40}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="field">
          <span className="field-label">Длительность</span>
          <div className="duration-head">
            <span className="duration-value">
              {duration} {pluralSutki(duration)}
            </span>
            <div className="quick-row">
              {QUICK_DURATIONS.map((d) => (
                <button
                  key={d}
                  type="button"
                  className={`chip ${duration === d ? 'is-active' : ''}`}
                  onClick={() => setDuration(d)}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
          <input
            type="range"
            min={DURATIONS_MIN}
            max={DURATIONS_MAX}
            step={1}
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            aria-label={`Длительность в сутках: ${duration}`}
          />
          <div className="range-hints">
            <span>1</span>
            <span>30</span>
          </div>
        </div>

        <div className="field">
          <label className="field-label" htmlFor="pass-start">
            Дата покупки
          </label>
          <input
            id="pass-start"
            type="date"
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </div>

        {start && (
          <div className="preview">
            Действует с <b>{formatDate(start)}</b> по <b>{formatDate(end)}</b> · {sutkiLabel(duration)}
          </div>
        )}

        {error && <div className="form-error">{error}</div>}

        <div className="form-actions">
          <button type="submit" className="btn btn-primary">
            {editing ? 'Сохранить' : 'Добавить проездной'}
          </button>
          {editing && (
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Отмена
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
