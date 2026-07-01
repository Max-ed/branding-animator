import { AppProvider } from './state/AppContext'
import { ExportProvider } from './state/ExportContext'
import { Header } from './components/Header'
import { AssetPanel } from './components/AssetPanel/AssetPanel'
import { CanvasPreview } from './components/CanvasPreview/CanvasPreview'
import { ControlsPanel } from './components/ControlsPanel/ControlsPanel'
import './App.css'

function App() {
  return (
    <AppProvider>
      <ExportProvider>
        <div className="app-shell">
          <Header />
          <div className="app-body">
            <AssetPanel />
            <CanvasPreview />
            <ControlsPanel />
          </div>
        </div>
      </ExportProvider>
    </AppProvider>
  )
}

export default App
