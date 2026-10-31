import { Link } from 'react-router-dom'
import { AudioLines, Clock, HardDrive, CheckCircle2, XCircle, Mic2 } from 'lucide-react'
import { api } from '../api'
import { useAsync } from '../context/hooks'
import { Empty, ErrorState, Loading } from '../components/States'
import { fmtBytes, fmtDate, fmtDuration, langLabel } from '../lib'

const statusBadge = (s) => <span className={`badge ${s === 'completed' ? 'ok' : s === 'failed' ? 'err' : 'warn'}`}>{s}</span>

export default function Dashboard() {
  const usage = useAsync(() => api.usage(), [])
  const recent = useAsync(() => api.history({ limit: 8 }), [])

  const t = usage.data?.totals
  const el = usage.data?.elevenlabs
  const stats = t && [
    { label: 'Total audio', value: t.totalAudio, icon: AudioLines },
    { label: 'Total duration', value: fmtDuration(t.totalDurationSeconds), icon: Clock },
    { label: 'Storage used', value: fmtBytes(t.storageBytes), icon: HardDrive },
    { label: 'Successful', value: t.successful, icon: CheckCircle2 },
    { label: 'Failed', value: t.failed, icon: XCircle },
    {
      label: 'ElevenLabs credits',
      value: el ? `${(el.characterLimit - el.characterCount).toLocaleString()}` : '–',
      icon: Mic2,
      sub: el ? `of ${el.characterLimit.toLocaleString()} characters left` : 'Quota unavailable for this API key',
    },
  ]

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p>Overview of generated audio across all languages.</p>
        </div>
        <Link className="btn primary" to="/generate">
          <Mic2 size={16} /> New audio
        </Link>
      </div>

      {usage.loading ? (
        <Loading />
      ) : usage.error ? (
        <ErrorState error={usage.error} onRetry={usage.reload} />
      ) : (
        <div className="stats">
          {stats.map(({ label, value, icon: Icon, sub }) => (
            <div className="card stat" key={label}>
              <div className="stat-label">
                <Icon size={15} /> {label}
              </div>
              <div className="stat-value">{value}</div>
              {sub && <div className="stat-sub">{sub}</div>}
            </div>
          ))}
        </div>
      )}

      <div className="card mt" style={{ marginTop: 20 }}>
        <div className="card-title">
          <h2>Recent audio</h2>
          <Link to="/library" className="btn sm">
            Open library
          </Link>
        </div>
        {recent.loading ? (
          <Loading />
        ) : recent.error ? (
          <ErrorState error={recent.error} onRetry={recent.reload} />
        ) : !recent.data.items.length ? (
          <Empty icon={AudioLines} title="No audio yet" action={<Link className="btn primary" to="/generate">Generate your first audio</Link>}>
            Generated audio will appear here.
          </Empty>
        ) : (
          <div className="table-wrap">
            <table className="t">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Language</th>
                  <th>Voice</th>
                  <th>Duration</th>
                  <th>Status</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                {recent.data.items.map((a) => (
                  <tr key={a.id}>
                    <td>
                      <div className="title">{a.title}</div>
                      {a.status === 'failed' && <div className="sub" style={{ color: 'var(--danger)' }}>{a.errorMessage}</div>}
                    </td>
                    <td>{langLabel(a.language)}</td>
                    <td className="muted">{a.voiceName || '–'}</td>
                    <td>{a.status === 'completed' ? fmtDuration(a.duration) : '–'}</td>
                    <td>{statusBadge(a.status)}</td>
                    <td className="muted">{fmtDate(a.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
