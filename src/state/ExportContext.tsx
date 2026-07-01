import { createContext, useContext, useState, type ReactNode } from 'react'
import { useApp } from './AppContext'
import { FORMATS } from '../types'
import { recordExport } from '../lib/exportRecorder'

interface ExportContextValue {
  isRecording: boolean
  progress: number
  startExport: () => void
}

const ExportContext = createContext<ExportContextValue | null>(null)

export function ExportProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [isRecording, setIsRecording] = useState(false)
  const [progress, setProgress] = useState(0)

  async function startExport() {
    if (isRecording) return
    setIsRecording(true)
    setProgress(0)

    const format = FORMATS[state.format]
    const assetsById = Object.fromEntries(state.assets.map((a) => [a.id, a]))

    try {
      await recordExport({
        preset: state.preset,
        params: state.presetParams[state.preset],
        slots: state.presetSlots[state.preset],
        assets: assetsById,
        shared: state.shared,
        backgroundColor: state.canvas.backgroundColor,
        dropShadow: state.canvas.dropShadow,
        cornerRadius: state.canvas.cornerRadius,
        width: format.width,
        height: format.height,
        onProgress: setProgress,
      })
    } finally {
      setIsRecording(false)
      setProgress(0)
    }
  }

  return (
    <ExportContext.Provider value={{ isRecording, progress, startExport }}>{children}</ExportContext.Provider>
  )
}

export function useExport(): ExportContextValue {
  const ctx = useContext(ExportContext)
  if (!ctx) throw new Error('useExport must be used within ExportProvider')
  return ctx
}
