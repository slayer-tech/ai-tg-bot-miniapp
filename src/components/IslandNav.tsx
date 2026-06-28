import WebApp from '@twa-dev/sdk'
import { motion } from 'framer-motion'
import {
  CalendarBlank,
  Gear,
  RocketLaunch,
  User,
  type Icon,
} from '@phosphor-icons/react'
import { springSnappy } from '../lib/motion'
import { cn } from '../lib/cn'

export type TabId = 'planner' | 'autopilot' | 'settings' | 'account'

const TABS: { id: TabId; label: string; icon: Icon }[] = [
  { id: 'planner', label: 'План', icon: CalendarBlank },
  { id: 'autopilot', label: 'Auto', icon: RocketLaunch },
  { id: 'settings', label: 'Настройки', icon: Gear },
  { id: 'account', label: 'Профиль', icon: User },
]

export function IslandNav({
  active,
  onChange,
}: {
  active: TabId
  onChange: (id: TabId) => void
}) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 flex justify-center px-4 pb-[calc(0.75rem+env(safe-area-inset-bottom))] pt-2 pointer-events-none"
      aria-label="Навигация"
    >
      <div className="pointer-events-auto flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--glass-bg-elevated)_92%,transparent)] p-1.5 ring-1 ring-[var(--glass-border-strong)] backdrop-blur-xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.5)]">
        {TABS.map(({ id, label, icon: IconComp }) => {
          const isActive = active === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => {
                onChange(id)
                WebApp.HapticFeedback?.selectionChanged()
              }}
              className={cn(
                'relative flex flex-col items-center gap-0.5 rounded-full px-4 py-2 min-w-[4.5rem] transition-colors',
                isActive ? 'text-[var(--glass-accent)]' : 'text-[var(--glass-hint)]',
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="absolute inset-0 rounded-full bg-[color-mix(in_srgb,var(--glass-accent)_14%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--glass-accent)_25%,transparent)]"
                  transition={springSnappy}
                />
              )}
              <IconComp size={22} weight="light" className="relative z-10" />
              <span className="relative z-10 text-[10px] font-medium tracking-wide">{label}</span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}
