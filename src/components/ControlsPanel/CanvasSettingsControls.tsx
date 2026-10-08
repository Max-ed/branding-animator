import { useRef } from 'react'
import { useApp } from '../../state/AppContext'
import { makeId } from '../../lib/id'
import type { Asset } from '../../types'

export function CanvasSettingsControls() {
  const { state, dispatch } = useApp()
  const { backgroundColor, backgroundAsset, dropShadow, cornerRadius, outline } = state.canvas
  const bgInputRef = useRef<HTMLInputElement>(null)

  function handleBgFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const type = file.type.startsWith('video/') ? 'video' : 'image'
    const asset: Asset = { id: makeId(), type, name: file.name, url: URL.createObjectURL(file), file }
    dispatch({ type: 'SET_BACKGROUND_ASSET', asset })
    e.target.value = ''
  }

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

      <div className="control-field control-field-row">
        <label>Background Media</label>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <button onClick={() => bgInputRef.current?.click()} style={{ fontSize: 11 }}>
            {backgroundAsset ? 'Replace' : 'Upload'}
          </button>
          {backgroundAsset && (
            <button onClick={() => dispatch({ type: 'SET_BACKGROUND_ASSET', asset: null })} style={{ fontSize: 11 }}>
              Clear
            </button>
          )}
          <input
            ref={bgInputRef}
            type="file"
            accept="image/*,video/*"
            style={{ display: 'none' }}
            onChange={handleBgFileChange}
          />
        </div>
      </div>
      {backgroundAsset && (
        <div className="control-field">
          <span style={{ fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            {backgroundAsset.name}
          </span>
        </div>
      )}

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
        <label>Outline</label>
        <input
          type="checkbox"
          checked={outline.enabled}
          onChange={(e) => dispatch({ type: 'SET_OUTLINE', outline: { enabled: e.target.checked } })}
        />
      </div>

      {outline.enabled && (
        <>
          <div className="control-field control-field-row">
            <label>Outline Color</label>
            <input
              type="color"
              className="color-swatch"
              value={outline.color}
              onChange={(e) => dispatch({ type: 'SET_OUTLINE', outline: { color: e.target.value } })}
            />
          </div>

          <div className="control-field">
            <label>Outline Thickness — {outline.thickness}px</label>
            <input
              type="range"
              min={1}
              max={60}
              value={outline.thickness}
              onChange={(e) => dispatch({ type: 'SET_OUTLINE', outline: { thickness: Number(e.target.value) } })}
            />
          </div>
        </>
      )}

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
