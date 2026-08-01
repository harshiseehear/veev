import { useRef } from 'react'

// A thin vertical drag handle. Calls onDelta(dxSinceLastMove) as the pointer moves.
export default function Resizer({ onDelta }) {
  const last = useRef(0)
  const onDown = (e) => {
    e.preventDefault()
    last.current = e.clientX
    const move = (ev) => { const dx = ev.clientX - last.current; last.current = ev.clientX; onDelta(dx) }
    const up = () => {
      window.removeEventListener('mousemove', move)
      window.removeEventListener('mouseup', up)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', up)
  }
  return <div className="resizer" onMouseDown={onDown} title="Drag to resize" />
}
