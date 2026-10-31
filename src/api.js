const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
const TOKEN_KEY = 'bk_voice_token'

export const getToken = () => localStorage.getItem(TOKEN_KEY)
export const setToken = (t) => (t ? localStorage.setItem(TOKEN_KEY, t) : localStorage.removeItem(TOKEN_KEY))

export class ApiError extends Error {
  constructor(message, status, code) {
    super(message)
    this.status = status
    this.code = code
  }
}

const parse = async (res) => {
  const data = await res.json().catch(() => ({}))
  if (!res.ok || data.success === false) {
    if (res.status === 401 && getToken()) {
      setToken(null)
      window.dispatchEvent(new Event('bk:logout'))
    }
    throw new ApiError(data.message || `Request failed (${res.status})`, res.status, data.code)
  }
  return data
}

const request = async (method, path, body) => {
  let res
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    })
  } catch {
    throw new ApiError('Cannot reach the server. Check your connection and that the backend is running.', 0, 'NETWORK')
  }
  return parse(res)
}

const qs = (params) => {
  const p = new URLSearchParams()
  Object.entries(params || {}).forEach(([k, v]) => v !== '' && v != null && p.set(k, v))
  const s = p.toString()
  return s ? `?${s}` : ''
}

const V = '/admin/voice'
export const api = {
  login: (email, password) => request('POST', '/auth/login', { email, password }),
  me: () => request('GET', '/auth/me'),

  voices: () => request('GET', `${V}/voices`),
  updateVoice: (voiceId, body) => request('PATCH', `${V}/voices/${voiceId}`, body),
  testVoice: async (body) => {
    let res
    try {
      res = await fetch(`${BASE}${V}/voices/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(body),
      })
    } catch {
      throw new ApiError('Cannot reach the server.', 0, 'NETWORK')
    }
    if (!res.ok) await parse(res)
    return URL.createObjectURL(await res.blob())
  },

  generate: (body) => request('POST', `${V}/generate`, body),
  regenerate: (id, body = {}) => request('POST', `${V}/${id}/regenerate`, body),
  save: (id) => request('POST', `${V}/${id}/save`),
  remove: (id) => request('DELETE', `${V}/${id}`),
  history: (params) => request('GET', `${V}/history${qs(params)}`),
  usage: () => request('GET', `${V}/usage`),

  kandas: () => request('GET', '/admin/scripture/kandas'),
  sargas: (kandaId) => request('GET', `/admin/scripture/kandas/${kandaId}/sargas`),
  verses: (kandaId, params) => request('GET', `/admin/scripture/kandas/${kandaId}/verses${qs(params)}`),

  bulkStart: (body) => request('POST', `${V}/bulk-generate`, body),
  bulkLatest: () => request('GET', `${V}/bulk/latest`),
  bulkStatus: (id) => request('GET', `${V}/bulk/${id}`),
  bulkRetry: (id) => request('POST', `${V}/bulk/${id}/retry`),
}
