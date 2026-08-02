import { useEffect, useState } from 'react'
import FontLoader from '../FontLoader.jsx'
import Resizer from './Resizer.jsx'
import Navigator from './Navigator.jsx'
import Workspace from './Workspace.jsx'
import Inspector from './Inspector.jsx'
import { useEditor } from './useEditor.js'

// Composes the three editor regions (navigator · workspace · inspector) around the
// useEditor brain. Kept thin on purpose — all logic lives in the hook and panels.
export default function Editor({ config, setConfig, token, slug }) {
  const edit = useEditor({ config, setConfig, slug })
  const [railW, setRailW] = useState(() => Number(localStorage.getItem('qw-railw')) || 244)
  const [inspW, setInspW] = useState(() => Number(localStorage.getItem('qw-inspw')) || 340)
  useEffect(() => { localStorage.setItem('qw-railw', String(railW)) }, [railW])
  useEffect(() => { localStorage.setItem('qw-inspw', String(inspW)) }, [inspW])

  return (
    <div className="k-body">
      <FontLoader fonts={config.theme?.fonts} id={`admin-${config.slug}`} />
      <aside className="k-rail" style={{ width: railW }}><Navigator edit={edit} config={config} /></aside>
      <Resizer onDelta={(dx) => setRailW((w) => Math.max(200, Math.min(420, w + dx)))} />
      <Workspace edit={edit} config={config} />
      <Resizer onDelta={(dx) => setInspW((w) => Math.max(300, Math.min(680, w - dx)))} />
      <Inspector edit={edit} config={config} setConfig={setConfig} slug={slug} token={token} width={inspW} />
    </div>
  )
}
