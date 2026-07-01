import { motion } from 'framer-motion'
import type { FoldingStackParams, PresetRenderProps } from '../../types'
import { getTransition, speedScale } from '../../lib/easing'
import { TIMING } from '../../lib/presetTiming'
import { BASE_SIZE_FRACTION } from '../../lib/baseSize'
import { AssetVisual } from './AssetVisual'

export function FoldingStack({
  slots,
  assets,
  params,
  shared,
  playKey,
  width,
  height,
}: PresetRenderProps<FoldingStackParams>) {
  const baseSize = Math.min(width, height) * BASE_SIZE_FRACTION.foldingStack
  const center = { x: width / 2, y: height / 2 }
  const foldMs = TIMING.foldingStack.foldMs

  return (
    <div key={playKey} className="preset-stage" style={{ perspective: params.perspective }}>
      {slots.map((slot, index) => {
        const asset = slot.assetId ? assets[slot.assetId] : undefined
        const offset = 14 * index
        const delaySec = speedScale(index * foldMs * TIMING.foldingStack.delayFactor, shared.speed) / 1000
        const durationSec = speedScale(foldMs, shared.speed) / 1000

        const isHorizontal = params.axis === 'horizontal'
        const initialRotate = isHorizontal ? { rotateX: -110 } : { rotateY: -110 }
        const animateRotate = isHorizontal ? { rotateX: 0 } : { rotateY: 0 }

        return (
          <div
            key={slot.id}
            className="preset-item-anchor"
            style={{ left: center.x + offset, top: center.y + offset, zIndex: index }}
          >
            <motion.div
              className="preset-item"
              style={{ transformOrigin: isHorizontal ? 'top center' : 'left center' }}
              initial={{ opacity: 0, ...initialRotate }}
              animate={{ opacity: 1, ...animateRotate }}
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
