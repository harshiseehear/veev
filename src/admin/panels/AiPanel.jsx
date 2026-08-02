import { useState } from 'react'
import { api } from '../../api.js'
import { Panel, Note, Btn } from '../ui.jsx'

// AI — describe a change or attach a brief; the model edits THIS project's config.
export default function AiPanel({ config, setConfig, slug, token }) {
  const [prompt, setPrompt] = useState('')
  const [docText, setDocText] = useState('')
  const [docName, setDocName] = useState('')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState([])

  const onFile = async (e) => { const f = e.target.files?.[0]; if (!f) return; setDocName(f.name); setDocText(await f.text()) }
  const send = async () => {
    setBusy(true)
    try {
      const res = await api.ai({ slug, name: config.name, prompt, docText, config }, token)
      if (res.ok && res.config) { setConfig(res.config); setLog((l) => [{ role: 'ai', text: `✓ ${res.message} (${res.model || 'model'})` }, { role: 'you', text: prompt || docName }, ...l]); setPrompt('') }
      else setLog((l) => [{ role: 'err', text: res.message || 'No changes.' }, ...l])
    } catch (e) { setLog((l) => [{ role: 'err', text: e.message }, ...l]) }
    finally { setBusy(false) }
  }

  return (
    <Panel title="AI assistant" sub={config.name} tone="ink">
      <Note>Describe a change, or attach a client brief (.txt/.md/.csv). The model edits <b>this</b> project's config; review, then Save/Publish.</Note>
      <textarea className="k-json" style={{ minHeight: 110 }} placeholder="e.g. Make all question titles 10% bigger and move the CTA up 60px" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <label className="k-upload">{docName || '📎 Attach brief'}<input type="file" hidden accept=".txt,.md,.csv,.json" onChange={onFile} /></label>
      <Btn variant="primary wide" disabled={busy} onClick={send}>{busy ? 'Thinking…' : 'Ask AI to edit'}</Btn>
      <div className="k-ai-log">{log.map((m, i) => <div key={i} className={`k-ai-msg ${m.role}`}>{m.text}</div>)}</div>
    </Panel>
  )
}
