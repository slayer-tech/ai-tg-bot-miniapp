import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function GlassField({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string | null
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <label className="text-xs font-medium uppercase tracking-wider text-[var(--glass-hint)]">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-[var(--glass-danger)] m-0">{error}</p>}
      {hint && !error && <p className="text-xs text-[var(--glass-hint)] m-0">{hint}</p>}
    </div>
  )
}

export function GlassInput({
  className,
  error,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={cn(
        'w-full rounded-xl bg-[color-mix(in_srgb,var(--glass-text)_5%,transparent)] px-4 py-3 text-sm text-[var(--glass-text)] ring-1 ring-[var(--glass-border)] placeholder:text-[var(--glass-hint)] focus:outline-none focus:ring-[var(--glass-accent)] transition-shadow',
        error && 'ring-[var(--glass-danger)]',
        className,
      )}
      {...props}
    />
  )
}

export function GlassTextarea({
  className,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        'w-full rounded-xl bg-[color-mix(in_srgb,var(--glass-text)_5%,transparent)] px-4 py-3 text-sm text-[var(--glass-text)] ring-1 ring-[var(--glass-border)] placeholder:text-[var(--glass-hint)] focus:outline-none focus:ring-[var(--glass-accent)] resize-none',
        className,
      )}
      {...props}
    />
  )
}
