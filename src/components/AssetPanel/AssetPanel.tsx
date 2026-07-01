import { useRef } from 'react'
import { useApp } from '../../state/AppContext'
import { createAssetsFromFiles } from '../../lib/assets'
import { AssetThumb } from './AssetThumb'
import { SlotList } from './SlotList'
import './AssetPanel.css'

export function AssetPanel() {
  const { state, dispatch } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)

  function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return
    dispatch({ type: 'ADD_ASSETS', assets: createAssetsFromFiles(files) })
  }

  return (
    <aside className="asset-panel">
      <section className="panel-section">
        <div className="panel-section-header">
          <label>Asset Library</label>
          <button className="upload-btn" onClick={() => inputRef.current?.click()}>
            + Upload
          </button>
          <input
            ref={inputRef}
            type="file"
            multiple
            hidden
            accept=".jpg,.jpeg,.png,.webp,.svg,.mp4,.webm,image/jpeg,image/png,image/webp,image/svg+xml,video/mp4,video/webm"
            onChange={(e) => {
              handleFiles(e.target.files)
              e.target.value = ''
            }}
          />
        </div>

        {state.assets.length === 0 ? (
          <p className="panel-empty">No assets yet. Upload images or video loops.</p>
        ) : (
          <div className="asset-grid">
            {state.assets.map((asset) => (
              <div
                key={asset.id}
                className="asset-grid-item"
                title={`Add ${asset.name} to ${state.preset} slots`}
                onClick={() => dispatch({ type: 'ADD_SLOT', assetId: asset.id })}
              >
                <AssetThumb asset={asset} />
                <button
                  className="asset-remove"
                  onClick={(e) => {
                    e.stopPropagation()
                    dispatch({ type: 'REMOVE_ASSET', id: asset.id })
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="panel-section panel-section-grow">
        <div className="panel-section-header">
          <label>Slots — current preset</label>
        </div>
        <SlotList />
      </section>
    </aside>
  )
}
