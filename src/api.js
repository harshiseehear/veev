// Thin client for the backend API. Same-origin in production; Vite proxies
// /api and /assets to the Express server in dev.
const json = async (res) => {
  if (!res.ok) throw new Error((await res.text().catch(() => '')) || `HTTP ${res.status}`)
  return res.json()
}

const authHeaders = (token) => (token ? { Authorization: `Bearer ${token}` } : {})

export const api = {
  login: (username, password) =>
    fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username, password }) }).then(json),

  listProjects: () => fetch('/api/configs').then(json),
  getConfig: (slug, token) => fetch(`/api/configs/${slug}`, { headers: authHeaders(token) }).then(json),
  getPublicConfig: (slug) => fetch(`/api/public/${slug}`).then(json),

  saveConfig: (slug, config, token) =>
    fetch(`/api/configs/${slug}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(config) }).then(json),
  publishConfig: (slug, token) =>
    fetch(`/api/configs/${slug}/publish`, { method: 'POST', headers: authHeaders(token) }).then(json),
  createProject: (payload, token) =>
    fetch('/api/configs', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(payload) }).then(json),

  listAssets: (slug) => fetch(`/api/assets/${slug}`).then(json),
  uploadAsset: (slug, file, token) => {
    const fd = new FormData()
    fd.append('file', file)
    return fetch(`/api/assets/${slug}`, { method: 'POST', headers: authHeaders(token), body: fd }).then(json)
  },

  sendAnalytics: (slug, row) =>
    fetch(`/api/analytics/${slug}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(row) }).catch(() => {}),

  ai: (payload, token) =>
    fetch('/api/ai', { method: 'POST', headers: { 'Content-Type': 'application/json', ...authHeaders(token) }, body: JSON.stringify(payload) }).then(json),
}

export const resolveAsset = (src) => src || ''
