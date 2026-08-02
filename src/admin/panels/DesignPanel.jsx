import { useState } from 'react'
import { Panel, Section, Note, Row, Grid, Btn, Chip, Num, Txt, Select, Toggle, Color } from '../ui.jsx'

// DESIGN — geometry + type + colour of the selected element (scope-aware), plus
// the multi-select group tools. Mirrors the old Element tab, restructured into
// chunky titled panels.
export default function DesignPanel({ edit, config }) {
  const { selectedIds, effectiveEl: el, isSetScope, previewSetId, activeQid } = edit

  if (selectedIds.length > 1) return <GroupPanel edit={edit} />
  if (!el) return (
    <Panel title="Design" sub="no selection">
      <Note>Select an element on the canvas to edit it. Drag to move, drag the blue corner to resize, arrow-keys to nudge. Shift-click to multi-select.</Note>
    </Panel>
  )

  const s = el.style || {}
  const families = [...new Set((config.theme?.fonts || []).map((f) => f.family))]
  const isText = el.type !== 'image' && el.type !== 'timer'

  return (
    <>
      <Panel title={el.type} sub={el.id} tone="mango">
        {isSetScope && <div className="k-scope">Styling <b>{previewSetId}</b> · {activeQid} — each set keeps its own look. Position/size are shared across sets.</div>}
        <Grid>
          <Num label="X" value={el.x} onChange={(v) => edit.patchSel({ x: v })} />
          <Num label="Y" value={el.y} onChange={(v) => edit.patchSel({ y: v })} />
          <Num label="W" value={el.w} onChange={(v) => edit.patchSel({ w: v })} />
          <Num label="H" value={el.h} onChange={(v) => edit.patchSel({ h: v })} />
          <Num label="Z layer" value={el.z} onChange={(v) => edit.patchSel({ z: v })} />
        </Grid>
        <Row>
          <Chip onClick={() => edit.reorder(el.id, 'front')}>⤒ Front</Chip>
          <Chip onClick={() => edit.reorder(el.id, 'back')}>⤓ Back</Chip>
          <Chip onClick={() => edit.patchSel({ hidden: !el.hidden })}>{el.hidden ? 'Show' : 'Hide'}</Chip>
          <Chip onClick={edit.centerSelH}>⯐ Center H</Chip>
          <Chip onClick={edit.centerSelV}>⯐ Center V</Chip>
        </Row>
      </Panel>

      {/* content-bearing fields */}
      {(['text', 'button'].includes(el.type) || el.type === 'image' || ['prompt', 'pickLabel'].includes(el.type)) && (
        <Panel title="Content">
          {['text', 'button'].includes(el.type) && <Txt label="Text" area value={el.text} onChange={(v) => edit.patchSel({ text: v })} />}
          {el.type === 'button' && (
            <>
              <Select label="Action" value={el.action || 'reset'} onChange={(v) => edit.patchSel({ action: v })} options={['start', 'reset']} />
              <Select label="Icon" value={el.icon || ''} onChange={(v) => edit.patchSel({ icon: v || undefined })}>
                <option value="">none (show text)</option>
                <option value="arrow">→ arrow</option>
              </Select>
              {el.icon && <Num label="Icon size (% of box)" value={el.iconScale} onChange={(v) => edit.patchSel({ iconScale: v })} />}
            </>
          )}
          {el.type === 'image' && <>
            <Txt label="Image src" value={el.src} onChange={(v) => edit.patchSel({ src: v })} />
            <Select label="Fit" value={s.objectFit || 'contain'} onChange={(v) => edit.patchSelStyle({ objectFit: v })}
              options={[{ value: 'contain', label: 'contain (whole image)' }, { value: 'cover', label: 'cover (fill, crop)' }, { value: 'fill', label: 'fill (stretch)' }]} />
          </>}
          {['prompt', 'pickLabel'].includes(el.type) && <Note>Text comes from the question (Content tab). Style it below.</Note>}
        </Panel>
      )}

      {/* typography */}
      {isText && (
        <Panel title="Type">
          <Row>
            <Chip on={s.fontWeight >= 700} onClick={() => edit.patchSelStyle({ fontWeight: s.fontWeight >= 700 ? 400 : 700 })}><b>B</b> Bold</Chip>
            <Chip on={s.fontStyle === 'italic'} onClick={() => edit.patchSelStyle({ fontStyle: s.fontStyle === 'italic' ? 'normal' : 'italic' })}><i>I</i> Italic</Chip>
          </Row>
          <Select label="Font" value={s.fontFamily || ''} onChange={(v) => edit.patchSelStyle({ fontFamily: v })}>
            <option value="">(inherit)</option>
            {families.map((f) => <option key={f} value={f}>{f}</option>)}
            <option value="sans-serif">sans-serif</option>
          </Select>
          <Grid>
            <Num label="Size" value={s.fontSize} onChange={(v) => edit.patchSelStyle({ fontSize: v })} />
            <Num label="Weight" step={100} value={s.fontWeight} onChange={(v) => edit.patchSelStyle({ fontWeight: v })} />
            <Num label="Line H" step={0.05} value={s.lineHeight} onChange={(v) => edit.patchSelStyle({ lineHeight: v })} />
            <Num label="Letter" step={0.5} value={s.letterSpacing} onChange={(v) => edit.patchSelStyle({ letterSpacing: v })} />
          </Grid>
          <Select label="Align" value={s.textAlign || 'center'} onChange={(v) => edit.patchSelStyle({ textAlign: v })} options={['left', 'center', 'right']} />
          <Select label="Transform" value={s.textTransform || 'none'} onChange={(v) => edit.patchSelStyle({ textTransform: v })} options={['none', 'uppercase', 'lowercase']} />
        </Panel>
      )}

      {/* colour */}
      <Panel title="Colour" tone="orange">
        <Color label="Text colour" value={s.color} onChange={(v) => edit.patchSelStyle({ color: v })} />
        <Color label="Background" value={s.background} onChange={(v) => edit.patchSelStyle({ background: v })} />
        <Row><Chip on={s.background === 'transparent' || s.background === ''} onClick={() => edit.patchSelStyle({ background: 'transparent' })}>No fill (transparent)</Chip></Row>
        <Num label="Corner radius" value={s.borderRadius} onChange={(v) => edit.patchSelStyle({ borderRadius: v })} />
      </Panel>

      {/* option cards */}
      {['options', 'resultList'].includes(el.type) && (
        <Panel title="Option cards">
          <Num label="Gap" value={el.gap} onChange={(v) => edit.patchSel({ gap: v })} />
          {el.type === 'options' && <Toggle label="Show A) B) letters" checked={el.showLetters} onChange={(v) => edit.patchSel({ showLetters: v })} />}
          <OptionStyle el={el} edit={edit} />
        </Panel>
      )}

      {/* answer summary */}
      {el.type === 'answerSummary' && (
        <Panel title="Answer cards">
          <Grid>
            <Num label="Card height" value={s.height} onChange={(v) => edit.patchSelStyle({ height: v })} />
            <Num label="Gap" value={el.gap} onChange={(v) => edit.patchSel({ gap: v })} />
            <Num label="Font size" value={s.fontSize} onChange={(v) => edit.patchSelStyle({ fontSize: v })} />
            <Num label="Pad X" value={s.paddingX} onChange={(v) => edit.patchSelStyle({ paddingX: v })} />
            <Num label="Radius" value={s.borderRadius} onChange={(v) => edit.patchSelStyle({ borderRadius: v })} />
          </Grid>
          <Color label="Correct bg" value={s.correctBg} onChange={(v) => edit.patchSelStyle({ correctBg: v })} />
          <Color label="Correct text" value={s.correctColor} onChange={(v) => edit.patchSelStyle({ correctColor: v })} />
          <Color label="Wrong bg" value={s.wrongBg} onChange={(v) => edit.patchSelStyle({ wrongBg: v })} />
          <Color label="Wrong text" value={s.wrongColor} onChange={(v) => edit.patchSelStyle({ wrongColor: v })} />
        </Panel>
      )}

      <ActionsPanel edit={edit} />
    </>
  )
}

function ActionsPanel({ edit }) {
  const [msg, setMsg] = useState('')
  return (
    <Panel title="Element actions">
      <Row>
        <Btn onClick={() => setMsg(edit.copyStyle())}>⧉ Copy</Btn>
        <Btn disabled={!edit.hasClip} onClick={() => setMsg(edit.pasteStyle())}>⤵ Paste</Btn>
      </Row>
      {msg && <Note>{msg}</Note>}
      <Btn variant="danger wide" onClick={edit.removeSelected}>Delete element</Btn>
    </Panel>
  )
}

function OptionStyle({ el, edit }) {
  const os = el.optionStyle || {}, sel = el.selectedStyle || {}
  const set = (patch) => edit.patchSelOptionStyle(patch)
  const setSel = (patch) => edit.patchSel({ selectedStyle: { ...sel, ...patch } })
  return (
    <Grid>
      <Num label="Card H" value={os.height} onChange={(v) => set({ height: v })} />
      <Num label="Pad X" value={os.paddingX} onChange={(v) => set({ paddingX: v })} />
      <Num label="Font size" value={os.fontSize} onChange={(v) => set({ fontSize: v })} />
      <Num label="Radius" value={os.borderRadius} onChange={(v) => set({ borderRadius: v })} />
      <label className="k-field k-span2"><span>Card bg</span><input type="color" value={/^#/.test(os.background || '') ? os.background : '#ffffff'} onChange={(e) => set({ background: e.target.value })} /></label>
      <label className="k-field k-span2"><span>Card text</span><input type="color" value={/^#/.test(os.color || '') ? os.color : '#000000'} onChange={(e) => set({ color: e.target.value })} /></label>
      {el.type === 'options' && <label className="k-field k-span2"><span>Selected bg</span><input type="color" value={/^#/.test(sel.background || '') ? sel.background : '#e7c9ff'} onChange={(e) => setSel({ background: e.target.value })} /></label>}
    </Grid>
  )
}

function GroupPanel({ edit }) {
  return (
    <Panel title={`${edit.selectedIds.length} selected`} tone="orange">
      <Note>Drag any one to move them together; arrow-keys nudge the group. Shift-click on the canvas to add/remove.</Note>
      <Section>Center on canvas</Section>
      <Row>
        <Chip onClick={() => edit.centerGroupOnCanvas('h')}>⯐ Center H</Chip>
        <Chip onClick={() => edit.centerGroupOnCanvas('v')}>⯐ Center V</Chip>
      </Row>
      <Section>Align to each other</Section>
      <Row>
        <Chip onClick={() => edit.alignGroup('left')}>Left</Chip>
        <Chip onClick={() => edit.alignGroup('hcenter')}>Center</Chip>
        <Chip onClick={() => edit.alignGroup('right')}>Right</Chip>
      </Row>
      <Row>
        <Chip onClick={() => edit.alignGroup('top')}>Top</Chip>
        <Chip onClick={() => edit.alignGroup('vmiddle')}>Middle</Chip>
        <Chip onClick={() => edit.alignGroup('bottom')}>Bottom</Chip>
      </Row>
    </Panel>
  )
}
