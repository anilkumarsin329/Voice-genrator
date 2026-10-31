import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, getToken, setToken } from '../api'
import { AuthContext } from './contexts'

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(!!getToken())

  useEffect(() => {
    if (!getToken()) return
    api.me().then((r) => setUser(r.user)).catch(() => setToken(null)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const onLogout = () => setUser(null)
    window.addEventListener('bk:logout', onLogout)
    return () => window.removeEventListener('bk:logout', onLogout)
  }, [])

  const login = useCallback(async (email, password) => {
    const r = await api.login(email, password)
    setToken(r.token)
    setUser(r.user)
  }, [])

  const logout = useCallback(() => {
    setToken(null)
    setUser(null)
  }, [])

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
