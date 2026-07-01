import { useApp } from '../../state/AppContext'
import { PRESET_ORDER } from '../../types'
import { PresetTile } from './PresetTile'
import { SharedControls } from './SharedControls'
import { PresetControls } from './PresetControls'
import { CanvasSettingsControls } from './CanvasSettingsControls'
import './PresetTile.css'
import './ControlsPanel.css'

export function ControlsPanel() {
  const { state, dispatch } = useApp()

  return (
    <aside className="controls-panel">
      <section className="panel-section">
        <label>Preset</label>
        <div className="preset-tile-list">
          {PRESET_ORDER.map((preset) => (
            <PresetTile
              key={preset}
              preset={preset}
              active={state.preset === preset}
              onSelect={() => dispatch({ type: 'SET_PRESET', preset })}
            />
          ))}
        </div>
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
