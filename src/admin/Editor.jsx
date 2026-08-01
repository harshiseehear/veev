import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage } from '../engine/renderer.jsx'
import QuizPlayer from '../engine/QuizPlayer.jsx'
import FontLoader from '../FontLoader.jsx'
import { resolveAsset } from '../api.js'
import { getQuestion } from '../engine/quizLogic.js'
import Inspector from './Inspector.jsx'
import Resizer from './Resizer.jsx'

export default function Editor({ config, setConfig, token, slug, onSave, onPublish, status }) {
  const [screenId, setScreenId] = useState(config.screens?.[0]?.id)
  const [selectedId, setSelectedId] = useState(null)
  const [preview, setPreview] = useState(false)
  const [guides, setGuides] = useState({ v: false, h: false })
  const [inspW, setInspW] = useState(() => Number(localStorage.getItem('qw-inspw')) || 340)
  useEffect(() => { localStorage.setItem('qw-inspw', String(inspW)) }, [inspW])
  const dragRef = useRef(null)

  const [previewSetId, setPreviewSetId] = useState(config.sets?.[0]?.id)
  const screen = useMemo(() => config.screens?.find((s) => s.id === screenId) || config.screens?.[0], [config, screenId])
  const cw = config.theme?.canvasWidth || 1080
  const ch = config.theme?.canvasHeight || 1920

  // --- immutable config mutators ---
  const patchElement = (sid, eid, patch) =>
    setConfig((prev) => ({
      ...prev,
      screens: prev.screens.map((s) => s.id !== sid ? s : {
        ...s, elements: s.elements.map((el) => el.id === eid ? { ...el, ...patch } : el),
      }),
    }))
  const patchElementStyle = (sid, eid, stylePatch) =>
    setConfig((prev) => ({
      ...prev,
      screens: prev.screens.map((s) => s.id !== sid ? s : {
        ...s, elements: s.elements.map((el) => el.id === eid ? { ...el, style: { ...el.style, ...stylePatch } } : el),
      }),
    }))
  const removeElement = (sid, eid) =>
    setConfig((prev) => ({ ...prev, screens: prev.screens.map((s) => s.id !== sid ? s : { ...s, elements: s.elements.filter((el) => el.id !== eid) }) }))
  const addElement = (el) =>
    setConfig((prev) => ({ ...prev, screens: prev.screens.map((s) => s.id !== screenId ? s : { ...s, elements: [...s.elements, el] }) }))
  // copy an element's styling (style + option styling) to the same-id element on
  // chosen screens (targetIds); if targetIds omitted, all other screens.
  const copyStyleTo = (elId, targetIds) => {
    const src = screen.elements.find((e) => e.id === elId)
    if (!src) return 0
    const bits = {}
    ;['style', 'optionStyle', 'selectedStyle', 'gap', 'showLetters', 'justify'].forEach((k) => { if (src[k] !== undefined) bits[k] = src[k] })
    const targets = config.screens
      .filter((s) => s.id !== screen.id && (!targetIds || targetIds.includes(s.id)) && s.elements.some((el) => el.id === elId && el.type === src.type))
      .map((s) => s.id)
    const idset = new Set(targets)
    setConfig((prev) => ({
      ...prev,
      screens: prev.screens.map((s) => idset.has(s.id) ? ({
        ...s, elements: s.elements.map((el) => (el.id === elId && el.type === src.type) ? { ...el, ...JSON.parse(JSON.stringify(bits)) } : el),
      }) : s),
    }))
    return targets.length
  }
  // screens (other than this one) that have a matching element to copy style into
  const copyTargetsFor = (elId) => {
    const src = screen.elements.find((e) => e.id === elId)
    if (!src) return []
    return config.screens.filter((s) => s.id !== screen.id && s.elements.some((el) => el.id === elId && el.type === src.type)).map((s) => s.id)
  }
  const reorder = (eid, dir) =>
    setConfig((prev) => ({ ...prev, screens: prev.screens.map((s) => {
      if (s.id !== screenId) return s
      const maxZ = Math.max(1, ...s.elements.map((e) => e.z || 1))
      const minZ = Math.min(...s.elements.map((e) => e.z || 1))
      return { ...s, elements: s.elements.map((e) => e.id === eid ? { ...e, z: dir === 'front' ? maxZ + 1 : minZ - 1 } : e) }
    }) }))

  // --- drag / resize (mounted once, reads latest via dragRef) ---
  useEffect(() => {
    const SNAP = 12 // canvas px within which an element's centre snaps to the canvas centre
    const move = (e) => {
      const d = dragRef.current
      if (!d) return
      const dx = (e.clientX - d.sx) / d.scale
      const dy = (e.clientY - d.sy) / d.scale
      if (d.handle === 'move') {
        let nx = Math.round(d.ox + dx)
        let ny = Math.round(d.oy + dy)
        let gv = false
        let gh = false
        if (Math.abs(nx + d.ow / 2 - d.cw / 2) <= SNAP) { nx = Math.round(d.cw / 2 - d.ow / 2); gv = true }
        if (Math.abs(ny + d.oh / 2 - d.ch / 2) <= SNAP) { ny = Math.round(d.ch / 2 - d.oh / 2); gh = true }
        patchElement(d.sid, d.eid, { x: nx, y: ny })
        setGuides({ v: gv, h: gh })
      } else {
        patchElement(d.sid, d.eid, { w: Math.max(20, Math.round(d.ow + dx)), h: Math.max(20, Math.round(d.oh + dy)) })
      }
    }
    const up = () => { dragRef.current = null; setGuides({ v: false, h: false }) }
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerDown = (e, eid, handle) => {
    e.preventDefault(); e.stopPropagation()
    setSelectedId(eid)
    const el = screen.elements.find((x) => x.id === eid)
    if (!el) return
    const wrap = document.querySelector('.qw-stage-wrap')
    const scale = parseFloat(wrap?.dataset.scale || '1') || 1
    dragRef.current = { sid: screen.id, eid, handle, scale, sx: e.clientX, sy: e.clientY, ox: el.x, oy: el.y, ow: el.w, oh: el.h, cw, ch }
  }

  // arrow-key nudge
  useEffect(() => {
    const onKey = (e) => {
      if (!selectedId || preview) return
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      const step = e.shiftKey ? 10 : 1
      const map = { ArrowLeft: ['x', -step], ArrowRight: ['x', step], ArrowUp: ['y', -step], ArrowDown: ['y', step] }
      const m = map[e.key]
      if (!m) return
      e.preventDefault()
      const el = screen.elements.find((x) => x.id === selectedId)
      if (el) patchElement(screen.id, selectedId, { [m[0]]: (el[m[0]] || 0) + m[1] })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedId, screen, preview]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedEl = screen?.elements.find((e) => e.id === selectedId) || null

  // preview ctx (static, unselected)
  const sampleResult = () => {
    const rl = config.resultLogic || {}
    if (rl.type === 'score') return { type: 'score', score: Math.min(3, (rl.scoreQuestions || []).length), total: (rl.scoreQuestions || []).length }
    const track = rl.fallback?.track || Object.keys(rl.tracks || {})[0]
    return { type: 'recommendation', track, items: rl.fallback?.items || ['Sample 1', 'Sample 2', 'Sample 3'] }
  }
  const ctx = {
    config,
    resolve: resolveAsset,
    question: screen?.type === 'question' ? getQuestion(config, screen.questionId || screen.id, previewSetId) : null,
    getQuestion: (qk) => getQuestion(config, qk, previewSetId),
    answers: {},
    result: screen?.type === 'result' ? sampleResult() : null,
    timerActive: false,
    autoResetMs: config.timings?.autoResetMs,
  }

  return (
    <div className="editor">
      <FontLoader fonts={config.theme?.fonts} id={`admin-${config.slug}`} />
      <div className="editor-topbar">
        <div className="screen-tabs">
          {config.screens?.map((s) => (
            <button key={s.id} className={`screen-tab ${screenId === s.id ? 'active' : ''}`} onClick={() => { setScreenId(s.id); setSelectedId(null) }}>
              {s.id}
            </button>
          ))}
        </div>
        <div className="topbar-actions">
          {config.sets && (
            <div className="set-tabs" title="Which set the canvas previews">
              {config.sets.map((s) => (
                <button key={s.id} className={`set-tab ${previewSetId === s.id ? 'active' : ''}`} onClick={() => setPreviewSetId(s.id)}>{s.id}</button>
              ))}
            </div>
          )}
          {status && <span className="topbar-status">{status}</span>}
          <button className={`btn ghost ${preview ? 'on' : ''}`} onClick={() => setPreview((p) => !p)}>{preview ? 'Editing' : 'Preview'}</button>
          <button className="btn" onClick={onSave}>Save draft</button>
          <button className="btn primary" onClick={onPublish}>Publish → /{slug}</button>
        </div>
      </div>
      <div className="editor-body">
        <div className="canvas-area">
          {preview
            ? <QuizPlayer key={`prev-${screenId}`} config={config} preview />
            : <Stage config={config} screen={screen} ctx={ctx} editable selectedId={selectedId} guides={guides}
                onPointerDown={onPointerDown} onBackgroundClick={() => setSelectedId(null)} />}
        </div>
        <Resizer onDelta={(dx) => setInspW((w) => Math.max(280, Math.min(680, w - dx)))} />
        <Inspector
          width={inspW}
          config={config} setConfig={setConfig} token={token} slug={slug}
          screen={screen} selectedEl={selectedEl}
          patchElement={(patch) => patchElement(screen.id, selectedId, patch)}
          patchElementStyle={(patch) => patchElementStyle(screen.id, selectedId, patch)}
          removeElement={() => { removeElement(screen.id, selectedId); setSelectedId(null) }}
          addElement={addElement}
          reorder={reorder}
          selectElement={setSelectedId}
          copyStyle={copyStyleTo}
          copyTargetsFor={copyTargetsFor}
        />
      </div>
    </div>
  )
}
