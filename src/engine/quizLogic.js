// Pure, config-driven quiz logic shared by the player and the admin preview.
// Nothing here touches the DOM or React, so it is trivially testable.

export const createFlowId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

// Which question ids are actually asked, in order (screens of type "question").
export const questionOrder = (config) =>
  (config.screens || []).filter((s) => s.type === 'question').map((s) => s.questionId || s.id)

// Resolve the active question bank. Trivia configs carry `sets`; a set is chosen
// per play-through. Recommendation configs use the single `questions` map.
export const pickActiveSet = (config) => {
  const sets = config.sets || []
  if (!sets.length) return null
  if (config.resultLogic?.setStrategy === 'random') {
    return sets[Math.floor(Math.random() * sets.length)].id
  }
  return sets[0].id
}

export const resolveQuestions = (config, activeSetId) => {
  const sets = config.sets || []
  if (sets.length) {
    const set = sets.find((s) => s.id === activeSetId) || sets[0]
    return set.questions
  }
  return config.questions || {}
}

export const getQuestion = (config, questionId, activeSetId) =>
  resolveQuestions(config, activeSetId)[questionId] || { prompt: '', options: [], maxSelect: 1 }

export const optionLabel = (question, value) =>
  question?.options?.find((o) => o.value === value)?.label || ''

// ---- Recommendation engine (VEEV-style) ------------------------------------

// Device/track selection: sort the selected letters, join, look up in deviceMap.
export const resolveTrack = (config, answers) => {
  const rl = config.resultLogic || {}
  const fromQ = rl.deviceFrom
  const picked = answers[fromQ]
  const arr = Array.isArray(picked) ? picked : picked ? [picked] : []
  if (!arr.length) return rl.deviceDefault || Object.keys(rl.tracks || {})[0]
  const key = [...arr].sort().join('')
  return rl.deviceMap?.[key] || rl.deviceDefault || Object.keys(rl.tracks || {})[0]
}

export const computeRecommendation = (config, answers) => {
  const rl = config.resultLogic || {}
  const track = resolveTrack(config, answers)
  const [k1, k2] = rl.tableKeys || ['q3', 'q4']
  const cell = rl.table?.[track]?.[answers[k1]]?.[answers[k2]]
  const items = Array.isArray(cell) && cell.length ? cell : rl.fallback?.items || []
  const resolvedTrack = Array.isArray(cell) && cell.length ? track : rl.fallback?.track || track
  return { track: resolvedTrack, items }
}

// Buttons show a short prefix ("18 mL Watermelon"); the sheet logs the full
// product name ("VEEV NOW 18 mL Watermelon").
export const recommendationButtons = (config, rec) => {
  const t = config.resultLogic?.tracks?.[rec.track] || {}
  const prefix = t.buttonPrefix ?? t.displayName ?? ''
  return rec.items.map((it) => ({
    display: [prefix, it].filter(Boolean).join(' '),
    full: [t.logName ?? t.displayName ?? prefix, it].filter(Boolean).join(' '),
  }))
}

// ---- Score engine (Uber-style trivia) --------------------------------------

export const computeScore = (config, answers, questions) => {
  const keys = config.resultLogic?.scoreQuestions || questionOrder(config)
  return keys.reduce((s, qk) => s + (answers[qk] && answers[qk] === questions[qk]?.correct ? 1 : 0), 0)
}

// ---- Unified result --------------------------------------------------------

export const computeResult = (config, answers, activeSetId) => {
  const type = config.resultLogic?.type || 'recommendation'
  if (type === 'score') {
    const questions = resolveQuestions(config, activeSetId)
    return { type, score: computeScore(config, answers, questions), total: (config.resultLogic.scoreQuestions || []).length }
  }
  return { type, ...computeRecommendation(config, answers) }
}

// ---- Analytics payload (generic, branches by result type) ------------------

export const buildAnalyticsRow = (config, { answers, activeSetId, result, event, flowId, suggestionClicked = '' }) => {
  const type = config.resultLogic?.type || 'recommendation'
  const base = {
    datetimestamp: new Date().toISOString(),
    'flow id': flowId,
    flow_id: flowId,
    'event type': event,
    event_type: event,
  }
  const questions = resolveQuestions(config, activeSetId)

  if (type === 'score') {
    const keys = config.resultLogic?.scoreQuestions || questionOrder(config)
    const row = { ...base, set: String(activeSetId || '').replace(/^set/i, ''), score: result?.score ?? '' }
    keys.forEach((qk) => { row[qk] = answers[qk] || '' })
    return row
  }

  // recommendation row — matches the existing VEEV sheet column names.
  const order = questionOrder(config)
  const row = { ...base }
  order.forEach((qk, i) => {
    const q = questions[qk]
    const val = answers[qk]
    const labels = (Array.isArray(val) ? val : val ? [val] : []).map((v) => optionLabel(q, v))
    const max = q?.maxSelect || 1
    if (max > 1) {
      for (let j = 0; j < max; j++) {
        row[`question ${i + 1} answer ${j + 1}`] = labels[j] || ''
        row[`question_${i + 1}_answer_${j + 1}`] = labels[j] || ''
      }
    } else {
      row[`question ${i + 1} answer`] = labels[0] || ''
      row[`question_${i + 1}_answer`] = labels[0] || ''
    }
  })
  const full = recommendationButtons(config, result).map((b) => b.full)
  for (let i = 0; i < 4; i++) {
    row[`final suggestion ${i + 1}`] = full[i] || ''
    row[`final_suggestion_${i + 1}`] = full[i] || ''
  }
  row['suggestion clicked'] = suggestionClicked
  row.suggestion_clicked = suggestionClicked
  return row
}
