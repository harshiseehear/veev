import { useState } from 'react'
import { api } from '../api.js'

const clone = (o) => JSON.parse(JSON.stringify(o))
const TABS = ['Element', 'Content', 'Rules', 'Assets', 'Settings', 'AI']

// small controlled inputs
const Num = ({ label, value, onChange, step = 1 }) => (
  <label className="fld"><span>{label}</span><input type="number" step={step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} /></label>
)
const Txt = ({ label, value, onChange, area }) => (
  <label className="fld"><span>{label}</span>{area ? <textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} /> : <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} />}</label>
)
const Color = ({ label, value, onChange }) => (
  <label className="fld"><span>{label}</span><span className="color-row"><input type="color" value={/^#/.test(value || '') ? value : '#000000'} onChange={(e) => onChange(e.target.value)} /><input value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="transparent" /></span></label>
)

export default function Inspector(props) {
  const { config, setConfig, screen, selectedEl } = props
  const [tab, setTab] = useState('Element')
  const update = (fn) => setConfig((prev) => { const next = clone(prev); fn(next); return next })

  return (
    <aside className="inspector">
      <div className="insp-tabs">
        {TABS.map((t) => <button key={t} className={`insp-tab ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>
      <div className="insp-body">
        {tab === 'Element' && <ElementTab {...props} />}
        {tab === 'Content' && <ContentTab config={config} update={update} />}
        {tab === 'Rules' && <RulesTab config={config} setConfig={setConfig} />}
        {tab === 'Assets' && <AssetsTab {...props} update={update} />}
        {tab === 'Settings' && <SettingsTab config={config} update={update} screen={screen} />}
        {tab === 'AI' && <AiTab {...props} />}
      </div>
    </aside>
  )
}

function ElementTab({ config, screen, selectedEl, patchElement, patchElementStyle, removeElement, addElement, reorder, selectElement }) {
  const families = [...new Set((config.theme?.fonts || []).map((f) => f.family))]
  const s = selectedEl?.style || {}
  const addNew = (type) => {
    const id = `${type}-${Math.random().toString(36).slice(2, 6)}`
    const base = { id, type, x: 120, y: 200, w: 500, h: 200, z: 5, style: { fontFamily: families[0] || 'sans-serif', fontWeight: 700, fontSize: 48, color: '#ffffff', textAlign: 'center' } }
    if (type === 'text') base.text = 'New text'
    if (type === 'button') { base.text = 'Button'; base.action = 'reset'; base.style.background = '#ffffff'; base.style.color = '#000'; base.style.borderRadius = 999 }
    if (type === 'image') { base.src = ''; base.style = { objectFit: 'contain' } }
    addElement(base)
  }
  return (
    <div className="insp-scroll">
      <div className="layers">
        <div className="insp-h">Layers · {screen?.id}</div>
        {[...(screen?.elements || [])].sort((a, b) => (b.z || 0) - (a.z || 0)).map((el) => (
          <button key={el.id} className={`layer ${selectedEl?.id === el.id ? 'sel' : ''}`} onClick={() => selectElement(el.id)}>
            <span className="layer-type">{el.type}</span><span className="layer-id">{el.id}</span>
            <span className="layer-eye" onClick={(e) => { e.stopPropagation(); patchElementAny(el, { hidden: !el.hidden }) }}>{el.hidden ? '🚫' : '👁'}</span>
          </button>
        ))}
        <div className="add-el">
          {['text', 'button', 'image'].map((t) => <button key={t} className="chip" onClick={() => addNew(t)}>+ {t}</button>)}
        </div>
      </div>

      {!selectedEl ? <p className="muted pad">Select an element on the canvas to edit it. Drag to move, drag the pink corner to resize, arrow-keys to nudge.</p> : (
        <>
          <div className="insp-h">{selectedEl.type} · {selectedEl.id}</div>
          <div className="grid2">
            <Num label="X" value={selectedEl.x} onChange={(v) => patchElement({ x: v })} />
            <Num label="Y" value={selectedEl.y} onChange={(v) => patchElement({ y: v })} />
            <Num label="W" value={selectedEl.w} onChange={(v) => patchElement({ w: v })} />
            <Num label="H" value={selectedEl.h} onChange={(v) => patchElement({ h: v })} />
            <Num label="Z (layer)" value={selectedEl.z} onChange={(v) => patchElement({ z: v })} />
          </div>
          <div className="row-btns">
            <button className="chip" onClick={() => reorder(selectedEl.id, 'front')}>Bring front</button>
            <button className="chip" onClick={() => reorder(selectedEl.id, 'back')}>Send back</button>
            <button className="chip" onClick={() => patchElement({ hidden: !selectedEl.hidden })}>{selectedEl.hidden ? 'Show' : 'Hide'}</button>
          </div>
          <div className="row-btns">
            <button className="chip" onClick={() => patchElement({ x: Math.round(((config.theme?.canvasWidth || 1080) - selectedEl.w) / 2) })}>⯐ Center H</button>
            <button className="chip" onClick={() => patchElement({ y: Math.round(((config.theme?.canvasHeight || 1920) - selectedEl.h) / 2) })}>⯐ Center V</button>
          </div>

          {['text', 'button'].includes(selectedEl.type) && <Txt label="Text" area value={selectedEl.text} onChange={(v) => patchElement({ text: v })} />}
          {selectedEl.type === 'button' && (
            <label className="fld"><span>Action</span><select value={selectedEl.action || 'reset'} onChange={(e) => patchElement({ action: e.target.value })}><option value="start">start</option><option value="reset">reset</option></select></label>
          )}
          {selectedEl.type === 'image' && <Txt label="Image src" value={selectedEl.src} onChange={(v) => patchElement({ src: v })} />}
          {['prompt', 'pickLabel'].includes(selectedEl.type) && <p className="muted">Text comes from the question (Content tab). Style it below.</p>}

          {selectedEl.type !== 'image' && selectedEl.type !== 'timer' && (
            <>
              <div className="insp-h sub">Type</div>
              <div className="row-btns">
                <button className={`chip ${(s.fontWeight >= 700) ? 'on' : ''}`} onClick={() => patchElementStyle({ fontWeight: (s.fontWeight >= 700) ? 400 : 700 })}><b>B</b>&nbsp;Bold</button>
                <button className={`chip ${s.fontStyle === 'italic' ? 'on' : ''}`} onClick={() => patchElementStyle({ fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic' })}><i>I</i>&nbsp;Italic</button>
              </div>
              <label className="fld"><span>Font</span><select value={s.fontFamily || ''} onChange={(e) => patchElementStyle({ fontFamily: e.target.value })}>
                <option value="">(inherit)</option>{families.map((f) => <option key={f} value={f}>{f}</option>)}<option value="sans-serif">sans-serif</option></select></label>
              <div className="grid2">
                <Num label="Size" value={s.fontSize} onChange={(v) => patchElementStyle({ fontSize: v })} />
                <Num label="Weight" value={s.fontWeight} step={100} onChange={(v) => patchElementStyle({ fontWeight: v })} />
                <Num label="Line H" value={s.lineHeight} step={0.05} onChange={(v) => patchElementStyle({ lineHeight: v })} />
                <Num label="Letter" value={s.letterSpacing} step={0.5} onChange={(v) => patchElementStyle({ letterSpacing: v })} />
              </div>
              <label className="fld"><span>Align</span><select value={s.textAlign || 'center'} onChange={(e) => patchElementStyle({ textAlign: e.target.value })}><option>left</option><option>center</option><option>right</option></select></label>
              <label className="fld"><span>Transform</span><select value={s.textTransform || 'none'} onChange={(e) => patchElementStyle({ textTransform: e.target.value })}><option value="none">none</option><option value="uppercase">uppercase</option><option value="lowercase">lowercase</option></select></label>
            </>
          )}
          <div className="insp-h sub">Colour</div>
          <Color label="Text colour" value={s.color} onChange={(v) => patchElementStyle({ color: v })} />
          <Color label="Background" value={s.background} onChange={(v) => patchElementStyle({ background: v })} />
          <Num label="Corner radius" value={s.borderRadius} onChange={(v) => patchElementStyle({ borderRadius: v })} />

          {['options', 'resultList'].includes(selectedEl.type) && (
            <>
              <div className="insp-h sub">Option cards</div>
              <Num label="Gap" value={selectedEl.gap} onChange={(v) => patchElement({ gap: v })} />
              {selectedEl.type === 'options' && (
                <label className="fld chk"><input type="checkbox" checked={!!selectedEl.showLetters} onChange={(e) => patchElement({ showLetters: e.target.checked })} /> Show A) B) letters</label>
              )}
              <OptionStyle el={selectedEl} patchElement={patchElement} />
            </>
          )}
          <button className="danger" onClick={removeElement}>Delete element</button>
        </>
      )}
    </div>
  )
  function patchElementAny(el, patch) { patchElement(patch) /* selection follows */ }
}

function OptionStyle({ el, patchElement }) {
  const os = el.optionStyle || {}
  const set = (patch) => patchElement({ optionStyle: { ...os, ...patch } })
  const sel = el.selectedStyle || {}
  const setSel = (patch) => patchElement({ selectedStyle: { ...sel, ...patch } })
  return (
    <div className="grid2">
      <Num label="Card H" value={os.height} onChange={(v) => set({ height: v })} />
      <Num label="Pad X" value={os.paddingX} onChange={(v) => set({ paddingX: v })} />
      <Num label="Font size" value={os.fontSize} onChange={(v) => set({ fontSize: v })} />
      <Num label="Radius" value={os.borderRadius} onChange={(v) => set({ borderRadius: v })} />
      <label className="fld span2"><span>Card bg</span><input type="color" value={/^#/.test(os.background || '') ? os.background : '#ffffff'} onChange={(e) => set({ background: e.target.value })} /></label>
      <label className="fld span2"><span>Card text</span><input type="color" value={/^#/.test(os.color || '') ? os.color : '#000000'} onChange={(e) => set({ color: e.target.value })} /></label>
      {el.type === 'options' && <label className="fld span2"><span>Selected bg</span><input type="color" value={/^#/.test(sel.background || '') ? sel.background : '#e7c9ff'} onChange={(e) => setSel({ background: e.target.value })} /></label>}
    </div>
  )
}

function ContentTab({ config, update }) {
  const sets = config.sets
  const [setIdx, setSetIdx] = useState(0)
  const questions = sets ? sets[setIdx]?.questions : config.questions
  const path = (mut) => update((next) => { const q = (next.sets ? next.sets[setIdx].questions : next.questions); mut(q) })
  const newSetId = () => { const ids = new Set((sets || []).map((s) => s.id)); let n = (sets?.length || 0) + 1; while (ids.has(`set${n}`)) n++; return `set${n}` }
  const duplicateSet = () => { const id = newSetId(); update((next) => { const copy = clone(next.sets[setIdx]); copy.id = id; next.sets.splice(setIdx + 1, 0, copy) }); setSetIdx(setIdx + 1) }
  const removeSet = () => { if ((sets?.length || 0) <= 1) return; update((next) => { next.sets.splice(setIdx, 1) }); setSetIdx(Math.max(0, setIdx - 1)) }
  return (
    <div className="insp-scroll">
      {sets && (
        <>
          <label className="fld"><span>Question set — {sets.length} total, one shown at random per play</span>
            <select value={setIdx} onChange={(e) => setSetIdx(Number(e.target.value))}>{sets.map((s, i) => <option key={s.id} value={i}>{s.id}</option>)}</select>
          </label>
          <div className="row-btns">
            <button className="chip" onClick={duplicateSet}>+ Duplicate set</button>
            <button className="chip" disabled={sets.length <= 1} onClick={removeSet}>🗑 Remove this set</button>
          </div>
          <p className="muted">Each player is randomly shown one of these {sets.length} sets. Edits below apply to <b>{sets[setIdx]?.id}</b> only.</p>
        </>
      )}
      {Object.entries(questions || {}).map(([qk, q]) => (
        <div className="qedit" key={qk}>
          <div className="insp-h sub">{qk}</div>
          <Txt label="Prompt" area value={q.prompt} onChange={(v) => path((qs) => { qs[qk].prompt = v })} />
          {!sets && <Txt label="Pick label" value={q.pickLabel} onChange={(v) => path((qs) => { qs[qk].pickLabel = v })} />}
          {!sets && <Num label="Max select" value={q.maxSelect} onChange={(v) => path((qs) => { qs[qk].maxSelect = v })} />}
          {sets && (
            <label className="fld"><span>Correct</span><select value={q.correct || ''} onChange={(e) => path((qs) => { qs[qk].correct = e.target.value })}>{(q.options || []).map((o) => <option key={o.value} value={o.value}>{o.value}</option>)}</select></label>
          )}
          {(q.options || []).map((o, i) => (
            <div className="optrow" key={i}>
              <input className="optval" value={o.value} onChange={(e) => path((qs) => { qs[qk].options[i].value = e.target.value })} />
              <input className="optlabel" value={o.label} onChange={(e) => path((qs) => { qs[qk].options[i].label = e.target.value })} />
              <button className="x" onClick={() => path((qs) => { qs[qk].options.splice(i, 1) })}>×</button>
            </div>
          ))}
          <button className="chip" onClick={() => path((qs) => { qs[qk].options = [...(qs[qk].options || []), { value: String.fromCharCode(65 + (qs[qk].options?.length || 0)), label: 'New option' }] })}>+ option</button>
        </div>
      ))}
    </div>
  )
}

function RulesTab({ config, setConfig }) {
  const [text, setText] = useState(JSON.stringify(config.resultLogic || {}, null, 2))
  const [err, setErr] = useState('')
  const apply = () => {
    try { const parsed = JSON.parse(text); setConfig((prev) => ({ ...prev, resultLogic: parsed })); setErr('Applied ✓') }
    catch (e) { setErr('Invalid JSON: ' + e.message) }
  }
  return (
    <div className="insp-scroll">
      <div className="insp-h">Result logic ({config.resultLogic?.type})</div>
      <p className="muted">Recommendation quizzes map answers → a device/track → a flavour table. Trivia quizzes score correct answers. Edit the logic below.</p>
      <textarea className="json" value={text} onChange={(e) => setText(e.target.value)} spellCheck={false} />
      <button className="btn primary" onClick={apply}>Apply logic</button>
      {err && <div className="muted">{err}</div>}
    </div>
  )
}

function AssetsTab({ config, slug, token, update, selectElement, addElement }) {
  const [assets, setAssets] = useState(null)
  const [busy, setBusy] = useState(false)
  const load = () => api.listAssets(slug).then(setAssets).catch(() => setAssets([]))
  if (assets === null) load()
  const upload = async (e) => {
    const file = e.target.files?.[0]; if (!file) return
    setBusy(true)
    try { await api.uploadAsset(slug, file, token); await load() } finally { setBusy(false); e.target.value = '' }
  }
  const setAsBg = (url) => update((next) => { const scr = next.screens.find((s) => s.id === (window.__qwScreen || next.screens[0].id)) })
  return (
    <div className="insp-scroll">
      <div className="insp-h">Assets · {slug}</div>
      <label className="upload">{busy ? 'Uploading…' : '⬆ Upload image / font'}<input type="file" hidden onChange={upload} /></label>
      <div className="asset-grid">
        {(assets || []).map((a) => (
          <div key={a.name} className="asset" title={a.name}>
            {/\.(png|jpg|jpeg|gif|svg|webp)$/i.test(a.name)
              ? <img src={a.url} alt="" />
              : <span className="asset-file">{a.name.split('/').pop()}</span>}
            <button className="chip" onClick={() => navigator.clipboard?.writeText(a.url)}>copy url</button>
          </div>
        ))}
      </div>
      <p className="muted">Copy a URL, then paste it into an image element's “src”, a screen background, or a font URL in Settings.</p>
    </div>
  )
}

function SettingsTab({ config, update, screen }) {
  return (
    <div className="insp-scroll">
      <div className="insp-h">Project</div>
      <Txt label="Name" value={config.name} onChange={(v) => update((n) => { n.name = v })} />
      <Txt label="Language" value={config.language} onChange={(v) => update((n) => { n.language = v })} />
      <div className="insp-h sub">Analytics</div>
      <Txt label="Google Sheet Web App URL" value={config.analytics?.sheetWebAppUrl} onChange={(v) => update((n) => { n.analytics = { ...n.analytics, sheetWebAppUrl: v } })} />
      <div className="insp-h sub">Timings</div>
      <div className="grid2">
        <Num label="Transition ms" value={config.timings?.transitionMs} onChange={(v) => update((n) => { n.timings = { ...n.timings, transitionMs: v } })} />
        <Num label="Auto-reset ms" value={config.timings?.autoResetMs} onChange={(v) => update((n) => { n.timings = { ...n.timings, autoResetMs: v } })} />
      </div>
      <div className="insp-h sub">Banner</div>
      <label className="fld chk"><input type="checkbox" checked={!!config.banner?.enabled} onChange={(e) => update((n) => { n.banner = { ...n.banner, enabled: e.target.checked } })} /> Show banner</label>
      <Txt label="Banner image src" value={config.banner?.src} onChange={(v) => update((n) => { n.banner = { ...n.banner, src: v } })} />
      <Num label="Banner height %" value={config.banner?.heightPct} onChange={(v) => update((n) => { n.banner = { ...n.banner, heightPct: v } })} />
      <div className="insp-h sub">This screen ({screen?.id}) background</div>
      <label className="fld"><span>Type</span><select value={screen?.background?.type || 'color'} onChange={(e) => update((n) => { const s = n.screens.find((x) => x.id === screen.id); s.background = { ...s.background, type: e.target.value } })}><option value="color">color</option><option value="image">image</option></select></label>
      {screen?.background?.type === 'image'
        ? <Txt label="Background src" value={screen?.background?.src} onChange={(v) => update((n) => { const s = n.screens.find((x) => x.id === screen.id); s.background = { ...s.background, src: v } })} />
        : <Color label="Background colour" value={screen?.background?.color} onChange={(v) => update((n) => { const s = n.screens.find((x) => x.id === screen.id); s.background = { ...s.background, color: v } })} />}
      <div className="insp-h sub">Fonts</div>
      {(config.theme?.fonts || []).map((f, i) => (
        <div className="optrow" key={i}>
          <input className="optval" value={f.family} onChange={(e) => update((n) => { n.theme.fonts[i].family = e.target.value })} />
          <input className="optlabel" value={f.url} onChange={(e) => update((n) => { n.theme.fonts[i].url = e.target.value })} />
          <button className="x" onClick={() => update((n) => { n.theme.fonts.splice(i, 1) })}>×</button>
        </div>
      ))}
      <button className="chip" onClick={() => update((n) => { n.theme = n.theme || {}; n.theme.fonts = [...(n.theme.fonts || []), { family: 'New Font', url: '', weight: 400 }] })}>+ font</button>
    </div>
  )
}

function AiTab({ config, setConfig, slug, token }) {
  const [prompt, setPrompt] = useState('')
  const [docText, setDocText] = useState('')
  const [docName, setDocName] = useState('')
  const [busy, setBusy] = useState(false)
  const [log, setLog] = useState([])
  const onFile = async (e) => {
    const f = e.target.files?.[0]; if (!f) return
    setDocName(f.name); setDocText(await f.text())
  }
  const send = async () => {
    setBusy(true)
    try {
      const res = await api.ai({ slug, name: config.name, prompt, docText, config }, token)
      if (res.ok && res.config) { setConfig(res.config); setLog((l) => [{ role: 'ai', text: `✓ ${res.message} (${res.model || 'model'})` }, { role: 'you', text: prompt || docName }, ...l]); setPrompt('') }
      else setLog((l) => [{ role: 'err', text: res.message || 'No changes.' }, ...l])
    } catch (e) { setLog((l) => [{ role: 'err', text: e.message }, ...l]) }
    finally { setBusy(false) }
  }
  return (
    <div className="insp-scroll">
      <div className="insp-h">AI assistant · {config.name}</div>
      <p className="muted">Describe a change, or upload a client brief (.txt/.md/.csv). Sonnet edits <b>this</b> project’s config; review, then Save/Publish.</p>
      <textarea className="ai-prompt" rows={4} placeholder="e.g. Make all question titles 10% bigger and move the CTA up 60px" value={prompt} onChange={(e) => setPrompt(e.target.value)} />
      <label className="upload sm">{docName || '📎 Attach brief'}<input type="file" hidden accept=".txt,.md,.csv,.json" onChange={onFile} /></label>
      <button className="btn primary" disabled={busy} onClick={send}>{busy ? 'Thinking…' : 'Ask AI to edit'}</button>
      <div className="ai-log">
        {log.map((m, i) => <div key={i} className={`ai-msg ${m.role}`}>{m.text}</div>)}
      </div>
    </div>
  )
}
