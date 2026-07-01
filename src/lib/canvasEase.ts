import type { EasingMode } from '../types'
import { cubicBezier } from './cubicBezier'
import { springProgress } from './spring'

const gentleCurve = cubicBezier(0.4, 0, 0.2, 1)

// Progress (0..1, can overshoot slightly for spring) of an entrance animation
// `durationMs` after `delaySec` have elapsed, given `elapsedMs` since the loop started.
export function evalProgress(
  easing: EasingMode,
  elapsedMs: number,
  delaySec: number,
  durationMs: number,
): number {
  const sinceDelayMs = elapsedMs - delaySec * 1000
  if (sinceDelayMs <= 0) return 0

  if (easing === 'spring') {
    return springProgress(sinceDelayMs / 1000)
  }

  const p = Math.min(sinceDelayMs / durationMs, 1)
  return easing === 'linear' ? p : gentleCurve(p)
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}
