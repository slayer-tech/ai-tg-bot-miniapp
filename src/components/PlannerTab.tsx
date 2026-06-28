import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CaretLeft, CaretRight, Clock, Image, Plus, CheckCircle } from '@phosphor-icons/react'
import {
  addDays,
  api,
  formatWeekRange,
  stripHtml,
  WEEKDAYS,
  type CalendarWeek,
  type DraftFull,
  type DraftPreview,
} from '../lib/api'
import { formatTimeMsk, mskTodayIso } from '../lib/scheduleMsk'
import { fadeUp, stagger } from '../lib/motion'
import { GlassBadge, GlassButton, GlassCard, GlassIconButton, GlassPanel, EmptyState } from './primitives'
import { CalendarBlank } from '@phosphor-icons/react'

function weekDates(monday: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDays(monday, i))
}

function draftDisplayTime(d: DraftPreview): string {
  const iso = d.calendar_at || d.published_at || d.scheduled_at
  return iso ? formatTimeMsk(iso) : '—'
}

function DraftRow({ d, onOpen }: { d: DraftPreview; onOpen: (id: number) => void }) {
  return (
    <motion.button
      type="button"
      variants={fadeUp}
      onClick={() => onOpen(d.id)}
      className="group w-full text-left rounded-2xl bg-[color-mix(in_srgb,var(--glass-text)_4%,transparent)] px-4 py-3 ring-1 ring-[var(--glass-border)] transition-transform active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <GlassBadge status={d.status} />
        <span className="font-mono text-xs text-[var(--glass-hint)]">{draftDisplayTime(d)}</span>
      </div>
      <p className="m-0 text-sm leading-snug line-clamp-2 text-[var(--glass-text)]">
        {stripHtml(d.text) || 'Без текста'}
      </p>
      <span className="mt-2 block text-[10px] text-[var(--glass-hint)] opacity-0 group-hover:opacity-100 transition-opacity">
        Редактировать
      </span>
    </motion.button>
  )
}

function PendingChip({ d, onOpen }: { d: DraftFull; onOpen: (id: number) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(d.id)}
      className="shrink-0 w-44 rounded-2xl bg-[color-mix(in_srgb,var(--glass-text)_5%,transparent)] px-3 py-3 ring-1 ring-[var(--glass-border)] text-left active:scale-[0.98] transition-transform"
    >
      <GlassBadge status="pending" />
      <p className="mt-2 m-0 text-xs line-clamp-2 text-[var(--glass-text)]">
        {stripHtml(d.text) || 'Пустой черновик'}
      </p>
      {d.has_media && (
        <span className="mt-1 inline-flex items-center gap-1 text-[10px] text-[var(--glass-hint)]">
          <Image size={12} weight="light" /> фото
        </span>
      )}
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

  if (!week) {
    return (
      <EmptyState
        icon={CalendarBlank}
        title="Нет данных календаря"
        description="Попробуйте обновить или выберите другую неделю."
      />
    )
  }

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

  const dayTitle = new Date(sel + 'T12:00:00').toLocaleDateString('ru-RU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <div className="flex flex-col gap-4">
      <GlassCard
        title="Календарь"
        action={
          <div className="flex items-center gap-1">
            <GlassIconButton label="Пред. неделя" onClick={() => onWeekChange(addDays(week.monday, -7))}>
              <CaretLeft size={18} weight="light" />
            </GlassIconButton>
            <span className="min-w-[7rem] text-center text-xs font-medium text-[var(--glass-hint)]">
              {formatWeekRange(week.monday)}
            </span>
            <GlassIconButton label="След. неделя" onClick={() => onWeekChange(addDays(week.monday, 7))}>
              <CaretRight size={18} weight="light" />
            </GlassIconButton>
          </div>
        }
      >
        <div className="flex flex-wrap gap-4 mb-4 pb-4 border-b border-[var(--glass-border)]">
          <div className="flex items-center gap-2">
            <Clock size={16} weight="light" className="text-[var(--glass-hint)]" />
            <span className="font-mono text-sm">
              {totalS}
              <span className="text-[var(--glass-hint)] text-xs ml-1">заплан.</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} weight="light" className="text-[var(--glass-success)]" />
            <span className="font-mono text-sm">
              {totalP}
              <span className="text-[var(--glass-hint)] text-xs ml-1">опубл.</span>
            </span>
          </div>
          {pending.length > 0 && (
            <span className="font-mono text-sm text-[var(--glass-warning)]">
              {pending.length}
              <span className="text-[var(--glass-hint)] text-xs ml-1">чернов.</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {days.map((iso, i) => {
            const c = week.day_counts[iso]
            const s = c && typeof c === 'object' ? c.scheduled ?? 0 : 0
            const p = c && typeof c === 'object' ? c.published ?? 0 : 0
            const isActive = iso === sel
            const isToday = iso === today
            return (
              <motion.button
                key={iso}
                type="button"
                layout
                onClick={() => setSelected(iso)}
                className={`flex flex-col items-center gap-0.5 rounded-xl py-2 transition-colors ${
                  isActive
                    ? 'bg-[color-mix(in_srgb,var(--glass-accent)_18%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--glass-accent)_35%,transparent)]'
                    : 'bg-[color-mix(in_srgb,var(--glass-text)_3%,transparent)]'
                } ${isToday && !isActive ? 'ring-1 ring-[var(--glass-border-strong)]' : ''}`}
              >
                <span className="text-[9px] uppercase tracking-wide text-[var(--glass-hint)]">
                  {WEEKDAYS[i]}
                </span>
                <span className="font-mono text-sm font-semibold">{iso.slice(8, 10)}</span>
                <span className="flex gap-1 min-h-[10px]">
                  {s > 0 && (
                    <span className="font-mono text-[9px] text-[#7dd3fc]">{s}</span>
                  )}
                  {p > 0 && (
                    <span className="font-mono text-[9px] text-[var(--glass-success)]">{p}</span>
                  )}
                </span>
              </motion.button>
            )
          })}
        </div>
      </GlassCard>

      {pending.length > 0 && (
        <GlassPanel>
          <h3 className="m-0 mb-3 text-xs font-semibold uppercase tracking-wider text-[var(--glass-hint)]">
            Черновики
          </h3>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
            {pending.slice(0, 8).map((d) => (
              <PendingChip key={d.id} d={d} onOpen={onOpenDraft} />
            ))}
          </div>
        </GlassPanel>
      )}

      <GlassCard
        title={dayTitle}
        action={
          <GlassButton variant="secondary" onClick={() => onCreatePost(sel)}>
            Пост
          </GlassButton>
        }
      >
        <AnimatePresence mode="wait">
          {dayDrafts.length === 0 ? (
            <motion.div key="empty" {...fadeUp} className="py-6 text-center">
              <p className="text-sm text-[var(--glass-hint)] mb-4">На этот день постов нет</p>
              <GlassButton onClick={() => onCreatePost(sel)} trailing={<Plus size={16} weight="bold" />}>
                Создать пост
              </GlassButton>
            </motion.div>
          ) : (
            <motion.div
              key={sel}
              className="flex flex-col gap-2"
              variants={stagger}
              initial="initial"
              animate="animate"
            >
              {dayDrafts.map((d) => (
                <DraftRow key={d.id} d={d} onOpen={onOpenDraft} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      <div className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-4 z-20">
        <GlassButton
          onClick={() => onCreatePost(sel)}
          trailing={<Plus size={18} weight="bold" />}
          className="shadow-[0_12px_40px_-8px_rgba(16,185,129,0.6)]"
        >
          Новый
        </GlassButton>
      </div>
    </div>
  )
}
