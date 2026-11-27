import { useCallback, useEffect, useRef, useState } from 'react'
import { ROUTE_CHANGE } from '../router'

/**
 * Open/close state for a button-controlled panel (dropdown, menu).
 * Closes on Escape (focus returns to the button), on a click or focus
 * outside the wrapper, and on page change.
 */
export function useDisclosure<W extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<W>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  const close = useCallback((returnFocus = false) => {
    setOpen(false)
    if (returnFocus) buttonRef.current?.focus()
  }, [])
  const toggle = useCallback(() => setOpen(o => !o), [])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close(true)
    }
    const onOutside = (e: Event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) close()
    }
    const onHash = () => close()
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onOutside)
    document.addEventListener('focusin', onOutside)
    window.addEventListener('hashchange', onHash)
    window.addEventListener('popstate', onHash)
    window.addEventListener(ROUTE_CHANGE, onHash)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onOutside)
      document.removeEventListener('focusin', onOutside)
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('popstate', onHash)
      window.removeEventListener(ROUTE_CHANGE, onHash)
    }
  }, [open, close])

  return { open, toggle, close, wrapperRef, buttonRef }
}
