import { useEffect, useState } from 'react'

/** Minimal data loader: { data, error, loading } that re-runs when deps change. */
export function useAsync<T>(load: () => Promise<T>, deps: unknown[]) {
  const [state, setState] = useState<{ data: T | null; error: boolean; loading: boolean }>({
    data: null,
    error: false,
    loading: true,
  })
  useEffect(() => {
    let cancelled = false
    setState(s => ({ ...s, loading: true, error: false }))
    load()
      .then(data => !cancelled && setState({ data, error: false, loading: false }))
      .catch(() => !cancelled && setState({ data: null, error: true, loading: false }))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  return state
}
