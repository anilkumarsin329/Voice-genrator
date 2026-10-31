import { useState } from 'react'
import { Play, ShieldCheck } from 'lucide-react'
import { api } from '../api'
import { useToast, useVoices } from '../context/hooks'
import AudioPlayer from '../components/AudioPlayer'
import { Empty, ErrorState, Loading } from '../components/States'
import { LANGS, SAMPLE_TEXT, STYLE_LABELS } from '../lib'

export default function Voices() {
  const toast = useToast()
  const { data, loading, error, reload } = useVoices()
  const [lang, setLang] = useState('sanskrit')
  const [text, setText] = useState(SAMPLE_TEXT.sanskrit)
  const [testing, setTesting] = useState(null)
  const [sample, setSample] = useState(null) // { voiceId, url }

  if (loading) return <div className="page"><Loading /></div>
  if (error) return <div className="page"><ErrorState error={error} onRetry={reload} /></div>

  const changeLang = (l) => {
    setLang(l)
    setText(SAMPLE_TEXT[l])
  }

  const update = async (voice, patch) => {
    try {
      await api.updateVoice(voice.voiceId, { name: voice.name, ...patch })
      await reload()
      toast.success('Voice updated.')
    } catch (e) {
      toast.error(e.message)
    }
  }

  const test = async (voice) => {
    setTesting(voice.voiceId)
    try {
      const url = await api.testVoice({ voiceId: voice.voiceId, language: lang, text, modelId: data.models[0].id })
      if (sample?.url) URL.revokeObjectURL(sample.url)
      setSample({ voiceId: voice.voiceId, url })
    } catch (e) {
      toast.error(e.message)
    } finally {
      setTesting(null)
    }
  }

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Voices &amp; Approval</h1>
          <p>Listen to a voice speaking your text, then approve it for the languages where the pronunciation is accurate.</p>
        </div>
      </div>

      {data.warning && <div className="alert">{data.warning}</div>}

      <div className="card">
        <div className="card-title"><h2>Pronunciation test</h2></div>
        <div className="seg" role="group" aria-label="Test language" style={{ marginBottom: 14 }}>
          {LANGS.map((l) => <button key={l.id} className={lang === l.id ? 'on' : ''} onClick={() => changeLang(l.id)}>{l.label}</button>)}
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="sample">Test text <span className="faint">{text.length}/400</span></label>
          <textarea id="sample" className={`textarea ${lang !== 'english' ? 'deva' : ''}`} style={{ minHeight: 90 }} maxLength={400} value={text} onChange={(e) => setText(e.target.value)} />
          <span className="hint">Test renders are not saved to the library or S3, but they do use a few ElevenLabs credits.</span>
        </div>
      </div>

      <div className="card">
        <div className="card-title"><h2>Voices</h2><span className="muted">{data.voices.length} available</span></div>
        {!data.voices.length ? (
          <Empty icon={ShieldCheck} title="No voices found">Add voices to your ElevenLabs account or set ELEVENLABS_VOICES in the backend environment.</Empty>
        ) : (
          data.voices.map((v) => (
            <div key={v.voiceId}>
              <div className="voice-row">
                <div>
                  <div className="title" style={{ fontWeight: 600 }}>{v.name}</div>
                  <div className="faint" style={{ fontSize: 12.5 }}>
                    {[v.category, v.labels?.gender, v.labels?.accent].filter(Boolean).join(' · ') || v.voiceId}
                  </div>
                </div>
                <select className="select" aria-label={`Style for ${v.name}`} value={v.style} onChange={(e) => update(v, { style: e.target.value })}>
                  <option value="">No style tag</option>
                  {data.styles.map((s) => <option key={s} value={s}>{STYLE_LABELS[s]}</option>)}
                </select>
                <div className="flex wrap">
                  {LANGS.map((l) => (
                    <label className="check" key={l.id} title={`Approve for ${l.label}`}>
                      <input type="checkbox" checked={!!v.approved[l.id]} onChange={(e) => update(v, { approved: { [l.id]: e.target.checked } })} />
                      {l.label}
                    </label>
                  ))}
                </div>
                <button className="btn sm" onClick={() => test(v)} disabled={!!testing || !text.trim()}>
                  {testing === v.voiceId ? <span className="spinner" /> : <Play size={14} />} Test
                </button>
              </div>
              {sample?.voiceId === v.voiceId && (
                <div style={{ paddingBottom: 14 }}><AudioPlayer src={sample.url} autoPlay /></div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}
