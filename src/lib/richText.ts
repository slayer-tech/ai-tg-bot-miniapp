/** Convert contenteditable HTML → Telegram-safe HTML. */
export function htmlToTelegram(html: string): string {
  const div = document.createElement('div')
  div.innerHTML = html

  function walk(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return (node.textContent || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return ''
    const el = node as HTMLElement
    const tag = el.tagName.toLowerCase()
    const inner = Array.from(el.childNodes).map(walk).join('')

    if (tag === 'br') return '\n'
    if (tag === 'div' || tag === 'p') return inner + '\n'
    if (tag === 'b' || tag === 'strong') return `<b>${inner}</b>`
    if (tag === 'i' || tag === 'em') return `<i>${inner}</i>`
    if (tag === 'u') return `<u>${inner}</u>`
    if (tag === 'a') {
      const href = (el.getAttribute('href') || '').trim()
      const safe = href.replace(/"/g, '&quot;')
      if (href.startsWith('http') || href.startsWith('tg:')) {
        return `<a href="${safe}">${inner || href}</a>`
      }
      return inner
    }
    if (tag === 'span') return inner
    return inner
  }

  return walk(div)
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Telegram HTML → contenteditable HTML for editing. */
export function telegramToHtml(text: string): string {
  if (!text) return ''
  // Footer хранится как Telegram HTML (<b>, <a href="...">…) — не экранируем теги.
  if (/<\s*(a|b|i|u|strong|em)\b/i.test(text)) {
    return text.replace(/\n/g, '<br>')
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
}

export function saveSelection(container: HTMLElement): Range | null {
  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return null
  const range = sel.getRangeAt(0)
  if (!container.contains(range.commonAncestorContainer)) return null
  return range.cloneRange()
}

function restoreSelection(range: Range) {
  const sel = window.getSelection()
  if (!sel) return
  sel.removeAllRanges()
  sel.addRange(range)
}

function normalizeUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return ''
  if (/^(https?:\/\/|tg:)/i.test(url)) return url
  return `https://${url}`
}

/** Вставить или обернуть ссылку (URL из диалога — prompt в Telegram WebApp не работает). */
export function applyLink(container: HTMLElement, saved: Range, urlRaw: string): void {
  const href = normalizeUrl(urlRaw)
  if (!href) return

  restoreSelection(saved)
  container.focus()

  const sel = window.getSelection()
  if (!sel || sel.rangeCount === 0) return
  const range = sel.getRangeAt(0)

  if (range.collapsed) {
    const label = urlRaw.replace(/^https?:\/\//i, '').replace(/\/$/, '') || href
    const a = document.createElement('a')
    a.href = href
    a.textContent = label
    range.insertNode(a)
    range.setStartAfter(a)
    range.collapse(true)
    sel.removeAllRanges()
    sel.addRange(range)
    return
  }

  const a = document.createElement('a')
  a.href = href
  const fragment = range.extractContents()
  a.appendChild(fragment)
  range.insertNode(a)
  range.setStartAfter(a)
  range.collapse(true)
  sel.removeAllRanges()
  sel.addRange(range)
}

/** Снять форматирование и убрать ссылки. */
export function clearFormatting(container: HTMLElement): void {
  container.focus()
  const sel = window.getSelection()
  const hasRange =
    sel && sel.rangeCount > 0 && container.contains(sel.anchorNode)

  if (hasRange && sel && !sel.isCollapsed) {
    document.execCommand('unlink', false)
    document.execCommand('removeFormat', false)
    document.execCommand('unlink', false)
  } else {
    unwrapAllLinks(container)
    container.querySelectorAll('b, strong, i, em, u').forEach((el) => {
      unwrapElement(el as HTMLElement)
    })
  }
}

function unwrapElement(el: HTMLElement) {
  const parent = el.parentNode
  if (!parent) return
  while (el.firstChild) parent.insertBefore(el.firstChild, el)
  parent.removeChild(el)
}

function unwrapAllLinks(container: HTMLElement) {
  container.querySelectorAll('a').forEach((a) => unwrapElement(a as HTMLElement))
}

export function formatCmd(container: HTMLElement, cmd: string, linkUrl?: string, savedRange?: Range | null) {
  container.focus()
  if (cmd === 'link') {
    if (!linkUrl || !savedRange) return
    applyLink(container, savedRange, linkUrl)
    return
  }
  if (cmd === 'removeFormat') {
    clearFormatting(container)
    return
  }
  document.execCommand('styleWithCSS', false, 'false')
  document.execCommand(cmd, false, undefined)
}
