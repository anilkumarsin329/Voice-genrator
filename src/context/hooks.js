import { useContext, useEffect, useState } from 'react'
import { api } from '../api'
import { AuthContext, ToastContext } from './contexts'

export const useAuth = () => useContext(AuthContext)
export const useToast = () => useContext(ToastContext)

/**
 * Run an async loader on mount and whenever the (primitive) deps change.
 * Returns { data, loading, error, reload }. While a refetch is in flight the previous data stays available.
 */
export function useAsync(fn, deps = []) {
  const [tick, setTick] = useState(0)
  const key = JSON.stringify([...deps, tick])
  const [res, setRes] = useState({ key: null, data: null, error: null })

  useEffect(() => {
    let live = true
    fn().then(
      (data) => live && setRes({ key, data, error: null }),
      (error) => live && setRes({ key, data: null, error }),
    )
    return () => {
      live = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key])

  const current = res.key === key
  return { data: res.data, loading: !current, error: current ? res.error : null, reload: () => setTick((t) => t + 1) }
}

export const useVoices = () => useAsync(() => api.voices(), [])
