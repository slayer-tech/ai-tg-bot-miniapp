import type { ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { spring } from '../../lib/motion'

export function GlassSheet({
  open = true,
  onClose,
  children,
  size = 'full',
}: {
  open?: boolean
  onClose?: () => void
  children: ReactNode
  size?: 'full' | 'sm'
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-40 flex flex-col justify-end"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className={`relative z-10 flex max-h-[96dvh] flex-col overflow-hidden rounded-t-[2rem] bg-[var(--glass-bg-elevated)] ring-1 ring-[var(--glass-border-strong)] shadow-[0_-20px_60px_-20px_rgba(0,0,0,0.5)] ${
              size === 'sm' ? 'max-h-[85dvh]' : ''
            }`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring}
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-[var(--glass-border-strong)]" />
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export function GlassModal({
  open = true,
  onClose,
  children,
}: {
  open?: boolean
  onClose?: () => void
  children: ReactNode
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            aria-label="Закрыть"
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] bg-[var(--glass-bg-elevated)] ring-1 ring-[var(--glass-border-strong)] shadow-[0_24px_80px_-24px_rgba(0,0,0,0.65)]"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 16, opacity: 0, scale: 0.98 }}
            transition={spring}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
