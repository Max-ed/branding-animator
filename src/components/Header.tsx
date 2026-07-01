import { FORMATS, type FormatId } from '../types'
import { useApp } from '../state/AppContext'
import { useExport } from '../state/ExportContext'
import './Header.css'

export function Header() {
  const { state, dispatch } = useApp()
  const { startExport, isRecording, progress } = useExport()

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
        {isRecording && (
          <div className="recording-indicator">
            <span className="rec-dot" />
            REC {Math.round(progress * 100)}%
          </div>
        )}
        <button className="export-btn" onClick={startExport} disabled={isRecording}>
          {isRecording ? 'Exporting…' : 'Export ▶'}
        </button>
      </div>
    </header>
  )
}
