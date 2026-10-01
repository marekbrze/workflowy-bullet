import { useEffect, useRef } from 'react'

/**
 * Returns a ref for the element that should receive focus when `active` turns from false to true —
 * e.g. the new heading after a form disappears. It does nothing on first render.
 */
export function useTransitionFocus<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null)
  const previous = useRef(active)
  useEffect(() => {
    if (active && !previous.current) ref.current?.focus()
    previous.current = active
  }, [active])
  return ref
}
