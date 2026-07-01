import { motion } from 'framer-motion'
import type { MaskRevealParams, PresetRenderProps } from '../../types'
import { getTransition, speedScale } from '../../lib/easing'
import { TIMING } from '../../lib/presetTiming'
import { BASE_SIZE_FRACTION } from '../../lib/baseSize'
import { AssetVisual } from './AssetVisual'

function getClipPaths(shape: MaskRevealParams['shape'], direction: MaskRevealParams['direction']) {
  if (shape === 'circle') {
    return { initial: 'circle(0% at 50% 50%)', animate: 'circle(75% at 50% 50%)' }
  }

  if (shape === 'diagonal') {
    const vertical = direction === 'up' || direction === 'down'
    if (!vertical) {
      const reverse = direction === 'right'
      return reverse
        ? {
            initial: 'polygon(100% 0%, 120% 0%, 100% 100%, 80% 100%)',
            animate: 'polygon(100% 0%, 220% 0%, 200% 100%, 80% -100%)',
          }
        : {
            initial: 'polygon(0% 0%, 0% 0%, -20% 100%, 0% 100%)',
            animate: 'polygon(0% 0%, 120% 0%, 100% 100%, 0% 100%)',
          }
    }
    const reverse = direction === 'down'
    return reverse
      ? { initial: 'polygon(0% 100%, 100% 100%, 100% 120%, 0% 80%)', animate: 'polygon(0% 100%, 100% 100%, 100% -100%, 0% -200%)' }
      : { initial: 'polygon(0% 0%, 100% 0%, 100% -20%, 0% 0%)', animate: 'polygon(0% 0%, 100% 0%, 100% 120%, 0% 100%)' }
  }

  switch (direction) {
    case 'left':
      return { initial: 'inset(0% 100% 0% 0%)', animate: 'inset(0% 0% 0% 0%)' }
    case 'right':
      return { initial: 'inset(0% 0% 0% 100%)', animate: 'inset(0% 0% 0% 0%)' }
    case 'up':
      return { initial: 'inset(0% 0% 100% 0%)', animate: 'inset(0% 0% 0% 0%)' }
    case 'down':
    default:
      return { initial: 'inset(100% 0% 0% 0%)', animate: 'inset(0% 0% 0% 0%)' }
  }
}

export function MaskReveal({
  slots,
  assets,
  params,
  shared,
  playKey,
  width,
  height,
}: PresetRenderProps<MaskRevealParams>) {
  const baseSize = Math.min(width, height) * BASE_SIZE_FRACTION.maskReveal
  const center = { x: width / 2, y: height / 2 }
  const clip = getClipPaths(params.shape, params.direction)

  return (
    <div key={playKey} className="preset-stage">
      {slots.map((slot, index) => {
        const asset = slot.assetId ? assets[slot.assetId] : undefined
        const offset = 12 * index
        const delaySec = speedScale(index * TIMING.maskReveal.staggerMs, shared.speed) / 1000
        const durationSec = speedScale(TIMING.maskReveal.durationMs, shared.speed) / 1000

        return (
          <div
            key={slot.id}
            className="preset-item-anchor"
            style={{ left: center.x + offset, top: center.y + offset, zIndex: index }}
          >
            <motion.div
              className="preset-item"
              initial={{ clipPath: clip.initial }}
              animate={{ clipPath: clip.animate }}
              transition={getTransition(shared.easing, durationSec, delaySec)}
            >
              <AssetVisual asset={asset} size={baseSize} scale={slot.scale} />
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
