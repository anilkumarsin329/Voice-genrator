import { useEffect, useMemo, useState } from 'react'
import { Layers, Play, RotateCcw, CheckCircle2, XCircle, Clock, SkipForward } from 'lucide-react'
import { api } from '../api'
import { useAsync, useToast, useVoices } from '../context/hooks'
import VoiceSettings from '../components/VoiceSettings'
import { Empty, ErrorState, Loading, Spinner } from '../components/States'
import { defaultSettings } from '../voiceDefaults'
import { LANGS } from '../lib'

const itemIcon = {
  completed: <CheckCircle2 size={16} color="var(--success)" />,
  skipped: <SkipForward size={16} color="var(--text-faint)" />,
  failed: <XCircle size={16} color="var(--danger)" />,
  processing: <Spinner />,
  pending: <Clock size={16} color="var(--text-faint)" />,
}

const EMPTY = new Set()

export default function Bulk() {
  const toast = useToast()
  const catalog = useVoices()
  const kandas = useAsync(() => api.kandas(), [])
  const [overrides, setSettings] = useState(null)
  const settings = overrides ?? (catalog.data ? defaultSettings(catalog.data) : null)
  const [kandaId, setKandaId] = useState('')
  const [sarga, setSarga] = useState('')
  const [sargas, setSargas] = useState([])
  const [job, setJob] = useState(null)
  const [starting, setStarting] = useState(false)
  const [refresh, setRefresh] = useState(0)

  // Verse list and selection are tied to the Kanda / Sarga / language they were loaded for,
  // so changing any of those never shows (or keeps selected) verses from the previous choice.
  const language = settings?.language
  const versesKey = kandaId && language ? `${kandaId}|${sarga}|${language}` : ''
  const [loaded, setLoaded] = useState({ key: '', list: null, error: null })
  const [pick, setPick] = useState({ key: '', ids: new Set() })
  const verses = loaded.key === versesKey ? loaded.list : null
  const versesError = loaded.key === versesKey ? loaded.error : null
  const selected = pick.key === versesKey ? pick.ids : EMPTY

  useEffect(() => {
    if (!versesKey) return
    let live = true
    api
      .verses(kandaId, { language, sarga })
      .then((r) => live && setLoaded({ key: versesKey, list: r.verses, error: null }))
      .catch((error) => live && setLoaded({ key: versesKey, list: null, error }))
    return () => {
      live = false
    }
  }, [versesKey, refresh, kandaId, language, sarga])

  // Resume the most recent job (so a page refresh keeps showing progress)
  useEffect(() => {
    api.bulkLatest().then((r) => r.job && setJob(r.job)).catch(() => {})
  }, [])

  // Poll while a job is running
  const running = job?.status === 'running'
  const jobId = job?.id
  useEffect(() => {
    if (!running) return
    const timer = setInterval(async () => {
      try {
        const r = await api.bulkStatus(jobId)
        setJob(r.job)
        if (r.job.status !== 'running') {
          const c = r.job.counts
          if (c.failed) toast.error(`Bulk run finished with ${c.failed} failed verse(s). You can retry them.`)
          else toast.success('Bulk generation complete.')
          setRefresh((n) => n + 1)
        }
      } catch {
        /* transient; next tick retries */
      }
    }, 2000)
    return () => clearInterval(timer)
  }, [running, jobId, toast])

  const onKanda = (id) => {
    setKandaId(id)
    setSarga('')
    setSargas([])
    if (id) api.sargas(id).then((r) => setSargas(r.sargas)).catch(() => {})
  }

  const selectable = useMemo(() => (verses || []).filter((v) => v.hasText && !v.hasAudio), [verses])
  const setSelected = (ids) => setPick({ key: versesKey, ids })
  const toggle = (id) => {
    const n = new Set(selected)
    if (n.has(id)) n.delete(id)
    else n.add(id)
    setSelected(n)
  }
  const allSelected = selectable.length > 0 && selectable.every((v) => selected.has(v.id))

  const start = async () => {
    setStarting(true)
    try {
      const voice = catalog.data.voices.find((v) => v.voiceId === settings.voiceId)
      const r = await api.bulkStart({
        kandaId,
        ...(sarga ? { sargaNumber: Number(sarga) } : {}),
        verseIds: [...selected],
        language: settings.language,
        voiceId: settings.voiceId,
        voiceName: voice?.name || '',
        modelId: settings.modelId,
        speed: settings.speed,
        stability: settings.stability,
        similarityBoost: settings.similarityBoost,
      })
      setJob(r.job)
      setSelected(EMPTY)
      toast.info(`Started generating ${r.job.total} verse(s), one at a time.`)
    } catch (e) {
      toast.error(e.message)
    } finally {
      setStarting(false)
    }
  }

  const retry = async () => {
    try {
      const r = await api.bulkRetry(job.id)
      setJob(r.job)
    } catch (e) {
      toast.error(e.message)
    }
  }

  if (catalog.loading || kandas.loading) return <div className="page"><Loading /></div>
  if (catalog.error || kandas.error) return <div className="page"><ErrorState error={catalog.error || kandas.error} onRetry={() => { catalog.reload(); kandas.reload() }} /></div>
  if (!settings) return null

  const done = job ? (job.counts.completed || 0) + (job.counts.skipped || 0) + (job.counts.failed || 0) : 0
  const pct = job ? Math.round((done / job.total) * 100) : 0
  const failed = job?.counts?.failed || 0
  const kandaName = (id) => kandas.data.kandas.find((k) => k.id === id)?.name

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Bulk Generation</h1>
          <p>Generate audio for many verses sequentially. Verses that already have saved audio are skipped automatically.</p>
        </div>
      </div>

      {job && (
        <div className="card" aria-live="polite">
          <div className="card-title">
            <h2>
              {running ? 'Generating…' : job.status === 'completed' ? 'Last run: complete' : job.status === 'interrupted' ? 'Last run: interrupted' : 'Last run: finished with errors'}
            </h2>
            <span className="muted">{kandaName(job.kanda) || 'Kanda'}{job.sargaNumber ? ` · Sarga ${job.sargaNumber}` : ''} · {job.language}</span>
          </div>
          <div className="progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div style={{ width: `${pct}%` }} /></div>
          <div className="flex wrap mt muted" style={{ fontSize: 13 }}>
            <span>{done} of {job.total} processed</span>
            {job.counts.completed > 0 && <span className="badge ok">{job.counts.completed} generated</span>}
            {job.counts.skipped > 0 && <span className="badge">{job.counts.skipped} already existed</span>}
            {failed > 0 && <span className="badge err">{failed} failed</span>}
            <span className="spacer" />
            {!running && (failed > 0 || job.counts.pending > 0) && (
              <button className="btn sm primary" onClick={retry}><RotateCcw size={14} /> Retry {failed + (job.counts.pending || 0)} remaining</button>
            )}
          </div>
          <div className="verse-list mt" style={{ maxHeight: 220 }}>
            {job.items.map((i) => (
              <div className="verse" key={i.verse} style={{ alignItems: 'center', padding: '8px 14px' }}>
                {itemIcon[i.status]}
                <span style={{ minWidth: 80 }}>{i.label}</span>
                <span className="muted" style={{ fontSize: 13, color: i.status === 'failed' ? 'var(--danger)' : undefined }}>
                  {i.status === 'failed' ? i.error : i.status === 'skipped' ? 'Already existed' : i.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="gen-layout" style={{ marginTop: job ? 20 : 0 }}>
        <div className="card" style={{ marginTop: 0 }}>
          <div className="card-title"><h2>Select verses</h2></div>
          <div className="row">
            <div className="field">
              <label htmlFor="kanda">Kanda</label>
              <select id="kanda" className="select" value={kandaId} onChange={(e) => onKanda(e.target.value)}>
                <option value="">Select a Kanda…</option>
                {kandas.data.kandas.map((k) => (
                  <option key={k.id} value={k.id}>{k.number}. {k.name} ({k.verseCount} verses)</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="sarga">Sarga</label>
              <select id="sarga" className="select" value={sarga} onChange={(e) => setSarga(e.target.value)} disabled={!kandaId || !sargas.length}>
                <option value="">{sargas.length || !kandaId ? 'All Sargas' : 'No Sarga grouping in this Kanda'}</option>
                {sargas.map((s) => <option key={s.number} value={s.number}>Sarga {s.number}</option>)}
              </select>
            </div>
          </div>

          <div className="field">
            <span className="label">Language to generate</span>
            <div className="seg" role="group" aria-label="Language">
              {LANGS.map((l) => (
                <button key={l.id} type="button" className={settings.language === l.id ? 'on' : ''} onClick={() => setSettings({ ...settings, language: l.id })}>{l.label}</button>
              ))}
            </div>
          </div>

          {!kandaId ? (
            <Empty icon={Layers} title="Choose a Kanda">Pick a Kanda to list its verses.</Empty>
          ) : versesError ? (
            <ErrorState error={versesError} onRetry={() => setRefresh((n) => n + 1)} />
          ) : !verses ? (
            <Loading />
          ) : !verses.length ? (
            <Empty title="No verses found">This Kanda has no verses yet.</Empty>
          ) : (
            <>
              <div className="flex wrap" style={{ marginBottom: 10 }}>
                <label className="check">
                  <input type="checkbox" checked={allSelected} disabled={!selectable.length} onChange={() => setSelected(allSelected ? EMPTY : new Set(selectable.map((v) => v.id)))} />
                  Select all available ({selectable.length})
                </label>
                <span className="spacer" />
                <span className="muted">{selected.size} selected</span>
              </div>
              <div className="verse-list">
                {verses.map((v) => {
                  const text = v[settings.language]
                  const off = !v.hasText || v.hasAudio
                  return (
                    <label key={v.id} className={`verse ${off ? 'disabled' : ''}`} style={{ cursor: off ? 'not-allowed' : 'pointer' }}>
                      <input type="checkbox" disabled={off} checked={selected.has(v.id)} onChange={() => toggle(v.id)} style={{ accentColor: 'var(--saffron)', marginTop: 5 }} />
                      <span className="num">{v.number}</span>
                      <span className="body">
                        <span className={settings.language !== 'english' ? 'deva' : ''} style={{ display: 'block', whiteSpace: 'pre-line' }}>
                          {text ? (text.length > 160 ? `${text.slice(0, 160)}…` : text) : <em className="faint">No {settings.language} text</em>}
                        </span>
                      </span>
                      {v.hasAudio && <span className="badge ok">Audio exists</span>}
                    </label>
                  )
                })}
              </div>
            </>
          )}
        </div>

        <div className="card" style={{ marginTop: 0 }}>
          <div className="card-title"><h2>Voice settings</h2></div>
          <VoiceSettings value={settings} onChange={setSettings} catalog={catalog.data} hideLanguage />
          <button className="btn primary block" style={{ marginTop: 22 }} disabled={!selected.size || starting || running || !settings.voiceId} onClick={start}>
            {starting ? <span className="spinner" /> : <Play size={16} />} Generate {selected.size || ''} verse{selected.size === 1 ? '' : 's'}
          </button>
          {running && <p className="faint mt" style={{ fontSize: 12.5, textAlign: 'center' }}>A bulk run is in progress. You can leave this page; it keeps running on the server.</p>}
        </div>
      </div>
    </div>
  )
}
