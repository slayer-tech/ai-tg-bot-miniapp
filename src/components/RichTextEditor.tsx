import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { formatCmd, htmlToTelegram, saveSelection, telegramToHtml } from '../lib/richText'

export type RichTextEditorHandle = {
  getValue: () => string
}

export const RichTextEditor = forwardRef(function RichTextEditor(
  {
    value,
    onChange,
    placeholder,
    rows = 4,
    disabled,
  }: {
    value: string
    onChange: (html: string) => void
    placeholder?: string
    rows?: number
    disabled?: boolean
  },
  ref,
) {
  const bodyRef = useRef<HTMLDivElement>(null)
  const lastExternal = useRef<string | null>(null)
  const savedRangeRef = useRef<Range | null>(null)
  const [linkOpen, setLinkOpen] = useState(false)
  const [linkUrl, setLinkUrl] = useState('https://')
  const linkInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!bodyRef.current) return
    if (value === lastExternal.current) return
    bodyRef.current.innerHTML = telegramToHtml(value)
    lastExternal.current = value
  }, [value])

  useImperativeHandle(ref, () => ({
    getValue: () => {
      if (bodyRef.current) return htmlToTelegram(bodyRef.current.innerHTML)
      return lastExternal.current ?? value
    },
  }), [value])

  useEffect(() => {
    if (linkOpen) linkInputRef.current?.focus()
  }, [linkOpen])

  const sync = () => {
    if (!bodyRef.current) return
    const html = htmlToTelegram(bodyRef.current.innerHTML)
    lastExternal.current = html
    onChange(html)
  }

  const runCmd = (cmd: string) => {
    if (!bodyRef.current || disabled) return
    formatCmd(bodyRef.current, cmd)
    sync()
  }

  const openLinkDialog = () => {
    if (!bodyRef.current || disabled) return
    let saved = saveSelection(bodyRef.current)
    if (!saved) {
      bodyRef.current.focus()
      const range = document.createRange()
      range.selectNodeContents(bodyRef.current)
      range.collapse(false)
      saved = range
    }
    savedRangeRef.current = saved
    setLinkUrl('https://')
    setLinkOpen(true)
  }

  const confirmLink = () => {
    const url = linkUrl.trim()
    if (!url || !bodyRef.current || !savedRangeRef.current) {
      setLinkOpen(false)
      return
    }
    formatCmd(bodyRef.current, 'link', url, savedRangeRef.current)
    sync()
    savedRangeRef.current = null
    setLinkOpen(false)
  }

  const minH = rows * 22

  return (
    <div className={`rte${disabled ? ' rte-disabled' : ''}`}>
      <div className="rte-toolbar">
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); runCmd('bold') }} title="Жирный">
          <b>B</b>
        </button>
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); runCmd('italic') }} title="Курсив">
          <i>I</i>
        </button>
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); runCmd('underline') }} title="Подчёркнутый">
          <u>U</u>
        </button>
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); openLinkDialog() }} title="Ссылка">
          🔗
        </button>
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); runCmd('removeFormat') }} title="Сброс форматирования и ссылок">
          ✕
        </button>
      </div>
      <div
        ref={bodyRef}
        className="rte-body"
        contentEditable={!disabled}
        data-placeholder={placeholder}
        style={{ minHeight: minH }}
        onInput={sync}
        onBlur={sync}
        suppressContentEditableWarning
      />

      {linkOpen && (
        <div className="rte-link-overlay" onClick={() => setLinkOpen(false)}>
          <div className="rte-link-dialog" onClick={(e) => e.stopPropagation()}>
            <strong>Ссылка</strong>
            <p className="field-hint">Выделите текст или вставьте URL</p>
            <input
              ref={linkInputRef}
              className="input"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://…"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  confirmLink()
                }
                if (e.key === 'Escape') setLinkOpen(false)
              }}
            />
            <div className="rte-link-actions">
              <button type="button" className="btn secondary" onClick={() => setLinkOpen(false)}>
                Отмена
              </button>
              <button type="button" className="btn primary" onClick={confirmLink}>
                Вставить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
})
