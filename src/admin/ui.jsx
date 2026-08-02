// Kiosk editor UI kit — the small set of controls every panel composes from.
// Keeping them here (one import) is what makes the panels short and consistent,
// and makes restyling the whole editor a one-file change.

// ---- colour helpers (alpha-aware hex, produces #RRGGBBAA under 100%) --------
export const baseHex = (v) => (/^#[0-9a-fA-F]{8}$/.test(v || '') ? v.slice(0, 7) : /^#[0-9a-fA-F]{6}$/.test(v || '') ? v : '#000000')
export const hexAlpha = (v) => (/^#[0-9a-fA-F]{8}$/.test(v || '') ? Math.round((parseInt(v.slice(7, 9), 16) / 255) * 100) : 100)
export const withAlpha = (hex, a) => (a >= 100 ? hex : hex + Math.round((a / 100) * 255).toString(16).padStart(2, '0'))

// ---- primitives -------------------------------------------------------------
export const Section = ({ children }) => <div className="k-secline">{children}</div>
export const Note = ({ children }) => <p className="k-muted">{children}</p>
export const Row = ({ children }) => <div className="k-row">{children}</div>
export const Grid = ({ children }) => <div className="k-grid2">{children}</div>

export const Btn = ({ children, variant = '', ...p }) => <button className={`k-btn ${variant}`} {...p}>{children}</button>
export const Chip = ({ children, on, ...p }) => <button className={`k-chip ${on ? 'on' : ''}`} {...p}>{children}</button>

// A titled chunky panel (the render-settings block look). tone: '' | 'orange' | 'ink'
export const Panel = ({ title, sub, tone = '', children }) => (
  <div className="k-panel">
    <div className={`k-panel-head ${tone}`}>
      <span className="k-panel-title">{title}</span>
      {sub != null && <span className="k-panel-sub">{sub}</span>}
    </div>
    <div className="k-panel-body">{children}</div>
  </div>
)

// ---- inputs -----------------------------------------------------------------
export const Num = ({ label, value, onChange, step = 1, ...p }) => (
  <label className="k-field"><span>{label}</span>
    <input type="number" step={step} value={value ?? ''} onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))} {...p} />
  </label>
)

export const Txt = ({ label, value, onChange, area, ...p }) => (
  <label className="k-field"><span>{label}</span>
    {area
      ? <textarea rows={3} value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} />
      : <input value={value ?? ''} onChange={(e) => onChange(e.target.value)} {...p} />}
  </label>
)

export const Select = ({ label, value, onChange, options, children }) => (
  <label className="k-field"><span>{label}</span>
    <select value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {options ? options.map((o) => (
        typeof o === 'string' ? <option key={o} value={o}>{o}</option> : <option key={o.value} value={o.value}>{o.label}</option>
      )) : children}
    </select>
  </label>
)

export const Toggle = ({ label, checked, onChange }) => (
  <label className="k-field chk"><input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} /> {label}</label>
)

export const Color = ({ label, value, onChange }) => {
  const hex = baseHex(value); const a = hexAlpha(value)
  return (
    <label className="k-field"><span>{label}</span>
      <span className="k-color">
        <input type="color" value={hex} onChange={(e) => onChange(withAlpha(e.target.value, a))} />
        <input className="k-hex" value={value ?? ''} onChange={(e) => onChange(e.target.value)} placeholder="transparent" />
      </span>
      <span className="k-alpha">
        <input type="range" min="0" max="100" value={a} onChange={(e) => onChange(withAlpha(hex, Number(e.target.value)))} />
        <span>{a}%</span>
      </span>
    </label>
  )
}
