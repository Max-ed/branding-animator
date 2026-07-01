import { motion } from 'framer-motion'
import type { ParallaxFloatParams, PresetRenderProps } from '../../types'
import { getTransition, speedScale } from '../../lib/easing'
import { TIMING } from '../../lib/presetTiming'
import { BASE_SIZE_FRACTION } from '../../lib/baseSize'
import { AssetVisual } from './AssetVisual'

export function ParallaxFloat({
  slots,
  assets,
  params,
  shared,
  playKey,
  width,
  height,
}: PresetRenderProps<ParallaxFloatParams>) {
  const baseSize = Math.min(width, height) * BASE_SIZE_FRACTION.parallaxFloat
  const count = Math.max(slots.length, 1)

  return (
    <div key={playKey} className="preset-stage">
      {slots.map((slot, index) => {
        const asset = slot.assetId ? assets[slot.assetId] : undefined
        const depth = count > 1 ? index / (count - 1) : 0.5
        const layerAmplitude = params.amplitude * (0.4 + 0.6 * depth)
        const layerSpeed = params.driftSpeed * (0.7 + 0.3 * depth)
        const x = ((index + 0.5) / count) * width
        const y = height / 2

        if (params.continuous) {
          const cycleSec = speedScale(TIMING.parallaxFloat.continuousCycleBaseMs / layerSpeed, shared.speed) / 1000
          return (
            <div key={slot.id} className="preset-item-anchor" style={{ left: x, top: y, zIndex: index }}>
              <motion.div
                className="preset-item"
                initial={{ y: -layerAmplitude, opacity: 0 }}
                animate={{ y: [-layerAmplitude, layerAmplitude, -layerAmplitude], opacity: 1 }}
                transition={{
                  opacity: getTransition(shared.easing, 0.4, 0),
                  y: { duration: cycleSec, repeat: Infinity, ease: 'easeInOut' },
                }}
              >
                <AssetVisual asset={asset} size={baseSize} scale={slot.scale} />
              </motion.div>
            </div>
          )
        }

        const delaySec = speedScale(index * TIMING.parallaxFloat.triggeredStaggerMs, shared.speed) / 1000
        const durationSec = speedScale(TIMING.parallaxFloat.triggeredDurationMs, shared.speed) / 1000
        return (
          <div key={slot.id} className="preset-item-anchor" style={{ left: x, top: y, zIndex: index }}>
            <motion.div
              className="preset-item"
              initial={{ y: -layerAmplitude * 2, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
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
