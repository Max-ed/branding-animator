import type { Asset } from '../types'

const cache = new Map<string, HTMLImageElement | HTMLVideoElement>()

export function getMediaElement(asset: Asset): HTMLImageElement | HTMLVideoElement {
  const cached = cache.get(asset.id)
  if (cached) return cached

  if (asset.type === 'video') {
    const video = document.createElement('video')
    video.src = asset.url
    video.muted = true
    video.loop = true
    video.playsInline = true
    cache.set(asset.id, video)
    return video
  }

  const img = new Image()
  img.src = asset.url
  cache.set(asset.id, img)
  return img
}

export async function preloadAssets(assets: Asset[]): Promise<void> {
  await Promise.all(
    assets.map((asset) => {
      const el = getMediaElement(asset)
      if (el instanceof HTMLVideoElement) {
        return el.readyState >= 2
          ? el.play()
          : new Promise<void>((resolve) => {
              el.addEventListener('loadeddata', () => resolve(), { once: true })
            }).then(() => el.play())
      }
      const img = el as HTMLImageElement
      return img.complete ? Promise.resolve() : new Promise<void>((resolve) => {
        img.addEventListener('load', () => resolve(), { once: true })
        img.addEventListener('error', () => resolve(), { once: true })
      })
    }),
  )
}
