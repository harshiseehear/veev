import { useState } from 'react'
import { Panel, Note, Btn } from '../ui.jsx'

// LOGIC — the result engine as raw JSON (recommendation table or trivia scoring).
// Power-user surface; validated on apply.
export default function LogicPanel({ config, setConfig }) {
  const [text, setText] = useState(JSON.stringify(config.resultLogic || {}, null, 2))
  const [msg, setMsg] = useState('')
  const apply = () => {
    try { const parsed = JSON.parse(text); setConfig((prev) => ({ ...prev, resultLogic: parsed })); setMsg('Applied ✓') }
    catch (e) { setMsg('Invalid JSON: ' + e.message) }
  }
  return (
    <Panel title="Result logic" sub={config.resultLogic?.type} tone="ink">
      <Note>Recommendation quizzes map answers → a device/track → a flavour table. Trivia quizzes score correct answers.</Note>
      <textarea className="k-json" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      <Btn variant="primary wide" onClick={apply}>Apply logic</Btn>
      {msg && <Note>{msg}</Note>}
    </Panel>
  )
}
