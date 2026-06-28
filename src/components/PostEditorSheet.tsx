import { useEffect, useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api, fetchMediaUrl, statusLabel, stripHtml, type DraftFull } from '../lib/api'
import { RichTextEditor } from './RichTextEditor'
import { Btn, SegmentChips, Toggle } from './ui'

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
  const d = dayIso ? new Date(dayIso + 'T12:00:00') : new Date()
  if (!dayIso) {
    d.setDate(d.getDate() + 1)
    d.setHours(12, 0, 0, 0)
  } else {
    d.setHours(12, 0, 0, 0)
  }
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
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
  const [pinAfter, setPinAfter] = useState(false)
  const [silent, setSilent] = useState(false)
  const [scheduleAt, setScheduleAt] = useState(() => defaultSchedule(defaultDay))
  const [mediaSrc, setMediaSrc] = useState<string | null>(null)
  const [aspect, setAspect] = useState<Aspect>('square')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAiWrite, setShowAiWrite] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const applyDraft = async (d: DraftFull) => {
    setDraft(d)
    setText(d.text || '')
    setBtnUrl(d.inline_button_url || '')
    setBtnText(d.inline_button_text || '')
    setAutodelete(toAutoDel(d.autodelete_hours))
    setPinAfter(d.pin_after_publish)
    setSilent(d.disable_notification)
    if (d.scheduled_at) {
      const dt = new Date(d.scheduled_at)
      const pad = (n: number) => String(n).padStart(2, '0')
      setScheduleAt(
        `${pad(dt.getDate())}.${pad(dt.getMonth() + 1)}.${dt.getFullYear()} ${pad(dt.getHours())}:${pad(dt.getMinutes())}`,
      )
    }
    if (d.media_url) {
      const url = await fetchMediaUrl(d.media_url)
      setMediaSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return url
      })
    } else {
      setMediaSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
  }

  const load = async () => {
    await applyDraft(await api.getDraft(draftId))
  }

  useEffect(() => {
    load().catch((e) => setMsg(e instanceof Error ? e.message : String(e)))
    return () => {
      setMediaSrc((prev) => {
        if (prev) URL.revokeObjectURL(prev)
        return null
      })
    }
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

  const patchAll = async (extra: Record<string, unknown> = {}) => {
    const d = await api.patchDraft(draftId, {
      text,
      inline_button_url: btnUrl.trim() || null,
      inline_button_text: btnText.trim() || null,
      clear_button: !btnUrl.trim(),
      autodelete_hours: autodelete || 0,
      pin_after_publish: pinAfter,
      disable_notification: silent,
      ...extra,
    })
    await applyDraft(d)
    return d
  }

  const saveAutodelete = (h: AutoDel) => {
    setAutodelete(h)
    run(async () => {
      const d = await api.patchDraft(draftId, { autodelete_hours: h || 0 })
      await applyDraft(d)
    }, h ? `Автоудаление: ${h} ч` : 'Автоудаление выкл')
  }

  const saveButton = (useAi = false) =>
    run(async () => {
      const d = await api.patchDraft(draftId, {
        inline_button_url: btnUrl.trim(),
        inline_button_text: useAi ? '/auto' : btnText.trim() || '/auto',
        clear_button: false,
      })
      await applyDraft(d)
      setBtnText(d.inline_button_text || '')
    }, 'Кнопка сохранена')

  const refreshMedia = async (d: DraftFull) => applyDraft(d)

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
            onClick={() => run(async () => { await patchAll() }, 'Сохранено')}
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
              <h3>🖼 Картинка</h3>
              {mediaSrc ? (
                <div className="media-preview">
                  <img src={mediaSrc} alt="" />
                  <div className="media-actions">
                    <Btn variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()}>
                      Заменить
                    </Btn>
                    <Btn
                      variant="secondary"
                      disabled={busy}
                      onClick={() =>
                        run(async () => refreshMedia(await api.removeDraftMedia(draftId)), 'Удалено')
                      }
                    >
                      Убрать
                    </Btn>
                    <Btn
                      disabled={busy}
                      onClick={() =>
                        run(async () => refreshMedia(await api.aiImage(draftId, 'uniqueify')), 'ИИ доработал')
                      }
                    >
                      ✨ ИИ-редакт
                    </Btn>
                  </div>
                </div>
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
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (!f) return
                  run(async () => refreshMedia(await api.uploadDraftMedia(draftId, f)), 'Загружено')
                  e.target.value = ''
                }}
              />
            </section>
          )}

          {published && mediaSrc && (
            <section className="editor-section">
              <h3>🖼 Картинка</h3>
              <div className="media-preview">
                <img src={mediaSrc} alt="" />
              </div>
            </section>
          )}

          {/* Text */}
          <section className="editor-section">
            <h3>📝 Текст</h3>
            {editable ? (
              <>
                <RichTextEditor value={text} onChange={setText} placeholder="Текст поста…" rows={6} disabled={busy} />
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
              <input className="input" placeholder="URL — https://…" value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} />
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
                      const d = await api.patchDraft(draftId, { clear_button: true })
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
                      const d = await api.patchDraft(draftId, { pin_after_publish: v })
                      await applyDraft(d)
                    })
                  }}
                />
                <Toggle
                  label="🔕 Без звука (тихая публикация)"
                  checked={silent}
                  onChange={(v) => {
                    setSilent(v)
                    run(async () => {
                      const d = await api.patchDraft(draftId, { disable_notification: v })
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
              <input className="input" placeholder="ДД.ММ.ГГГГ ЧЧ:ММ" value={scheduleAt} onChange={(e) => setScheduleAt(e.target.value)} />
              <p className="field-hint">Московское время. Джиттер ±7–23 мин если включён.</p>
              <div className="publish-row">
                <Btn
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await patchAll()
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
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await patchAll()
                      await api.publishDraft(draftId)
                      onClose()
                    }, 'Опубликовано')
                  }
                  full
                >
                  🚀 Сейчас
                </Btn>
              </div>
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
    </div>
  )
}
