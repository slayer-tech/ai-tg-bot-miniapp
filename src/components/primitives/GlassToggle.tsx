import { motion } from 'framer-motion'
import { springSnappy } from '../../lib/motion'

export function GlassToggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
  disabled?: boolean
}) {
  return (
    <label className="flex items-center justify-between gap-3 py-2 cursor-pointer">
      <span className="text-sm text-[var(--glass-text)]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={`relative h-7 w-12 rounded-full transition-colors disabled:opacity-40 ${
          checked ? 'bg-[var(--glass-accent)]' : 'bg-[color-mix(in_srgb,var(--glass-text)_12%,transparent)]'
        }`}
      >
        <motion.span
          className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md"
          animate={{ x: checked ? 20 : 0 }}
          transition={springSnappy}
        />
      </button>
    </label>
  )
}
