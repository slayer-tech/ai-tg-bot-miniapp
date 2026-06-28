/** @deprecated Use primitives directly */
import type { ReactNode } from 'react'
import {
  GlassCard,
  GlassButton,
  GlassField,
  GlassSegment,
  GlassToggle,
} from './primitives'

export function Card(props: { title?: string; children: ReactNode; action?: ReactNode }) {
  return <GlassCard {...props} />
}

export function Btn(props: {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  disabled?: boolean
  full?: boolean
}) {
  return <GlassButton {...props} />
}

export function Toggle(props: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return <GlassToggle {...props} />
}

export function Field(props: { label: string; hint?: string; children: ReactNode }) {
  return <GlassField {...props} />
}

export function StatGrid({ items }: { items: { label: string; value: string | number }[] }) {
  return (
    <div className="grid grid-cols-2 gap-4">
      {items.map((it) => (
        <div key={it.label} className="flex flex-col gap-1">
          <span className="font-mono text-2xl font-semibold tracking-tight">{it.value}</span>
          <span className="text-xs text-[var(--glass-hint)]">{it.label}</span>
        </div>
      ))}
    </div>
  )
}

export function Empty({ text }: { text: string }) {
  return <p className="text-sm text-[var(--glass-hint)] text-center py-4 m-0">{text}</p>
}

export function SegmentChips<T extends string | number>(props: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
  disabled?: boolean
}) {
  return <GlassSegment {...props} />
}

export { statusLabel } from './primitives/GlassBadge'
