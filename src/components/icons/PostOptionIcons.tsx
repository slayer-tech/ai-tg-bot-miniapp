import { cn } from '../../lib/cn'

type IconProps = { className?: string; active?: boolean }

const stroke = (active?: boolean) =>
  active ? 'var(--glass-accent)' : 'currentColor'

/** Закреп — стеклянная булавка с кольцом */
export function PinOptionIcon({ className, active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn('h-5 w-5', className)}
    >
      <circle
        cx="12"
        cy="7"
        r="4.25"
        stroke={stroke(active)}
        strokeWidth="1.5"
        fill={active ? 'color-mix(in srgb, var(--glass-accent) 18%, transparent)' : 'none'}
      />
      <path
        d="M12 11v8.5M9 19.5h6"
        stroke={stroke(active)}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M8.5 11h7"
        stroke={stroke(active)}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={active ? 1 : 0.55}
      />
    </svg>
  )
}

/** Тихий — колокол с перечёркнутой волной */
export function SilentOptionIcon({ className, active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn('h-5 w-5', className)}
    >
      <path
        d="M12 4.5a4.5 4.5 0 0 1 4.5 4.5v3.2l1.4 2.3H6.1l1.4-2.3V9a4.5 4.5 0 0 1 4.5-4.5Z"
        stroke={stroke(active)}
        strokeWidth="1.5"
        strokeLinejoin="round"
        fill={active ? 'color-mix(in srgb, var(--glass-accent) 12%, transparent)' : 'none'}
      />
      <path
        d="M9.5 18.5a2.5 2.5 0 0 0 5 0"
        stroke={stroke(active)}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 4l16 16"
        stroke={active ? 'var(--glass-accent)' : 'var(--glass-hint)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={active ? 0.9 : 0.65}
      />
    </svg>
  )
}

/** Без футера — лист с отрезанной нижней частью */
export function NoFooterOptionIcon({ className, active }: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={cn('h-5 w-5', className)}
    >
      <rect
        x="5.5"
        y="3.5"
        width="13"
        height="17"
        rx="2"
        stroke={stroke(active)}
        strokeWidth="1.5"
        fill={active ? 'color-mix(in srgb, var(--glass-accent) 10%, transparent)' : 'none'}
      />
      <path
        d="M8 8.5h8M8 11.5h5.5"
        stroke={stroke(active)}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.7}
      />
      <path
        d="M5.5 15.5h13"
        stroke={active ? 'var(--glass-accent)' : 'var(--glass-hint)'}
        strokeWidth="1.5"
        strokeDasharray="2.5 2.5"
        strokeLinecap="round"
      />
      <path
        d="M7 18.5h10"
        stroke={active ? 'var(--glass-accent)' : 'var(--glass-hint)'}
        strokeWidth="1.5"
        strokeLinecap="round"
        opacity={0.45}
      />
    </svg>
  )
}
