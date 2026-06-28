import { cn } from '../../lib/cn'

export function GlassSegment<T extends string | number>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={String(o.value)}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o.value)}
          className={cn(
            'rounded-full px-3.5 py-2 text-xs font-medium transition-all active:scale-[0.98]',
            value === o.value
              ? 'bg-[var(--glass-accent)] text-[#041510]'
              : 'bg-[color-mix(in_srgb,var(--glass-text)_6%,transparent)] text-[var(--glass-hint)] ring-1 ring-[var(--glass-border)]',
            disabled && 'opacity-40',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
