import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { Gear, X } from '@phosphor-icons/react'
import { api, channelName, humanError, type Channel, type Settings } from '../lib/api'
import { RichTextEditor } from './RichTextEditor'
import { GlassBadge, GlassButton, GlassCard, GlassField, GlassInput, GlassTextarea, GlassToggle, useToast, EmptyState } from './primitives'

export function SettingsTab({
  settings,
  channels,
  activeId,
  onRefresh,
  onSwitchChannel,
}: {
  settings: Settings | null
  channels: Channel[]
  activeId: number | null
  onRefresh: () => Promise<void>
  onSwitchChannel: (id: number) => Promise<void>
}) {
  const [footer, setFooter] = useState('')
  const [description, setDescription] = useState('')
  const [slotsText, setSlotsText] = useState('')
  const [jitter, setJitter] = useState(true)
  const [competitors, setCompetitors] = useState<string[]>([])
  const [newComp, setNewComp] = useState('')
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  useEffect(() => {
    if (!settings) return
    setFooter(settings.footer || '')
    setDescription(settings.description || '')
    setSlotsText(settings.slots.join(', '))
    setJitter(settings.schedule_jitter_enabled)
    api.getCompetitors().then((r) => setCompetitors(r.usernames)).catch(() => {})
  }, [settings])

  const flash = (text: string) => {
    toast.show(text, false)
    WebApp.HapticFeedback?.notificationOccurred('success')
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
      await onRefresh()
    } catch (e) {
      toast.show(humanError(e), true)
    } finally {
      setBusy(false)
    }
  }

  if (!settings) {
    return (
      <GlassCard title="Настройки">
        <EmptyState icon={Gear} title="Подключите канал" description="Настройки появятся после подключения канала в боте." />
      </GlassCard>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {toast.node}

      <GlassCard title="Публикация">
        <GlassField label="Подпись (footer)" hint="B / I / U / ссылка в панели редактора">
          <RichTextEditor value={footer} onChange={setFooter} placeholder="Текст внизу каждого поста…" rows={3} disabled={busy} />
        </GlassField>
        {footer && (
          <div className="mt-3 rounded-xl bg-[color-mix(in_srgb,var(--glass-text)_4%,transparent)] p-3 ring-1 ring-[var(--glass-border)]">
            <span className="text-[10px] uppercase tracking-wider text-[var(--glass-hint)]">Превью</span>
            <div className="text-sm mt-2" dangerouslySetInnerHTML={{ __html: footer.replace(/\n/g, '<br>') }} />
          </div>
        )}
        <GlassButton className="mt-3" disabled={busy} full onClick={() => run(async () => { await api.patchFooter(footer); flash('Подпись сохранена') })}>
          Сохранить подпись
        </GlassButton>

        <GlassField label="Описание / стиль канала">
          <GlassTextarea rows={4} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Тематика, тон, аудитория…" />
        </GlassField>
        <GlassButton disabled={busy} full onClick={() => run(async () => { await api.patchDescription(description); flash('Описание сохранено') })}>
          Сохранить описание
        </GlassButton>
      </GlassCard>

      <GlassCard title="Расписание">
        <GlassField label="Слоты (МСК)" hint="Через запятую: 10:00, 14:00, 18:00">
          <GlassInput value={slotsText} onChange={(e) => setSlotsText(e.target.value)} placeholder="12:00, 15:00, 18:00" />
        </GlassField>
        <GlassButton disabled={busy} full onClick={() => run(async () => { const times = slotsText.split(/[,;\s]+/).filter(Boolean); const r = await api.patchSlots(times); setSlotsText(r.slots.join(', ')); flash('Слоты обновлены') })}>
          Сохранить слоты
        </GlassButton>
        <GlassToggle label="Рандом времени ±7–23 мин" checked={jitter} onChange={(v) => { setJitter(v); run(async () => { await api.patchJitter(v); flash(v ? 'Джиттер включён' : 'Джиттер выключен') }) }} />
      </GlassCard>

      <GlassCard title="Похожие каналы">
        <div className="flex flex-wrap gap-2 mb-3">
          {competitors.length === 0 && <span className="text-sm text-[var(--glass-hint)]">Нет источников</span>}
          {competitors.map((u) => (
            <span key={u} className="inline-flex items-center gap-1 rounded-full bg-[color-mix(in_srgb,var(--glass-text)_6%,transparent)] px-3 py-1 text-xs ring-1 ring-[var(--glass-border)]">
              @{u}
              <button type="button" className="text-[var(--glass-hint)] hover:text-[var(--glass-danger)]" onClick={() => run(async () => { await api.removeCompetitor(u); setCompetitors((prev) => prev.filter((x) => x !== u)); flash('Удалено') })}>
                <X size={12} weight="bold" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <GlassInput placeholder="@channel" value={newComp} onChange={(e) => setNewComp(e.target.value)} />
          <GlassButton variant="secondary" disabled={busy || !newComp.trim()} onClick={() => run(async () => { await api.addCompetitor(newComp.replace(/^@/, '')); setNewComp(''); const r = await api.getCompetitors(); setCompetitors(r.usernames); flash('Канал добавлен') })}>
            +
          </GlassButton>
        </div>
      </GlassCard>

      <GlassCard title="Каналы">
        <ul className="flex flex-col gap-2 m-0 p-0 list-none">
          {channels.map((c) => (
            <li
              key={c.id}
              className={`flex items-center justify-between gap-3 rounded-xl px-3 py-3 ring-1 ${
                c.id === activeId ? 'ring-[color-mix(in_srgb,var(--glass-accent)_40%,transparent)] bg-[color-mix(in_srgb,var(--glass-accent)_8%,transparent)]' : 'ring-[var(--glass-border)] bg-[color-mix(in_srgb,var(--glass-text)_3%,transparent)]'
              }`}
            >
              <div>
                <strong className="text-sm block">{channelName(c)}</strong>
                {!c.is_bot_connected && <GlassBadge status="missed" />}
              </div>
              {c.id === activeId ? (
                <span className="text-[10px] uppercase tracking-wider text-[var(--glass-success)]">активный</span>
              ) : (
                <GlassButton variant="secondary" onClick={() => onSwitchChannel(c.id)}>
                  Выбрать
                </GlassButton>
              )}
            </li>
          ))}
        </ul>
      </GlassCard>
    </div>
  )
}
