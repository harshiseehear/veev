import { glyphFor, ADDABLE, ELEMENTS } from './elements.js'

// Left rail — the document navigator: the screen flow, the set switcher (trivia),
// and the layers of the current screen. Screens read as numbered "No." rows,
// echoing the roadbook / archive-card code identifiers.
export default function Navigator({ edit, config }) {
  const screens = config.screens || []
  const layers = [...(edit.screen?.elements || [])].sort((a, b) => (b.z || 0) - (a.z || 0))

  return (
    <>
      <Sec label="Screens" count={screens.length}>
        {screens.map((s, i) => (
          <button key={s.id} className={`k-screen ${edit.screenId === s.id ? 'on' : ''}`} onClick={() => edit.selectScreen(s.id)}>
            <span className="k-screen-no">{String(i + 1).padStart(2, '0')}</span>
            <span className="k-screen-name">{s.id}</span>
            <span className="k-screen-tag">{s.type || 'screen'}</span>
          </button>
        ))}
      </Sec>

      {config.sets && (
        <Sec label="Sets" count={config.sets.length}>
          <div className="k-chips">
            {config.sets.map((s) => (
              <button key={s.id} className={`k-setchip ${edit.previewSetId === s.id ? 'on' : ''}`} onClick={() => edit.setPreviewSetId(s.id)}>{s.id}</button>
            ))}
          </div>
        </Sec>
      )}

      <Sec label="Layers" count={layers.length}>
        {layers.map((el) => (
          <button key={el.id} className={`k-layer ${edit.selectedId === el.id ? 'on' : ''}`} onClick={() => edit.select(el.id)}>
            <span className="k-layer-glyph">{glyphFor(el.type)}</span>
            <span className="k-layer-id">{el.id}</span>
            <span className="k-eye" onClick={(e) => { e.stopPropagation(); edit.select(el.id); edit.patchSel({ hidden: !el.hidden }) }}>{el.hidden ? '⊘' : '◉'}</span>
          </button>
        ))}
        <div className="k-addrow">
          {ADDABLE.map((t) => <button key={t} className="k-chip" onClick={() => edit.addNewElement(t)}>+ {ELEMENTS[t].label}</button>)}
        </div>
      </Sec>
    </>
  )
}

function Sec({ label, count, children }) {
  return (
    <div className="k-sec">
      <div className="k-sec-head"><span className="k-label">{label}</span><span className="k-count">({count})</span></div>
      <div className="k-sec-body">{children}</div>
    </div>
  )
}
