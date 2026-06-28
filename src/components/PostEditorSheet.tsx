import { useEffect, useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api, fetchMediaUrl, humanError, statusLabel, stripHtml, type DraftFull } from '../lib/api'
import {
  defaultScheduleMsk,
  formatScheduleMsk,
  scheduleFromIso,
} from '../lib/scheduleMsk'
import { RichTextEditor, type RichTextEditorHandle } from './RichTextEditor'
import { MediaAlbumGrid, MediaPickerDialog } from './MediaAlbum'
import { Btn, SegmentChips, Toggle } from './ui'
import { MAX_DRAFT_PHOTOS, validateInlineButtonUrl } from '../lib/validateUrl'

type Aspect = 'vertical' | 'square' | 'horizontal'
type AutoDel = 0 | 1 | 24 | 48

const AUTODELETE_OPTS: { value: AutoDel; label: string }[] = [
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

function defaultSchedule(dayIso?: string): string {
  return defaultScheduleMsk(dayIso)
}

function toAutoDel(h: number | null): AutoDel {
  if (h === 1 || h === 24 || h === 48) return h
  return 0
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
  const [autodelete, setAutodelete] = useState<AutoDel>(0)
  const [silent, setSilent] = useState(false)
  const [pinAfter, setPinAfter] = useState(false)
  const [scheduleAt, setScheduleAt] = useState(() => defaultSchedule(defaultDay))
  const [mediaItems, setMediaItems] = useState<{ src: string; index: number }[]>([])
  const mediaBlobsRef = useRef<string[]>([])
  const [picker, setPicker] = useState<'remove' | 'ai-edit' | null>(null)
  const [btnUrlError, setBtnUrlError] = useState<string | null>(null)
  const [aspect, setAspect] = useState<Aspect>('square')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
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
    const paths = d.media_urls?.length
      ? d.media_urls
      : d.media_url
        ? [d.media_url]
        : []
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
    setAutodelete(toAutoDel(d.autodelete_hours))
    setPinAfter(d.pin_after_publish)
    setSilent(d.disable_notification)
    setBtnUrlError(null)
    if (d.scheduled_at) {
      setScheduleAt(scheduleFromIso(d.scheduled_at))
    }
    await loadMediaItems(d)
  }

  const load = async () => {
    await applyDraft(await api.getDraft(draftId))
  }

  useEffect(() => {
    load().catch((e) => setMsg(humanError(e)))
    return () => revokeMediaBlobs()
  }, [draftId]) // eslint-disable-line react-hooks/exhaustive-deps

  const run = async (fn: () => Promise<void>, success?: string) => {
    setBusy(true)
    setMsg(null)
    try {
      await fn()
      if (success) {
        setMsg(success)
        WebApp.HapticFeedback?.notificationOccurred('success')
      }
      onSaved()
    } catch (e) {
      setMsg(e instanceof Error ? e.message : String(e))
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

  const saveAutodelete = (h: AutoDel) => {
    setAutodelete(h)
    run(async () => {
      const d = await api.patchDraft(draftId, {
        text: currentText(),
        autodelete_hours: h || 0,
      })
      await applyDraft(d)
    }, h ? `Автоудаление: ${h} ч` : 'Автоудаление выкл')
  }

  const saveButton = (useAi = false) => {
    if (!checkBtnUrl()) {
      setMsg(btnUrlError || 'Неверная ссылка')
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

  const mediaCount = draft?.media_count ?? mediaItems.length
  const maxMedia = draft?.max_media ?? MAX_DRAFT_PHOTOS
  const canAddMedia = mediaCount < maxMedia

  const removeMediaAt = (index: number) =>
    run(async () => refreshMedia(await api.removeDraftMediaAt(draftId, index)), 'Удалено')

  const runAiEditAt = (index: number) =>
    run(async () => refreshMedia(await api.aiImage(draftId, 'uniqueify', 'square', undefined, index)), 'ИИ доработал')

  const handleRemoveClick = () => {
    if (mediaCount <= 1) {
      if (confirm('Убрать фото?')) removeMediaAt(0)
      return
    }
    setPicker('remove')
  }

  const handleAiEditClick = () => {
    if (mediaCount <= 1) {
      runAiEditAt(0)
      return
    }
    setPicker('ai-edit')
  }

  const handlePhotoClick = (index: number) => {
    if (confirm(`Убрать фото ${index + 1}?`)) removeMediaAt(index)
  }

  const uploadFiles = (files: FileList | null) => {
    if (!files?.length) return
    const remaining = maxMedia - mediaCount
    const batch = Array.from(files).slice(0, remaining)
    if (batch.length < files.length) {
      setMsg(`Максимум ${maxMedia} фото — загружено ${batch.length}`)
    }
    run(async () => {
      let d = draft!
      for (const f of batch) {
        d = await api.uploadDraftMedia(draftId, f)
      }
      await refreshMedia(d)
    }, batch.length > 1 ? `Загружено ${batch.length} фото` : 'Загружено')
  }

  if (!draft) {
    return (
      <div className="sheet-overlay">
        <div className="sheet">
          <p className="loader">{msg || 'Загрузка…'}</p>
        </div>
      </div>
    )
  }

  const editable = draft.is_editable && !draft.is_published
  const published = draft.is_published

  return (
    <div className="sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <header className="sheet-head">
          <button type="button" className="icon-btn" onClick={onClose}>←</button>
          <div>
            <strong>{published ? 'Опубликованный пост' : 'Редактор поста'}</strong>
            <span className="sheet-status">{statusLabel(draft.status)}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            disabled={busy || !editable}
            onClick={() =>
              run(async () => {
                await api.patchDraft(draftId, {
                  text: currentText(),
                  autodelete_hours: autodelete || 0,
                  pin_after_publish: pinAfter,
                  disable_notification: silent,
                  ...(btnUrl.trim()
                    ? { inline_button_url: btnUrl.trim(), inline_button_text: btnText.trim() || '/auto' }
                    : { clear_button: true }),
                }).then(applyDraft)
              }, 'Сохранено')
            }
          >
            💾
          </button>
        </header>

        {msg && <div className="toast">{msg}</div>}

        <div className="sheet-body">
          {published && (
            <section className="editor-section published-banner">
              ✅ Пост в канале. Можно настроить автоудаление или удалить.
            </section>
          )}

          {/* Image */}
          {!published && (
            <section className="editor-section">
              <h3>🖼 Фото</h3>
              <p className="field-hint">
                До {maxMedia} фото в альбоме (как в Telegram). Нажмите на фото, чтобы убрать.
              </p>
              {mediaItems.length > 0 ? (
                <>
                  <MediaAlbumGrid
                    items={mediaItems}
                    editable={!busy}
                    onPhotoClick={handlePhotoClick}
                  />
                  <div className="media-actions">
                    <Btn
                      variant="secondary"
                      disabled={busy || !canAddMedia}
                      onClick={() => fileRef.current?.click()}
                    >
                      ➕ Добавить
                    </Btn>
                    <Btn variant="secondary" disabled={busy} onClick={handleRemoveClick}>
                      Убрать
                    </Btn>
                    <Btn disabled={busy} onClick={handleAiEditClick}>
                      ✨ ИИ-редакт
                    </Btn>
                  </div>
                </>
              ) : (
                <div className="media-empty">
                  <Btn variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()} full>
                    📷 Добавить фото
                  </Btn>
                  <p className="field-hint">Формат для ИИ-генерации:</p>
                  <SegmentChips options={ASPECT_OPTS} value={aspect} onChange={setAspect} disabled={busy} />
                  <Btn
                    disabled={busy}
                    onClick={() =>
                      run(
                        async () =>
                          refreshMedia(
                            await api.aiImage(draftId, 'generate', aspect, aiPrompt || text),
                          ),
                        'Сгенерировано',
                      )
                    }
                    full
                  >
                    🎨 Сгенерировать ИИ
                  </Btn>
                </div>
              )}
              {mediaItems.length > 0 && canAddMedia && (
                <>
                  <p className="field-hint">ИИ-генерация добавит ещё одно фото:</p>
                  <SegmentChips options={ASPECT_OPTS} value={aspect} onChange={setAspect} disabled={busy} />
                  <Btn
                    disabled={busy || !canAddMedia}
                    onClick={() =>
                      run(
                        async () =>
                          refreshMedia(
                            await api.aiImage(draftId, 'generate', aspect, aiPrompt || text),
                          ),
                        'Сгенерировано',
                      )
                    }
                    full
                  >
                    🎨 Сгенерировать ИИ
                  </Btn>
                </>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  uploadFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </section>
          )}

          {published && mediaItems.length > 0 && (
            <section className="editor-section">
              <h3>🖼 Фото</h3>
              <MediaAlbumGrid items={mediaItems} editable={false} onPhotoClick={() => {}} />
            </section>
          )}

          {/* Text */}
          <section className="editor-section">
            <h3>📝 Текст</h3>
            {editable ? (
              <>
                <RichTextEditor
                  ref={editorRef}
                  value={text}
                  onChange={setText}
                  placeholder="Текст поста…"
                  rows={6}
                  disabled={busy}
                />
                <div className="ai-row">
                  <Btn variant="secondary" disabled={busy} onClick={() => run(async () => { const d = await api.aiText(draftId, 'shorten'); await applyDraft(d); setText(d.text) }, 'Короче')}>
                    Короче
                  </Btn>
                  <Btn variant="secondary" disabled={busy} onClick={() => run(async () => { const d = await api.aiText(draftId, 'humor'); await applyDraft(d); setText(d.text) }, 'Готово')}>
                    Юмор
                  </Btn>
                  <Btn variant="secondary" disabled={busy} onClick={() => run(async () => { const d = await api.aiText(draftId, 'rewrite'); await applyDraft(d); setText(d.text) }, 'Переписано')}>
                    Переписать
                  </Btn>
                  <Btn variant="secondary" disabled={busy} onClick={() => setShowAiWrite((v) => !v)}>
                    ✨ ИИ написать
                  </Btn>
                </div>
                {showAiWrite && (
                  <div className="ai-write">
                    <input className="input" placeholder="Идея для поста…" value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)} />
                    <Btn
                      disabled={busy || !aiPrompt.trim()}
                      onClick={() =>
                        run(async () => {
                          const d = await api.aiText(draftId, 'write', aiPrompt)
                          await applyDraft(d)
                          setText(d.text)
                          setShowAiWrite(false)
                        }, 'Пост готов')
                      }
                    >
                      Сгенерировать
                    </Btn>
                  </div>
                )}
              </>
            ) : (
              <p className="preview-text">{stripHtml(draft.footer_preview)}</p>
            )}
          </section>

          {draft.footer_preview.includes('подпись канала') && (
            <section className="editor-section footer-preview">
              <h3>Подпись канала</h3>
              <div
                className="footer-render"
                dangerouslySetInnerHTML={{
                  __html: draft.footer_preview.split('— подпись канала —')[1] || '',
                }}
              />
            </section>
          )}

          {/* Inline button */}
          {editable && (
            <section className="editor-section">
              <h3>🔗 Кнопка под постом</h3>
              {(draft.inline_button_text && draft.inline_button_url) && (
                <div className="button-preview">
                  <span className="badge ok">{draft.inline_button_text}</span>
                  <span className="field-hint">{draft.inline_button_url}</span>
                </div>
              )}
              <input
                className={`input${btnUrlError ? ' input-err' : ''}`}
                placeholder="URL — https://… или @channel"
                value={btnUrl}
                onChange={(e) => {
                  setBtnUrl(e.target.value)
                  if (btnUrlError) setBtnUrlError(null)
                }}
                onBlur={() => btnUrl.trim() && checkBtnUrl()}
              />
              {btnUrlError && <p className="field-hint err-hint">{btnUrlError}</p>}
              <input className="input" placeholder="Текст кнопки" value={btnText} onChange={(e) => setBtnText(e.target.value)} />
              <div className="ai-row">
                <Btn variant="secondary" disabled={busy || !btnUrl.trim()} onClick={() => saveButton(false)} full>
                  Сохранить кнопку
                </Btn>
                <Btn disabled={busy || !btnUrl.trim()} onClick={() => saveButton(true)} full>
                  ✨ ИИ подберёт текст
                </Btn>
              </div>
              {(btnUrl || draft.inline_button_url) && (
                <Btn
                  variant="ghost"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      const d = await api.patchDraft(draftId, {
                        text: currentText(),
                        clear_button: true,
                      })
                      await applyDraft(d)
                      setBtnUrl('')
                      setBtnText('')
                    }, 'Кнопка убрана')
                  }
                  full
                >
                  Убрать кнопку
                </Btn>
              )}
            </section>
          )}

          {/* More options */}
          <section className="editor-section">
            <h3>⚙️ Дополнительно</h3>
            <p className="field-hint">⏱ Автоудаление из канала после публикации</p>
            <SegmentChips
              options={AUTODELETE_OPTS}
              value={autodelete}
              onChange={(v) => saveAutodelete(v)}
              disabled={busy}
            />
            {editable && (
              <>
                <Toggle
                  label="📌 Закрепить после публикации"
                  checked={pinAfter}
                  onChange={(v) => {
                    setPinAfter(v)
                    run(async () => {
                      const d = await api.patchDraft(draftId, {
                        text: currentText(),
                        pin_after_publish: v,
                      })
                      await applyDraft(d)
                    })
                  }}
                />
                {pinAfter && (
                  <p className="field-hint">
                    Нужно право бота «Редактирование сообщений» в настройках канала.
                  </p>
                )}
                <Toggle
                  label="🔕 Без звука (тихая публикация)"
                  checked={silent}
                  onChange={(v) => {
                    setSilent(v)
                    run(async () => {
                      const d = await api.patchDraft(draftId, {
                        text: currentText(),
                        disable_notification: v,
                      })
                      await applyDraft(d)
                    })
                  }}
                />
              </>
            )}
          </section>

          {/* Publish */}
          {editable && (
            <section className="editor-section">
              <h3>🚀 Публикация</h3>
              <input className="input" placeholder="ДД.ММ.ГГГГ ЧЧ:ММ (Москва)" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
              <p className="field-hint">Московское время (МСК). Джиттер ±7–23 мин если включён.</p>
              <div className="ai-row">
                <Btn variant="secondary" disabled={busy} onClick={() => setScheduleAt(formatScheduleMsk(new Date(Date.now() + 3600000)))}>
                  +1 ч
                </Btn>
                <Btn variant="secondary" disabled={busy} onClick={() => setScheduleAt(formatScheduleMsk(new Date(Date.now() + 3 * 3600000)))}>
                  +3 ч
                </Btn>
                <Btn variant="secondary" disabled={busy} onClick={() => setScheduleAt(defaultScheduleMsk())}>
                  Завтра 12:00
                </Btn>
              </div>
              <div className="publish-row">
                <Btn
                  disabled={busy || !canPublish}
                  onClick={() =>
                    run(async () => {
                      await patchForPublish()
                      await api.scheduleDraft(draftId, scheduleAt)
                      onClose()
                    }, 'Запланировано')
                  }
                  full
                >
                  🕒 В расписание
                </Btn>
                <Btn
                  variant="secondary"
                  disabled={busy || !canPublish}
                  onClick={() =>
                    run(async () => {
                      await patchForPublish()
                      const d = await api.publishDraft(draftId)
                      setMsg(d.warning || 'Опубликовано')
                      WebApp.HapticFeedback?.notificationOccurred('success')
                      onClose()
                    })
                  }
                  full
                >
                  🚀 Сейчас
                </Btn>
              </div>
              {!canPublish && (
                <p className="field-hint err-hint">Добавьте текст или картинку для публикации</p>
              )}
            </section>
          )}

          <section className="editor-section danger-zone">
            <Btn
              variant="danger"
              disabled={busy}
              onClick={() => {
                if (!confirm('Удалить пост?')) return
                run(async () => {
                  await api.deleteDraft(draftId)
                  onClose()
                })
              }}
              full
            >
              🗑 Удалить
            </Btn>
          </section>
        </div>
      </div>

      {picker && mediaCount > 1 && (
        <MediaPickerDialog
          title={picker === 'remove' ? 'Какое фото убрать?' : 'Какое фото отредактировать ИИ?'}
          count={mediaCount}
          onPick={(index) => {
            setPicker(null)
            if (picker === 'remove') removeMediaAt(index)
            else runAiEditAt(index)
          }}
          onCancel={() => setPicker(null)}
        />
      )}
    </div>
  )
}
