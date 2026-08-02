import { useState } from 'react'
import { api } from '../../api.js'
import { makeImageElement } from '../elements.js'
import { Panel, Note, Chip } from '../ui.jsx'

const clone = (o) => JSON.parse(JSON.stringify(o))
const isImg = (n) => /\.(png|jpg|jpeg|gif|svg|webp)$/i.test(n)

// ASSETS — upload images/fonts; drop an image onto the current screen as a
// movable element, or set it as the full-screen background.
export default function AssetsPanel({ config, setConfig, slug, token, screen, addElement }) {
  const [assets, setAssets] = useState(null)
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const update = (fn) => setConfig((prev) => { const next = clone(prev); fn(next); return next })
  const load = () => api.listAssets(slug).then(setAssets).catch(() => setAssets([]))
  if (assets === null) load()

  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { await api.uploadAsset(slug, file, token); await load() } finally { setBusy(false); e.target.value = '' }
  }
  const addImageEl = (url) => { addElement(makeImageElement(url, config.theme?.canvasWidth, config.theme?.canvasHeight)); setMsg(`Added movable image to ${screen?.id} — select it on the canvas`) }
  const setAsBg = (url) => { update((n) => { const s = n.screens.find((x) => x.id === screen.id); if (s) s.background = { ...s.background, type: 'image', src: url } }); setMsg(`Set as ${screen?.id} background`) }

  return (
    <Panel title="Assets" sub={slug}>
      <label className="k-upload">{busy ? 'Uploading…' : '⬆ Upload image / font'}<input type="file" hidden onChange={upload} /></label>
      <div className="k-assets">
        {(assets || []).map((a) => (
          <div key={a.name} className="k-asset" title={a.name}>
            {isImg(a.name) ? <img src={a.url} alt="" /> : <span className="k-asset-file">{a.name.split('/').pop()}</span>}
            <Chip onClick={() => navigator.clipboard?.writeText(a.url)}>copy url</Chip>
            {isImg(a.name) && <Chip onClick={() => addImageEl(a.url)}>＋ element</Chip>}
            {isImg(a.name) && <Chip onClick={() => setAsBg(a.url)}>set as bg</Chip>}
          </div>
        ))}
      </div>
      {msg && <Note>{msg}</Note>}
      <Note>“＋ element” adds a draggable/resizable image to the current screen. “set as bg” makes it the full-screen background.</Note>
    </Panel>
  )
}
