import { useState } from 'react'
import { Download, RefreshCw, Save, Wand2, CheckCircle2, AudioLines } from 'lucide-react'
import { api } from '../api'
import { useToast, useVoices } from '../context/hooks'
import AudioPlayer from '../components/AudioPlayer'
import VoiceSettings from '../components/VoiceSettings'
import { Empty, ErrorState, Loading } from '../components/States'
import { defaultSettings } from '../voiceDefaults'
import { LANGS, fmtBytes, fmtDuration } from '../lib'

const MAX_CHARS = 5000

export default function Generator() {
  const toast = useToast()
  const catalog = useVoices()
  const [title, setTitle] = useState('')
  const [text, setText] = useState('')
  const [overrides, setSettings] = useState(null)
  const settings = overrides ?? (catalog.data ? defaultSettings(catalog.data) : null)
  const [busy, setBusy] = useState(null) // 'generate' | 'regenerate' | 'save'
  const [audio, setAudio] = useState(null)
  const [error, setError] = useState('')

  if (catalog.loading) return <div className="page"><Loading /></div>
  if (catalog.error) return <div className="page"><ErrorState error={catalog.error} onRetry={catalog.reload} /></div>
  if (!settings) return null

  const data = catalog.data
  const voice = data.voices.find((v) => v.voiceId === settings.voiceId)
  const payload = () => ({
    title: title.trim(),
    text,
    language: settings.language,
    voiceId: settings.voiceId,
    voiceName: voice?.name || '',
    ...(settings.style ? { voiceStyle: settings.style } : {}),
    modelId: settings.modelId,
    speed: settings.speed,
    stability: settings.stability,
    similarityBoost: settings.similarityBoost,
  })
  const canGenerate = title.trim() && text.trim() && settings.voiceId && text.length <= MAX_CHARS && !busy

  const run = async (kind, fn) => {
    setBusy(kind)
    setError('')
    try {
      await fn()
    } catch (e) {
      setError(e.message)
      toast.error(e.message)
    } finally {
      setBusy(null)
    }
  }

  const generate = () =>
    run('generate', async () => {
      const r = await api.generate(payload())
      setAudio(r.audio)
      toast[r.duplicate ? 'info' : 'success'](r.duplicate ? 'Identical audio already existed: reused it, no credits spent.' : 'Audio generated.')
    })

  const regenerate = () =>
    run('regenerate', async () => {
      const p = payload()
      const r = await api.regenerate(audio.id, {
        voiceId: p.voiceId,
        voiceName: p.voiceName,
        modelId: p.modelId,
        speed: p.speed,
        stability: p.stability,
        similarityBoost: p.similarityBoost,
      })
      setAudio(r.audio)
      toast.success('Audio regenerated.')
    })

  const save = () =>
    run('save', async () => {
      const r = await api.save(audio.id)
      setAudio(r.audio)
      toast.success('Saved to library.')
    })

  const setLanguage = (language) => {
    // keep the voice, but re-evaluate the style tag for the new language
    setSettings({ ...settings, language })
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Voice Generator</h1>
          <p>Convert Sanskrit, Hindi or English text into natural speech with ElevenLabs.</p>
        </div>
      </div>

      {data.warning && <div className="alert">{data.warning}</div>}

      <div className="gen-layout">
        <div>
          <div className="card">
            <div className="field">
              <label htmlFor="title">Content title</label>
              <input id="title" className="input" maxLength={200} placeholder="e.g. Bala Kanda – Sarga 1 – Verse 1" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>

            <div className="field">
              <span className="label">Language</span>
              <div className="seg" role="group" aria-label="Language">
                {LANGS.map((l) => (
                  <button key={l.id} type="button" className={settings.language === l.id ? 'on' : ''} onClick={() => setLanguage(l.id)}>
                    {l.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="field" style={{ marginBottom: 0 }}>
              <label htmlFor="text">
                Text
                <span className={text.length > MAX_CHARS ? 'val' : 'faint'} style={text.length > MAX_CHARS ? { color: 'var(--danger)' } : undefined}>
                  {text.length.toLocaleString()} / {MAX_CHARS.toLocaleString()}
                </span>
              </label>
              <textarea
                id="text"
                className={`textarea ${settings.language !== 'english' ? 'deva' : ''}`}
                lang={settings.language === 'english' ? 'en' : settings.language === 'hindi' ? 'hi' : 'sa'}
                placeholder={settings.language === 'english' ? 'Enter the text to convert to speech…' : 'यहाँ पाठ दर्ज करें…'}
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
          </div>

          <div className="card" aria-live="polite">
            <div className="card-title">
              <h2>Audio preview</h2>
              {audio && (
                <span className={`badge ${audio.saved ? 'ok' : 'warn'}`}>{audio.saved ? 'In library' : 'Draft: not saved yet'}</span>
              )}
            </div>
            {busy === 'generate' || busy === 'regenerate' ? (
              <Loading label={busy === 'generate' ? 'Generating audio… this can take up to a minute for long text.' : 'Regenerating…'} />
            ) : audio ? (
              <>
                <AudioPlayer src={audio.playUrl} duration={audio.duration} />
                <div className="flex wrap mt muted" style={{ fontSize: 13 }}>
                  <span>{fmtDuration(audio.duration)} min</span>·<span>{fmtBytes(audio.fileSize)}</span>·<span>MP3</span>·<span>{audio.voiceName}</span>
                </div>
                <div className="flex wrap mt">
                  <a className="btn" href={audio.downloadUrl}>
                    <Download size={16} /> Download MP3
                  </a>
                  <button className="btn" onClick={regenerate} disabled={!!busy}>
                    <RefreshCw size={16} /> Regenerate
                  </button>
                  <span className="spacer" />
                  {audio.saved ? (
                    <span className="badge ok"><CheckCircle2 size={14} /> Saved</span>
                  ) : (
                    <button className="btn primary" onClick={save} disabled={!!busy}>
                      {busy === 'save' ? <span className="spinner" /> : <Save size={16} />} Save to library
                    </button>
                  )}
                </div>
                <p className="faint mt" style={{ fontSize: 12.5 }}>
                  Regenerate uses the current voice and slider values on the right, and replaces this audio.
                </p>
              </>
            ) : (
              <Empty icon={AudioLines} title="Nothing generated yet">Your audio will appear here for preview.</Empty>
            )}
            {error && <div className="alert err mt" role="alert">{error}</div>}
          </div>
        </div>

        <div className="card">
          <div className="card-title">
            <h2>Voice settings</h2>
          </div>
          <VoiceSettings value={settings} onChange={setSettings} catalog={data} hideLanguage />
          <button className="btn primary block mt" style={{ marginTop: 22 }} onClick={generate} disabled={!canGenerate}>
            {busy === 'generate' ? <span className="spinner" /> : <Wand2 size={17} />} Generate audio
          </button>
          {!canGenerate && !busy && <p className="faint mt" style={{ fontSize: 12.5, textAlign: 'center' }}>Enter a title and text to enable generation.</p>}
        </div>
      </div>
    </div>
  )
}
