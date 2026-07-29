// AI assistant proxy — mirrors the RTS pattern: the API key lives ONLY on the
// server (ANTHROPIC_API_KEY env / Secret Manager in prod); the browser never
// sees it. The assistant is project-aware: it receives the current quiz config
// and returns a full, edited config plus a short human summary.
const MODEL = (process.env.WIZARD_AI_MODEL || 'claude-sonnet-4-6').trim()
const MAX_TOKENS = Number(process.env.WIZARD_AI_MAX_TOKENS || 16000)

const SYSTEM = `You are the built-in AI editor for "Quiz Wizard", a modular kiosk quiz platform.
You edit a single quiz's JSON config. A config has: meta (id,name,slug,language), theme (canvasWidth,canvasHeight,fonts,colors), banner, background, timings (transitionMs,autoResetMs), questions (or sets[] for trivia), resultLogic (type "recommendation" or "score", plus mapping tables), flow[], and screens[]. Each screen has a background and elements[]. Every element has: id, type (text|prompt|pickLabel|button|image|options|resultList|scoreCircle|answerSummary|timer), x, y, w, h (pixels on the canvas, origin top-left), z (stacking), and a style object (fontFamily,fontWeight,fontSize,color,background,borderRadius,textAlign,lineHeight,letterSpacing,textTransform).

RULES:
- Apply ONLY the change the user asks for. Preserve everything else exactly, including element ids.
- Keep coordinates within the canvas (0..canvasWidth, 0..canvasHeight).
- To move an element use x/y; to resize use w/h; to layer use z; to restyle use the style object.
- Never invent asset paths; reuse existing src values unless the user supplies a new one.
- Respond with a SINGLE JSON object and nothing else: {"message": "<one-sentence summary of what you changed>", "config": <the full updated config object>}.`

export async function handleAi(req, res) {
  const { slug, name, prompt, docText, config } = req.body || {}
  if (!prompt && !docText) return res.status(400).json({ ok: false, message: 'Nothing to do — provide a prompt or a document.' })
  if (!process.env.ANTHROPIC_API_KEY) {
    return res.json({ ok: false, message: 'AI is not configured. Set ANTHROPIC_API_KEY on the server to enable the assistant.' })
  }
  try {
    const { default: Anthropic } = await import('@anthropic-ai/sdk')
    const client = new Anthropic()
    const userContent = [
      `Project: ${name || slug} (slug: ${slug}).`,
      docText ? `The user attached this client document/brief:\n"""\n${docText.slice(0, 20000)}\n"""` : '',
      `User request: ${prompt || 'Apply the changes described in the attached document.'}`,
      `Current config JSON:\n${JSON.stringify(config)}`,
    ].filter(Boolean).join('\n\n')

    const resp = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM,
      messages: [{ role: 'user', content: userContent }],
    })
    const text = (resp.content || []).filter((b) => b.type === 'text').map((b) => b.text).join('')
    const jsonStr = text.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim()
    const start = jsonStr.indexOf('{')
    const parsed = JSON.parse(jsonStr.slice(start))
    if (!parsed.config) return res.json({ ok: false, message: parsed.message || 'The assistant did not return a config.' })
    parsed.config.slug = slug
    return res.json({ ok: true, message: parsed.message || 'Applied changes.', config: parsed.config, model: MODEL })
  } catch (err) {
    return res.status(500).json({ ok: false, message: `AI error: ${err.message}` })
  }
}
