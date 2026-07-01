import type { Asset, AssetType } from '../types'
import { makeId } from './id'

const VIDEO_TYPES = new Set(['video/mp4', 'video/webm'])
const IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml'])

export function createAssetsFromFiles(files: FileList | File[]): Asset[] {
  const assets: Asset[] = []
  for (const file of Array.from(files)) {
    const type: AssetType | null = VIDEO_TYPES.has(file.type)
      ? 'video'
      : IMAGE_TYPES.has(file.type)
        ? 'image'
        : null
    if (!type) continue
    assets.push({
      id: makeId(),
      type,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    })
  }
  return assets
}
