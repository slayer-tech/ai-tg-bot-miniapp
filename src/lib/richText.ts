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
      const href = el.getAttribute('href') || ''
      if (href.startsWith('http')) return `<a href="${href}">${inner}</a>`
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
  return text
    .replace(/\n/g, '<br>')
    .replace(/<b>/gi, '<b>')
    .replace(/<\/b>/gi, '</b>')
    .replace(/<i>/gi, '<i>')
    .replace(/<\/i>/gi, '</i>')
    .replace(/<u>/gi, '<u>')
    .replace(/<\/u>/gi, '</u>')
}

export function formatCmd(cmd: string, value?: string) {
  document.execCommand('styleWithCSS', false, 'false')
  if (cmd === 'link') {
    const url = value || prompt('URL ссылки (https://…)', 'https://') || ''
    if (url) document.execCommand('createLink', false, url)
    return
  }
  document.execCommand(cmd, false, value)
}
