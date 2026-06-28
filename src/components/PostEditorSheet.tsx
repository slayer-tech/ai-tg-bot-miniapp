import type { ReactNode } from 'react'
import { useEffect, useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import {
  ArrowLeft,
  Clock,
  FloppyDisk,
  Gear,
  Image as ImageIcon,
  LinkSimple,
  RocketLaunch,
  Sparkle,
  TextT,
  Trash,
} from '@phosphor-icons/react'
import { api, fetchMediaUrl, humanError, stripHtml, type DraftFull } from '../lib/api'
import {
  defaultScheduleMsk,
  formatScheduleMsk,
  scheduleFromIso,
} from '../lib/scheduleMsk'
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor'
import { MediaAlbumGrid, MediaPickerDialog, AiImageEditDialog } from './MediaAlbum'
import {
  GlassBadge,
  GlassButton,
  GlassIconButton,
  GlassSegment,
  GlassSheet,
  GlassOptionToggle,
  useToast,
} from './primitives'
import { NoFooterOptionIcon, PinOptionIcon, SilentOptionIcon } from './icons/PostOptionIcons'
import { GlassInput } from './primitives/GlassField'
import { AppSkeleton } from './primitives/Skeleton'
import { maxPhotosForDraft, MAX_DRAFT_PHOTOS_GALLERY, validateInlineButtonUrl } from '../lib/validateUrl'

type Aspect = 'vertical' | 'square' | 'horizontal'

const AUTODELETE_PRESETS = [0, 1, 24, 48] as const
const AUTODELETE_MIN = 1
const AUTODELETE_MAX = 720
const AUTODELETE_OPTS = [
  { value: 0, label: 'Выкл' },
  { value: 1, label: '1 ч' },
  { value: 24, label: '24 ч' },
  { value: 48, label: '48 ч' },
]
const ASPECT_OPTS: { value: Aspect; label: string }[] = [
  { value: 'vertical', label: '3:4' },
  { value: 'square', label: '1:1' },
  { value: 'horizontal', label: '16:9' },
]
const PRESET_SET = new Set<number>(AUTODELETE_PRESETS)

function Section({ icon: Icon, title, children }: { icon: typeof ImageIcon; title: string; children: ReactNode }) {
  return (
    <section className="py-4 border-b border-[var(--glass-border)] last:border-0">
      <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--glass-hint)] m-0 mb-3">
        <Icon size={16} weight="light" />
        {title}
      </h3>
      {children}
    </section>
  )
}

export function PostEditorSheet({
  draftId,
  defaultDay,
  onClose,
  onSaved,
}: {
  draftId: number
  defaultDay?: string
  onClose: () => void
  onSaved: () => void
}) {
  const [draft, setDraft] = useState<DraftFull | null>(null)
  const [text, setText] = useState('')
  const [btnUrl, setBtnUrl] = useState('')
  const [btnText, setBtnText] = useState('')
  const [autodelete, setAutodelete] = useState(0)
  const [autodeleteCustom, setAutodeleteCustom] = useState('')
  const [silent, setSilent] = useState(false)
  const [pinAfter, setPinAfter] = useState(false)
  const [skipFooter, setSkipFooter] = useState(false)
  const [scheduleAt, setScheduleAt] = useState(() => defaultScheduleMsk(defaultDay))
  const [mediaItems, setMediaItems] = useState<{ src: string; index: number }[]>([])
  const mediaBlobsRef = useRef<string[]>([])
  const [picker, setPicker] = useState<'remove' | 'ai-edit' | null>(null)
  const [aiEditIndex, setAiEditIndex] = useState<number | null>(null)
  const [aiEditPrompt, setAiEditPrompt] = useState('')
  const [btnUrlError, setBtnUrlError] = useState<string | null>(null)
  const [aspect, setAspect] = useState<Aspect>('square')
  const [busy, setBusy] = useState(false)
  const toast = useToast()
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAiWrite, setShowAiWrite] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const editorRef = useRef<RichTextEditorHandle>(null)

  const currentText = () => editorRef.current?.getValue() ?? text

  const revokeMediaBlobs = () => {
    mediaBlobsRef.current.forEach((u) => URL.revokeObjectURL(u))
    mediaBlobsRef.current = []
  }

  const loadMediaItems = async (d: DraftFull) => {
    revokeMediaBlobs()
    const paths = d.media_urls?.length ? d.media_urls : d.media_url ? [d.media_url] : []
    const loaded: { src: string; index: number }[] = []
    for (let i = 0; i < paths.length; i++) {
      const src = await fetchMediaUrl(paths[i])
      if (src) {
        mediaBlobsRef.current.push(src)
        loaded.push({ src, index: i })
      }
    }
    setMediaItems(loaded)
  }

  const applyDraft = async (d: DraftFull) => {
    setDraft(d)
    setText(d.text || '')
    setBtnUrl(d.inline_button_url || '')
    setBtnText(d.inline_button_text || '')
    setAutodelete(d.autodelete_hours ?? 0)
    setAutodeleteCustom(
      d.autodelete_hours && !PRESET_SET.has(d.autodelete_hours) ? String(d.autodelete_hours) : '',
    )
    setPinAfter(d.pin_after_publish)
    setSilent(d.disable_notification)
    setSkipFooter(d.skip_footer ?? false)
    setBtnUrlError(null)
    if (d.scheduled_at) setScheduleAt(scheduleFromIso(d.scheduled_at))
    await loadMediaItems(d)
  }

  useEffect(() => {
    api.getDraft(draftId).then(applyDraft).catch((e) => toast.show(humanError(e), true))
    return () => revokeMediaBlobs()
  }, [draftId]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn: () => Promise<void>, success?: string) => {
    setBusy(true)
    toast.clear()
    try {
      await fn()
      if (success) {
        toast.show(success, false)
        WebApp.HapticFeedback?.notificationOccurred('success')
      }
      onSaved()
    } catch (e) {
      toast.show(humanError(e), true)
      WebApp.HapticFeedback?.notificationOccurred('error')
    } finally {
      setBusy(false)
    }
  }

  const checkBtnUrl = (): boolean => {
    if (!btnUrl.trim()) {
      setBtnUrlError(null)
      return true
    }
    const err = validateInlineButtonUrl(btnUrl)
    setBtnUrlError(err)
    return !err
  }

  const patchForPublish = async () => {
    if (btnUrl.trim()) {
      const err = validateInlineButtonUrl(btnUrl)
      if (err) throw new Error(err)
    }
    const payload: Record<string, unknown> = {
      text: currentText(),
      autodelete_hours: autodelete || 0,
      pin_after_publish: pinAfter,
      disable_notification: silent,
      skip_footer: skipFooter,
    }
    if (btnUrl.trim()) {
      payload.inline_button_url = btnUrl.trim()
      payload.inline_button_text = btnText.trim() || '/auto'
    } else {
      payload.clear_button = true
    }
    await applyDraft(await api.patchDraft(draftId, payload))
  }

  const canPublish = Boolean(stripHtml(text).trim() || draft?.has_media)

  const saveAutodelete = (h: number) => {
    if (h !== 0 && (h < AUTODELETE_MIN || h > AUTODELETE_MAX)) {
      toast.show(`Автоудаление: от ${AUTODELETE_MIN} до ${AUTODELETE_MAX} ч`, true)
      return
    }
    setAutodelete(h)
    if (PRESET_SET.has(h)) setAutodeleteCustom('')
    run(async () => {
      const d = await api.patchDraft(draftId, { text: currentText(), autodelete_hours: h || 0 })
      await applyDraft(d)
    }, h ? `Автоудаление: ${h} ч` : 'Автоудаление выкл')
  }

  const applyCustomAutodelete = () => {
    const raw = autodeleteCustom.trim()
    if (!raw) return
    const n = Number.parseInt(raw, 10)
    if (!Number.isFinite(n)) {
      toast.show('Укажите целое число часов', true)
      return
    }
    saveAutodelete(n)
  }

  const autodeleteChipValue = PRESET_SET.has(autodelete) ? autodelete : -1
  const btnUrlValidationError = btnUrl.trim() ? validateInlineButtonUrl(btnUrl) : null
  const btnUrlInvalid = Boolean(btnUrlValidationError)

  const saveButton = (useAi = false) => {
    const err = btnUrl.trim() ? validateInlineButtonUrl(btnUrl) : 'Укажите ссылку'
    if (err) {
      setBtnUrlError(err)
      toast.show(err, true)
      return
    }
    return run(async () => {
      const d = await api.patchDraft(draftId, {
        text: currentText(),
        inline_button_url: btnUrl.trim(),
        inline_button_text: useAi ? '/auto' : btnText.trim() || '/auto',
        clear_button: false,
      })
      await applyDraft(d)
      setBtnText(d.inline_button_text || '')
    }, 'Кнопка сохранена')
  }

  const refreshMedia = async (d: DraftFull) => applyDraft(d)
  const hasText = Boolean(stripHtml(text).trim())
  const mediaCount = draft?.media_count ?? mediaItems.length
  const maxMedia = maxPhotosForDraft(hasText)
  const canAddMedia = mediaCount < maxMedia

  const removeMediaAt = (index: number) =>
    run(async () => refreshMedia(await api.removeDraftMediaAt(draftId, index)), 'Удалено')

  const startAiEdit = (index: number) => {
    setAiEditIndex(index)
    setAiEditPrompt('')
  }

  const submitAiEdit = () => {
    if (aiEditIndex === null) return
    const prompt = aiEditPrompt.trim()
    if (prompt.length < 2) {
      toast.show('Опишите, что изменить на фото', true)
      return
    }
    const index = aiEditIndex
    return run(async () => {
      await refreshMedia(await api.aiImage(draftId, 'uniqueify', 'square', prompt, index))
      setAiEditIndex(null)
      setAiEditPrompt('')
    }, 'Фото обновлено')
  }

  const uploadFiles = (files: FileList | null) => {
    if (!files?.length) return
    const batch = Array.from(files).slice(0, maxMedia - mediaCount)
    run(async () => {
      let d = draft!
      for (const f of batch) d = await api.uploadDraftMedia(draftId, f)
      await refreshMedia(d)
    }, batch.length > 1 ? `Загружено ${batch.length} фото` : 'Загружено')
  }

  if (!draft) {
    return (
      <GlassSheet open onClose={onClose}>
        <div className="p-6">
          <AppSkeleton />
          {toast.node}
        </div>
      </GlassSheet>
    )
  }

  const editable = draft.is_editable && !draft.is_published
  const published = draft.is_published

  return (
    <GlassSheet open onClose={onClose}>
      <header className="flex items-center gap-2 border-b border-[var(--glass-border)] px-4 py-3 shrink-0">
        <GlassIconButton label="Назад" onClick={onClose}>
          <ArrowLeft size={18} weight="light" />
        </GlassIconButton>
        <div className="flex-1 min-w-0">
          <strong className="text-sm block truncate">{published ? 'Опубликованный пост' : 'Редактор'}</strong>
          <GlassBadge status={draft.status} />
        </div>
        <GlassIconButton
          label="Сохранить"
          disabled={busy || !editable}
          onClick={() =>
            run(async () => {
              await api.patchDraft(draftId, {
                text: currentText(),
                autodelete_hours: autodelete || 0,
                pin_after_publish: pinAfter,
                disable_notification: silent,
                skip_footer: skipFooter,
                ...(btnUrl.trim()
                  ? { inline_button_url: btnUrl.trim(), inline_button_text: btnText.trim() || '/auto' }
                  : { clear_button: true }),
              }).then(applyDraft)
            }, 'Сохранено')
          }
        >
          <FloppyDisk size={18} weight="light" />
        </GlassIconButton>
      </header>

      {toast.node}

      <div className="flex-1 overflow-y-auto px-4 pb-32">
        {published && (
          <div className="mt-3 rounded-xl bg-[color-mix(in_srgb,var(--glass-success)_12%,transparent)] px-4 py-3 text-sm text-[var(--glass-success)] ring-1 ring-[color-mix(in_srgb,var(--glass-success)_25%,transparent)]">
            Пост в канале. Можно настроить автоудаление или удалить.
          </div>
        )}

        {!published && (
          <Section icon={ImageIcon} title="Фото">
            <p className="text-xs text-[var(--glass-hint)] mb-3">
              {hasText
                ? 'С текстом — 1 фото (подпись Telegram до 1024 символов)'
                : `Без текста — альбом до ${MAX_DRAFT_PHOTOS_GALLERY} фото`}
            </p>
            {mediaItems.length > 0 ? (
              <>
                <MediaAlbumGrid
                  items={mediaItems}
                  editable={!busy}
                  onPhotoClick={(i) => { if (confirm(`Убрать фото ${i + 1}?`)) removeMediaAt(i) }}
                />
                <div className="flex flex-wrap gap-2 mt-3">
                  <GlassButton variant="secondary" disabled={busy || !canAddMedia} onClick={() => fileRef.current?.click()}>
                    Добавить
                  </GlassButton>
                  <GlassButton variant="secondary" disabled={busy} onClick={() => (mediaCount <= 1 ? confirm('Убрать фото?') && removeMediaAt(0) : setPicker('remove'))}>
                    Убрать
                  </GlassButton>
                  <GlassButton disabled={busy} onClick={() => (mediaCount <= 1 ? startAiEdit(0) : setPicker('ai-edit'))} trailing={<Sparkle size={14} weight="fill" />}>
                    ИИ-редакт
                  </GlassButton>
                </div>
              </>
            ) : (
              <>
                <GlassButton variant="secondary" disabled={busy} full onClick={() => fileRef.current?.click()}>
                  Добавить фото
                </GlassButton>
                <p className="text-xs text-[var(--glass-hint)] mt-3 mb-2">Формат для ИИ:</p>
                <GlassSegment options={ASPECT_OPTS} value={aspect} onChange={setAspect} disabled={busy} />
                <GlassButton
                  className="mt-3"
                  disabled={busy}
                  full
                  trailing={<Sparkle size={16} weight="fill" />}
                  onClick={() => run(async () => refreshMedia(await api.aiImage(draftId, 'generate', aspect, aiPrompt || text)), 'Сгенерировано')}
                >
                  Сгенерировать ИИ
                </GlassButton>
              </>
            )}
            <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => { uploadFiles(e.target.files); e.target.value = '' }} />
          </Section>
        )}

        {published && mediaItems.length > 0 && (
          <Section icon={ImageIcon} title="Фото">
            <MediaAlbumGrid items={mediaItems} editable={false} onPhotoClick={() => {}} />
          </Section>
        )}

        <Section icon={TextT} title="Текст">
          {editable ? (
            <>
              <RichTextEditor ref={editorRef} value={text} onChange={setText} placeholder="Текст поста…" rows={6} disabled={busy} />
              <div className="flex flex-wrap gap-2 mt-3">
                <GlassButton variant="secondary" disabled={busy} onClick={() => run(async () => { const d = await api.aiText(draftId, 'shorten'); await applyDraft(d); setText(d.text) }, 'Короче')}>Короче</GlassButton>
                <GlassButton variant="secondary" disabled={busy} onClick={() => run(async () => { const d = await api.aiText(draftId, 'humor'); await applyDraft(d); setText(d.text) }, 'Готово')}>Юмор</GlassButton>
                <GlassButton variant="secondary" disabled={busy} onClick={() => run(async () => { const d = await api.aiText(draftId, 'rewrite'); await applyDraft(d); setText(d.text) }, 'Переписано')}>Переписать</GlassButton>
                <GlassButton variant="secondary" disabled={busy} onClick={() => setShowAiWrite((v) => !v)} trailing={<Sparkle size={14} weight="fill" />}>ИИ написать</GlassButton>
              </div>
              {showAiWrite && (
                <div className="mt-3 flex flex-col gap-2">
                  <GlassInput placeholder="Идея для поста…" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                  <GlassButton disabled={busy || !aiPrompt.trim()} onClick={() => run(async () => { const d = await api.aiText(draftId, 'write', aiPrompt); await applyDraft(d); setText(d.text); setShowAiWrite(false) }, 'Пост готов')}>
                    Сгенерировать
                  </GlassButton>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm leading-relaxed m-0">{stripHtml(draft.footer_preview)}</p>
          )}
        </Section>

        {editable && (
          <Section icon={LinkSimple} title="Кнопка под постом">
            <GlassInput className="mb-2" placeholder="URL — https://… или @channel" value={btnUrl} error={!!(btnUrlError || btnUrlValidationError)} onChange={(e) => { setBtnUrl(e.target.value); if (btnUrlError) setBtnUrlError(null) }} onBlur={() => btnUrl.trim() && checkBtnUrl()} />
            {(btnUrlError || btnUrlValidationError) && (
              <p className="text-xs text-[var(--glass-danger)] mb-2">{btnUrlError || btnUrlValidationError}</p>
            )}
            <GlassInput className="mb-3" placeholder="Текст кнопки" value={btnText} onChange={(e) => setBtnText(e.target.value)} />
            <div className="flex flex-col gap-2">
              <GlassButton variant="secondary" disabled={busy || !btnUrl.trim() || btnUrlInvalid} full onClick={() => saveButton(false)}>Сохранить кнопку</GlassButton>
              <GlassButton disabled={busy || !btnUrl.trim() || btnUrlInvalid} full trailing={<Sparkle size={14} weight="fill" />} onClick={() => saveButton(true)}>ИИ подберёт текст</GlassButton>
              {(btnUrl || draft.inline_button_url) && (
                <GlassButton variant="ghost" disabled={busy} full onClick={() => run(async () => { const d = await api.patchDraft(draftId, { text: currentText(), clear_button: true }); await applyDraft(d); setBtnUrl(''); setBtnText('') }, 'Кнопка убрана')}>Убрать кнопку</GlassButton>
              )}
            </div>
          </Section>
        )}

        <Section icon={Gear} title="Дополнительно">
          <p className="text-xs text-[var(--glass-hint)] mb-2">Автоудаление из канала</p>
          <GlassSegment options={AUTODELETE_OPTS} value={autodeleteChipValue} onChange={saveAutodelete} disabled={busy} />
          <div className="flex gap-2 mt-3">
            <GlassInput type="number" min={AUTODELETE_MIN} max={AUTODELETE_MAX} placeholder="Своё, ч" value={autodeleteCustom} disabled={busy} onChange={(e) => setAutodeleteCustom(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && applyCustomAutodelete()} />
            <GlassButton variant="secondary" disabled={busy || !autodeleteCustom.trim()} onClick={applyCustomAutodelete}>OK</GlassButton>
          </div>
          {editable && (
            <div className="flex flex-col gap-2 mt-4">
              <GlassOptionToggle
                label="Закрепить"
                hint="Закрепить пост после публикации"
                checked={pinAfter}
                icon={<PinOptionIcon active={pinAfter} />}
                onChange={(v) => {
                  setPinAfter(v)
                  run(async () => applyDraft(await api.patchDraft(draftId, { text: currentText(), pin_after_publish: v })))
                }}
              />
              <GlassOptionToggle
                label="Тихий"
                hint="Без push-уведомления подписчикам"
                checked={silent}
                icon={<SilentOptionIcon active={silent} />}
                onChange={(v) => {
                  setSilent(v)
                  run(async () => applyDraft(await api.patchDraft(draftId, { text: currentText(), disable_notification: v })))
                }}
              />
              <GlassOptionToggle
                label="Без футера"
                hint="Не добавлять подпись канала к этому посту"
                checked={skipFooter}
                icon={<NoFooterOptionIcon active={skipFooter} />}
                onChange={(v) => {
                  setSkipFooter(v)
                  run(async () => applyDraft(await api.patchDraft(draftId, { text: currentText(), skip_footer: v })))
                }}
              />
            </div>
          )}
        </Section>

        {editable && (
          <Section icon={RocketLaunch} title="Публикация">
            <GlassInput placeholder="ДД.ММ.ГГГГ ЧЧ:ММ (Москва)" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
            <p className="text-xs text-[var(--glass-hint)] my-2">Московское время. Джиттер ±7–23 мин если включён.</p>
            <div className="flex flex-wrap gap-2 mb-3">
              <GlassButton variant="secondary" disabled={busy} onClick={() => setScheduleAt(formatScheduleMsk(new Date(Date.now() + 3600000)))}>+1 ч</GlassButton>
              <GlassButton variant="secondary" disabled={busy} onClick={() => setScheduleAt(formatScheduleMsk(new Date(Date.now() + 3 * 3600000)))}>+3 ч</GlassButton>
              <GlassButton variant="secondary" disabled={busy} onClick={() => setScheduleAt(defaultScheduleMsk())}>Завтра 12:00</GlassButton>
            </div>
            <GlassButton disabled={busy || !canPublish} full trailing={<Clock size={16} weight="light" />} onClick={() => run(async () => { await patchForPublish(); await api.scheduleDraft(draftId, scheduleAt); onClose() }, 'Запланировано')}>
              В расписание
            </GlassButton>
            <GlassButton className="mt-2" variant="secondary" disabled={busy || !canPublish} full trailing={<RocketLaunch size={16} weight="light" />} onClick={() => run(async () => { await patchForPublish(); const d = await api.publishDraft(draftId); toast.show(d.warning || 'Опубликовано', false); WebApp.HapticFeedback?.notificationOccurred('success'); onClose() })}>
              Сейчас
            </GlassButton>
            {!canPublish && <p className="text-xs text-[var(--glass-danger)] mt-2">Добавьте текст или картинку</p>}
          </Section>
        )}

        <div className="py-4">
          <GlassButton variant="danger" disabled={busy} full trailing={<Trash size={16} weight="light" />} onClick={() => { if (!confirm('Удалить пост?')) return; run(async () => { await api.deleteDraft(draftId); onClose() }) }}>
            Удалить
          </GlassButton>
        </div>
      </div>

      {picker && mediaCount > 1 && (
        <MediaPickerDialog
          title={picker === 'remove' ? 'Какое фото убрать?' : 'Какое фото отредактировать ИИ?'}
          count={mediaCount}
          onPick={(index) => {
            setPicker(null)
            if (picker === 'remove') removeMediaAt(index)
            else startAiEdit(index)
          }}
          onCancel={() => setPicker(null)}
        />
      )}

      {aiEditIndex !== null && (
        <AiImageEditDialog
          photoIndex={aiEditIndex}
          photoCount={mediaCount}
          prompt={aiEditPrompt}
          busy={busy}
          onPromptChange={setAiEditPrompt}
          onSubmit={submitAiEdit}
          onCancel={() => { if (!busy) { setAiEditIndex(null); setAiEditPrompt('') } }}
        />
      )}
    </GlassSheet>
  )
}
