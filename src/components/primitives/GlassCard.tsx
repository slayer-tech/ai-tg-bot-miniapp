import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { GlassShell } from './GlassShell'

export function GlassCard({
  title,
  children,
  action,
  className,
  noPadding,
}: {
  title?: string
  children: ReactNode
  action?: ReactNode
  className?: string
  noPadding?: boolean
}) {
  return (
    <GlassShell className={className} padding={!noPadding}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 mb-4">
          {title && (
            <h2 className="text-base font-semibold tracking-tight text-[var(--glass-text)] m-0">
              {title}
            </h2>
          )}
          {action}
        </div>
      )}
      {children}
    </GlassShell>
  )
}

export function GlassPanel({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        'rounded-2xl bg-[var(--glass-bg-elevated)] ring-1 ring-[var(--glass-border)] p-4',
        className,
      )}
    >
      {children}
    </div>
  )
}
