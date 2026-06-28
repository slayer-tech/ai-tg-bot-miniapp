import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function GlassShell({
  children,
  className,
  innerClassName,
  padding = true,
}: {
  children: ReactNode
  className?: string
  innerClassName?: string
  padding?: boolean
}) {
  return (
    <div
      className={cn(
        'rounded-[var(--glass-radius-outer)] p-1.5 ring-1 ring-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-text)_4%,transparent)]',
        className,
      )}
    >
      <div
        className={cn(
          'rounded-[var(--glass-radius-inner)] bg-[var(--glass-bg)] shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]',
          padding && 'p-5',
          innerClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}
