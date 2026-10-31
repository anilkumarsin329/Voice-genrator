import { useCallback, useMemo, useRef, useState } from 'react'
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react'
import { ToastContext } from './contexts'

const icons = { success: CheckCircle2, error: AlertCircle, info: Info }
const colors = { success: 'var(--success)', error: 'var(--danger)', info: 'var(--gold)' }

export default function ToastProvider({ children }) {
  const [items, setItems] = useState([])
  const id = useRef(0)

  const dismiss = useCallback((i) => setItems((s) => s.filter((t) => t.id !== i)), [])
  const push = useCallback(
    (type, message) => {
      const i = ++id.current
      setItems((s) => [...s, { id: i, type, message }])
      setTimeout(() => dismiss(i), type === 'error' ? 7000 : 4000)
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => {
          const Icon = icons[t.type]
          return (
            <div key={t.id} className={`toast ${t.type}`}>
              <Icon size={18} color={colors[t.type]} style={{ flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>{t.message}</div>
              <button className="btn icon sm" style={{ border: 0, padding: 2 }} onClick={() => dismiss(t.id)} aria-label="Dismiss">
                <X size={15} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
