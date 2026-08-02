import { useState } from 'react'
import DesignPanel from './panels/DesignPanel.jsx'
import ContentPanel from './panels/ContentPanel.jsx'
import LogicPanel from './panels/LogicPanel.jsx'
import AssetsPanel from './panels/AssetsPanel.jsx'
import ProjectPanel from './panels/ProjectPanel.jsx'
import AiPanel from './panels/AiPanel.jsx'

// Right inspector — icon tab row (render-settings style) routing to one panel.
// Adding a tab is a single entry here; panels are self-contained.
const TABS = [
  { id: 'design',  glyph: '◧', name: 'DESIGN' },
  { id: 'content', glyph: '☰', name: 'CONTENT' },
  { id: 'assets',  glyph: '▦', name: 'ASSETS' },
  { id: 'logic',   glyph: '⚙', name: 'LOGIC' },
  { id: 'project', glyph: '◉', name: 'PROJECT' },
  { id: 'ai',      glyph: '✦', name: 'AI' },
]

export default function Inspector({ edit, config, setConfig, slug, token, width }) {
  const [tab, setTab] = useState('design')
  const common = { config, setConfig, slug, token }
  return (
    <aside className="k-inspector" style={{ width }}>
      <div className="k-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`k-tab ${tab === t.id ? 'on' : ''}`} title={t.name} onClick={() => setTab(t.id)}>
            <span className="k-tab-glyph">{t.glyph}</span>
            <span className="k-tab-name">{t.name}</span>
          </button>
        ))}
      </div>
      <div className="k-insp-body">
        {tab === 'design' && <DesignPanel edit={edit} config={config} />}
        {tab === 'content' && <ContentPanel {...common} previewSetId={edit.previewSetId} setPreviewSetId={edit.setPreviewSetId} activeQid={edit.activeQid} />}
        {tab === 'assets' && <AssetsPanel {...common} screen={edit.screen} addElement={edit.addElement} />}
        {tab === 'logic' && <LogicPanel {...common} />}
        {tab === 'project' && <ProjectPanel {...common} screen={edit.screen} />}
        {tab === 'ai' && <AiPanel {...common} />}
      </div>
    </aside>
  )
}
