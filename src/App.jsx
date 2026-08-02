import { useEffect, useState } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { api } from './api.js'
import FontLoader from './FontLoader.jsx'
import QuizPlayer from './engine/QuizPlayer.jsx'
import AdminApp from './admin/AdminApp.jsx'

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
      {/* Root sends you to the editor; unauthenticated → login, then /control. */}
      <Route path="/" element={<Navigate to="/control" replace />} />
      <Route path="/control/*" element={<AdminApp />} />
      {/* Public quiz players — /veev, /uber, … — unchanged. */}
      <Route path="/:slug" element={<PublicPlay />} />
    </Routes>
  )
}
