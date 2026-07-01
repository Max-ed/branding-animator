import type { Asset, DropShadowSettings, PresetId, PresetParamsMap, SharedAnimationSettings, Slot } from '../types'
import { getLoopDurationMs } from './loopDuration'
import { preloadAssets } from './mediaCache'
import { drawPresetFrame } from './canvasRenderers'

interface RecordExportOptions {
  preset: PresetId
  params: PresetParamsMap[PresetId]
  slots: Slot[]
  assets: Record<string, Asset>
  shared: SharedAnimationSettings
  backgroundColor: string
  dropShadow: DropShadowSettings
  cornerRadius: number
  width: number
  height: number
  onProgress?: (progress: number) => void
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export async function recordExport(opts: RecordExportOptions): Promise<void> {
  const usedAssets = opts.slots
    .map((slot) => (slot.assetId ? opts.assets[slot.assetId] : undefined))
    .filter((a): a is Asset => Boolean(a))

  await preloadAssets(usedAssets)

  const canvas = document.createElement('canvas')
  canvas.width = opts.width
  canvas.height = opts.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const loopMs = getLoopDurationMs(opts.preset, opts.params, opts.shared, opts.slots.length)

  // Pre-decode: render sample frames across the full animation timeline
  // before the MediaRecorder starts. This forces the browser to flush image
  // decode pipelines so no asset appears black in the first recorded frames.
  const WARMUP_SAMPLES = 12
  for (let i = 0; i < WARMUP_SAMPLES; i++) {
    drawPresetFrame(
      ctx, opts.preset, opts.params, opts.slots, opts.assets, opts.shared,
      opts.backgroundColor, opts.dropShadow, opts.cornerRadius,
      opts.width, opts.height, (loopMs / WARMUP_SAMPLES) * i,
    )
  }
  await new Promise<void>((r) => setTimeout(r, 80))

  const stream = canvas.captureStream(30)
  const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9') ? 'video/webm;codecs=vp9' : 'video/webm'
  const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 12_000_000 })
  const chunks: Blob[] = []

  recorder.ondataavailable = (event) => {
    if (event.data.size > 0) chunks.push(event.data)
  }

  return new Promise((resolve, reject) => {
    recorder.onerror = (event) => reject(event)
    recorder.onstop = () => {
      stream.getTracks().forEach((track) => track.stop())
      downloadBlob(new Blob(chunks, { type: 'video/webm' }), 'branding-animation.webm')
      resolve()
    }

    recorder.start()
    const startTime = performance.now()

    function tick() {
      const elapsed = performance.now() - startTime
      drawPresetFrame(
        ctx!,
        opts.preset,
        opts.params,
        opts.slots,
        opts.assets,
        opts.shared,
        opts.backgroundColor,
        opts.dropShadow,
        opts.cornerRadius,
        opts.width,
        opts.height,
        elapsed,
      )
      opts.onProgress?.(Math.min(elapsed / loopMs, 1))

      if (elapsed < loopMs) {
        requestAnimationFrame(tick)
      } else if (recorder.state !== 'inactive') {
        recorder.stop()
      }
    }

    requestAnimationFrame(tick)
  })
}
