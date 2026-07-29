import { useEffect, useState } from 'react'
import { Routes, Route, Link, useParams } from 'react-router-dom'
import { api } from './api.js'
import FontLoader from './FontLoader.jsx'
import QuizPlayer from './engine/QuizPlayer.jsx'
import AdminApp from './admin/AdminApp.jsx'

function Landing() {
  const [projects, setProjects] = useState([])
  useEffect(() => { api.listProjects().then(setProjects).catch(() => setProjects([])) }, [])
  return (
    <div className="landing">
      <h1>Quiz Wizard</h1>
      <p className="muted">Modular kiosk quiz platform. Live quizzes:</p>
      <div className="landing-grid">
        {projects.map((p) => (
          <Link key={p.slug} className="landing-card" to={`/${p.slug}`}>
            <span className="landing-slug">/{p.slug}</span>
            <span className="landing-name">{p.name}</span>
            <span className={`badge ${p.published ? 'ok' : 'off'}`}>{p.published ? 'published' : 'draft'}</span>
          </Link>
        ))}
      </div>
      <Link className="admin-link" to="/admin">Open Admin →</Link>
    </div>
  )
}

function PublicPlay() {
  const { slug } = useParams()
  const [config, setConfig] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => {
    setConfig(null); setError('')
    api.getPublicConfig(slug).then(setConfig).catch(() => setError('This quiz is not available.'))
  }, [slug])
  if (error) return <div className="fullscreen-msg">{error}</div>
  if (!config) return <div className="fullscreen-msg">Loading…</div>
  return (
    <div className="play-root">
      <FontLoader fonts={config.theme?.fonts} id={config.slug} />
      <QuizPlayer config={config} />
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/admin/*" element={<AdminApp />} />
      <Route path="/:slug" element={<PublicPlay />} />
    </Routes>
  )
}
