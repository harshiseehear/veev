// Element registry. Each entry describes a canvas element type: a glyph for the
// layers list, a human label, whether it can be freely added, and a factory for
// sensible defaults. To add a new element type, add one entry here — the layers
// list, add-buttons and glyphs pick it up automatically.

export const ELEMENTS = {
  text:          { glyph: 'T',  label: 'Text',      addable: true },
  button:        { glyph: '⬭',  label: 'Button',    addable: true },
  image:         { glyph: '▧',  label: 'Image',     addable: true },
  prompt:        { glyph: '¶',  label: 'Prompt',    addable: false },
  pickLabel:     { glyph: '›',  label: 'Pick label', addable: false },
  options:       { glyph: '◫',  label: 'Options',   addable: false },
  resultList:    { glyph: '☰',  label: 'Result list', addable: false },
  scoreCircle:   { glyph: '◐',  label: 'Score',     addable: false },
  answerSummary: { glyph: '▤',  label: 'Answers',   addable: false },
  timer:         { glyph: '▬',  label: 'Timer',     addable: false },
}

export const glyphFor = (type) => ELEMENTS[type]?.glyph || '◇'
export const ADDABLE = Object.keys(ELEMENTS).filter((t) => ELEMENTS[t].addable)

// Build a fresh element of `type` at a reasonable spot, honouring the project's
// first font family for text-bearing elements.
export function makeElement(type, families = []) {
  const id = `${type}-${Math.random().toString(36).slice(2, 6)}`
  const base = { id, type, x: 120, y: 200, w: 500, h: 200, z: 5,
    style: { fontFamily: families[0] || 'sans-serif', fontWeight: 700, fontSize: 48, color: '#ffffff', textAlign: 'center' } }
  if (type === 'text') base.text = 'New text'
  if (type === 'button') { base.text = 'Button'; base.action = 'reset'; base.style.background = '#ffffff'; base.style.color = '#000000'; base.style.borderRadius = 999 }
  if (type === 'image') { base.src = ''; base.style = { objectFit: 'contain' } }
  return base
}

export function makeImageElement(url, cw = 1080, ch = 1920) {
  const w = Math.round(cw * 0.5), h = Math.round(ch * 0.25)
  return { id: `image-${Math.random().toString(36).slice(2, 6)}`, type: 'image', src: url,
    x: Math.round((cw - w) / 2), y: Math.round((ch - h) / 2), w, h, z: 6, style: { objectFit: 'contain' } }
}
