import { motion, type Easing } from 'framer-motion'
import type { CarouselParams, PresetRenderProps } from '../../types'
import { speedScale } from '../../lib/easing'
import { BASE_SIZE_FRACTION } from '../../lib/baseSize'
import {
  getCarouselRenderOrder,
  getCarouselStops,
  getContinuousDurationMs,
  getMagneticLegMs,
  getSnappySegments,
  MAGNETIC_EASE_POINTS,
} from '../../lib/carouselTiming'
import { AssetVisual } from './AssetVisual'

const SNAPPY_EASE: Easing = [0.65, 0, 0.35, 1]
const MAGNETIC_EASE: Easing = [...MAGNETIC_EASE_POINTS]

export function Carousel({ slots, assets, params, shared, playKey, width, height }: PresetRenderProps<CarouselParams>) {
  const baseSize = Math.min(width, height) * BASE_SIZE_FRACTION.carousel
  const step = baseSize + params.gap
  const count = Math.max(slots.length, 1)
  const cy = height / 2

  // renderOrder lays out every item in the strip, including the two
  // non-stop peek clones at the edges. stops are the subset of virtual
  // positions the camera actually centers on; stopOffset accounts for the
  // single leading peek clone shifting stop positions by one slot (the
  // trailing peek clone, after the stops, doesn't affect this offset).
  const renderOrder = getCarouselRenderOrder(slots.length)
  const stops = getCarouselStops(slots.length)
  const stopOffset = slots.length > 1 ? 1 : 0

  const centerXFor = (virtualIndex: number) => width / 2 - (virtualIndex * step + baseSize / 2)

  let keyframes: number[]
  let times: number[] | undefined
  let ease: Easing | Easing[]
  let durationSec: number

  if (stops.length <= 1) {
    keyframes = [centerXFor(stopOffset), centerXFor(stopOffset)]
    times = undefined
    ease = 'linear'
    durationSec = speedScale(getContinuousDurationMs(count), shared.speed) / 1000
  } else if (params.mode === 'continuous') {
    keyframes = [centerXFor(stopOffset), centerXFor(stopOffset + stops.length - 1)]
    times = undefined
    ease = 'linear'
    durationSec = speedScale(getContinuousDurationMs(count), shared.speed) / 1000
  } else if (params.mode === 'magnetic') {
    const legCount = stops.length - 1
    const legMs = getMagneticLegMs()
    keyframes = stops.map((_, i) => centerXFor(stopOffset + i))
    times = stops.map((_, i) => i / legCount)
    ease = stops.slice(1).map(() => MAGNETIC_EASE)
    durationSec = speedScale(legMs * legCount, shared.speed) / 1000
  } else {
    const segments = getSnappySegments(params.holdMs, stops.length)
    const totalMs = segments.reduce((sum, s) => sum + s.durationMs, 0)
    let stopIndex = 0
    let acc = 0
    keyframes = [centerXFor(stopOffset)]
    times = [0]
    const easeArr: Easing[] = []
    segments.forEach((seg) => {
      if (seg.isTravel) stopIndex += 1
      keyframes.push(centerXFor(stopOffset + stopIndex))
      acc += seg.durationMs
      times!.push(acc / totalMs)
      easeArr.push(seg.isTravel ? SNAPPY_EASE : 'linear')
    })
    ease = easeArr
    durationSec = speedScale(totalMs, shared.speed) / 1000
  }

  return (
    <div key={playKey} className="preset-stage">
      <motion.div
        className="carousel-track"
        style={{ top: cy }}
        initial={{ x: keyframes[0] }}
        animate={{ x: keyframes }}
        transition={times ? { duration: durationSec, times, ease } : { duration: durationSec, ease }}
      >
        {renderOrder.map((slotIndex, virtualIndex) => {
          const slot = slots[slotIndex]
          const asset = slot?.assetId ? assets[slot.assetId] : undefined
          return (
            <div
              key={`v-${virtualIndex}`}
              className="preset-item-anchor"
              style={{ left: virtualIndex * step + baseSize / 2, top: 0 }}
            >
              <AssetVisual asset={asset} size={baseSize} scale={slot?.scale ?? 1} />
            </div>
          )
        })}
      </motion.div>
    </div>
  )
}
