export const spring = { type: 'spring' as const, stiffness: 100, damping: 20 }

export const springSnappy = { type: 'spring' as const, stiffness: 380, damping: 28 }

export const fadeUp = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
}

export const stagger = {
  animate: { transition: { staggerChildren: 0.06 } },
}
