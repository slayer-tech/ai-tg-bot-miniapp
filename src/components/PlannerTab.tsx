import { useEffect, useState } from 'react'
import {
  addDays,
  api,
  formatWeekRange,
  statusClass,
  statusLabel,
  stripHtml,
  WEEKDAYS,
  type CalendarWeek,
  type DraftFull,
  type DraftPreview,
} from '../lib/api'
import { formatTimeMsk, mskTodayIso } from '../lib/scheduleMsk'
import { Btn, Card, Empty } from './ui'

function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function draftDisplayTime(d: DraftPreview): string {
  const iso = d.calendar_at || d.published_at || d.scheduled_at
  return iso ? formatTimeMsk(iso) : '—'
}

function DraftItem({
  d,
  onOpen,
}: {
  d: DraftPreview
  onOpen: (id: number) => void
}) {
  const time = draftDisplayTime(d)
  return (
    <button type="button" className="draft-item draft-click" onClick={() => onOpen(d.id)}>
      <div className="draft-meta">
        <span className={statusClass(d.status)}>{statusLabel(d.status)}</span>
        <span className="draft-time">{time}</span>
      </div>
      <p className="draft-text">{stripHtml(d.text) || 'Без текста'}</p>
      <span className="draft-edit-hint">Нажмите для редактирования →</span>
    </button>
  )
}

function PendingItem({ d, onOpen }: { d: DraftFull; onOpen: (id: number) => void }) {
  return (
    <button type="button" className="draft-item draft-click" onClick={() => onOpen(d.id)}>
      <div className="draft-meta">
        <span className="badge warn">Черновик</span>
        {d.has_media && <span className="draft-time">📷</span>}
      </div>
      <p className="draft-text">{stripHtml(d.text) || 'Пустой черновик'}</p>
    </button>
  )
}

export function PlannerTab({
  week,
  onWeekChange,
  onOpenDraft,
  onCreatePost,
  refreshKey,
}: {
  week: CalendarWeek | null
  onWeekChange: (monday: string) => void
  onOpenDraft: (id: number) => void
  onCreatePost: (day?: string) => void
  refreshKey?: number
}) {
  const [selected, setSelected] = useState<string | null>(null)
  const [pending, setPending] = useState<DraftFull[]>([])

  useEffect(() => {
    api.listDrafts('pending').then((r) => setPending(r.drafts)).catch(() => {})
  }, [week, refreshKey])

  if (!week) return <Empty text="Нет данных календаря" />

  const days = weekDates(week.monday)
  const today = mskTodayIso()
  const defaultSel = days.includes(today) ? today : week.monday
  const sel = selected && days.includes(selected) ? selected : defaultSel
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
          {pending.length > 0 && <span>📝 {pending.length} черновиков</span>}
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

      {pending.length > 0 && (
        <Card title="Черновики">
          <div className="draft-list">
            {pending.slice(0, 5).map((d) => (
              <PendingItem key={d.id} d={d} onOpen={onOpenDraft} />
            ))}
          </div>
        </Card>
      )}

      <Card
        title={new Date(sel + 'T12:00:00').toLocaleDateString('ru-RU', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
        })}
        action={
          <Btn variant="secondary" onClick={() => onCreatePost(sel)}>
            + Пост
          </Btn>
        }
      >
        {dayDrafts.length === 0 ? (
          <>
            <Empty text="На этот день постов нет" />
            <Btn onClick={() => onCreatePost(sel)} full>
              + Создать пост
            </Btn>
          </>
        ) : (
          <div className="draft-list">
            {dayDrafts.map((d) => (
              <DraftItem key={d.id} d={d} onOpen={onOpenDraft} />
            ))}
          </div>
        )}
      </Card>

      <div className="fab-wrap">
        <button type="button" className="fab" onClick={() => onCreatePost(sel)} aria-label="Новый пост">
          +
        </button>
      </div>
    </>
  )
}
