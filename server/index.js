import express from 'express'
import cors from 'cors'
import multer from 'multer'
import path from 'path'
import { promises as fs } from 'fs'
import { fileURLToPath } from 'url'
import { login, requireAuth } from './auth.js'
import { handleAi } from './ai.js'
import {
  ASSET_DIR, assetDir, listAssets, listProjects, getWorkingConfig, getLiveConfig,
  saveDraft, publish, createProject,
} from './store.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const DIST = path.join(ROOT, 'dist')
const app = express()

app.use(cors())
app.use(express.json({ limit: '25mb' }))

// Serve project assets (backgrounds, fonts, logos, uploads).
app.use('/assets', express.static(ASSET_DIR, { maxAge: '1h' }))

// ---- auth ----
app.post('/api/login', (req, res) => {
  const result = login(req.body?.username, req.body?.password)
  if (!result) return res.status(401).json({ error: 'Invalid username or password.' })
  res.json(result)
})

// ---- projects / configs ----
app.get('/api/configs', async (_req, res) => res.json(await listProjects()))

app.get('/api/configs/:slug', requireAuth, async (req, res) => {
  const cfg = await getWorkingConfig(req.params.slug)
  if (!cfg) return res.status(404).json({ error: 'not found' })
  res.json(cfg)
})

app.put('/api/configs/:slug', requireAuth, async (req, res) => {
  res.json(await saveDraft(req.params.slug, req.body))
})

app.post('/api/configs/:slug/publish', requireAuth, async (req, res) => {
  res.json(await publish(req.params.slug))
})

app.post('/api/configs', requireAuth, async (req, res) => {
  const { slug, template } = req.body || {}
  if (!slug || !/^[a-z0-9-]+$/.test(slug)) return res.status(400).json({ error: 'slug must be lowercase letters, numbers, hyphens' })
  if (await getWorkingConfig(slug)) return res.status(409).json({ error: 'slug already exists' })
  const base = template ? await getWorkingConfig(template) : null
  const cfg = base
    ? { ...JSON.parse(JSON.stringify(base)), id: slug, slug, name: req.body.name || slug, published: false }
    : { schemaVersion: 1, id: slug, slug, name: req.body.name || slug, published: false, language: 'en',
        resultLogic: { type: 'score', scoreQuestions: [] }, analytics: { sheetWebAppUrl: '' },
        theme: { canvasWidth: 1080, canvasHeight: 1920, colors: {}, fonts: [] },
        banner: { enabled: false }, background: { type: 'color', color: '#111827' },
        timings: { transitionMs: 400, autoResetMs: 30000 }, questions: {}, flow: ['welcome', 'result'],
        screens: [
          { id: 'welcome', type: 'welcome', background: { type: 'color', color: '#111827' }, elements: [
            { id: 'title', type: 'text', text: 'New Quiz', x: 90, y: 800, w: 900, h: 200, z: 2, style: { fontFamily: 'sans-serif', fontWeight: 800, fontSize: 90, color: '#fff', textAlign: 'center' } },
            { id: 'cta', type: 'button', action: 'start', text: 'Start', x: 390, y: 1100, w: 300, h: 140, z: 3, style: { fontWeight: 700, fontSize: 44, color: '#111827', background: '#fff', borderRadius: 999, textAlign: 'center' } } ] },
          { id: 'result', type: 'result', background: { type: 'color', color: '#111827' }, elements: [
            { id: 'heading', type: 'text', text: 'Thanks!', x: 90, y: 800, w: 900, h: 200, z: 2, style: { fontWeight: 800, fontSize: 80, color: '#fff', textAlign: 'center' } },
            { id: 'reset', type: 'button', action: 'reset', text: 'Done', x: 390, y: 1100, w: 300, h: 140, z: 3, style: { fontWeight: 700, fontSize: 44, color: '#111827', background: '#fff', borderRadius: 999, textAlign: 'center' } } ] },
        ] }
  res.json(await createProject(slug, cfg))
})

// ---- public (published) config for the player ----
app.get('/api/public/:slug', async (req, res) => {
  const cfg = await getLiveConfig(req.params.slug)
  if (!cfg) return res.status(404).json({ error: 'not available' })
  res.json(cfg)
})

// ---- assets ----
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, _file, cb) => {
      const dir = assetDir(req.params.slug)
      await fs.mkdir(dir, { recursive: true })
      cb(null, dir)
    },
    filename: (_req, file, cb) => cb(null, file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')),
  }),
})
app.get('/api/assets/:slug', async (req, res) => res.json(await listAssets(req.params.slug)))
app.post('/api/assets/:slug', requireAuth, upload.single('file'), (req, res) => {
  res.json({ name: req.file.filename, url: `/assets/${req.params.slug}/${req.file.filename}` })
})

// ---- analytics proxy: forward the row to the project's Sheets Web App ----
app.post('/api/analytics/:slug', async (req, res) => {
  const cfg = (await getLiveConfig(req.params.slug)) || (await getWorkingConfig(req.params.slug))
  const url = cfg?.analytics?.sheetWebAppUrl
  if (!url) return res.json({ ok: false, skipped: 'no sheet url' })
  try {
    await fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(req.body) })
    res.json({ ok: true })
  } catch (err) {
    res.json({ ok: false, error: err.message })
  }
})

// ---- AI assistant ----
app.post('/api/ai', requireAuth, handleAi)

app.get('/api/health', (_req, res) => res.json({ ok: true }))

// ---- static frontend + SPA fallback (production) ----
app.use(express.static(DIST))
app.get('*', async (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/assets')) return next()
  try {
    res.sendFile(path.join(DIST, 'index.html'))
  } catch {
    res.status(404).send('Not built. Run `npm run build`.')
  }
})

const PORT = process.env.PORT || 8787
app.listen(PORT, () => console.log(`Quiz Wizard server on :${PORT}`))
