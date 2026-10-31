import { useState } from 'react'
import { useAuth } from '../context/hooks'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setError('')
    try {
      await login(email, password)
    } catch (err) {
      setError(err.message)
      setBusy(false)
    }
  }

  return (
    <div className="login-wrap">
      <form className="card login-card" onSubmit={submit}>
        <div className="brand">
          <div className="brand-mark" style={{ width: 52, height: 52, fontSize: 30 }}>ॐ</div>
          <div className="brand-name" style={{ fontSize: 26 }}>Swarakosh</div>
          <div className="brand-sub">Voice Studio · Admin</div>
        </div>
        <div className="mt" />
        {error && <div className="alert err" role="alert">{error}</div>}
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" className="input" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label htmlFor="pw">Password</label>
          <input id="pw" className="input" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn primary block" disabled={busy}>
          {busy && <span className="spinner" />} Sign in
        </button>
        <p className="faint mt" style={{ textAlign: 'center', fontSize: 12.5 }}>Use your Brahmakosh admin account.</p>
      </form>
    </div>
  )
}
