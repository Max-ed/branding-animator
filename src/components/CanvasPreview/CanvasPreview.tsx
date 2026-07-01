import { useEffect, useRef } from 'react'
import { useApp } from '../../state/AppContext'
import { FORMATS } from '../../types'
import { useScaleToFit } from '../../lib/useScaleToFit'
import { getLoopDurationMs } from '../../lib/loopDuration'
import { formatStyleVars } from '../../lib/dimensions'
import { PRESET_COMPONENTS } from '../presets'
import '../presets/presets.css'
import './CanvasPreview.css'

export function CanvasPreview() {
  const { state, dispatch } = useApp()
  const viewportRef = useRef<HTMLDivElement>(null)

  const format = FORMATS[state.format]
  const scale = useScaleToFit(viewportRef, format.width, format.height)

  const slots = state.presetSlots[state.preset]
  const assetsById = Object.fromEntries(state.assets.map((a) => [a.id, a]))
  const params = state.presetParams[state.preset]
  const loopMs = getLoopDurationMs(state.preset, params, state.shared, slots.length)

  useEffect(() => {
    if (!state.isPlaying) return
    const timer = setTimeout(() => dispatch({ type: 'RESTART' }), loopMs)
    return () => clearTimeout(timer)
  }, [state.isPlaying, state.playKey, loopMs, dispatch])

  const PresetComponent = PRESET_COMPONENTS[state.preset]

  return (
    <main className="canvas-preview">
      <div ref={viewportRef} className="preview-viewport" style={formatStyleVars(state.format)}>
        <div
          className="preview-stage"
          style={{
            width: format.width,
            height: format.height,
            transform: `scale(${scale})`,
            backgroundColor: state.canvas.backgroundColor,
          }}
        >
          <PresetComponent
            slots={slots}
            assets={assetsById}
            params={params as never}
            shared={state.shared}
            playKey={state.playKey}
            width={format.width}
            height={format.height}
          />
        </div>
      </div>

      <div className="preview-transport">
        <button onClick={() => dispatch({ type: 'SET_PLAYING', isPlaying: !state.isPlaying })}>
          {state.isPlaying ? 'Pause' : 'Play'}
        </button>
        <button onClick={() => dispatch({ type: 'RESTART' })}>Restart</button>
        <span className="preview-meta">
          {format.label} · {(loopMs / 1000).toFixed(1)}s loop
        </span>
      </div>
    </main>
  )
}
