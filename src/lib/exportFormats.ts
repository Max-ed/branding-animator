export type ExportFormatId = 'webm-vp9' | 'mp4-h264' | 'webm-live'
export type ExportQuality = 'web' | 'high'

export interface ExportFormatDef {
  id: ExportFormatId
  label: string
  extension: 'webm' | 'mp4'
  /** Frame-by-frame WebCodecs render (true) or the old real-time MediaRecorder (false). */
  frameAccurate: boolean
  container?: 'webm' | 'mp4'
  muxCodec?: 'vp9' | 'avc'
  /** WebCodecs codec strings to try, best first (all cover 1920×1080 @ 30 fps). */
  codecCandidates?: string[]
  /** Bits per pixel per frame for each quality level. */
  bitsPerPixel?: Record<ExportQuality, number>
}

export const EXPORT_FORMATS: ExportFormatDef[] = [
  {
    id: 'webm-vp9',
    label: 'WebM · VP9',
    extension: 'webm',
    frameAccurate: true,
    container: 'webm',
    muxCodec: 'vp9',
    codecCandidates: ['vp09.00.40.08', 'vp09.00.41.08', 'vp09.00.50.08'],
    bitsPerPixel: { web: 0.2, high: 0.4 },
  },
  {
    id: 'mp4-h264',
    label: 'MP4 · H.264',
    extension: 'mp4',
    frameAccurate: true,
    container: 'mp4',
    muxCodec: 'avc',
    codecCandidates: ['avc1.640028', 'avc1.64002a', 'avc1.4d0028', 'avc1.42e028'],
    bitsPerPixel: { web: 0.25, high: 0.5 },
  },
  {
    id: 'webm-live',
    label: 'WebM · live recording (old)',
    extension: 'webm',
    frameAccurate: false,
  },
]

export const EXPORT_FPS = 30

export function getExportFormat(id: ExportFormatId): ExportFormatDef {
  return EXPORT_FORMATS.find((f) => f.id === id) ?? EXPORT_FORMATS[0]
}

export function bitrateFor(format: ExportFormatDef, quality: ExportQuality, width: number, height: number): number {
  const bpp = format.bitsPerPixel?.[quality] ?? 0.25
  return Math.round(width * height * EXPORT_FPS * bpp)
}

export function baseEncoderConfig(
  codec: string,
  format: ExportFormatDef,
  width: number,
  height: number,
  bitrate: number,
): VideoEncoderConfig {
  return {
    codec,
    width,
    height,
    bitrate,
    bitrateMode: 'variable',
    framerate: EXPORT_FPS,
    latencyMode: 'quality',
    ...(format.muxCodec === 'avc' ? { avc: { format: 'avc' as const } } : {}),
  }
}

/** Returns the first codec string this browser can encode at the given size, or null. */
export async function findSupportedCodec(
  format: ExportFormatDef,
  width: number,
  height: number,
  bitrate: number,
): Promise<string | null> {
  if (!format.frameAccurate) return typeof MediaRecorder !== 'undefined' ? 'mediarecorder' : null
  if (typeof VideoEncoder === 'undefined' || !format.codecCandidates) return null
  for (const codec of format.codecCandidates) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported(baseEncoderConfig(codec, format, width, height, bitrate))
      if (supported) return codec
    } catch {
      // Malformed or unknown codec string in this browser — try the next.
    }
  }
  return null
}
