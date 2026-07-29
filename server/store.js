import { promises as fs } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DATA_DIR = path.join(__dirname, 'data')
export const LIVE_DIR = path.join(DATA_DIR, 'configs') // published / live
export const DRAFT_DIR = path.join(DATA_DIR, 'drafts') // admin working copies
export const ASSET_DIR = path.join(DATA_DIR, 'assets')

const ensure = async (dir) => { await fs.mkdir(dir, { recursive: true }) }
const readJson = async (file) => JSON.parse(await fs.readFile(file, 'utf8'))
const writeJson = async (file, obj) => { await ensure(path.dirname(file)); await fs.writeFile(file, JSON.stringify(obj, null, 2)) }

const liveFile = (slug) => path.join(LIVE_DIR, `${slug}.json`)
const draftFile = (slug) => path.join(DRAFT_DIR, `${slug}.json`)
const exists = async (f) => !!(await fs.stat(f).catch(() => null))

export const listSlugs = async () => {
  await ensure(LIVE_DIR)
  const files = await fs.readdir(LIVE_DIR)
  return files.filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''))
}

export const listProjects = async () => {
  const slugs = await listSlugs()
  const out = []
  for (const slug of slugs) {
    const live = await readJson(liveFile(slug)).catch(() => null)
    if (live) out.push({ slug, name: live.name || slug, published: live.published !== false, type: live.resultLogic?.type })
  }
  return out
}

// Admin view: draft if it exists, else the live config.
export const getWorkingConfig = async (slug) => {
  if (await exists(draftFile(slug))) return readJson(draftFile(slug))
  if (await exists(liveFile(slug))) return readJson(liveFile(slug))
  return null
}

export const getLiveConfig = async (slug) => {
  if (!(await exists(liveFile(slug)))) return null
  const cfg = await readJson(liveFile(slug))
  return cfg.published === false ? null : cfg
}

export const saveDraft = async (slug, config) => {
  config.slug = slug
  await writeJson(draftFile(slug), config)
  return config
}

export const publish = async (slug) => {
  const draft = (await exists(draftFile(slug))) ? await readJson(draftFile(slug)) : await readJson(liveFile(slug))
  draft.slug = slug
  draft.published = true
  await writeJson(liveFile(slug), draft)
  await writeJson(draftFile(slug), draft)
  return draft
}

export const createProject = async (slug, config) => {
  config.slug = slug
  config.published = config.published ?? false
  await writeJson(liveFile(slug), config)
  await writeJson(draftFile(slug), config)
  await ensure(path.join(ASSET_DIR, slug, 'fonts'))
  return config
}

export const assetDir = (slug) => path.join(ASSET_DIR, slug)
export const listAssets = async (slug) => {
  const dir = assetDir(slug)
  await ensure(dir)
  const walk = async (rel) => {
    const abs = path.join(dir, rel)
    const entries = await fs.readdir(abs, { withFileTypes: true })
    let files = []
    for (const e of entries) {
      const r = rel ? `${rel}/${e.name}` : e.name
      if (e.isDirectory()) files = files.concat(await walk(r))
      else files.push({ name: r, url: `/assets/${slug}/${r}` })
    }
    return files
  }
  return walk('')
}
