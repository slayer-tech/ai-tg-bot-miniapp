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
    <div className="flex flex-col gap-2.5">
      <label className="text-sm font-semibold text-[var(--glass-text)] leading-snug">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-[var(--glass-danger)] m-0">{error}</p>}
      {hint && !error && <p className="text-[13px] text-[var(--glass-hint)] m-0 leading-snug">{hint}</p>}
    </div>
  )
}

/** Секция формы: контент + действие с нормальными отступами */
export function GlassFormSection({
  children,
  action,
  divider,
}: {
  children: ReactNode
  action?: ReactNode
  divider?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4',
        divider && 'pb-7 mb-7 border-b border-[var(--glass-border)] last:border-0 last:pb-0 last:mb-0',
      )}
    >
      <div className="flex flex-col gap-3">{children}</div>
      {action && <div className="flex justify-end pt-1">{action}</div>}
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
