import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

// Merge a per-set override (overrides[elementId]) into an element. Everything
// except position/size can be overridden per set; style/optionStyle/selectedStyle
// deep-merge, other keys (gap, showLetters, text…) replace.
const mergeOverride = (el, ov) => {
  if (!ov) return el
  const m = { ...el }
  for (const k of Object.keys(ov)) {
    if (k === 'style') m.style = { ...(el.style || {}), ...ov.style }
    else if (k === 'optionStyle') m.optionStyle = { ...(el.optionStyle || {}), ...ov.optionStyle }
    else if (k === 'selectedStyle') m.selectedStyle = { ...(el.selectedStyle || {}), ...ov.selectedStyle }
    else m[k] = ov[k]
  }
  return m
}

// Renders the dynamic content of a single element based on its type.
function ElementContent({ el, ctx }) {
  // el is already merged with any per-set override by the Stage (see mergeOverride).
  const s = el.style || {}
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
          {el.icon === 'arrow'
            ? (<svg viewBox="0 0 24 24" fill="none" style={{ width: `${el.iconScale || 55}%`, height: `${el.iconScale || 55}%` }}>
                <path d="M5 12H19M19 12L13 6M19 12L13 18" stroke={s.color || '#ffffff'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>)
            : el.text}
        </button>
      )
    case 'options': {
      const q = ctx.question
      const os = el.optionStyle || {}
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
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', gap: `${el.gap || 18}px` }}>
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
      return <TimerBar el={el} ctx={ctx} />
    default:
      return null
  }
}

// Timer bar. Default variant (uber): a single fill that shrinks left->right over
// the auto-reset time, on a track (keyframe-driven, restarts on each question).
function TimerBar({ el, ctx }) {
  const s = el.style || {}
  if (s.variant === 'center') return <CenterTimerBar el={el} ctx={ctx} />
  const radius = `${s.borderRadius || 999}px`
  return (
    <div style={{ width: '100%', height: '100%', borderRadius: radius, background: s.trackColor || 'rgba(255,255,255,0.3)', overflow: 'hidden', position: 'relative' }}>
      {ctx.timerActive && (
        <div key={ctx.timerKey} style={{ height: '100%', width: '100%', background: s.fillColor || '#fff', borderRadius: radius, animation: `qw-timer-shrink ${ctx.autoResetMs || 30000}ms linear forwards` }} />
      )}
    </div>
  )
}

// variant 'center' (veev): a track-less white fill that drains from BOTH sides
// toward centre over the auto-reset time. When a choice is made it stops draining
// and grows smoothly back to full, spanning the whole two-phase transition (the
// elements fading out AND the new ones fading in), then starts draining again.
// Fully width-transition-driven (no keyframe) so the grow reads as one continuous
// motion instead of an instant snap. The frozen width is handed from the outgoing
// screen to the incoming one via ctx.timerResetRef.
function CenterTimerBar({ el, ctx }) {
  const s = el.style || {}
  const radius = `${s.borderRadius || 999}px`
  const fillRef = useRef(null)
  const T = ctx.transitionMs || 500

  // Grow in: on a new question (timerKey change → mounts during the fade-in), start
  // from the width the outgoing screen handed off (default full) and grow to 100%
  // over one transition, so the grow finishes as the new screen finishes fading in.
  useEffect(() => {
    const fill = fillRef.current
    if (!fill || !ctx.timerActive) return
    const start = ctx.timerResetRef?.current
    if (ctx.timerResetRef) ctx.timerResetRef.current = null
    fill.style.transition = 'none'
    fill.style.width = `${start == null ? 100 : start}%`
    void fill.offsetWidth
    if (start == null) return // first entry: already full, just drain at idle
    fill.style.transition = `width ${T}ms linear`
    fill.style.width = '100%'
  }, [ctx.timerKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Drain: once the transition settles, run the both-sides drain from full.
  useEffect(() => {
    const fill = fillRef.current
    if (!fill || !ctx.timerActive || ctx.transitionPhase !== 'idle') return
    fill.style.transition = 'none'
    fill.style.width = '100%'
    void fill.offsetWidth
    fill.style.transition = `width ${ctx.autoResetMs || 30000}ms linear`
    fill.style.width = '0%'
  }, [ctx.transitionPhase, ctx.timerKey]) // eslint-disable-line react-hooks/exhaustive-deps

  // Freeze + hand off: on pick (phase 'out') stop the drain at its current width and
  // grow toward full over the FULL transition (2T); we only see the first half here,
  // then stash the mid-point so the incoming screen continues from exactly there.
  useEffect(() => {
    const fill = fillRef.current
    if (!fill || ctx.transitionPhase !== 'out') return
    const parentW = fill.parentElement?.offsetWidth || 1
    const cur = (fill.getBoundingClientRect().width / parentW) * 100
    fill.style.transition = 'none'
    fill.style.width = `${cur}%`
    void fill.offsetWidth
    fill.style.transition = `width ${2 * T}ms linear`
    fill.style.width = '100%'
    if (ctx.timerResetRef) ctx.timerResetRef.current = (cur + 100) / 2
  }, [ctx.transitionPhase]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ width: '100%', height: '100%', borderRadius: radius, background: 'transparent', overflow: 'hidden', position: 'relative' }}>
      {ctx.timerActive && (
        <div key={ctx.timerKey} ref={fillRef} style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '100%', transform: 'translateX(-50%)', background: s.fillColor || '#ffffff', borderRadius: radius }} />
      )}
    </div>
  )
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
export function Stage({ config, screen, ctx, editable = false, selectedIds = [], onPointerDown, onBackgroundClick, guides = null, elFade = null, bgOnly = false }) {
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
        {!bgOnly && (() => {
          const merged = (screen.elements || [])
            .map((el) => mergeOverride(el, ctx.question?.overrides?.[el.id]))
            .sort((a, b) => (a.z || 0) - (b.z || 0))
          const box = (el) => (
            <ElementBox key={el.id} el={el} ctx={ctx} editable={editable} selected={selectedIds.includes(el.id)} onPointerDown={onPointerDown} />
          )
          if (!elFade) return merged.map(box)
          // A center-variant timer is exempt from the fade so it can grow to full
          // during the transition instead of fading out; everything else fades.
          const exempt = (el) => el.type === 'timer' && el.style?.variant === 'center'
          return (
            <>
              <div key={elFade.key} className={elFade.className} style={{ position: 'absolute', inset: 0, zIndex: 2, '--qw-fade': `${elFade.durationMs}ms` }}>
                {merged.filter((e) => !exempt(e)).map(box)}
              </div>
              {merged.filter(exempt).map(box)}
            </>
          )
        })()}
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
