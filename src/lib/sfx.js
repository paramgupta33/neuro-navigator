const STORAGE_KEY = 'neuronav-sfx-enabled'

export function getSfxEnabled() {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function setSfxEnabled(value) {
  try {
    localStorage.setItem(STORAGE_KEY, value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

let audioCtx = null

function getAudioContext() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return null
  if (!audioCtx) audioCtx = new AC()
  return audioCtx
}

/** ~80ms soft pixel-style square beep */
export async function playPixelClickBeep() {
  const ctx = getAudioContext()
  if (!ctx) return
  try {
    await ctx.resume()
    const t0 = ctx.currentTime
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(520, t0)
    osc.frequency.exponentialRampToValueAtTime(780, t0 + 0.04)
    gain.gain.setValueAtTime(0.0001, t0)
    gain.gain.exponentialRampToValueAtTime(0.055, t0 + 0.012)
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.08)
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start(t0)
    osc.stop(t0 + 0.085)
  } catch {
    /* ignore */
  }
}
