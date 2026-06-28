import { useEffect, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import {
  api,
  channelName,
  type Channel,
  type Settings,
} from '../lib/api'
import { RichTextEditor } from './RichTextEditor'
import { Btn, Card, Empty, Field, Toggle } from './ui'

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
  const [msg, setMsg] = useState<string | null>(null)

  useEffect(() => {
    if (!settings) return
    setFooter(settings.footer || '')
    setDescription(settings.description || '')
    setSlotsText(settings.slots.join(', '))
    setJitter(settings.schedule_jitter_enabled)
    api.getCompetitors().then((r) => setCompetitors(r.usernames)).catch(() => {})
  }, [settings])

  const flash = (text: string) => {
    setMsg(text)
    WebApp.HapticFeedback?.notificationOccurred('success')
    setTimeout(() => setMsg(null), 2000)
  }

  const run = async (fn: () => Promise<void>) => {
    setBusy(true)
    try {
      await fn()
      await onRefresh()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  if (!settings) {
    return (
      <Card title="Настройки">
        <Empty text="Подключите канал в боте" />
      </Card>
    )
  }

  return (
    <>
      {msg && <div className="toast">{msg}</div>}

      <Card title="Публикация">
        <Field label="Подпись (footer)" hint="Выделите текст и нажмите B / I / U / 🔗 — HTML не нужен">
          <RichTextEditor
            value={footer}
            onChange={setFooter}
            placeholder="Текст внизу каждого поста…"
            rows={3}
            disabled={busy}
          />
        </Field>
        {footer && (
          <div className="footer-preview-box">
            <span className="field-hint">Превью:</span>
            <div className="footer-render" dangerouslySetInnerHTML={{ __html: footer.replace(/\n/g, '<br>') }} />
          </div>
        )}
        <Btn
          disabled={busy}
          onClick={() => run(async () => {
            await api.patchFooter(footer)
            flash('Подпись сохранена')
          })}
          full
        >
          Сохранить подпись
        </Btn>

        <Field label="Описание / стиль канала">
          <textarea
            className="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Тематика, тон, аудитория…"
          />
        </Field>
        <Btn
          disabled={busy}
          onClick={() => run(async () => {
            await api.patchDescription(description)
            flash('Описание сохранено')
          })}
          full
        >
          Сохранить описание
        </Btn>
      </Card>

      <Card title="Расписание">
        <Field label="Слоты (МСК)" hint="Через запятую: 10:00, 14:00, 18:00">
          <input
            className="input"
            value={slotsText}
            onChange={(e) => setSlotsText(e.target.value)}
            placeholder="12:00, 15:00, 18:00"
          />
        </Field>
        <Btn
          disabled={busy}
          onClick={() => run(async () => {
            const times = slotsText.split(/[,;\s]+/).filter(Boolean)
            const r = await api.patchSlots(times)
            setSlotsText(r.slots.join(', '))
            flash('Слоты обновлены')
          })}
          full
        >
          Сохранить слоты
        </Btn>

        <Toggle
          label="Рандом времени ±7–23 мин"
          checked={jitter}
          onChange={(v) => {
            setJitter(v)
            run(async () => {
              await api.patchJitter(v)
              flash(v ? 'Джиттер включён' : 'Джиттер выключен')
            })
          }}
        />
      </Card>

      <Card title="Похожие каналы">
        <div className="tag-list">
          {competitors.length === 0 && <Empty text="Нет источников" />}
          {competitors.map((u) => (
            <span key={u} className="tag">
              @{u}
              <button
                type="button"
                className="tag-x"
                onClick={() =>
                  run(async () => {
                    await api.removeCompetitor(u)
                    setCompetitors((prev) => prev.filter((x) => x !== u))
                    flash('Удалено')
                  })
                }
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="inline-add">
          <input
            className="input"
            placeholder="@channel"
            value={newComp}
            onChange={(e) => setNewComp(e.target.value)}
          />
          <Btn
            variant="secondary"
            disabled={busy || !newComp.trim()}
            onClick={() =>
              run(async () => {
                await api.addCompetitor(newComp.replace(/^@/, ''))
                setNewComp('')
                const r = await api.getCompetitors()
                setCompetitors(r.usernames)
                flash('Канал добавлен')
              })
            }
          >
            +
          </Btn>
        </div>
      </Card>

      <Card title="Каналы">
        <ul className="channel-list">
          {channels.map((c) => (
            <li key={c.id} className={c.id === activeId ? 'active' : ''}>
              <div className="ch-info">
                <strong>{channelName(c)}</strong>
                {!c.is_bot_connected && (
                  <span className="badge err">нет доступа</span>
                )}
              </div>
              {c.id === activeId ? (
                <span className="badge ok">активный</span>
              ) : (
                <Btn variant="secondary" onClick={() => onSwitchChannel(c.id)}>
                  Выбрать
                </Btn>
              )}
            </li>
          ))}
        </ul>
      </Card>
    </>
  )
}
