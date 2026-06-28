import { motion } from 'framer-motion'
import type { ReactNode } from 'react'
import { springSnappy } from '../../lib/motion'
import { cn } from '../../lib/cn'

export function GlassOptionToggle({
  checked,
  onChange,
  label,
  hint,
  icon,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  hint?: string
  icon: ReactNode
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors disabled:opacity-40',
        checked
          ? 'bg-[color-mix(in_srgb,var(--glass-accent)_14%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--glass-accent)_35%,transparent)]'
          : 'bg-[color-mix(in_srgb,var(--glass-text)_4%,transparent)] ring-1 ring-[var(--glass-border)]',
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors',
          checked
            ? 'bg-[color-mix(in_srgb,var(--glass-accent)_22%,transparent)] text-[var(--glass-accent)]'
            : 'bg-[color-mix(in_srgb,var(--glass-text)_6%,transparent)] text-[var(--glass-hint)]',
        )}
      >
        {icon}
      </span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-[var(--glass-text)]">{label}</span>
        {hint && <span className="block text-[11px] text-[var(--glass-hint)] mt-0.5">{hint}</span>}
      </span>
      <span
        className={cn(
          'relative h-6 w-10 shrink-0 rounded-full transition-colors',
          checked ? 'bg-[var(--glass-accent)]' : 'bg-[color-mix(in_srgb,var(--glass-text)_12%,transparent)]',
        )}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm"
          animate={{ x: checked ? 16 : 0 }}
          transition={springSnappy}
        />
      </span>
    </button>
  )
}
