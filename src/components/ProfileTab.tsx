import type { Me } from '../lib/api'
import { GlassButton, GlassCard, GlassShell } from './primitives'

export function ProfileTab({
  me,
  billing,
  onRefresh,
}: {
  me: Me
  billing: { text_credits: number; image_credits: number; unlimited: boolean } | null
  onRefresh: () => void
}) {
  return (
    <div className="flex flex-col gap-4">
      <GlassShell>
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[color-mix(in_srgb,var(--glass-accent)_15%,transparent)] ring-1 ring-[color-mix(in_srgb,var(--glass-accent)_30%,transparent)]">
            <span className="text-xl font-semibold text-[var(--glass-accent)]">
              {me.username?.[0]?.toUpperCase() || 'U'}
            </span>
          </div>
          <div>
            <strong className="text-base block">{me.username ? `@${me.username}` : `ID ${me.id}`}</strong>
            <span className="text-xs text-[var(--glass-hint)] font-mono">Telegram ID: {me.id}</span>
          </div>
        </div>
      </GlassShell>

      <GlassCard title="Лимиты">
        {billing?.unlimited ? (
          <p className="font-mono text-3xl font-semibold tracking-tight m-0 text-[var(--glass-accent)]">
            Безлимит
            <span className="block text-xs font-sans font-normal text-[var(--glass-hint)] mt-1">dev-тариф</span>
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <span className="font-mono text-3xl font-semibold">{billing?.text_credits ?? me.text_credits}</span>
              <span className="block text-xs text-[var(--glass-hint)] mt-1">Текстовые посты</span>
            </div>
            <div>
              <span className="font-mono text-3xl font-semibold">{billing?.image_credits ?? me.image_credits}</span>
              <span className="block text-xs text-[var(--glass-hint)] mt-1">Картинки</span>
            </div>
          </div>
        )}
        <GlassButton className="mt-4" variant="secondary" onClick={onRefresh} full>
          Обновить
        </GlassButton>
      </GlassCard>
    </div>
  )
}
