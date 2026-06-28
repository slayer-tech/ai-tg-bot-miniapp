import { cn } from '../../lib/cn'

const STATUS: Record<string, { label: string; className: string }> = {
  pending: { label: 'Черновик', className: 'text-[var(--glass-warning)] bg-[color-mix(in_srgb,var(--glass-warning)_15%,transparent)]' },
  scheduled: { label: 'В расписании', className: 'text-[#7dd3fc] bg-[color-mix(in_srgb,#7dd3fc_12%,transparent)]' },
  published: { label: 'Опубликован', className: 'text-[var(--glass-success)] bg-[color-mix(in_srgb,var(--glass-success)_15%,transparent)]' },
  deleted: { label: 'Удалён', className: 'text-[var(--glass-hint)] bg-[color-mix(in_srgb,var(--glass-text)_6%,transparent)]' },
  missed: { label: 'Пропущен', className: 'text-[var(--glass-danger)] bg-[color-mix(in_srgb,var(--glass-danger)_12%,transparent)]' },
}

export function GlassBadge({ status }: { status: string }) {
  const s = STATUS[status] ?? { label: status, className: 'text-[var(--glass-hint)] bg-[color-mix(in_srgb,var(--glass-text)_6%,transparent)]' }
  return (
    <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide', s.className)}>
      {s.label}
    </span>
  )
}

export function statusLabel(status: string): string {
  return STATUS[status]?.label ?? status
}
