import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { LinkSimple, TextB, TextItalic, TextUnderline, X } from '@phosphor-icons/react'
import { formatCmd, htmlToTelegram, saveSelection, telegramToHtml } from '../lib/richText'
import { GlassButton } from './primitives/GlassButton'
import { GlassModal } from './primitives/GlassSheet'

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

  useImperativeHandle(
    ref,
    () => ({
      getValue: () => {
        if (bodyRef.current) return htmlToTelegram(bodyRef.current.innerHTML)
        return lastExternal.current ?? value
      },
    }),
    [value],
  )

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
  const tb =
    'flex h-9 w-9 items-center justify-center rounded-lg text-[var(--glass-text)] transition-colors hover:bg-[color-mix(in_srgb,var(--glass-text)_8%,transparent)] disabled:opacity-40'

  return (
    <div className={disabled ? 'opacity-60 pointer-events-none' : ''}>
      <div className="flex flex-wrap gap-1 mb-2 p-1 rounded-xl bg-[color-mix(in_srgb,var(--glass-text)_4%,transparent)] ring-1 ring-[var(--glass-border)]">
        <button type="button" disabled={disabled} className={tb} onMouseDown={(e) => { e.preventDefault(); runCmd('bold') }} title="Жирный">
          <TextB size={18} weight="bold" />
        </button>
        <button type="button" disabled={disabled} className={tb} onMouseDown={(e) => { e.preventDefault(); runCmd('italic') }} title="Курсив">
          <TextItalic size={18} weight="light" />
        </button>
        <button type="button" disabled={disabled} className={tb} onMouseDown={(e) => { e.preventDefault(); runCmd('underline') }} title="Подчёркнутый">
          <TextUnderline size={18} weight="light" />
        </button>
        <button type="button" disabled={disabled} className={tb} onMouseDown={(e) => { e.preventDefault(); openLinkDialog() }} title="Ссылка">
          <LinkSimple size={18} weight="light" />
        </button>
        <button type="button" disabled={disabled} className={tb} onMouseDown={(e) => { e.preventDefault(); runCmd('removeFormat') }} title="Сброс">
          <X size={18} weight="light" />
        </button>
      </div>
      <div
        ref={bodyRef}
        className="rte-body rounded-xl bg-[color-mix(in_srgb,var(--glass-text)_4%,transparent)] px-4 py-3 text-sm ring-1 ring-[var(--glass-border)] focus:outline-none focus:ring-[var(--glass-accent)]"
        contentEditable={!disabled}
        data-placeholder={placeholder}
        style={{ minHeight: minH }}
        onInput={sync}
        onBlur={sync}
        suppressContentEditableWarning
      />

      <GlassModal open={linkOpen} onClose={() => setLinkOpen(false)}>
        <div className="p-5 flex flex-col gap-3">
          <strong className="text-sm">Ссылка</strong>
          <p className="text-xs text-[var(--glass-hint)] m-0">Выделите текст или вставьте URL</p>
          <input
            ref={linkInputRef}
            className="w-full rounded-xl bg-[color-mix(in_srgb,var(--glass-text)_5%,transparent)] px-4 py-3 text-sm ring-1 ring-[var(--glass-border)] focus:outline-none focus:ring-[var(--glass-accent)]"
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
          <div className="flex gap-2">
            <GlassButton variant="secondary" full onClick={() => setLinkOpen(false)}>
              Отмена
            </GlassButton>
            <GlassButton full onClick={confirmLink}>
              Вставить
            </GlassButton>
          </div>
        </div>
      </GlassModal>
    </div>
  )
})
