import { useEffect, useState, useCallback } from 'react'
import { api } from '../api.js'
import Login from './Login.jsx'
import Masthead from './Masthead.jsx'
import Editor from './Editor.jsx'
import './theme.css'

const AUTH_KEY = 'qw-auth'

export default function AdminApp() {
  const [auth, setAuth] = useState(() => { try { return JSON.parse(localStorage.getItem(AUTH_KEY) || 'null') } catch { return null } })
  const onLogin = (a) => { setAuth(a); localStorage.setItem(AUTH_KEY, JSON.stringify(a)) }
  const onLogout = () => { setAuth(null); localStorage.removeItem(AUTH_KEY) }
  if (!auth?.token) return <Login onLogin={onLogin} />
  return <AdminShell auth={auth} onLogout={onLogout} />
}

function AdminShell({ auth, onLogout }) {
  const [projects, setProjects] = useState([])
  const [slug, setSlug] = useState(null)
  const [config, setConfig] = useState(null)
  const [status, setStatus] = useState('')

  const refreshProjects = useCallback(async () => {
    const list = await api.listProjects().catch(() => [])
    setProjects(list)
    setSlug((cur) => cur || (list[0]?.slug ?? null))
  }, [])
  useEffect(() => { refreshProjects() }, [refreshProjects])

  useEffect(() => {
    if (!slug) return
    setConfig(null)
    api.getConfig(slug, auth.token).then(setConfig).catch(() => setStatus('Failed to load project'))
  }, [slug, auth.token])

  const flash = (msg) => { setStatus(msg); setTimeout(() => setStatus(''), 2500) }
  const save = async () => { await api.saveConfig(slug, config, auth.token); flash('Draft saved ✓') }
  const publish = async () => { await api.saveConfig(slug, config, auth.token); await api.publishConfig(slug, auth.token); await refreshProjects(); flash(`Published → /${slug}`) }
  const newProject = async () => {
    const name = prompt('Project name?'); if (!name) return
    const s = prompt('Slug (lowercase, e.g. "veld")?', name.toLowerCase().replace(/[^a-z0-9-]/g, '-')); if (!s) return
    const useTemplate = confirm('Start from a copy of the current project? (Cancel = blank quiz)')
    try { await api.createProject({ slug: s, name, template: useTemplate ? slug : null }, auth.token); await refreshProjects(); setSlug(s); flash('Project created ✓') }
    catch (e) { alert(e.message) }
  }

  return (
    <div className="k-app">
      <Masthead
        projects={projects} slug={slug} config={config}
        onPick={setSlug} onNew={newProject} onSave={save} onPublish={publish}
        status={status} user={auth.user} onLogout={onLogout}
      />
      {config
        ? <Editor key={slug} config={config} setConfig={setConfig} token={auth.token} slug={slug} />
        : <div className="k-empty">{slug ? 'Loading…' : 'Select or create a project.'}</div>}
    </div>
  )
}
