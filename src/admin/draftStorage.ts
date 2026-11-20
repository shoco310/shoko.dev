/**
 * Keeps unsaved form input in localStorage (this browser only) so an error,
 * a reload or a closed tab never loses what was typed. Cleared after a
 * successful save. Content here is public-facing material, never personal data.
 */
export function loadDraft<T extends object>(key: string, base: T): T | null {
  try {
    const raw = localStorage.getItem(`shoko-admin:${key}`)
    return raw ? { ...base, ...(JSON.parse(raw) as Partial<T>) } : null
  } catch {
    return null
  }
}

export function saveDraft(key: string, value: unknown) {
  try {
    localStorage.setItem(`shoko-admin:${key}`, JSON.stringify(value))
  } catch {
    /* storage unavailable */
  }
}

export function clearDraft(key: string) {
  try {
    localStorage.removeItem(`shoko-admin:${key}`)
  } catch {
    /* ignore */
  }
}
