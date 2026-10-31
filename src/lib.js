export const LANGS = [
  { id: 'sanskrit', label: 'Sanskrit', native: 'संस्कृतम्' },
  { id: 'hindi', label: 'Hindi', native: 'हिन्दी' },
  { id: 'english', label: 'English', native: 'English' },
]
export const langLabel = (id) => LANGS.find((l) => l.id === id)?.label || id
export const STYLE_LABELS = {
  devotional_male: 'Devotional Male',
  calm_male: 'Calm Male',
  deep_male: 'Deep Male',
  soft_female: 'Soft Female',
  devotional_female: 'Devotional Female',
  calm_female: 'Calm Female',
  narrator: 'Narrator',
}

export const fmtDuration = (s = 0) => {
  s = Math.round(s)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  return h ? `${h}h ${m}m` : `${m}:${String(sec).padStart(2, '0')}`
}
export const fmtBytes = (b = 0) => {
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`
  return `${(b / 1073741824).toFixed(2)} GB`
}
export const fmtDate = (d) =>
  new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })

export const SAMPLE_TEXT = {
  sanskrit: 'ॐ भूर्भुवः स्वः। तत्सवितुर्वरेण्यं भर्गो देवस्य धीमहि।',
  hindi: 'ॐ नमः शिवाय। आपका दिन मंगलमय हो।',
  english: 'Om namah shivaya. May peace and wisdom be with you.',
}
