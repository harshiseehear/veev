import { Panel, Note, Row, Chip, Num, Txt, Select } from '../ui.jsx'

const clone = (o) => JSON.parse(JSON.stringify(o))

// CONTENT — the question's prompt, options, correct answer; plus set management
// for trivia quizzes. Edits the ACTIVE set (chosen in the left rail).
export default function ContentPanel({ config, setConfig, previewSetId, setPreviewSetId, activeQid }) {
  const update = (fn) => setConfig((prev) => { const next = clone(prev); fn(next); return next })
  const sets = config.sets
  const setIdx = sets ? Math.max(0, sets.findIndex((s) => s.id === previewSetId)) : -1
  const questions = sets ? sets[setIdx]?.questions : config.questions
  const q = questions?.[activeQid]
  const path = (mut) => update((next) => mut(next.sets ? next.sets[setIdx].questions : next.questions))

  const newSetId = () => { const ids = new Set((sets || []).map((s) => s.id)); let n = (sets?.length || 0) + 1; while (ids.has(`set${n}`)) n++; return `set${n}` }
  const duplicateSet = () => { const id = newSetId(); update((next) => { const c = clone(next.sets[setIdx]); c.id = id; next.sets.splice(setIdx + 1, 0, c) }); setPreviewSetId?.(id) }
  const removeSet = () => { if ((sets?.length || 0) <= 1) return; const rest = sets.filter((_, i) => i !== setIdx); update((next) => { next.sets.splice(setIdx, 1) }); setPreviewSetId?.((rest[setIdx - 1] || rest[0]).id) }

  return (
    <>
      {sets && (
        <Panel title="Sets" sub={`${sets.length} · random per play`} tone="lime">
          <Note>Editing set <b>{previewSetId}</b> — switch sets in the left rail. One of {sets.length} shows at random per play-through.</Note>
          <Row>
            <Chip onClick={duplicateSet}>+ Duplicate set</Chip>
            <Chip disabled={sets.length <= 1} onClick={removeSet}>🗑 Remove set</Chip>
          </Row>
        </Panel>
      )}
      {!q ? (
        <Panel title="Content" sub="no question"><Note>Select a question page (e.g. q1) in the left rail to edit its content{sets ? ` for ${previewSetId}` : ''}.</Note></Panel>
      ) : (
        <Panel title={sets ? `${previewSetId} · ${activeQid}` : activeQid} tone="orange">
          <Txt label="Prompt" area value={q.prompt} onChange={(v) => path((qs) => { qs[activeQid].prompt = v })} />
          {!sets && <Txt label="Pick label" value={q.pickLabel} onChange={(v) => path((qs) => { qs[activeQid].pickLabel = v })} />}
          {!sets && <Num label="Max select" value={q.maxSelect} onChange={(v) => path((qs) => { qs[activeQid].maxSelect = v })} />}
          {sets && (
            <Select label="Correct answer" value={q.correct || ''} onChange={(v) => path((qs) => { qs[activeQid].correct = v })}
              options={(q.options || []).map((o) => o.value)} />
          )}
          <div className="k-secline">Options</div>
          {(q.options || []).map((o, i) => (
            <div className="k-optrow" key={i}>
              <input className="k-input" value={o.value} onChange={(e) => path((qs) => { qs[activeQid].options[i].value = e.target.value })} />
              <input className="k-input" value={o.label} onChange={(e) => path((qs) => { qs[activeQid].options[i].label = e.target.value })} />
              <button className="k-x" onClick={() => path((qs) => { qs[activeQid].options.splice(i, 1) })}>×</button>
            </div>
          ))}
          <Row><Chip onClick={() => path((qs) => { qs[activeQid].options = [...(qs[activeQid].options || []), { value: String.fromCharCode(65 + (qs[activeQid].options?.length || 0)), label: 'New option' }] })}>+ option</Chip></Row>
        </Panel>
      )}
    </>
  )
}
