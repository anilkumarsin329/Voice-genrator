/** Initial voice settings once the /voices catalog has loaded. */
export const defaultSettings = (catalog, language = 'sanskrit') => ({
  language,
  voiceId: catalog.voices?.[0]?.voiceId || '',
  style: '',
  modelId: catalog.models?.[0]?.id || 'eleven_multilingual_v2',
  speed: 1,
  stability: 0.5,
  similarityBoost: 0.75,
})
