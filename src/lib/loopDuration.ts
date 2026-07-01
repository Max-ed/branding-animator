import type { PresetId, PresetParamsMap, SharedAnimationSettings } from '../types'
import { TIMING } from './presetTiming'
import { getContinuousDurationMs, getCarouselLoopMs } from './carouselTiming'

export function getLoopDurationMs(
  preset: PresetId,
  params: PresetParamsMap[PresetId],
  shared: SharedAnimationSettings,
  slotCount: number,
): number {
  const count = Math.max(slotCount, 1)
  let base: number

  switch (preset) {
    case 'simpleStack': {
      base = TIMING.simpleStack.intervalMs * count + TIMING.simpleStack.endHoldMs
      break
    }
    case 'carousel': {
      const p = params as PresetParamsMap['carousel']
      base = getCarouselLoopMs(p, count)
      break
    }
    case 'foldingStack': {
      base = count * TIMING.foldingStack.foldMs * TIMING.foldingStack.delayFactor + TIMING.foldingStack.foldMs + 150
      break
    }
    case 'parallaxFloat': {
      const p = params as PresetParamsMap['parallaxFloat']
      const n = Math.max(p.imagesPerLayer, 1)
      const numLayers = Math.ceil(count / n)
      const frontCount = Math.min(n, count)
      // Master sync period: front layer loops 2^(numLayers-1) times while
      // the back layer completes exactly once — so all layers land at 0 together.
      base = getContinuousDurationMs(frontCount) * Math.pow(2, Math.max(numLayers - 1, 0))
      break
    }
    case 'parallaxStack': {
      base = getContinuousDurationMs(count)
      break
    }
    case 'maskReveal': {
      base = count * TIMING.maskReveal.staggerMs + TIMING.maskReveal.durationMs + 150
      break
    }
    default:
      base = 3000
  }

  return base / shared.speed
}
