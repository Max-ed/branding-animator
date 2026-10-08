import { useState } from 'react'
import { useApp } from '../../state/AppContext'
import { resolveShared } from '../../lib/loopDuration'
import type { EasingMode } from '../../types'

const EASING_OPTIONS: { id: EasingMode; label: string }[] = [
  { id: 'gentle', label: 'Gentle' },
  { id: 'spring', label: 'Spring' },
  { id: 'linear', label: 'Linear' },
]

export function SharedControls() {
  const { state, dispatch } = useApp()
  const { durationSec } = state.shared
  // Draft string so partial input like "2." can be typed before it's a valid number.
  const [draft, setDraft] = useState(durationSec?.toString() ?? '')

  const effective = resolveShared(
    state.preset,
    state.presetParams[state.preset],
    state.shared,
    state.presetSlots[state.preset].length,
  )

  function onDurationChange(value: string) {
    setDraft(value)
    if (value.trim() === '') {
      dispatch({ type: 'SET_DURATION', durationSec: null })
      return
    }
    const n = Number(value)
    if (Number.isFinite(n) && n > 0) dispatch({ type: 'SET_DURATION', durationSec: Math.min(n, 120) })
  }

  return (
    <div className="control-group">
      <div className="control-field">
        <label>Easing Mode</label>
        <select
          value={state.shared.easing}
          onChange={(e) => dispatch({ type: 'SET_EASING', easing: e.target.value as EasingMode })}
        >
          {EASING_OPTIONS.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="control-field">
        <label>Clip Duration (s) — empty = auto</label>
        <input
          type="number"
          min={0.5}
          max={120}
          step={0.5}
          placeholder="auto"
          value={draft}
          onChange={(e) => onDurationChange(e.target.value)}
        />
      </div>

      <div className="control-field">
        <label>
          Speed — {effective.speed.toFixed(2)}×{durationSec ? ' (set by duration)' : ''}
        </label>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={state.shared.speed}
          disabled={Boolean(durationSec)}
          onChange={(e) => dispatch({ type: 'SET_SPEED', speed: Number(e.target.value) })}
        />
      </div>
    </div>
  )
}
