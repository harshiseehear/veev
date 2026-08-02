import { useEffect, useMemo, useRef, useState } from 'react'
import { resolveAsset } from '../api.js'
import { getQuestion } from '../engine/quizLogic.js'
import { makeElement } from './elements.js'

// The editor's brain: selection, per-set scoping, immutable config mutations,
// drag/resize, keyboard nudge, group align, and the style clipboard. Pure state
// + callbacks — the layout components (rail, workspace, inspector) just render it.
export function useEditor({ config, setConfig, slug }) {
  const [screenId, setScreenId] = useState(config.screens?.[0]?.id)
  const [selectedIds, setSelectedIds] = useState([])
  const [previewSetId, setPreviewSetId] = useState(config.sets?.[0]?.id)
  const [preview, setPreview] = useState(false)
  const [guides, setGuides] = useState({ v: false, h: false })
  const [styleClip, setStyleClip] = useState(() => { try { return JSON.parse(localStorage.getItem('qw-styleclip') || 'null') } catch { return null } })
  const dragRef = useRef(null)
  const liveRef = useRef({})

  const selectedId = selectedIds.length === 1 ? selectedIds[0] : null
  const screen = useMemo(() => config.screens?.find((s) => s.id === screenId) || config.screens?.[0], [config, screenId])
  const cw = config.theme?.canvasWidth || 1080
  const ch = config.theme?.canvasHeight || 1920

  const selectScreen = (id) => { setScreenId(id); setSelectedIds([]) }
  const select = (id) => setSelectedIds(id ? [id] : [])

  // --- immutable config mutators ---
  const patchElement = (sid, eid, patch) =>
    setConfig((prev) => ({ ...prev, screens: prev.screens.map((s) => s.id !== sid ? s : { ...s, elements: s.elements.map((el) => el.id === eid ? { ...el, ...patch } : el) }) }))
  const patchElementStyle = (sid, eid, stylePatch) =>
    setConfig((prev) => ({ ...prev, screens: prev.screens.map((s) => s.id !== sid ? s : { ...s, elements: s.elements.map((el) => el.id === eid ? { ...el, style: { ...el.style, ...stylePatch } } : el) }) }))
  const removeElementRaw = (sid, eid) =>
    setConfig((prev) => ({ ...prev, screens: prev.screens.map((s) => s.id !== sid ? s : { ...s, elements: s.elements.filter((el) => el.id !== eid) }) }))
  const addElement = (el) =>
    setConfig((prev) => ({ ...prev, screens: prev.screens.map((s) => s.id !== screenId ? s : { ...s, elements: [...s.elements, el] }) }))
  const reorder = (eid, dir) =>
    setConfig((prev) => ({ ...prev, screens: prev.screens.map((s) => {
      if (s.id !== screenId) return s
      const maxZ = Math.max(1, ...s.elements.map((e) => e.z || 1))
      const minZ = Math.min(...s.elements.map((e) => e.z || 1))
      return { ...s, elements: s.elements.map((e) => e.id === eid ? { ...e, z: dir === 'front' ? maxZ + 1 : minZ - 1 } : e) }
    }) }))

  // --- per-set scoping: on a question page of a set-based quiz, edits target the
  // active set's override for the element; the inspector shows effective values. ---
  const activeQid = screen?.questionId || screen?.id
  const isSetScope = !!config.sets && screen?.type === 'question'
  const selectedEl = screen?.elements.find((e) => e.id === selectedId) || null
  const activeOverride = isSetScope ? (config.sets.find((s) => s.id === previewSetId)?.questions?.[activeQid]?.overrides?.[selectedId] || {}) : {}
  const effectiveEl = selectedEl && isSetScope
    ? { ...selectedEl, ...activeOverride,
        style: { ...(selectedEl.style || {}), ...(activeOverride.style || {}) },
        optionStyle: { ...(selectedEl.optionStyle || {}), ...(activeOverride.optionStyle || {}) },
        selectedStyle: { ...(selectedEl.selectedStyle || {}), ...(activeOverride.selectedStyle || {}) } }
    : selectedEl

  const writeOverride = (elId, patch) => setConfig((prev) => {
    const next = JSON.parse(JSON.stringify(prev))
    const q = next.sets.find((s) => s.id === previewSetId)?.questions?.[activeQid]
    if (!q) return prev
    q.overrides = q.overrides || {}; q.overrides[elId] = { ...(q.overrides[elId] || {}), ...patch }
    return next
  })
  const setOverride = (elId, kind, patch) => setConfig((prev) => {
    const next = JSON.parse(JSON.stringify(prev))
    const q = next.sets.find((s) => s.id === previewSetId)?.questions?.[activeQid]
    if (!q) return prev
    q.overrides = q.overrides || {}; q.overrides[elId] = q.overrides[elId] || {}
    q.overrides[elId][kind] = { ...(q.overrides[elId][kind] || {}), ...patch }
    return next
  })

  // scope-aware element edit callbacks used by the inspector
  const patchSel = (patch) => isSetScope ? writeOverride(selectedId, patch) : patchElement(screen.id, selectedId, patch)
  const patchSelStyle = (patch) => isSetScope ? setOverride(selectedId, 'style', patch) : patchElementStyle(screen.id, selectedId, patch)
  const patchSelOptionStyle = (patch) => isSetScope
    ? setOverride(selectedId, 'optionStyle', patch)
    : patchElement(screen.id, selectedId, { optionStyle: { ...(selectedEl?.optionStyle || {}), ...patch } })
  const removeSelected = () => { removeElementRaw(screen.id, selectedId); setSelectedIds([]) }
  const addNewElement = (type) => addElement(makeElement(type, [...new Set((config.theme?.fonts || []).map((f) => f.family))]))

  // --- drag / resize (mounted once, reads latest via dragRef) ---
  useEffect(() => {
    const SNAP = 12
    const move = (e) => {
      const d = dragRef.current; if (!d) return
      const dx = (e.clientX - d.sx) / d.scale, dy = (e.clientY - d.sy) / d.scale
      if (d.handle === 'move') {
        let adx = dx, ady = dy, gv = false, gh = false
        if (Math.abs(d.gcx + dx - d.cw / 2) <= SNAP) { adx = d.cw / 2 - d.gcx; gv = true }
        if (Math.abs(d.gcy + dy - d.ch / 2) <= SNAP) { ady = d.ch / 2 - d.gcy; gh = true }
        d.items.forEach((it) => it.commit({ x: Math.round(it.ox + adx), y: Math.round(it.oy + ady) }))
        setGuides({ v: gv, h: gh })
      } else {
        const it = d.items[0]
        it.commit({ w: Math.max(20, Math.round(it.ow + dx)), h: Math.max(20, Math.round(it.oh + dy)) })
      }
    }
    const up = () => { dragRef.current = null; setGuides({ v: false, h: false }) }
    window.addEventListener('mousemove', move); window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', move); window.removeEventListener('mouseup', up) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const onPointerDown = (e, eid, handle) => {
    e.preventDefault(); e.stopPropagation()
    if (e.shiftKey || e.metaKey || e.ctrlKey) {
      setSelectedIds((ids) => ids.includes(eid) ? ids.filter((x) => x !== eid) : [...ids, eid]); return
    }
    const dragIds = selectedIds.includes(eid) ? selectedIds : [eid]
    if (!selectedIds.includes(eid)) setSelectedIds([eid])
    const wrap = document.querySelector('.qw-stage-wrap')
    const scale = parseFloat(wrap?.dataset.scale || '1') || 1
    const ovOf = (id) => isSetScope ? (config.sets.find((s) => s.id === previewSetId)?.questions?.[activeQid]?.overrides?.[id] || {}) : {}
    const writerOf = (id) => isSetScope ? (patch) => writeOverride(id, patch) : (patch) => patchElement(screen.id, id, patch)
    const mk = (id) => { const el = screen.elements.find((x) => x.id === id); const ov = ovOf(id); return { eid: id, ox: ov.x ?? el.x, oy: ov.y ?? el.y, ow: ov.w ?? el.w, oh: ov.h ?? el.h, commit: writerOf(id) } }
    if (handle === 'resize') {
      if (!screen.elements.some((x) => x.id === eid)) return
      dragRef.current = { handle: 'resize', scale, sx: e.clientX, sy: e.clientY, items: [mk(eid)], cw, ch }
    } else {
      const items = dragIds.filter((id) => screen.elements.some((x) => x.id === id)).map(mk)
      if (!items.length) return
      const minX = Math.min(...items.map((i) => i.ox)), maxX = Math.max(...items.map((i) => i.ox + i.ow))
      const minY = Math.min(...items.map((i) => i.oy)), maxY = Math.max(...items.map((i) => i.oy + i.oh))
      dragRef.current = { handle: 'move', scale, sx: e.clientX, sy: e.clientY, items, gcx: (minX + maxX) / 2, gcy: (minY + maxY) / 2, cw, ch }
    }
  }

  // --- group (multi-select) helpers ---
  const gOvOf = (id) => isSetScope ? (config.sets.find((s) => s.id === previewSetId)?.questions?.[activeQid]?.overrides?.[id] || {}) : {}
  const gWriterOf = (id) => isSetScope ? (patch) => writeOverride(id, patch) : (patch) => patchElement(screen.id, id, patch)
  const gEffPos = (el) => { const ov = gOvOf(el.id); return { x: ov.x ?? el.x, y: ov.y ?? el.y, w: ov.w ?? el.w, h: ov.h ?? el.h } }
  const groupBBox = () => {
    const els = selectedIds.map((id) => screen.elements.find((x) => x.id === id)).filter(Boolean).map((el) => ({ id: el.id, ...gEffPos(el) }))
    if (!els.length) return null
    const minX = Math.min(...els.map((e) => e.x)), maxX = Math.max(...els.map((e) => e.x + e.w))
    const minY = Math.min(...els.map((e) => e.y)), maxY = Math.max(...els.map((e) => e.y + e.h))
    return { els, minX, maxX, minY, maxY, cx: (minX + maxX) / 2, cy: (minY + maxY) / 2 }
  }
  const centerGroupOnCanvas = (axis) => {
    const b = groupBBox(); if (!b) return
    const dx = axis === 'h' ? cw / 2 - b.cx : 0, dy = axis === 'v' ? ch / 2 - b.cy : 0
    b.els.forEach((e) => gWriterOf(e.id)({ x: Math.round(e.x + dx), y: Math.round(e.y + dy) }))
  }
  const alignGroup = (kind) => {
    const b = groupBBox(); if (!b) return
    b.els.forEach((e) => {
      const p = {}
      if (kind === 'left') p.x = b.minX
      else if (kind === 'right') p.x = b.maxX - e.w
      else if (kind === 'hcenter') p.x = Math.round(b.cx - e.w / 2)
      else if (kind === 'top') p.y = b.minY
      else if (kind === 'bottom') p.y = b.maxY - e.h
      else if (kind === 'vmiddle') p.y = Math.round(b.cy - e.h / 2)
      gWriterOf(e.id)(p)
    })
  }
  const nudgeSelected = (axis, delta) =>
    selectedIds.forEach((id) => { const el = screen.elements.find((x) => x.id === id); if (!el) return; const p = gEffPos(el); gWriterOf(id)({ [axis]: (p[axis] || 0) + delta }) })
  const centerSelH = () => patchSel({ x: Math.round((cw - (effectiveEl?.w || 0)) / 2) })
  const centerSelV = () => patchSel({ y: Math.round((ch - (effectiveEl?.h || 0)) / 2) })

  liveRef.current = { nudgeSelected, selectedIds, preview }
  useEffect(() => {
    const onKey = (e) => {
      const { nudgeSelected: nudge, selectedIds: ids, preview: prev } = liveRef.current
      if (!ids?.length || prev || !nudge) return
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      const step = e.shiftKey ? 10 : 1
      const map = { ArrowLeft: ['x', -step], ArrowRight: ['x', step], ArrowUp: ['y', -step], ArrowDown: ['y', step] }
      const m = map[e.key]; if (!m) return
      e.preventDefault(); nudge(m[0], m[1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // --- style clipboard (all fields except identity) ---
  const EXCL = ['id', 'type', 'questionId']
  const copyStyle = () => {
    if (!effectiveEl) return ''
    const clip = {}; Object.keys(effectiveEl).forEach((k) => { if (!EXCL.includes(k)) clip[k] = JSON.parse(JSON.stringify(effectiveEl[k])) })
    setStyleClip(clip); try { localStorage.setItem('qw-styleclip', JSON.stringify(clip)) } catch { /* ignore */ }
    return `Copied all fields from ${effectiveEl.type}`
  }
  const pasteStyle = () => {
    if (!styleClip || !selectedId || !selectedEl) return ''
    const clip = {}; Object.keys(styleClip).forEach((k) => { if (!EXCL.includes(k)) clip[k] = JSON.parse(JSON.stringify(styleClip[k])) })
    if (isSetScope) writeOverride(selectedId, clip); else patchElement(screen.id, selectedId, clip)
    return `Pasted all fields onto ${selectedEl.id}`
  }

  // --- preview ctx for the static canvas ---
  const sampleResult = () => {
    const rl = config.resultLogic || {}
    if (rl.type === 'score') return { type: 'score', score: Math.min(3, (rl.scoreQuestions || []).length), total: (rl.scoreQuestions || []).length }
    const track = rl.fallback?.track || Object.keys(rl.tracks || {})[0]
    return { type: 'recommendation', track, items: rl.fallback?.items || ['Sample 1', 'Sample 2', 'Sample 3'] }
  }
  const ctx = {
    config, resolve: resolveAsset,
    question: screen?.type === 'question' ? getQuestion(config, screen.questionId || screen.id, previewSetId) : null,
    getQuestion: (qk) => getQuestion(config, qk, previewSetId),
    answers: {}, result: screen?.type === 'result' ? sampleResult() : null,
    timerActive: false, autoResetMs: config.timings?.autoResetMs,
  }

  return {
    // state
    screenId, screen, selectedIds, selectedId, effectiveEl, previewSetId, preview, guides, ctx, cw, ch,
    isSetScope, activeQid, hasClip: !!styleClip, slug,
    // selection / nav
    selectScreen, select, setSelectedIds, setPreviewSetId, setPreview,
    // canvas interaction
    onPointerDown,
    // element ops (scope-aware)
    patchSel, patchSelStyle, patchSelOptionStyle, removeSelected, addNewElement, addElement, reorder,
    centerSelH, centerSelV,
    // group ops
    centerGroupOnCanvas, alignGroup,
    // clipboard
    copyStyle, pasteStyle,
  }
}
