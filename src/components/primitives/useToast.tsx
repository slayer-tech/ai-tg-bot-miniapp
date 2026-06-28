import { useCallback, useEffect, useRef, useState } from 'react'
import { Toast } from './EmptyState'
import { shortenMessage } from '../../lib/scheduleMsk'

const DEFAULT_MS = 3000

export function useToast(durationMs = DEFAULT_MS) {
  const [state, setState] = useState<{ text: string; error: boolean } | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const clear = useCallback(() => {
    if (timer.current) clearTimeout(timer.current)
    setState(null)
  }, [])

  const show = useCallback(
    (text: string, error = false) => {
      if (timer.current) clearTimeout(timer.current)
      const short = shortenMessage(text)
      setState({ text: short, error })
      timer.current = setTimeout(() => setState(null), durationMs)
    },
    [durationMs],
  )

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current)
    },
    [],
  )

  const node = state ? <Toast error={state.error}>{state.text}</Toast> : null

  return { show, clear, node }
}
