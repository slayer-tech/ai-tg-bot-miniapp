import type { ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'default' | 'sm'

export function GlassButton({
  children,
  onClick,
  variant = 'primary',
  size = 'default',
  disabled,
  full,
  type = 'button',
  className,
  trailing,
}: {
  children: ReactNode
  onClick?: () => void
  variant?: Variant
  size?: Size
  disabled?: boolean
  full?: boolean
  type?: 'button' | 'submit'
  className?: string
  trailing?: ReactNode
}) {
  const sizes: Record<Size, string> = {
    default: 'px-4 py-2 text-[13px] leading-tight',
    sm: 'px-3 py-1.5 text-xs leading-tight',
  }

  const base =
    'group inline-flex items-center justify-center gap-1.5 rounded-xl font-semibold transition-transform duration-200 ease-[var(--spring)] active:scale-[0.98] disabled:opacity-45 disabled:cursor-not-allowed disabled:active:scale-100'

  const variants: Record<Variant, string> = {
    primary: 'bg-[var(--glass-accent)] text-[#041510] shadow-[0_2px_10px_-4px_rgba(16,185,129,0.45)]',
    secondary:
      'bg-[color-mix(in_srgb,var(--glass-text)_8%,transparent)] text-[var(--glass-text)] ring-1 ring-[var(--glass-border)]',
    ghost: 'bg-transparent text-[var(--glass-hint)] hover:text-[var(--glass-text)]',
    danger: 'bg-[color-mix(in_srgb,var(--glass-danger)_18%,transparent)] text-[var(--glass-danger)] ring-1 ring-[color-mix(in_srgb,var(--glass-danger)_35%,transparent)]',
  }

  return (
    <button
      type={type}
      className={cn(base, sizes[size], variants[variant], full && 'w-full', className)}
      onClick={onClick}
      disabled={disabled}
    >
      <span>{children}</span>
      {trailing && (
        <span
          className={cn(
            'flex items-center justify-center rounded-full bg-black/10 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-px group-active:scale-95',
            size === 'sm' ? 'h-5 w-5' : 'h-6 w-6',
          )}
        >
          {trailing}
        </span>
      )}
    </button>
  )
}

export function GlassIconButton({
  children,
  onClick,
  disabled,
  label,
  className,
}: {
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
  label: string
  className?: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--glass-text)_6%,transparent)] ring-1 ring-[var(--glass-border)] text-[var(--glass-text)] transition-transform active:scale-95 disabled:opacity-40',
        className,
      )}
    >
      {children}
    </button>
  )
}
