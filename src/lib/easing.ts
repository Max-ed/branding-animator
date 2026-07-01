import type { Transition } from 'framer-motion'
import type { EasingMode } from '../types'

export function getTransition(
  easing: EasingMode,
  durationSec: number,
  delaySec = 0,
): Transition {
  if (easing === 'spring') {
    return {
      type: 'spring',
      stiffness: 260,
      damping: 18,
      mass: 0.9,
      delay: delaySec,
    }
  }
  if (easing === 'linear') {
    return { type: 'tween', ease: 'linear', duration: durationSec, delay: delaySec }
  }
  return { type: 'tween', ease: [0.4, 0, 0.2, 1], duration: durationSec, delay: delaySec }
}

export function speedScale(durationMs: number, speed: number): number {
  return durationMs / speed
}
