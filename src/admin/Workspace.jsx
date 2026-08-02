import { Stage } from '../engine/renderer.jsx'
import QuizPlayer from '../engine/QuizPlayer.jsx'

// Center workspace — a technical context strip (breadcrumb) over the drafting-grid
// canvas. In preview it swaps the static Stage for the live QuizPlayer.
export default function Workspace({ edit, config }) {
  const { screen, previewSetId, preview } = edit
  return (
    <section className="k-workspace">
      <div className="k-context">
        <span className="k-crumb"><b>{config.name || config.slug}</b><span className="sep">/</span>{screen?.id}</span>
        {config.sets && <span className="k-crumb">SET<span className="sep">·</span><b>{previewSetId}</b></span>}
        <span className="k-crumb">{screen?.type}</span>
        <span style={{ flex: 1 }} />
        <button className={`k-chip ${preview ? 'on' : ''}`} onClick={() => edit.setPreview((p) => !p)}>{preview ? '■ Stop preview' : '▶ Preview'}</button>
      </div>
      <div className={`k-canvas ${preview ? 'preview' : ''}`}>
        {preview
          ? <QuizPlayer key={`prev-${screen?.id}`} config={config} preview />
          : <Stage key={`${previewSetId || 'base'}-${screen?.id}`} config={config} screen={screen} ctx={edit.ctx}
              editable selectedIds={edit.selectedIds} guides={edit.guides}
              onPointerDown={edit.onPointerDown} onBackgroundClick={() => edit.setSelectedIds([])} />}
      </div>
    </section>
  )
}
