import type { AppState } from '../state/AppContext'
import { DEFAULT_ASSET_SCALE } from '../state/AppContext'
import {
  DEFAULT_CANVAS_SETTINGS,
  DEFAULT_PRESET_PARAMS,
  FORMATS,
  PRESET_ORDER,
  type Asset,
  type PresetId,
  type PresetParamsMap,
  type Slot,
} from '../types'
import { downloadBlob } from './exportRecorder'
import { makeId } from './id'

// A saved configuration is one self-contained file so it can be reopened
// anywhere: "BANM" magic, a uint32 (LE) header length, a JSON header, then the
// raw bytes of every asset file back to back.
//
// Asset files are embedded rather than referenced because the browser can't
// re-open a file from disk by path.

const MAGIC = 'BANM'
const VERSION = 1
export const CONFIG_EXTENSION = '.animator'

type SavedState = Omit<AppState, 'playKey' | 'isPlaying' | 'assets' | 'canvas'> & {
  canvas: Omit<AppState['canvas'], 'backgroundAsset'> & { backgroundAssetId: string | null }
}

interface SavedAsset {
  id: string
  type: Asset['type']
  name: string
  mime: string
  offset: number
  size: number
}

interface Header {
  version: number
  savedAt: string
  assets: SavedAsset[]
  backgroundAsset: SavedAsset | null
  state: SavedState
}

export type LoadedState = Omit<AppState, 'playKey' | 'isPlaying'>

function timestamp() {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}`
}

export function buildConfigBlob(state: AppState): Blob {
  const files: File[] = []
  let offset = 0
  const describe = (asset: Asset): SavedAsset => {
    const entry: SavedAsset = {
      id: asset.id,
      type: asset.type,
      name: asset.name,
      mime: asset.file.type,
      offset,
      size: asset.file.size,
    }
    offset += asset.file.size
    files.push(asset.file)
    return entry
  }

  const assets = state.assets.map(describe)
  const backgroundAsset = state.canvas.backgroundAsset ? describe(state.canvas.backgroundAsset) : null
  const { backgroundAsset: _bg, ...canvasRest } = state.canvas

  const header: Header = {
    version: VERSION,
    savedAt: new Date().toISOString(),
    assets,
    backgroundAsset,
    state: {
      format: state.format,
      preset: state.preset,
      presetSlots: state.presetSlots,
      presetAssetScale: state.presetAssetScale,
      shared: state.shared,
      presetParams: state.presetParams,
      canvas: { ...canvasRest, backgroundAssetId: state.canvas.backgroundAsset?.id ?? null },
    },
  }

  const headerBytes = new TextEncoder().encode(JSON.stringify(header))
  const prefix = new Uint8Array(8)
  prefix.set(new TextEncoder().encode(MAGIC), 0)
  new DataView(prefix.buffer).setUint32(4, headerBytes.length, true)
  return new Blob([prefix, headerBytes, ...files], { type: 'application/octet-stream' })
}

interface SaveFilePickerWindow {
  showSaveFilePicker?: (options: {
    suggestedName: string
    types: { description: string; accept: Record<string, string[]> }[]
  }) => Promise<{ createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }> }>
}

/** Saves via the native "Save as" dialog where available (Chrome), otherwise as a download. */
export async function saveConfig(state: AppState): Promise<void> {
  const blob = buildConfigBlob(state)
  const suggestedName = `branding-animator_${timestamp()}${CONFIG_EXTENSION}`
  const picker = (window as unknown as SaveFilePickerWindow).showSaveFilePicker
  if (picker) {
    try {
      const handle = await picker({
        suggestedName,
        types: [{ description: 'Branding Animator configuration', accept: { 'application/octet-stream': [CONFIG_EXTENSION] } }],
      })
      const writable = await handle.createWritable()
      await writable.write(blob)
      await writable.close()
      return
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return
      // Picker unavailable in this context (e.g. iframe) — fall back to download.
    }
  }
  downloadBlob(blob, suggestedName)
}

function isObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v)
}

export async function loadConfig(file: File): Promise<LoadedState> {
  const prefix = new Uint8Array(await file.slice(0, 8).arrayBuffer())
  if (new TextDecoder().decode(prefix.slice(0, 4)) !== MAGIC) {
    throw new Error('This is not a Branding Animator configuration file.')
  }
  const headerLength = new DataView(prefix.buffer).getUint32(4, true)
  const dataStart = 8 + headerLength
  const header = JSON.parse(await file.slice(8, dataStart).text()) as Header
  if (!isObject(header) || typeof header.version !== 'number') throw new Error('Configuration file is damaged.')
  if (header.version > VERSION) throw new Error('This configuration was saved by a newer version of the app.')

  // Fresh ids so a re-loaded config never collides with cached media of an earlier load.
  const idMap = new Map<string, string>()
  const restore = (saved: SavedAsset): Asset => {
    const blob = file.slice(dataStart + saved.offset, dataStart + saved.offset + saved.size, saved.mime)
    const restored = new File([blob], saved.name, { type: saved.mime })
    const id = makeId()
    idMap.set(saved.id, id)
    return { id, type: saved.type, name: saved.name, url: URL.createObjectURL(restored), file: restored }
  }
  const assets = (header.assets ?? []).map(restore)
  const backgroundAsset = header.backgroundAsset ? restore(header.backgroundAsset) : null

  const s = header.state ?? ({} as Partial<SavedState>)
  const remapSlots = (slots: unknown): Slot[] =>
    Array.isArray(slots)
      ? slots.filter(isObject).map((slot) => ({
          id: makeId(),
          assetId: typeof slot.assetId === 'string' ? (idMap.get(slot.assetId) ?? null) : null,
          scale: typeof slot.scale === 'number' && slot.scale > 0 ? slot.scale : 1,
        }))
      : []

  // Merge onto defaults so files from older versions still load after new settings are added.
  const presetSlots = {} as Record<PresetId, Slot[]>
  const presetParams = {} as PresetParamsMap
  const presetAssetScale = { ...DEFAULT_ASSET_SCALE }
  for (const preset of PRESET_ORDER) {
    presetSlots[preset] = remapSlots(s.presetSlots?.[preset])
    ;(presetParams as unknown as Record<PresetId, object>)[preset] = {
      ...DEFAULT_PRESET_PARAMS[preset],
      ...(isObject(s.presetParams?.[preset]) ? s.presetParams[preset] : {}),
    }
    const scale = s.presetAssetScale?.[preset]
    if (typeof scale === 'number' && scale > 0) presetAssetScale[preset] = scale
  }

  const canvas = isObject(s.canvas) ? s.canvas : ({} as Partial<SavedState['canvas']>)
  return {
    format: s.format && s.format in FORMATS ? s.format : '1920x1080',
    preset: s.preset && PRESET_ORDER.includes(s.preset) ? s.preset : 'simpleStack',
    assets,
    presetSlots,
    presetAssetScale,
    presetParams,
    shared: { easing: 'gentle', speed: 1, durationSec: null, ...(isObject(s.shared) ? s.shared : {}) },
    canvas: {
      ...DEFAULT_CANVAS_SETTINGS,
      ...(typeof canvas.backgroundColor === 'string' ? { backgroundColor: canvas.backgroundColor } : {}),
      ...(typeof canvas.cornerRadius === 'number' ? { cornerRadius: canvas.cornerRadius } : {}),
      dropShadow: { ...DEFAULT_CANVAS_SETTINGS.dropShadow, ...(isObject(canvas.dropShadow) ? canvas.dropShadow : {}) },
      outline: { ...DEFAULT_CANVAS_SETTINGS.outline, ...(isObject(canvas.outline) ? canvas.outline : {}) },
      backgroundAsset,
    },
  }
}
