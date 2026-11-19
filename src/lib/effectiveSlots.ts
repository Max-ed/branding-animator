import type { Slot } from '../types'

/** Slots with the preset-wide "scale all" multiplier folded into each slot's own scale. */
export function applyAssetScale(slots: Slot[], multiplier: number): Slot[] {
  if (multiplier === 1) return slots
  return slots.map((slot) => ({ ...slot, scale: slot.scale * multiplier }))
}
