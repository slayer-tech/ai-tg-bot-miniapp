import { useEffect, useRef, useState } from 'react'
import WebApp from '@twa-dev/sdk'
import { api, fetchMediaUrl, statusLabel, stripHtml, type DraftFull } from '../lib/api'
import { RichTextEditor } from './RichTextEditor'
import { Btn } from './ui'

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
  const [scheduleAt, setScheduleAt] = useState(() => defaultSchedule(defaultDay))
  const [mediaSrc, setMediaSrc] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [aiPrompt, setAiPrompt] = useState('')
  const [showAiWrite, setShowAiWrite] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const load = async () => {
    const d = await api.getDraft(draftId)
    setDraft(d)
    setText(d.text || '')
    setBtnUrl(d.inline_button_url || '')
    setBtnText(d.inline_button_text || '')
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

  const saveFields = async () => {
    const d = await api.patchDraft(draftId, {
      text,
      inline_button_url: btnUrl || null,
      inline_button_text: btnText || null,
      clear_button: !btnUrl,
    })
    setDraft(d)
  }

  const refreshMedia = async (d: DraftFull) => {
    setDraft(d)
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

  return (
    <div className="sheet-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet">
        <header className="sheet-head">
          <button type="button" className="icon-btn" onClick={onClose}>←</button>
          <div>
            <strong>Редактор поста</strong>
            <span className="sheet-status">{statusLabel(draft.status)}</span>
          </div>
          <button
            type="button"
            className="icon-btn"
            disabled={busy || !editable}
            onClick={() =>
              run(async () => {
                const d = await api.patchDraft(draftId, {
                  text,
                  inline_button_url: btnUrl || null,
                  inline_button_text: btnText || null,
                  clear_button: !btnUrl,
                })
                setDraft(d)
              }, 'Сохранено')
            }
          >
            💾
          </button>
        </header>

        {msg && <div className="toast">{msg}</div>}

        <div className="sheet-body">
          {/* Image */}
          <section className="editor-section">
            <h3>Картинка</h3>
            {mediaSrc ? (
              <div className="media-preview">
                <img src={mediaSrc} alt="" />
                {editable && (
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
                )}
              </div>
            ) : (
              editable && (
                <div className="media-empty">
                  <Btn variant="secondary" disabled={busy} onClick={() => fileRef.current?.click()} full>
                    📷 Добавить фото
                  </Btn>
                  <Btn
                    disabled={busy}
                    onClick={() =>
                      run(async () => refreshMedia(await api.aiImage(draftId, 'generate', 'square', aiPrompt || text)), 'Сгенерировано')
                    }
                    full
                  >
                    🎨 Сгенерировать ИИ
                  </Btn>
                </div>
              )
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

          {/* Text */}
          <section className="editor-section">
            <h3>Текст</h3>
            {editable ? (
              <>
                <RichTextEditor value={text} onChange={setText} placeholder="Текст поста…" rows={6} disabled={busy} />
                <div className="ai-row">
                  <Btn variant="secondary" disabled={busy} onClick={() => run(async () => { const d = await api.aiText(draftId, 'shorten'); setDraft(d); setText(d.text) }, 'Короче')}>
                    Короче
                  </Btn>
                  <Btn variant="secondary" disabled={busy} onClick={() => run(async () => { const d = await api.aiText(draftId, 'humor'); setDraft(d); setText(d.text) }, 'Готово')}>
                    Юмор
                  </Btn>
                  <Btn variant="secondary" disabled={busy} onClick={() => run(async () => { const d = await api.aiText(draftId, 'rewrite'); setDraft(d); setText(d.text) }, 'Переписано')}>
                    Переписать
                  </Btn>
                  <Btn variant="secondary" disabled={busy} onClick={() => setShowAiWrite((v) => !v)}>
                    ✨ ИИ написать
                  </Btn>
                </div>
                {showAiWrite && (
                  <div className="ai-write">
                    <input
                      className="input"
                      placeholder="Идея для поста…"
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                    <Btn
                      disabled={busy || !aiPrompt.trim()}
                      onClick={() =>
                        run(async () => {
                          const d = await api.aiText(draftId, 'write', aiPrompt)
                          setDraft(d)
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

          {/* Button */}
          {editable && (
            <section className="editor-section">
              <h3>Кнопка под постом</h3>
              <input className="input" placeholder="https://…" value={btnUrl} onChange={(e) => setBtnUrl(e.target.value)} />
              <input className="input" placeholder="Текст кнопки (или /auto)" value={btnText} onChange={(e) => setBtnText(e.target.value)} />
            </section>
          )}

          {/* Publish */}
          {editable && (
            <section className="editor-section">
              <h3>Публикация</h3>
              <input
                className="input"
                placeholder="ДД.ММ.ГГГГ ЧЧ:ММ"
                value={scheduleAt}
                onChange={(e) => setScheduleAt(e.target.value)}
              />
              <p className="field-hint">Московское время. Джиттер ±7–23 мин если включён.</p>
              <div className="publish-row">
                <Btn
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await saveFields()
                      await api.scheduleDraft(draftId, scheduleAt)
                      onClose()
                    }, 'Запланировано')
                  }
                  full
                >
                  🕒 Запланировать
                </Btn>
                <Btn
                  variant="secondary"
                  disabled={busy}
                  onClick={() =>
                    run(async () => {
                      await saveFields()
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
