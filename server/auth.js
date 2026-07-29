import crypto from 'crypto'

// Simple credential + bearer-token auth for the admin UI. Credentials can be
// overridden via the ADMIN_USERS env var (JSON: {"user":"pass"}). This is
// gate-keeping for a kiosk admin, not bank-grade security.
const defaultUsers = { hvrc: 'fullmetalbitch', michelle: 'mawg' }

let USERS = defaultUsers
try {
  if (process.env.ADMIN_USERS) USERS = JSON.parse(process.env.ADMIN_USERS)
} catch {
  /* keep defaults */
}

const tokens = new Map() // token -> { user, at }

export const login = (username, password) => {
  const u = (username || '').trim().toLowerCase()
  if (USERS[u] && USERS[u] === password) {
    const token = crypto.randomBytes(24).toString('hex')
    tokens.set(token, { user: u, at: Date.now() })
    return { token, user: u }
  }
  return null
}

export const userForToken = (token) => tokens.get(token)?.user || null

export const requireAuth = (req, res, next) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const user = userForToken(token)
  if (!user) return res.status(401).json({ error: 'unauthorized' })
  req.user = user
  next()
}
