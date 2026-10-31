import { useEffect, useState } from 'react'
import { Download, Play, RefreshCw, Search, Trash2, Library as LibraryIcon, ChevronUp } from 'lucide-react'
import { api } from '../api'
import { useAsync, useToast } from '../context/hooks'
import AudioPlayer from '../components/AudioPlayer'
import ConfirmDialog from '../components/ConfirmDialog'
import { Empty, ErrorState, Loading } from '../components/States'
import { LANGS, fmtBytes, fmtDate, fmtDuration, langLabel } from '../lib'

export default function LibraryPage() {
  const toast = useToast()
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [language, setLanguage] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(null) // id of the row with its player expanded
  const [confirm, setConfirm] = useState(null) // { kind: 'delete' | 'regenerate', audio }
  const [busy, setBusy] = useState(false)

  // debounce the title search
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(q.trim())
      setPage(1)
    }, 350)
    return () => clearTimeout(t)
  }, [q])

  const list = useAsync(
    () => api.history({ q: search, language, from, to, page, limit: 15, saved: 'true', status: 'completed' }),
    [search, language, from, to, page],
  )

  const act = async () => {
    setBusy(true)
    try {
      if (confirm.kind === 'delete') {
        await api.remove(confirm.audio.id)
        toast.success('Audio deleted.')
        if (open === confirm.audio.id) setOpen(null)
      } else {
        await api.regenerate(confirm.audio.id)
        toast.success('Audio regenerated.')
      }
      setConfirm(null)
      await list.reload()
    } catch (e) {
      toast.error(e.message)
    } finally {
      setBusy(false)
    }
  }

  const filtered = search || language || from || to
  const items = list.data?.items || []
  const pg = list.data?.pagination

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Audio Library</h1>
          <p>Saved audio stored privately in S3. Links are signed and expire automatically.</p>
        </div>
      </div>

      <div className="card">
        <div className="filters">
          <div className="field">
            <label htmlFor="q">Search title</label>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: 11, top: 12, color: 'var(--text-faint)' }} />
              <input id="q" className="input" style={{ paddingLeft: 32 }} placeholder="Search by title…" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </div>
          <div className="field">
            <label htmlFor="lang">Language</label>
            <select id="lang" className="select" value={language} onChange={(e) => { setLanguage(e.target.value); setPage(1) }}>
              <option value="">All languages</option>
              {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
            </select>
          </div>
          <div className="field">
            <label htmlFor="from">From</label>
            <input id="from" type="date" className="input" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1) }} />
          </div>
          <div className="field">
            <label htmlFor="to">To</label>
            <input id="to" type="date" className="input" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1) }} />
          </div>
        </div>

        {list.loading && !list.data ? (
          <Loading />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !items.length ? (
          <Empty icon={LibraryIcon} title={filtered ? 'No audio matches these filters' : 'Your library is empty'}>
            {filtered ? 'Try clearing a filter or searching for a different title.' : 'Audio you save from the generator or bulk generation appears here.'}
          </Empty>
        ) : (
          <div className="table-wrap" style={{ opacity: list.loading ? 0.6 : 1 }}>
            <table className="t">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Language</th>
                  <th>Voice</th>
                  <th>Length</th>
                  <th>Size</th>
                  <th>Created</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {items.map((a) => (
                  <FragmentRow
                    key={a.id}
                    a={a}
                    expanded={open === a.id}
                    onToggle={() => setOpen(open === a.id ? null : a.id)}
                    onRegenerate={() => setConfirm({ kind: 'regenerate', audio: a })}
                    onDelete={() => setConfirm({ kind: 'delete', audio: a })}
                  />
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pg && pg.pages > 1 && (
          <div className="pager">
            <span>{pg.total} items · page {pg.page} of {pg.pages}</span>
            <div className="flex">
              <button className="btn sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
              <button className="btn sm" disabled={page >= pg.pages} onClick={() => setPage(page + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>

      {confirm && (
        <ConfirmDialog
          title={confirm.kind === 'delete' ? 'Delete this audio?' : 'Regenerate this audio?'}
          message={
            confirm.kind === 'delete'
              ? `"${confirm.audio.title}" will be permanently removed from the library and from S3.`
              : `"${confirm.audio.title}" will be generated again with its original settings, replacing the current file. This uses ElevenLabs credits.`
          }
          confirmLabel={confirm.kind === 'delete' ? 'Delete' : 'Regenerate'}
          danger={confirm.kind === 'delete'}
          busy={busy}
          onConfirm={act}
          onCancel={() => setConfirm(null)}
        />
      )}
    </div>
  )
}

function FragmentRow({ a, expanded, onToggle, onRegenerate, onDelete }) {
  return (
    <>
      <tr className={expanded ? 'expanded' : ''}>
        <td>
          <div className="title">{a.title}</div>
        </td>
        <td><span className="badge gold">{langLabel(a.language)}</span></td>
        <td className="muted">{a.voiceName || '–'}</td>
        <td>{fmtDuration(a.duration)}</td>
        <td className="muted">{fmtBytes(a.fileSize)}</td>
        <td className="muted">{fmtDate(a.createdAt)}</td>
        <td>
          <div className="actions">
            <button className="btn sm icon" onClick={onToggle} title={expanded ? 'Close player' : 'Play'} aria-label="Play">
              {expanded ? <ChevronUp size={16} /> : <Play size={16} />}
            </button>
            <a className="btn sm icon" href={a.downloadUrl} title="Download MP3" aria-label="Download">
              <Download size={16} />
            </a>
            <button className="btn sm icon" onClick={onRegenerate} title="Regenerate" aria-label="Regenerate">
              <RefreshCw size={16} />
            </button>
            <button className="btn sm icon danger" onClick={onDelete} title="Delete" aria-label="Delete">
              <Trash2 size={16} />
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="expanded">
          <td colSpan={7}>
            <AudioPlayer src={a.playUrl} duration={a.duration} autoPlay />
          </td>
        </tr>
      )}
    </>
  )
}
