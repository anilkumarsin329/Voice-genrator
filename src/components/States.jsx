import { AlertTriangle, Inbox } from 'lucide-react'

export const Spinner = () => <span className="spinner" aria-label="Loading" />

export const Loading = ({ label = 'Loading…' }) => (
  <div className="center muted flex" style={{ justifyContent: 'center' }}>
    <Spinner /> {label}
  </div>
)

export const Empty = ({ icon: Icon = Inbox, title, children, action }) => (
  <div className="empty">
    <div className="ico">
      <Icon size={24} />
    </div>
    <h3>{title}</h3>
    {children && <p>{children}</p>}
    {action && <div className="mt">{action}</div>}
  </div>
)

export const ErrorState = ({ error, onRetry }) => (
  <div className="empty">
    <div className="ico" style={{ background: 'var(--danger-soft)', color: 'var(--danger)' }}>
      <AlertTriangle size={24} />
    </div>
    <h3>Something went wrong</h3>
    <p>{error?.message || 'Unexpected error'}</p>
    {onRetry && (
      <div className="mt">
        <button className="btn" onClick={onRetry}>
          Try again
        </button>
      </div>
    )}
  </div>
)
