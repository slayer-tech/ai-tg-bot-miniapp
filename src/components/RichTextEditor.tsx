import { useEffect, useRef } from 'react'
import { formatCmd, htmlToTelegram, telegramToHtml } from '../lib/richText'

export function RichTextEditor({
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
}) {
  const ref = useRef<HTMLDivElement>(null)
  const lastExternal = useRef(value)

  useEffect(() => {
    if (!ref.current || value === lastExternal.current) return
    ref.current.innerHTML = telegramToHtml(value)
    lastExternal.current = value
  }, [value])

  const sync = () => {
    if (!ref.current) return
    const html = htmlToTelegram(ref.current.innerHTML)
    lastExternal.current = html
    onChange(html)
  }

  const minH = rows * 22

  return (
    <div className={`rte${disabled ? ' rte-disabled' : ''}`}>
      <div className="rte-toolbar">
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); formatCmd('bold') }} title="Жирный">
          <b>B</b>
        </button>
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); formatCmd('italic') }} title="Курсив">
          <i>I</i>
        </button>
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); formatCmd('underline') }} title="Подчёркнутый">
          <u>U</u>
        </button>
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); formatCmd('link') }} title="Ссылка">
          🔗
        </button>
        <button type="button" disabled={disabled} onMouseDown={(e) => { e.preventDefault(); formatCmd('removeFormat') }} title="Сброс">
          ✕
        </button>
      </div>
      <div
        ref={ref}
        className="rte-body"
        contentEditable={!disabled}
        data-placeholder={placeholder}
        style={{ minHeight: minH }}
        onInput={sync}
        onBlur={sync}
        suppressContentEditableWarning
      />
    </div>
  )
}
