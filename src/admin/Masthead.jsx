import { useEffect, useRef, useState } from 'react'

// Top masthead (ink bar). Brand + project switcher on the left; status, live link,
// Save/Publish, and the signed-in user on the right.
export default function Masthead({ projects, slug, config, onPick, onNew, onSave, onPublish, status, user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  useEffect(() => {
    const away = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    window.addEventListener('mousedown', away); return () => window.removeEventListener('mousedown', away)
  }, [])
  const cur = projects.find((p) => p.slug === slug)

  return (
    <header className="k-masthead">
      <span className="k-brand">KIOSK<sup>ED·01</sup></span>
      <div className="k-proj" ref={ref}>
        <button className="k-proj-btn" onClick={() => setOpen((o) => !o)}>
          {cur?.name || 'Select project'} <span className="k-proj-slug">/{slug || '—'}</span> <span className="k-caret">▾</span>
        </button>
        {open && (
          <div className="k-proj-menu">
            {projects.map((p) => (
              <button key={p.slug} className={`k-proj-item ${slug === p.slug ? 'on' : ''}`} onClick={() => { onPick(p.slug); setOpen(false) }}>
                <span>{p.name}</span>
                <span className="k-proj-slug">/{p.slug}</span>
                <span className="k-count">{p.published ? '● live' : '○ draft'}</span>
              </button>
            ))}
            <button className="k-proj-new" onClick={() => { setOpen(false); onNew() }}>+ New project</button>
          </div>
        )}
      </div>

      <span className="k-mast-spacer" />
      {status && <span className="k-mast-status">{status}</span>}
      <a className="k-btn ghost" href={slug ? `/${slug}` : '/'} target="_blank" rel="noreferrer">Live ↗</a>
      <button className="k-btn ghost" onClick={onSave}>Save draft</button>
      <button className="k-btn yellow" onClick={onPublish}>Publish → /{slug}</button>
      <span className="k-user"><b>{user}</b></span>
      <button className="k-btn ghost" onClick={onLogout}>Sign out</button>
    </header>
  )
}
