import { Panel, Note, Row, Chip, Grid, Num, Txt, Select, Toggle, Color } from '../ui.jsx'

const clone = (o) => JSON.parse(JSON.stringify(o))

// PROJECT — project-wide settings: identity, analytics, timings/transition,
// banner, this-screen background, and fonts.
export default function ProjectPanel({ config, setConfig, screen }) {
  const update = (fn) => setConfig((prev) => { const next = clone(prev); fn(next); return next })
  const bg = screen?.background || {}
  const setBg = (patch) => update((n) => { const s = n.screens.find((x) => x.id === screen.id); s.background = { ...s.background, ...patch } })

  return (
    <>
      <Panel title="Project" tone="ink">
        <Txt label="Name" value={config.name} onChange={(v) => update((n) => { n.name = v })} />
        <Txt label="Language" value={config.language} onChange={(v) => update((n) => { n.language = v })} />
      </Panel>

      <Panel title="Analytics">
        <Txt label="Google Sheet Web App URL" value={config.analytics?.sheetWebAppUrl} onChange={(v) => update((n) => { n.analytics = { ...n.analytics, sheetWebAppUrl: v } })} />
      </Panel>

      <Panel title="Timings">
        <Grid>
          <Num label="Transition ms" value={config.timings?.transitionMs} onChange={(v) => update((n) => { n.timings = { ...n.timings, transitionMs: v } })} />
          <Num label="Auto-reset ms" value={config.timings?.autoResetMs} onChange={(v) => update((n) => { n.timings = { ...n.timings, autoResetMs: v } })} />
        </Grid>
        <Select label="Transition style" value={config.timings?.transitionStyle || ''} onChange={(v) => update((n) => { n.timings = { ...n.timings, transitionStyle: v || undefined } })}>
          <option value="">fade (default)</option>
          <option value="slideFade">slide-fade (elements only, static bg)</option>
          <option value="crossfade">crossfade (dissolve, bg holds then new fades in)</option>
        </Select>
      </Panel>

      <Panel title="Banner">
        <Toggle label="Show banner" checked={config.banner?.enabled} onChange={(v) => update((n) => { n.banner = { ...n.banner, enabled: v } })} />
        <Txt label="Banner image src" value={config.banner?.src} onChange={(v) => update((n) => { n.banner = { ...n.banner, src: v } })} />
        <Num label="Banner height %" value={config.banner?.heightPct} onChange={(v) => update((n) => { n.banner = { ...n.banner, heightPct: v } })} />
      </Panel>

      <Panel title="Background" sub={screen?.id} tone="orange">
        <Select label="Type" value={bg.type || 'color'} onChange={(v) => setBg({ type: v })} options={['color', 'image']} />
        {bg.type === 'image'
          ? <Txt label="Background src" value={bg.src} onChange={(v) => setBg({ src: v })} />
          : <Color label="Background colour" value={bg.color} onChange={(v) => setBg({ color: v })} />}
      </Panel>

      <Panel title="Fonts">
        {(config.theme?.fonts || []).map((f, i) => (
          <div className="k-optrow" key={i}>
            <input className="k-input" value={f.family} onChange={(e) => update((n) => { n.theme.fonts[i].family = e.target.value })} />
            <input className="k-input" value={f.url} onChange={(e) => update((n) => { n.theme.fonts[i].url = e.target.value })} />
            <button className="k-x" onClick={() => update((n) => { n.theme.fonts.splice(i, 1) })}>×</button>
          </div>
        ))}
        <Row><Chip onClick={() => update((n) => { n.theme = n.theme || {}; n.theme.fonts = [...(n.theme.fonts || []), { family: 'New Font', url: '', weight: 400 }] })}>+ font</Chip></Row>
      </Panel>
    </>
  )
}
