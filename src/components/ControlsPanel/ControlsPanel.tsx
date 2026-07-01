import { useApp } from '../../state/AppContext'
import { PRESET_ORDER, PRESET_LABELS, type PresetId } from '../../types'
import { SharedControls } from './SharedControls'
import { PresetControls } from './PresetControls'
import { CanvasSettingsControls } from './CanvasSettingsControls'
import './ControlsPanel.css'

export function ControlsPanel() {
  const { state, dispatch } = useApp()

  return (
    <aside className="controls-panel">
      <section className="panel-section">
        <label>Preset</label>
        <select
          value={state.preset}
          onChange={(e) => dispatch({ type: 'SET_PRESET', preset: e.target.value as PresetId })}
        >
          {PRESET_ORDER.map((preset) => (
            <option key={preset} value={preset}>{PRESET_LABELS[preset]}</option>
          ))}
        </select>
      </section>

      <section className="panel-section">
        <label>Animation</label>
        <SharedControls />
      </section>

      <section className="panel-section">
        <label>Canvas</label>
        <CanvasSettingsControls />
      </section>

      <section className="panel-section">
        <label>Preset Parameters</label>
        <PresetControls />
      </section>
    </aside>
  )
}
