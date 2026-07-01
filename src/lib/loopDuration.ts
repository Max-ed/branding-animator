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
      const frontCount = Math.min(Math.max(p.imagesPerLayer, 1), count)
      base = getContinuousDurationMs(frontCount)
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
