import { useEffect, useRef } from 'react'

/** The shortcut name for a key press: the physical letter key (layout-independent), or the key name. */
function shortcutOf(event: KeyboardEvent): string {
  if (event.code.startsWith('Key')) return event.code.slice(3).toLowerCase()
  return event.key.toLowerCase()
}

/**
 * Single-key shortcuts, keyed by lower-cased letter or key name ("a", "escape").
 * Letters match the physical key, so home-row positions hold on Colemak or Dvorak too.
 * Ignored while typing in a field.
 */
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
      const handler = latest.current[shortcutOf(event)]
      if (!handler) return
      event.preventDefault()
      handler()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [enabled])
}
