import { useApp } from '../../state/AppContext'
import type { EasingMode } from '../../types'

const EASING_OPTIONS: { id: EasingMode; label: string }[] = [
  { id: 'gentle', label: 'Gentle' },
  { id: 'spring', label: 'Spring' },
  { id: 'linear', label: 'Linear' },
]

export function SharedControls() {
  const { state, dispatch } = useApp()

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
        <label>Speed — {state.shared.speed.toFixed(1)}×</label>
        <input
          type="range"
          min={0.5}
          max={3}
          step={0.1}
          value={state.shared.speed}
          onChange={(e) => dispatch({ type: 'SET_SPEED', speed: Number(e.target.value) })}
        />
      </div>
    </div>
  )
}
