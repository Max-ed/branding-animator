import type { PresetId, PresetParamsMap, SharedAnimationSettings } from '../types'
import { TIMING } from './presetTiming'
import { getCarouselLoopMs } from './carouselTiming'

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
      base = p.continuous
        ? TIMING.parallaxFloat.continuousCycleBaseMs / (0.7 * Math.max(p.driftSpeed, 0.01))
        : count * TIMING.parallaxFloat.triggeredStaggerMs + TIMING.parallaxFloat.triggeredDurationMs + 200
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
