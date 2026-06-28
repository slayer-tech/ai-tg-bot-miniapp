import { useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { ArrowLeft, Sparkle } from '@phosphor-icons/react'
import { api, humanError } from '../lib/api'
import { GlassButton, GlassIconButton, GlassModal, useToast } from './primitives'
import { GlassTextarea } from './primitives/GlassField'

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
  const toast = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const run = async (fn: () => Promise<number>) => {
    setBusy(true)
    toast.clear()
    try {
      const id = await fn()
      WebApp.HapticFeedback?.notificationOccurred('success')
      onCreated(id)
    } catch (e) {
      toast.show(humanError(e), true)
    } finally {
      setBusy(false)
    }
  }

  return (
    <GlassModal open onClose={onClose}>
      <header className="flex items-center gap-3 border-b border-[var(--glass-border)] px-4 py-3">
        <GlassIconButton label="Назад" onClick={onClose}>
          <ArrowLeft size={18} weight="light" />
        </GlassIconButton>
        <strong className="text-sm flex-1">Новый пост</strong>
      </header>

      {toast.node}

      <div className="p-4 flex flex-col gap-3 max-h-[70dvh] overflow-y-auto">
        {mode === 'pick' && (
          <>
            <p className="text-xs text-[var(--glass-hint)] m-0">
              {defaultDay
                ? `День: ${new Date(defaultDay + 'T12:00:00').toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}`
                : 'Как создаём пост?'}
            </p>
            <GlassButton disabled={busy} full onClick={() => run(async () => (await api.generateTrendDraft()).id)}>
              Из трендов
            </GlassButton>
            <GlassButton disabled={busy} full onClick={() => setMode('idea')}>
              По идее
            </GlassButton>
            <GlassButton variant="secondary" disabled={busy} full onClick={() => setMode('reference')}>
              По референсу
            </GlassButton>
            <GlassButton variant="secondary" disabled={busy} full onClick={() => run(async () => (await api.createDraft('')).id)}>
              Ручной пост
            </GlassButton>
            <GlassButton
              variant="secondary"
              disabled={busy}
              full
              trailing={<Sparkle size={16} weight="fill" />}
              onClick={() =>
                run(async () => {
                  const d = await api.createDraft('')
                  return (await api.aiText(d.id, 'write', 'интересный пост для моего канала')).id
                })
              }
            >
              ИИ сам придумает
            </GlassButton>
          </>
        )}

        {mode === 'idea' && (
          <>
            <GlassTextarea
              rows={4}
              placeholder="О чём пост? Например: 5 привычек для продуктивности…"
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
            />
            <GlassButton
              disabled={busy || idea.trim().length < 3}
              full
              onClick={() => run(async () => (await api.generateIdeaDraft(idea.trim())).id)}
            >
              {busy ? 'Генерация…' : 'Сгенерировать текст'}
            </GlassButton>
            <GlassButton variant="ghost" disabled={busy} onClick={() => setMode('pick')}>
              Назад
            </GlassButton>
          </>
        )}

        {mode === 'reference' && (
          <>
            <GlassTextarea
              rows={5}
              placeholder="Вставьте текст референс-поста — ИИ перепишет под ваш канал…"
              value={refText}
              onChange={(e) => setRefText(e.target.value)}
            />
            <GlassButton variant="secondary" disabled={busy} full onClick={() => fileRef.current?.click()}>
              {refFile ? refFile.name : 'Прикрепить картинку (опционально)'}
            </GlassButton>
            <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => setRefFile(e.target.files?.[0] || null)} />
            <GlassButton
              disabled={busy || refText.trim().length < 10}
              full
              onClick={() => run(async () => (await api.generateReferenceDraft(refText.trim(), refFile || undefined)).id)}
            >
              {busy ? 'Обработка…' : 'Переписать по референсу'}
            </GlassButton>
            <GlassButton variant="ghost" disabled={busy} onClick={() => setMode('pick')}>
              Назад
            </GlassButton>
          </>
        )}
      </div>
    </GlassModal>
  )
}
