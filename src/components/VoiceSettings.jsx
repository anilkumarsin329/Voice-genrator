import { useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { LANGS, STYLE_LABELS } from '../lib'

/**
 * Shared voice picker + sliders. `value` = { language, voiceId, style, modelId, speed, stability, similarityBoost }.
 * `catalog` is the /voices response. Selecting a style applies its preset sliders and prefers a voice tagged with that style.
 */
export default function VoiceSettings({ value, onChange, catalog, hideLanguage }) {
  const { voices = [], models = [], styles = [], stylePresets = {} } = catalog
  const [gender, setGender] = useState('all')
  const set = (patch) => onChange({ ...value, ...patch })
  const voice = voices.find((v) => v.voiceId === value.voiceId)
  const genderOf = (v) => (v.style?.endsWith('_female') ? 'female' : v.style?.endsWith('_male') ? 'male' : (v.labels?.gender || '').toLowerCase())
  const shownVoices = gender === 'all' ? voices : voices.filter((v) => genderOf(v) === gender || v.voiceId === value.voiceId)

  const pickGender = (g) => {
    setGender(g)
    if (g === 'all' || (voice && genderOf(voice) === g)) return
    const match = voices.find((v) => genderOf(v) === g && v.approved?.[value.language]) || voices.find((v) => genderOf(v) === g)
    if (match) set({ voiceId: match.voiceId, style: match.style || '' })
  }
  const approved = voice?.approved?.[value.language]

  const pickStyle = (style) => {
    const preset = stylePresets[style] || {}
    const tagged = voices.find((v) => v.style === style && v.approved?.[value.language]) || voices.find((v) => v.style === style)
    set({ style, ...preset, ...(tagged ? { voiceId: tagged.voiceId } : {}) })
  }

  return (
    <>
      {!hideLanguage && (
        <div className="field">
          <span className="label">Language</span>
          <div className="seg" role="group" aria-label="Language">
            {LANGS.map((l) => (
              <button key={l.id} type="button" className={value.language === l.id ? 'on' : ''} onClick={() => set({ language: l.id })}>
                {l.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="field">
        <span className="label">Voice type</span>
        <div className="seg" role="group" aria-label="Voice type">
          {[['all', 'All'], ['male', 'Male'], ['female', 'Female']].map(([id, label]) => (
            <button key={id} type="button" className={gender === id ? 'on' : ''} onClick={() => pickGender(id)}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="vs-style">Voice style</label>
          <select id="vs-style" className="select" value={value.style} onChange={(e) => pickStyle(e.target.value)}>
            <option value="">Custom</option>
            {styles.filter((s) => gender === 'all' || s === 'narrator' || s.endsWith(`_${gender}`)).map((s) => (
              <option key={s} value={s}>
                {STYLE_LABELS[s]}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="vs-voice">Voice</label>
          <select id="vs-voice" className="select" value={value.voiceId} onChange={(e) => set({ voiceId: e.target.value })}>
            {!voices.length && <option value="">No voices available</option>}
            {shownVoices.map((v) => (
              <option key={v.voiceId} value={v.voiceId}>
                {v.approved?.[value.language] ? '✓ ' : ''}
                {v.name}
                {v.style ? ` · ${STYLE_LABELS[v.style]}` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {voice && !approved && (
        <div className="alert">
          <AlertTriangle size={16} />
          <span>
            This voice is not yet approved for {value.language}. Pronunciation is not guaranteed
            {value.language === 'sanskrit' ? ', especially for Sanskrit' : ''}. Test it under Voices &amp; Approval first.
          </span>
        </div>
      )}

      <div className="field">
        <label htmlFor="vs-model">Voice model</label>
        <select id="vs-model" className="select" value={value.modelId} onChange={(e) => set({ modelId: e.target.value })}>
          {models.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
        <span className="hint">{models.find((m) => m.id === value.modelId)?.note}</span>
      </div>

      <div className="field">
        <label htmlFor="vs-speed">
          Speed <span className="val">{Number(value.speed).toFixed(2)}×</span>
        </label>
        <input id="vs-speed" type="range" min="0.7" max="1.2" step="0.05" value={value.speed} onChange={(e) => set({ speed: Number(e.target.value), style: '' })} />
      </div>
      <div className="field">
        <label htmlFor="vs-stab">
          Stability <span className="val">{Number(value.stability).toFixed(2)}</span>
        </label>
        <input id="vs-stab" type="range" min="0" max="1" step="0.05" value={value.stability} onChange={(e) => set({ stability: Number(e.target.value), style: '' })} />
        <span className="hint">Lower = more expressive, higher = more consistent.</span>
      </div>
      <div className="field" style={{ marginBottom: 0 }}>
        <label htmlFor="vs-sim">
          Similarity boost <span className="val">{Number(value.similarityBoost).toFixed(2)}</span>
        </label>
        <input id="vs-sim" type="range" min="0" max="1" step="0.05" value={value.similarityBoost} onChange={(e) => set({ similarityBoost: Number(e.target.value), style: '' })} />
      </div>
    </>
  )
}
