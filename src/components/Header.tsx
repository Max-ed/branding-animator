import { useRef, useState } from 'react'
import { FORMATS, type FormatId } from '../types'
import { useApp } from '../state/AppContext'
import { useExport } from '../state/ExportContext'
import { EXPORT_FORMATS, getExportFormat, type ExportFormatId, type ExportQuality } from '../lib/exportFormats'
import { CONFIG_EXTENSION, loadConfig, saveConfig } from '../lib/configFile'
import { clearMediaCache } from '../lib/mediaCache'
import './Header.css'

export function Header() {
  const { state, dispatch } = useApp()
  const {
    startExport,
    cancelExport,
    isRecording,
    progress,
    exportFormat,
    setExportFormat,
    quality,
    setQuality,
    supported,
  } = useExport()
  const loadInputRef = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState<'saving' | 'loading' | null>(null)

  const format = getExportFormat(exportFormat)
  const formatUnsupported = supported[exportFormat] === false

  async function handleSave() {
    setBusy('saving')
    try {
      await saveConfig(state)
    } catch (e) {
      alert(`Saving failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  async function handleLoad(file: File | undefined) {
    if (!file) return
    setBusy('loading')
    try {
      const loaded = await loadConfig(file)
      clearMediaCache()
      dispatch({ type: 'LOAD_STATE', state: loaded })
    } catch (e) {
      alert(`Loading failed: ${e instanceof Error ? e.message : String(e)}`)
    } finally {
      setBusy(null)
    }
  }

  return (
    <header className="header">
      <div className="header-group">
        {(Object.keys(FORMATS) as FormatId[]).map((id) => (
          <button
            key={id}
            className={`format-btn ${state.format === id ? 'active' : ''}`}
            onClick={() => dispatch({ type: 'SET_FORMAT', format: id })}
          >
            {FORMATS[id].label}
          </button>
        ))}
      </div>

      <div className="header-group">
        <button className="format-btn" onClick={handleSave} disabled={busy !== null || isRecording}>
          {busy === 'saving' ? 'Saving…' : 'Save'}
        </button>
        <button
          className="format-btn"
          onClick={() => loadInputRef.current?.click()}
          disabled={busy !== null || isRecording}
        >
          {busy === 'loading' ? 'Loading…' : 'Load'}
        </button>
        <input
          ref={loadInputRef}
          type="file"
          accept={CONFIG_EXTENSION}
          hidden
          onChange={(e) => {
            handleLoad(e.target.files?.[0])
            e.target.value = ''
          }}
        />

        <span className="header-divider" />

        {isRecording ? (
          <>
            <div className="recording-indicator">
              <span className="rec-dot" />
              {format.frameAccurate ? 'RENDER' : 'REC'} {Math.round(progress * 100)}%
            </div>
            {format.frameAccurate && (
              <button className="format-btn" onClick={cancelExport}>
                Cancel
              </button>
            )}
          </>
        ) : (
          <>
            <select
              className="export-select"
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value as ExportFormatId)}
              title="Export format"
            >
              {EXPORT_FORMATS.map((f) => (
                <option key={f.id} value={f.id} disabled={supported[f.id] === false}>
                  {f.label}
                  {supported[f.id] === false ? ' — not supported in this browser' : ''}
                </option>
              ))}
            </select>
            {format.frameAccurate && (
              <select
                className="export-select"
                value={quality}
                onChange={(e) => setQuality(e.target.value as ExportQuality)}
                title="Bitrate: Web keeps files small, High preserves fine colour detail"
              >
                <option value="web">Web quality</option>
                <option value="high">High quality</option>
              </select>
            )}
          </>
        )}
        <button
          className="export-btn"
          onClick={startExport}
          disabled={isRecording || formatUnsupported}
          title={formatUnsupported ? 'This format cannot be encoded in this browser — try Chrome' : undefined}
        >
          {isRecording ? 'Exporting…' : 'Export ▶'}
        </button>
      </div>
    </header>
  )
}
