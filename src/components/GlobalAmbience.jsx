import { useCallback, useEffect, useState } from 'react'
import {
  getSfxEnabled,
  playPixelClickBeep,
  setSfxEnabled,
} from '../lib/sfx'

const LEAVES = [
  { left: '7%', dur: '10s', delay: '0s' },
  { left: '22%', dur: '14s', delay: '1.5s' },
  { left: '38%', dur: '8s', delay: '0.4s' },
  { left: '55%', dur: '11s', delay: '2.2s' },
  { left: '72%', dur: '9s', delay: '3s' },
  { left: '88%', dur: '13s', delay: '0.8s' },
]

export function GlobalAmbience() {
  const [sfxOn, setSfxOn] = useState(getSfxEnabled)

  const toggleSfx = useCallback(() => {
    setSfxOn((prev) => {
      const next = !prev
      setSfxEnabled(next)
      if (next) void playPixelClickBeep()
      return next
    })
  }, [])

  useEffect(() => {
    if (!sfxOn) return

    const maybePlayClick = (target) => {
      if (!(target instanceof Element)) return
      if (target.closest('[data-sfx-skip]')) return
      if (
        target.closest('.leaflet-control-zoom-in') ||
        target.closest('.leaflet-control-zoom-out')
      ) {
        void playPixelClickBeep()
        return
      }
      const btn = target.closest('button')
      if (btn && btn.type !== 'submit') {
        void playPixelClickBeep()
        return
      }
      if (target.closest('input[type="button"], input[type="reset"]')) {
        void playPixelClickBeep()
      }
    }

    const onClickCapture = (e) => {
      maybePlayClick(e.target)
    }

    const onSubmitCapture = () => {
      void playPixelClickBeep()
    }

    document.addEventListener('click', onClickCapture, true)
    document.addEventListener('submit', onSubmitCapture, true)
    return () => {
      document.removeEventListener('click', onClickCapture, true)
      document.removeEventListener('submit', onSubmitCapture, true)
    }
  }, [sfxOn])

  return (
    <>
      <div className="app-leaves-layer" aria-hidden>
        {LEAVES.map((leaf, i) => (
          <span
            key={i}
            className="app-leaf"
            style={{
              left: leaf.left,
              animationDuration: leaf.dur,
              animationDelay: leaf.delay,
            }}
          >
            🍃
          </span>
        ))}
      </div>

      <button
        type="button"
        data-sfx-skip
        onClick={toggleSfx}
        className="cozy-pixel-btn fixed bottom-4 left-4 z-[4000] bg-[#2d1f0e] px-3 py-2 text-[0.45rem] leading-snug text-[#e8c96d] shadow-[3px_3px_0_#000] transition-transform duration-75 hover:brightness-110"
        aria-pressed={sfxOn}
        title="Toggle click sounds"
      >
        🔊 SFX: {sfxOn ? 'ON' : 'OFF'}
      </button>
    </>
  )
}
