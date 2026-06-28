# Content Planner — Design System

## Aesthetic: Ethereal Glass
OLED base, glass surfaces, subtle mesh orbs, emerald accent. Adapts to Telegram light/dark via `--tg-theme-*`.

## Tokens
See `src/design/tokens.css`.

## Typography
- Display/UI: Geist
- Mono (time, metrics): Geist Mono

## Icons
Phosphor Light, weight regular, size 20–24px.

## Components
`src/components/primitives/` — GlassShell, GlassCard, GlassButton, GlassSheet, etc.

## Motion
Framer Motion spring: `stiffness: 100, damping: 20`. Stagger lists. No linear easing.

## Banned
Emoji in UI, Inter font, purple neon gradients, identical 3-col card grids, side-stripe borders.
