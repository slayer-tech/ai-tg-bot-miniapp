import { useState } from 'react'
import {
  addDays,
  formatWeekRange,
  statusClass,
  statusLabel,
  stripHtml,
  WEEKDAYS,
  type CalendarWeek,
  type DraftPreview,
} from '../lib/api'
import { Card, Empty } from './ui'

function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function DraftItem({ d }: { d: DraftPreview }) {
  const time = d.scheduled_at
    ? new Date(d.scheduled_at).toLocaleTimeString('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'
  return (
    <div className="draft-item">
      <div className="draft-meta">
        <span className={statusClass(d.status)}>{statusLabel(d.status)}</span>
        <span className="draft-time">{time}</span>
      </div>
      <p className="draft-text">{stripHtml(d.text) || 'Без текста'}</p>
    </div>
  )
}

export function PlannerTab({
  week,
  onWeekChange,
}: {
  week: CalendarWeek | null
  onWeekChange: (monday: string) => void
}) {
  const [selected, setSelected] = useState<string | null>(null)

  if (!week) return <Empty text="Нет данных календаря" />

  const days = weekDates(week.monday)
  const today = new Date().toISOString().slice(0, 10)
  const sel = selected || today
  const dayDrafts = week.drafts_by_day[sel] || []

  let totalS = 0
  let totalP = 0
  for (const d of days) {
    const c = week.day_counts[d]
    if (c && typeof c === 'object') {
      totalS += c.scheduled ?? 0
      totalP += c.published ?? 0
    }
  }

  return (
    <>
      <Card
        title="Календарь"
        action={
          <div className="week-nav">
            <button
              type="button"
              className="icon-btn"
              onClick={() => onWeekChange(addDays(week.monday, -7))}
            >
              ‹
            </button>
            <span className="week-label">{formatWeekRange(week.monday)}</span>
            <button
              type="button"
              className="icon-btn"
              onClick={() => onWeekChange(addDays(week.monday, 7))}
            >
              ›
            </button>
          </div>
        }
      >
        <div className="week-summary">
          <span>🕐 {totalS} запланировано</span>
          <span>✅ {totalP} опубликовано</span>
        </div>
        <div className="week-grid">
          {days.map((iso, i) => {
            const c = week.day_counts[iso]
            const s = c && typeof c === 'object' ? c.scheduled ?? 0 : 0
            const p = c && typeof c === 'object' ? c.published ?? 0 : 0
            const active = iso === sel
            const isToday = iso === today
            return (
              <button
                key={iso}
                type="button"
                className={`day-cell${active ? ' active' : ''}${isToday ? ' today' : ''}`}
                onClick={() => setSelected(iso)}
              >
                <span className="day-name">{WEEKDAYS[i]}</span>
                <span className="day-num">{iso.slice(8, 10)}</span>
                <span className="day-counts">
                  {s > 0 && <em>{s}</em>}
                  {p > 0 && <strong>{p}</strong>}
                </span>
              </button>
            )
          })}
        </div>
      </Card>

      <Card title={new Date(sel + 'T12:00:00').toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}>
        {dayDrafts.length === 0 ? (
          <Empty text="На этот день постов нет" />
        ) : (
          <div className="draft-list">
            {dayDrafts.map((d) => (
              <DraftItem key={d.id} d={d} />
            ))}
          </div>
        )}
      </Card>
    </>
  )
}
