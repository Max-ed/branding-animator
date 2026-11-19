import { BufferTarget, EncodedPacket, EncodedVideoPacketSource, Mp4OutputFormat, Output, WebMOutputFormat } from 'mediabunny'
import type { Asset } from '../types'
import { drawPresetFrame } from './canvasRenderers'
import { downloadBlob, type RecordExportOptions } from './exportRecorder'
import { baseEncoderConfig, bitrateFor, EXPORT_FPS, findSupportedCodec, type ExportFormatDef, type ExportQuality } from './exportFormats'
import { getLoopDurationMs } from './loopDuration'
import { getMediaElement, preloadAssets } from './mediaCache'
import { BT709_LIMITED, rgbaToI420 } from './yuv'

export interface FrameExportOptions extends RecordExportOptions {
  format: ExportFormatDef
  quality: ExportQuality
  signal?: AbortSignal
}

const KEYFRAME_INTERVAL = EXPORT_FPS * 2

function usedAssets(opts: RecordExportOptions): Asset[] {
  const list = opts.slots
    .map((slot) => (slot.assetId ? opts.assets[slot.assetId] : undefined))
    .filter((a): a is Asset => Boolean(a))
  if (opts.backgroundAsset) list.push(opts.backgroundAsset)
  return list
}

/** Puts every video asset on the frame for `timeSec` (looping) and waits until it is decoded. */
async function seekVideos(videos: HTMLVideoElement[], timeSec: number) {
  await Promise.all(
    videos.map((video) => {
      const duration = video.duration
      if (!Number.isFinite(duration) || duration <= 0) return Promise.resolve()
      const target = timeSec % duration
      if (Math.abs(video.currentTime - target) < 0.0005 && video.readyState >= 2) return Promise.resolve()
      return new Promise<void>((resolve) => {
        const timeout = setTimeout(resolve, 2000)
        video.addEventListener(
          'seeked',
          () => {
            clearTimeout(timeout)
            resolve()
          },
          { once: true },
        )
        video.currentTime = target
      })
    }),
  )
}

/**
 * Renders the loop frame by frame at exactly EXPORT_FPS and encodes it with
 * WebCodecs. Frame timing comes from the frame index, not the wall clock, so
 * a slow machine or background tab can't drop or repeat frames. Colours are
 * converted to BT.709 limited range here and the file is tagged to match.
 */
export async function frameExport(opts: FrameExportOptions): Promise<void> {
  const { format, width, height } = opts
  const bitrate = bitrateFor(format, opts.quality, width, height)
  const codec = await findSupportedCodec(format, width, height, bitrate)
  if (!codec || codec === 'mediarecorder') {
    throw new Error(`${format.label} encoding isn't supported in this browser. Try Chrome, or pick another format.`)
  }

  const assets = usedAssets(opts)
  await preloadAssets(assets)
  const videos = assets
    .map((a) => getMediaElement(a))
    .filter((el): el is HTMLVideoElement => el instanceof HTMLVideoElement)
  for (const v of videos) v.pause()

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d', { willReadFrequently: true, colorSpace: 'srgb' })
  if (!ctx) throw new Error('Canvas 2D context unavailable')

  const loopMs = getLoopDurationMs(opts.preset, opts.params, opts.shared, opts.slots.length)
  const totalFrames = Math.max(1, Math.round((loopMs / 1000) * EXPORT_FPS))

  const output = new Output({
    format: format.container === 'mp4' ? new Mp4OutputFormat({ fastStart: 'in-memory' }) : new WebMOutputFormat(),
    target: new BufferTarget(),
  })
  const source = new EncodedVideoPacketSource(format.muxCodec!)
  output.addVideoTrack(source, { frameRate: EXPORT_FPS })
  await output.start()

  let encodeError: unknown = null
  let writeChain: Promise<void> = Promise.resolve()

  const encoder = new VideoEncoder({
    output: (chunk, meta) => {
      // Force the container colour tags to what we actually encoded,
      // regardless of what this browser's encoder reports.
      const fixedMeta: EncodedVideoChunkMetadata | undefined = meta?.decoderConfig
        ? { ...meta, decoderConfig: { ...meta.decoderConfig, colorSpace: BT709_LIMITED } }
        : meta
      const packet = EncodedPacket.fromEncodedChunk(chunk)
      writeChain = writeChain.then(() => source.add(packet, fixedMeta))
      writeChain.catch((e) => {
        encodeError ??= e
      })
    },
    error: (e) => {
      encodeError ??= e
    },
  })
  encoder.configure(baseEncoderConfig(codec, format, width, height, bitrate))

  const yuv = new Uint8Array(width * height * 1.5)
  const frameDurationUs = 1_000_000 / EXPORT_FPS

  try {
    for (let i = 0; i < totalFrames; i++) {
      if (opts.signal?.aborted) throw new DOMException('Export cancelled', 'AbortError')
      if (encodeError) throw encodeError

      const elapsedMs = (i * 1000) / EXPORT_FPS
      if (videos.length) await seekVideos(videos, elapsedMs / 1000)

      drawPresetFrame(
        ctx, opts.preset, opts.params, opts.slots, opts.assets, opts.shared,
        opts.backgroundColor, opts.dropShadow, opts.cornerRadius,
        width, height, elapsedMs, opts.backgroundAsset, opts.outline,
      )

      const rgba = ctx.getImageData(0, 0, width, height).data
      rgbaToI420(rgba, width, height, yuv)
      const frame = new VideoFrame(yuv, {
        format: 'I420',
        codedWidth: width,
        codedHeight: height,
        timestamp: Math.round(i * frameDurationUs),
        duration: Math.round(frameDurationUs),
        colorSpace: BT709_LIMITED,
      })
      encoder.encode(frame, { keyFrame: i % KEYFRAME_INTERVAL === 0 })
      frame.close()

      // Backpressure: don't let the encoder queue grow unbounded.
      while (encoder.encodeQueueSize > 4) {
        await new Promise<void>((resolve) => encoder.addEventListener('dequeue', () => resolve(), { once: true }))
      }

      opts.onProgress?.(((i + 1) / totalFrames) * 0.97)
      // Yield so the progress indicator can repaint.
      if (i % 4 === 0) await new Promise<void>((r) => setTimeout(r, 0))
    }

    await encoder.flush()
    await writeChain
    if (encodeError) throw encodeError
    await output.finalize()
  } catch (e) {
    if (output.state === 'started') await output.cancel().catch(() => {})
    throw e
  } finally {
    if (encoder.state !== 'closed') encoder.close()
    for (const v of videos) v.play().catch(() => {})
  }

  opts.onProgress?.(1)
  const buffer = (output.target as BufferTarget).buffer
  if (!buffer) throw new Error('Export produced no data')
  const mime = format.container === 'mp4' ? 'video/mp4' : 'video/webm'
  downloadBlob(new Blob([buffer], { type: mime }), opts.filename ?? `branding-animation.${format.extension}`)
}
