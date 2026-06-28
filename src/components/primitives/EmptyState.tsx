import type { ReactNode } from 'react'
import type { Icon } from '@phosphor-icons/react'
import { GlassButton } from './GlassButton'

export function EmptyState({
  icon: IconComp,
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: Icon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
}) {
  return (
    <div className="flex flex-col items-center text-center py-10 px-4">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--glass-text)_6%,transparent)] ring-1 ring-[var(--glass-border)]">
        <IconComp size={28} weight="light" className="text-[var(--glass-hint)]" />
      </div>
      <h2 className="text-base font-semibold tracking-tight m-0 mb-2">{title}</h2>
      {description && (
        <p className="text-sm text-[var(--glass-hint)] max-w-[28ch] m-0 mb-4 leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <GlassButton variant="secondary" onClick={onAction}>
          {actionLabel}
        </GlassButton>
      )}
    </div>
  )
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-2xl bg-[color-mix(in_srgb,var(--glass-danger)_12%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--glass-danger)_30%,transparent)] px-4 py-3 text-sm text-[var(--glass-danger)]">
      <p className="m-0 mb-2">{message}</p>
      {onRetry && (
        <button
          type="button"
          className="text-xs font-semibold underline underline-offset-2"
          onClick={onRetry}
        >
          Повторить
        </button>
      )}
    </div>
  )
}

export function Toast({ children, error }: { children: ReactNode; error?: boolean }) {
  return (
    <div
      className={`mx-4 mb-2 rounded-xl px-4 py-2.5 text-sm font-medium ${
        error
          ? 'bg-[color-mix(in_srgb,var(--glass-danger)_15%,transparent)] text-[var(--glass-danger)]'
          : 'bg-[color-mix(in_srgb,var(--glass-accent)_18%,transparent)] text-[var(--glass-success)]'
      }`}
    >
      {children}
    </div>
  )
}
