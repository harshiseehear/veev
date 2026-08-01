import { useLayoutEffect, useRef, useState } from 'react'
import { recommendationButtons } from './quizLogic.js'

// Absolute canvas size everything is authored against; the stage is scaled to fit.
export const cssFromStyle = (s = {}) => {
  const css = {}
  if (s.fontFamily) css.fontFamily = `'${s.fontFamily}', sans-serif`
  if (s.fontWeight != null) css.fontWeight = s.fontWeight
  if (s.fontSize != null) css.fontSize = `${s.fontSize}px`
  if (s.fontStyle) css.fontStyle = s.fontStyle
  if (s.color) css.color = s.color
  if (s.background) css.background = s.background
  if (s.borderRadius != null) css.borderRadius = `${s.borderRadius}px`
  if (s.textAlign) css.textAlign = s.textAlign
  if (s.lineHeight != null) css.lineHeight = s.lineHeight
  if (s.letterSpacing != null) css.letterSpacing = `${s.letterSpacing}px`
  if (s.textTransform) css.textTransform = s.textTransform
  if (s.opacity != null) css.opacity = s.opacity
  if (s.boxShadow) css.boxShadow = s.boxShadow
  if (s.border) css.border = s.border
  return css
}

const alignItems = (align) => (align === 'left' ? 'flex-start' : align === 'right' ? 'flex-end' : 'center')

// Renders the dynamic content of a single element based on its type.
function ElementContent({ el, ctx }) {
  // per-set overrides: a set's question may carry overrides[elementId] = { style, optionStyle }
  const ov = ctx.question?.overrides?.[el.id] || {}
  const s = { ...(el.style || {}), ...(ov.style || {}) }
  switch (el.type) {
    case 'text':
    case 'prompt':
    case 'pickLabel': {
      let text = el.text || ''
      if (el.type === 'prompt') text = ctx.question?.prompt || el.text || ''
      if (el.type === 'pickLabel') text = ctx.question?.pickLabel || el.text || ''
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center',
          alignItems: alignItems(s.textAlign), whiteSpace: 'pre-line', ...cssFromStyle(s) }}>
          {text}
        </div>
      )
    }
    case 'image':
      return <img src={ctx.resolve(el.src)} alt="" style={{ width: '100%', height: '100%', objectFit: s.objectFit || 'contain' }} />
    case 'button':
      return (
        <button type="button" onClick={ctx.onAction ? () => ctx.onAction(el.action) : undefined}
          style={{ width: '100%', height: '100%', border: 'none', cursor: 'pointer', display: 'flex',
            alignItems: 'center', justifyContent: 'center', whiteSpace: 'pre-line', ...cssFromStyle(s) }}>
          {el.text}
        </button>
      )
    case 'options': {
      const q = ctx.question
      const os = { ...(el.optionStyle || {}), ...(ov.optionStyle || {}) }
      const selected = ctx.answers?.[el.questionId]
      const isSel = (v) => (Array.isArray(selected) ? selected.includes(v) : selected === v)
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: `${el.gap || 24}px`, justifyContent: el.justify || 'center' }}>
          {(q?.options || []).map((opt, i) => {
            const sel = isSel(opt.value)
            const merged = sel ? { ...os, ...(el.selectedStyle || {}) } : os
            return (
              <button key={opt.value} type="button"
                onClick={ctx.onSelect ? () => ctx.onSelect(el.questionId, opt.value) : undefined}
                style={{ minHeight: `${os.height || 120}px`, width: '100%', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: os.textAlign === 'center' ? 'center' : 'flex-start',
                  padding: `${os.paddingY ?? 0}px ${os.paddingX ?? 40}px`, lineHeight: os.lineHeight ?? 1.2,
                  gap: el.showLetters ? '18px' : 0, ...cssFromStyle(merged) }}>
                {el.showLetters
                  ? (<><span style={{ flex: 'none', minWidth: 48 }}>{String.fromCharCode(65 + i)})</span><span>{opt.label}</span></>)
                  : opt.label}
              </button>
            )
          })}
        </div>
      )
    }
    case 'resultList': {
      const os = el.optionStyle || {}
      const buttons = ctx.result ? recommendationButtons(ctx.config, ctx.result) : []
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: `${el.gap || 32}px`, justifyContent: 'flex-start' }}>
          {buttons.map((b, i) => (
            <button key={i} type="button" onClick={ctx.onResultClick ? () => ctx.onResultClick(b.full) : undefined}
              style={{ height: `${os.height || 120}px`, width: '100%', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: `0 ${os.paddingX ?? 32}px`, ...cssFromStyle(os) }}>
              {b.display}
            </button>
          ))}
        </div>
      )
    }
    case 'scoreCircle':
      return (
        <div style={{ width: '100%', height: '100%', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...cssFromStyle(s) }}>
          {ctx.result?.score ?? 0}
        </div>
      )
    case 'answerSummary': {
      const keys = ctx.config.resultLogic?.scoreQuestions || []
      return (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: `${el.gap || 18}px`, overflow: 'hidden' }}>
          {keys.map((qk) => {
            const q = ctx.getQuestion(qk)
            const val = ctx.answers?.[qk]
            const correct = val && val === q?.correct
            const label = q?.options?.find((o) => o.value === val)?.label || '—'
            return (
              <div key={qk} style={{ height: `${s.height || 90}px`, borderRadius: `${s.borderRadius || 12}px`,
                display: 'flex', alignItems: 'center', padding: `0 ${s.paddingX || 30}px`,
                fontFamily: `'${s.fontFamily}', sans-serif`, fontWeight: s.fontWeight, fontSize: `${s.fontSize}px`,
                background: correct ? s.correctBg : s.wrongBg, color: correct ? s.correctColor : s.wrongColor }}>
                {label}
              </div>
            )
          })}
        </div>
      )
    }
    case 'timer':
      return (
        <div style={{ width: '100%', height: '100%', borderRadius: `${s.borderRadius || 999}px`, background: s.trackColor || 'rgba(255,255,255,0.3)', overflow: 'hidden' }}>
          {ctx.timerActive && (
            <div key={ctx.timerKey} style={{ height: '100%', background: s.fillColor || '#fff', borderRadius: `${s.borderRadius || 999}px`,
              animation: `qw-timer-shrink ${ctx.autoResetMs || 30000}ms linear forwards` }} />
          )}
        </div>
      )
    default:
      return null
  }
}

// One positioned element, with optional edit affordances.
function ElementBox({ el, ctx, editable, selected, onPointerDown }) {
  return (
    <div
      onMouseDown={editable ? (e) => onPointerDown(e, el.id, 'move') : undefined}
      style={{
        position: 'absolute', left: el.x, top: el.y, width: el.w, height: el.h, zIndex: el.z || 1,
        display: el.hidden ? 'none' : 'block',
        outline: selected ? '3px solid #ff3d7f' : editable ? '1px dashed rgba(255,255,255,0.35)' : 'none',
        cursor: editable ? 'move' : 'default',
      }}
    >
      <div style={{ width: '100%', height: '100%', pointerEvents: editable ? 'none' : 'auto' }}>
        <ElementContent el={el} ctx={ctx} />
      </div>
      {editable && selected && (
        <div
          onMouseDown={(e) => { e.stopPropagation(); onPointerDown(e, el.id, 'resize') }}
          style={{ position: 'absolute', right: -9, bottom: -9, width: 18, height: 18, background: '#ff3d7f', borderRadius: 4, cursor: 'nwse-resize', zIndex: 9999 }}
        />
      )}
    </div>
  )
}

// The fixed-size authoring canvas, scaled to fit its container.
export function Stage({ config, screen, ctx, editable = false, selectedId = null, onPointerDown, onBackgroundClick, guides = null }) {
  const wrapRef = useRef(null)
  const [scale, setScale] = useState(1)
  const cw = config.theme?.canvasWidth || 1080
  const ch = config.theme?.canvasHeight || 1920

  useLayoutEffect(() => {
    const measure = () => {
      const el = wrapRef.current
      if (!el) return
      const r = el.getBoundingClientRect()
      setScale(Math.min(r.width / cw, r.height / ch))
    }
    measure()
    const ro = new ResizeObserver(measure)
    if (wrapRef.current) ro.observe(wrapRef.current)
    window.addEventListener('resize', measure)
    return () => { ro.disconnect(); window.removeEventListener('resize', measure) }
  }, [cw, ch])

  const bg = screen.background || config.background || { type: 'color', color: '#000' }
  const banner = config.banner || {}

  return (
    <div ref={wrapRef} className="qw-stage-wrap" data-scale={scale}>
      <div className="qw-stage" style={{ width: cw, height: ch, transform: `scale(${scale})` }}
        onMouseDown={editable && onBackgroundClick ? (e) => { if (e.target === e.currentTarget || e.target.classList.contains('qw-bg')) onBackgroundClick() } : undefined}>
        {bg.type === 'image' && bg.src
          ? <img className="qw-bg" src={ctx.resolve(bg.src)} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <div className="qw-bg" style={{ position: 'absolute', inset: 0, background: bg.color || '#000' }} />}
        {bg.overlay && <div style={{ position: 'absolute', inset: 0, background: bg.overlay, zIndex: 1 }} />}
        {banner.enabled && banner.src && (
          <img src={ctx.resolve(banner.src)} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: `${(banner.heightPct || 8) / 100 * ch}px`, objectFit: 'cover', objectPosition: 'top', zIndex: 50, background: '#fff' }} />
        )}
        {[...(screen.elements || [])].sort((a, b) => (a.z || 0) - (b.z || 0)).map((el) => (
          <ElementBox key={el.id} el={el} ctx={ctx} editable={editable} selected={selectedId === el.id} onPointerDown={onPointerDown} />
        ))}
        {editable && guides?.v && (
          <div style={{ position: 'absolute', left: cw / 2 - 1, top: 0, width: 2, height: ch, background: '#ff3d7f', zIndex: 9998, pointerEvents: 'none' }} />
        )}
        {editable && guides?.h && (
          <div style={{ position: 'absolute', top: ch / 2 - 1, left: 0, height: 2, width: cw, background: '#ff3d7f', zIndex: 9998, pointerEvents: 'none' }} />
        )}
      </div>
    </div>
  )
}

export { ElementContent }
