import { useEffect, useMemo, useRef, useState } from 'react'
import { Stage } from './renderer.jsx'
import { resolveAsset, api } from '../api.js'
import { buildAnalyticsRow, computeResult, createFlowId, getQuestion, pickActiveSet } from './quizLogic.js'

// The public, interactive quiz. Given a resolved config, it drives the whole
// welcome -> questions -> result flow with auto-reset, and logs to analytics.
export default function QuizPlayer({ config, preview = false }) {
  const flow = config.flow && config.flow.length ? config.flow : (config.screens || []).map((s) => s.id)
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState({})
  const [activeSetId, setActiveSetId] = useState(() => pickActiveSet(config))
  const [fading, setFading] = useState(false)
  const [outgoingId, setOutgoingId] = useState(null)
  const [phase, setPhase] = useState('idle') // crossfade: 'idle' | 'out' | 'in'
  const [timerKey, setTimerKey] = useState(0)
  const flowIdRef = useRef('')
  const loggedRef = useRef(false)
  const autoResetRef = useRef(null)
  const transitionRef = useRef(null)
  const timerResetRef = useRef(null) // center timer: hands the frozen width from the outgoing screen to the incoming one

  const screenId = flow[index]
  const screen = useMemo(() => (config.screens || []).find((s) => s.id === screenId) || config.screens?.[0], [config, screenId])
  const isQuestion = screen?.type === 'question'
  const isResult = screen?.type === 'result'
  const question = isQuestion ? getQuestion(config, screen.questionId || screen.id, activeSetId) : null
  const autoResetMs = config.timings?.autoResetMs || 30000
  const transitionMs = config.timings?.transitionMs || 400
  const style = config.timings?.transitionStyle

  const result = useMemo(
    () => (isResult ? computeResult(config, answers, activeSetId) : null),
    [isResult, config, answers, activeSetId],
  )

  const clearTimers = () => { clearTimeout(autoResetRef.current); clearTimeout(transitionRef.current) }

  const reset = () => {
    clearTimers()
    setIndex(0); setAnswers({}); setActiveSetId(pickActiveSet(config)); setFading(false); setOutgoingId(null); setPhase('idle')
    loggedRef.current = false; flowIdRef.current = ''
  }

  // Two-phase crossfade (matches original veev): phase 'out' fades the current
  // elements out while the background holds; then phase 'in' fades the new
  // background + new elements in together over the old background.
  const crossTo = (nextIndex) => {
    setOutgoingId(screenId)
    setPhase('out')
    clearTimeout(transitionRef.current)
    transitionRef.current = setTimeout(() => {
      setIndex(nextIndex)
      setPhase('in')
      setTimerKey((k) => k + 1)
      clearTimeout(transitionRef.current)
      transitionRef.current = setTimeout(() => { setPhase('idle'); setOutgoingId(null) }, transitionMs)
    }, transitionMs)
  }
  const goTo = (nextIndex) => {
    if (style === 'crossfade') return crossTo(nextIndex)
    setFading(true)
    transitionRef.current = setTimeout(() => { setIndex(nextIndex); setFading(false); setTimerKey((k) => k + 1) }, transitionMs)
  }
  const advance = () => goTo(Math.min(index + 1, flow.length - 1))

  const makeRow = (event, suggestionClicked = '') =>
    buildAnalyticsRow(config, {
      answers, activeSetId, event, suggestionClicked, flowId: flowIdRef.current,
      result: computeResult(config, answers, activeSetId),
    })

  // inactivity auto-reset on question/result screens
  useEffect(() => {
    clearTimeout(autoResetRef.current)
    if ((isQuestion || isResult) && !preview) autoResetRef.current = setTimeout(reset, autoResetMs)
    return () => clearTimeout(autoResetRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, isQuestion, isResult])

  // log result_reached once when landing on the result screen
  useEffect(() => {
    if (!isResult || preview || loggedRef.current) return
    loggedRef.current = true
    if (!flowIdRef.current) flowIdRef.current = createFlowId()
    api.sendAnalytics(config.slug, makeRow('result_reached'))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isResult])

  const onSelect = (questionId, value) => {
    const q = getQuestion(config, questionId, activeSetId)
    const max = q.maxSelect || 1
    setAnswers((prev) => {
      const cur = prev[questionId]
      let next
      if (max === 1) next = value
      else {
        const arr = Array.isArray(cur) ? cur : []
        next = arr.includes(value) ? arr.filter((v) => v !== value) : arr.length < max ? [...arr, value] : arr
      }
      const done = max === 1 ? true : Array.isArray(next) && next.length === max
      if (done) { clearTimeout(autoResetRef.current); advance() }
      return { ...prev, [questionId]: next }
    })
  }

  const onAction = (action) => {
    if (action === 'start') {
      clearTimers()
      setAnswers({}); setActiveSetId(pickActiveSet(config)); flowIdRef.current = createFlowId(); loggedRef.current = false
      goTo(Math.min(1, flow.length - 1))
    } else if (action === 'reset') {
      reset()
    }
  }

  const onResultClick = (fullLabel) => {
    if (!preview) api.sendAnalytics(config.slug, makeRow('suggestion_clicked', fullLabel))
    reset()
  }

  const buildCtx = (scr, interactive) => {
    const isQ = scr?.type === 'question'
    const isR = scr?.type === 'result'
    return {
      config,
      resolve: resolveAsset,
      question: isQ ? getQuestion(config, scr.questionId || scr.id, activeSetId) : null,
      getQuestion: (qk) => getQuestion(config, qk, activeSetId),
      answers,
      onSelect: interactive ? onSelect : undefined,
      onAction: interactive ? onAction : undefined,
      onResultClick: interactive ? onResultClick : undefined,
      result: isR ? computeResult(config, answers, activeSetId) : null,
      timerActive: interactive && (isQ || isR) && !preview,
      timerKey,
      autoResetMs,
      transitionMs,
      transitionPhase: phase,
      timerResetRef,
    }
  }
  const ctx = buildCtx(screen, true)

  if (!screen) return null
  // Two-phase crossfade (veev): out = current elements fade out (bg holds);
  // in = new bg + new elements fade in together over the old bg; then old removed.
  if (style === 'crossfade') {
    const outScreen = outgoingId ? (config.screens || []).find((s) => s.id === outgoingId) : null
    if (phase === 'out') {
      return (
        <div className="qw-player">
          <Stage config={config} screen={screen} ctx={ctx} elFade={{ key: screenId, className: 'qw-fade-out', durationMs: transitionMs }} />
        </div>
      )
    }
    return (
      <div className="qw-player" style={{ position: 'relative' }}>
        {phase === 'in' && outScreen && (
          <div style={{ position: 'absolute', inset: 0 }}><Stage config={config} screen={outScreen} ctx={buildCtx(outScreen, false)} bgOnly /></div>
        )}
        <div key={screenId} className={phase === 'in' ? 'qw-fade-in' : ''} style={{ position: 'absolute', inset: 0, '--qw-fade': `${transitionMs}ms` }}>
          <Stage config={config} screen={screen} ctx={ctx} />
        </div>
      </div>
    )
  }
  // slideFade: background stays put, only the elements fade + slide up (matches
  // the original uber). Default fade: the whole screen (incl. background) crossfades.
  if (config.timings?.transitionStyle === 'slideFade') {
    const elFade = { key: screenId, className: `qw-slidefade-${fading ? 'out' : 'in'}`, durationMs: transitionMs }
    return (
      <div className="qw-player">
        <Stage config={config} screen={screen} ctx={ctx} elFade={elFade} />
      </div>
    )
  }
  return (
    <div key={screenId} className={`qw-player ${fading ? 'qw-fade-out' : 'qw-fade-in'}`} style={{ '--qw-fade': `${transitionMs}ms` }}>
      <Stage config={config} screen={screen} ctx={ctx} />
    </div>
  )
}
