import type { PresetId } from '../types'

// Fraction of the canvas's shorter dimension used as each asset's base box size,
// shared by the live DOM preview and the canvas export renderer.
export const BASE_SIZE_FRACTION: Record<PresetId, number> = {
  simpleStack: 0.53,
  carousel: 0.69,
  foldingStack: 0.53,
  parallaxFloat: 0.41,
  parallaxStack: 0.50,
  maskReveal: 0.53,
}
