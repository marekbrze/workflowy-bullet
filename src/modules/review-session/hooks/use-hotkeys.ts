import { useEffect, useRef } from 'react'

/** Single-key shortcuts, keyed by lower-cased `KeyboardEvent.key`. Ignored while typing in a field. */
export function useHotkeys(handlers: Record<string, () => void>, enabled: boolean) {
  const latest = useRef(handlers)
  useEffect(() => {
    latest.current = handlers
  })

  useEffect(() => {
    if (!enabled) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return
      const target = event.target as HTMLElement | null
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) return
      const handler = latest.current[event.key.toLowerCase()]
      if (!handler) return
      event.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
