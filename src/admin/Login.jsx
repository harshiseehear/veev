import { useState } from 'react'
import { api } from '../api.js'

export default function Login({ onLogin }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    setBusy(true); setError('')
    try { onLogin(await api.login(username, password)) }
    catch { setError('Invalid username or password.') }
    finally { setBusy(false) }
  }

  return (
    <div className="k-login">
      <form className="k-login-card" onSubmit={submit}>
        <div className="k-login-head">
          <h1>KIOSK</h1>
          <p>Editor · sign in</p>
        </div>
        <div className="k-login-body">
          <label><span>Username</span><input value={username} onChange={(e) => setUsername(e.target.value)} autoFocus /></label>
          <label><span>Password</span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></label>
          {error && <div className="k-login-err">{error}</div>}
          <button className="k-btn primary wide" type="submit" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </div>
      </form>
    </div>
  )
}
