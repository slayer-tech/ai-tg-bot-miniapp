import { useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api } from '../lib/api'
import { Btn } from './ui'

type Mode = 'pick' | 'idea' | 'reference'

export function CreatePostDialog({
  defaultDay,
  onCreated,
  onClose,
}: {
  defaultDay?: string
  onCreated: (draftId: number) => void
  onClose: () => void
}) {
  const [mode, setMode] = useState<Mode>('pick')
  const [idea, setIdea] = useState('')
  const [refText, setRefText] = useState('')
  const [refFile, setRefFile] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

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

        {mode === 'pick' && (
          <div className="create-options">
            <p className="create-hint">
              {defaultDay
                ? `День: ${new Date(defaultDay + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
                : 'Как создаём пост?'}
            </p>
            <Btn disabled={busy} full onClick={() => run(async () => (await api.generateTrendDraft()).id)}>
              🤖 Из трендов
            </Btn>
            <Btn disabled={busy} full onClick={() => setMode('idea')}>
              💡 По идее
            </Btn>
            <Btn variant="secondary" disabled={busy} full onClick={() => setMode('reference')}>
              📎 По референсу
            </Btn>
            <Btn variant="secondary" disabled={busy} full onClick={() => run(async () => (await api.createDraft('')).id)}>
              ✍️ Ручной пост
            </Btn>
            <Btn
              variant="secondary"
              disabled={busy}
              full
              onClick={() =>
                run(async () => {
                  const d = await api.createDraft('')
                  return (await api.aiText(d.id, 'write', 'интересный пост для моего канала')).id
                })
              }
            >
              ✨ ИИ сам придумает
            </Btn>
          </div>
        )}

        {mode === 'idea' && (
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
              {busy ? 'Генерация…' : 'Сгенерировать текст'}
            </Btn>
            <Btn variant="ghost" disabled={busy} onClick={() => setMode('pick')}>
              Назад
            </Btn>
          </div>
        )}

        {mode === 'reference' && (
          <div className="create-options">
            <textarea
              className="textarea"
              rows={5}
              placeholder="Вставьте текст референс-поста — ИИ перепишет под ваш канал…"
              value={refText}
              onChange={(e) => setRefText(e.target.value)}
            />
            <Btn variant="secondary" disabled={busy} full onClick={() => fileRef.current?.click()}>
              {refFile ? `📷 ${refFile.name}` : '📷 Прикрепить картинку (опционально)'}
            </Btn>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setRefFile(e.target.files?.[0] || null)}
            />
            <Btn
              disabled={busy || refText.trim().length < 10}
              full
              onClick={() =>
                run(async () => (await api.generateReferenceDraft(refText.trim(), refFile || undefined)).id)
              }
            >
              {busy ? 'Обработка…' : 'Переписать по референсу'}
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
