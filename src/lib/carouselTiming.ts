import type { CarouselParams } from '../types'
import { TIMING } from './presetTiming'

// One segment of the carousel track's timeline, in pre-speed-scaled ms.
// "Hold" segments keep the track stationary at an item; "travel" segments
// move it to the next item. Shared by the live preview and the canvas
// export renderer so they can never drift apart.
export interface CarouselSegment {
  durationMs: number
  isTravel: boolean
}

export function getSnappySegments(holdMs: number, count: number): CarouselSegment[] {
  const segments: CarouselSegment[] = []
  for (let i = 0; i < count; i++) {
    segments.push({ durationMs: holdMs, isTravel: false })
    if (i < count - 1) segments.push({ durationMs: TIMING.carousel.travelMs, isTravel: true })
  }
  return segments
}

export function getContinuousDurationMs(count: number): number {
  return TIMING.carousel.continuousPerItemMs * count
}

// "Magnetic" mode walks the same stops as snappy mode, but with no hold
// segments at all — just one continuous leg per stop-to-stop transition.
// A strong ease-in-out per leg (applied where this is consumed) makes the
// track crawl to a near-stop at each position before accelerating away,
// without ever truly pausing. The endpoint control points (y1, y2) are
// kept off 0/1 on purpose so velocity never drops all the way to zero —
// only a hard ease like (x, 0, x, 1) does that.
export const MAGNETIC_EASE_POINTS = [0.7, 0.12, 0.3, 0.88] as const

export function getMagneticLegMs(): number {
  return TIMING.carousel.magneticLegMs
}

// The sequence of original asset indices the track centers on (stops),
// in order. Starts on the first asset and, after reaching the last,
// repeats the first asset again — so the final stop matches the starting
// one, making the loop restart (a hard remount) visually seamless.
export function getCarouselStops(count: number): number[] {
  if (count <= 0) return []
  if (count === 1) return [0]
  return [...Array.from({ length: count }, (_, i) => i), 0]
}

// Full render order for the strip: the stops above, plus two non-stop
// "peek" clones — a clone of the last asset prepended before the first
// stop (so it has a left neighbor to peek at), and a clone of the second
// asset appended after the last stop (so the final stop, which already
// matches the first, has a right neighbor to peek at too).
export function getCarouselRenderOrder(count: number): number[] {
  if (count <= 1) return getCarouselStops(count)
  return [count - 1, ...getCarouselStops(count), 1]
}

export function getCarouselLoopMs(params: CarouselParams, count: number): number {
  const stops = getCarouselStops(count)
  if (stops.length <= 1) return getContinuousDurationMs(count)
  if (params.mode === 'continuous') return getContinuousDurationMs(count)
  if (params.mode === 'magnetic') return getMagneticLegMs() * (stops.length - 1)
  return getSnappySegments(params.holdMs, stops.length).reduce((sum, s) => sum + s.durationMs, 0)
}
