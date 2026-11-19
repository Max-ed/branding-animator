import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { useApp } from './AppContext'
import { FORMATS } from '../types'
import { recordExport, type RecordExportOptions } from '../lib/exportRecorder'
import { frameExport } from '../lib/frameExporter'
import { resolveShared } from '../lib/loopDuration'
import { applyAssetScale } from '../lib/effectiveSlots'
import {
  bitrateFor,
  EXPORT_FORMATS,
  findSupportedCodec,
  getExportFormat,
  type ExportFormatId,
  type ExportQuality,
} from '../lib/exportFormats'

interface ExportContextValue {
  isRecording: boolean
  progress: number
  exportFormat: ExportFormatId
  setExportFormat: (id: ExportFormatId) => void
  quality: ExportQuality
  setQuality: (q: ExportQuality) => void
  /** Which formats this browser can produce at the current canvas size. */
  supported: Partial<Record<ExportFormatId, boolean>>
  startExport: () => void
  cancelExport: () => void
}

const ExportContext = createContext<ExportContextValue | null>(null)

const PREFS_KEY = 'branding-animator.export'

function readPrefs(): { format?: ExportFormatId; quality?: ExportQuality } {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

export function ExportProvider({ children }: { children: ReactNode }) {
  const { state } = useApp()
  const [isRecording, setIsRecording] = useState(false)
  const [progress, setProgress] = useState(0)
  const [exportFormat, setExportFormat] = useState<ExportFormatId>(() => readPrefs().format ?? 'webm-vp9')
  const [quality, setQuality] = useState<ExportQuality>(() => readPrefs().quality ?? 'web')
  const [supported, setSupported] = useState<Partial<Record<ExportFormatId, boolean>>>({})
  const abortRef = useRef<AbortController | null>(null)

  const { width, height } = FORMATS[state.format]

  useEffect(() => {
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify({ format: exportFormat, quality }))
    } catch {
      // Storage unavailable (private mode) — preferences just won't persist.
    }
  }, [exportFormat, quality])

  useEffect(() => {
    let cancelled = false
    Promise.all(
      EXPORT_FORMATS.map(async (f) => {
        const codec = await findSupportedCodec(f, width, height, bitrateFor(f, 'high', width, height))
        return [f.id, codec !== null] as const
      }),
    ).then((entries) => {
      if (!cancelled) setSupported(Object.fromEntries(entries))
    })
    return () => {
      cancelled = true
    }
  }, [width, height])

  async function startExport() {
    if (isRecording) return
    const format = getExportFormat(exportFormat)
    setIsRecording(true)
    setProgress(0)

    const assetsById = Object.fromEntries(state.assets.map((a) => [a.id, a]))
    const rawSlots = state.presetSlots[state.preset]
    const options: RecordExportOptions = {
      preset: state.preset,
      params: state.presetParams[state.preset],
      slots: applyAssetScale(rawSlots, state.presetAssetScale[state.preset]),
      assets: assetsById,
      shared: resolveShared(state.preset, state.presetParams[state.preset], state.shared, rawSlots.length),
      backgroundColor: state.canvas.backgroundColor,
      backgroundAsset: state.canvas.backgroundAsset,
      dropShadow: state.canvas.dropShadow,
      cornerRadius: state.canvas.cornerRadius,
      outline: state.canvas.outline,
      width,
      height,
      onProgress: setProgress,
      filename: `branding-animation_${state.preset}_${width}x${height}.${format.extension}`,
    }

    try {
      if (format.frameAccurate) {
        const controller = new AbortController()
        abortRef.current = controller
        await frameExport({ ...options, format, quality, signal: controller.signal })
      } else {
        await recordExport(options)
      }
    } catch (e) {
      if (!(e instanceof DOMException && e.name === 'AbortError')) {
        console.error(e)
        alert(`Export failed: ${e instanceof Error ? e.message : String(e)}`)
      }
    } finally {
      abortRef.current = null
      setIsRecording(false)
      setProgress(0)
    }
  }

  function cancelExport() {
    abortRef.current?.abort()
  }

  return (
    <ExportContext.Provider
      value={{
        isRecording,
        progress,
        exportFormat,
        setExportFormat,
        quality,
        setQuality,
        supported,
        startExport,
        cancelExport,
      }}
    >
      {children}
    </ExportContext.Provider>
  )
}

export function useExport(): ExportContextValue {
  const ctx = useContext(ExportContext)
  if (!ctx) throw new Error('useExport must be used within ExportProvider')
  return ctx
}
