import { useApp } from '../../state/AppContext'

export function CanvasSettingsControls() {
  const { state, dispatch } = useApp()
  const { backgroundColor, dropShadow, cornerRadius } = state.canvas

  return (
    <div className="control-group">
      <div className="control-field control-field-row">
        <label>Background Color</label>
        <input
          type="color"
          className="color-swatch"
          value={backgroundColor}
          onChange={(e) => dispatch({ type: 'SET_BACKGROUND_COLOR', color: e.target.value })}
        />
      </div>

      <div className="control-field">
        <label>Corner Radius — {cornerRadius}%</label>
        <input
          type="range"
          min={0}
          max={50}
          value={cornerRadius}
          onChange={(e) => dispatch({ type: 'SET_CORNER_RADIUS', cornerRadius: Number(e.target.value) })}
        />
      </div>

      <div className="control-field control-field-row">
        <label>Drop Shadow</label>
        <input
          type="checkbox"
          checked={dropShadow.enabled}
          onChange={(e) => dispatch({ type: 'SET_DROP_SHADOW', dropShadow: { enabled: e.target.checked } })}
        />
      </div>

      {dropShadow.enabled && (
        <>
          <div className="control-field">
            <label>Shadow Offset Y — {dropShadow.offsetY}px</label>
            <input
              type="range"
              min={0}
              max={60}
              value={dropShadow.offsetY}
              onChange={(e) => dispatch({ type: 'SET_DROP_SHADOW', dropShadow: { offsetY: Number(e.target.value) } })}
            />
          </div>

          <div className="control-field">
            <label>Shadow Blur — {dropShadow.blur}px</label>
            <input
              type="range"
              min={0}
              max={100}
              value={dropShadow.blur}
              onChange={(e) => dispatch({ type: 'SET_DROP_SHADOW', dropShadow: { blur: Number(e.target.value) } })}
            />
          </div>

          <div className="control-field">
            <label>Shadow Transparency — {Math.round(dropShadow.opacity * 100)}%</label>
            <input
              type="range"
              min={0}
              max={100}
              value={Math.round(dropShadow.opacity * 100)}
              onChange={(e) =>
                dispatch({ type: 'SET_DROP_SHADOW', dropShadow: { opacity: Number(e.target.value) / 100 } })
              }
            />
          </div>
        </>
      )}
    </div>
  )
}
