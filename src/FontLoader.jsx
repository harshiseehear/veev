import { useEffect } from 'react'
import { resolveAsset } from './api.js'

// Injects @font-face rules for a config's fonts so the player/editor render
// with the project's real typography.
export default function FontLoader({ fonts = [], id = 'default' }) {
  useEffect(() => {
    const styleId = `qw-fonts-${id}`
    let tag = document.getElementById(styleId)
    if (!tag) {
      tag = document.createElement('style')
      tag.id = styleId
      document.head.appendChild(tag)
    }
    tag.textContent = fonts
      .map(
        (f) => `@font-face{font-family:'${f.family}';src:url('${resolveAsset(f.url)}');font-weight:${f.weight || 400};font-style:${f.style || 'normal'};font-display:swap;}`,
      )
      .join('\n')
  }, [JSON.stringify(fonts), id])
  return null
}
