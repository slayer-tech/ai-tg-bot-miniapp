import { useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { Btn } from './ui'

export function CreatePostDialog({
  defaultDay,
  onCreated,
  onClose,
}: {
  defaultDay?: string
  onCreated: (draftId: number) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<'pick' | 'idea'>('pick')
  const [idea, setIdea] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const run = async (fn: () => Promise<number>) => {
    setBusy(true)
    setErr(null)
    try {
      const id = await fn()
      WebApp.HapticFeedback?.notificationOccurred('success')
      onCreated(id)
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet sheet-sm">
        <header className="sheet-head">
          <button type="button" className="icon-btn" onClick={onClose}>←</button>
          <strong>Новый пост</strong>
          <span />
        </header>

        {err && <div className="toast err">{err}</div>}

        {mode === 'pick' ? (
          <div className="create-options">
            <p className="create-hint">
              {defaultDay
                ? `День: ${new Date(defaultDay + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
                : 'Выберите способ создания'}
            </p>
            <Btn
              disabled={busy}
              full
              onClick={() => run(async () => (await api.createDraft('')).id)}
            >
              ✍️ Пустой пост — напишу сам
            </Btn>
            <Btn
              variant="secondary"
              disabled={busy}
              full
              onClick={() => setMode('idea')}
            >
              💡 По идее — ИИ напишет текст
            </Btn>
            <Btn
              variant="secondary"
              disabled={busy}
              full
              onClick={() =>
                run(async () => {
                  const d = await api.createDraft('')
                  const updated = await api.aiText(d.id, 'write', 'интересный пост для моего канала')
                  return updated.id
                })
              }
            >
              ✨ ИИ сам придумает пост
            </Btn>
          </div>
        ) : (
          <div className="create-options">
            <textarea
              className="textarea"
              rows={4}
              placeholder="О чём пост? Например: 5 привычек для продуктивности…"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            <Btn
              disabled={busy || idea.trim().length < 3}
              full
              onClick={() => run(async () => (await api.generateIdeaDraft(idea.trim())).id)}
            >
              {busy ? 'Генерация…' : 'Сгенерировать'}
            </Btn>
            <Btn variant="ghost" disabled={busy} onClick={() => setMode('pick')}>
              Назад
            </Btn>
          </div>
        )}
      </div>
    </div>
  )
}
