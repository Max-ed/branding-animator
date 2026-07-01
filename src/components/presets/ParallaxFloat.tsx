import { motion } from 'framer-motion'
import type { ParallaxFloatParams, PresetRenderProps } from '../../types'
import { speedScale } from '../../lib/easing'
import { BASE_SIZE_FRACTION } from '../../lib/baseSize'
import { getContinuousDurationMs } from '../../lib/carouselTiming'
import { AssetVisual } from './AssetVisual'

const SCALE_PER_LAYER = 0.82
const SPEED_PER_LAYER = 0.60

export function ParallaxFloat({ slots, assets, params, shared, playKey, width, height }: PresetRenderProps<ParallaxFloatParams>) {
  const baseSize = Math.min(width, height) * BASE_SIZE_FRACTION.parallaxFloat
  const n = Math.max(params.imagesPerLayer, 1)
  const cy = height / 2

  const layerSlots: (typeof slots)[] = []
  for (let i = 0; i < slots.length; i += n) {
    layerSlots.push(slots.slice(i, i + n))
  }
  if (layerSlots.length === 0) layerSlots.push([])

  const numLayers = layerSlots.length

  return (
    <div key={playKey} className="preset-stage">
      {layerSlots.map((layerItems, L) => {
        const scaleMultiplier = Math.pow(SCALE_PER_LAYER, L)
        const speedMultiplier = Math.pow(SPEED_PER_LAYER, L)
        const layerBaseSize = baseSize * scaleMultiplier
        const step = layerBaseSize + params.gap
        const count = Math.max(layerItems.length, 1)
        const totalWidth = count * step
        const durationSec = speedScale(getContinuousDurationMs(count), shared.speed) / speedMultiplier / 1000
        const copies = Math.ceil(width / totalWidth) + 2
        const zIndex = numLayers - L

        return (
          <div
            key={L}
            style={{ position: 'absolute', left: 0, top: cy, width: '100%', zIndex }}
          >
            <motion.div
              style={{ position: 'absolute', left: 0, top: 0 }}
              initial={{ x: 0 }}
              animate={{ x: -totalWidth }}
              transition={{ duration: durationSec, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
            >
              {Array.from({ length: copies * count }, (_, vi) => {
                const slotI = vi % count
                const slot = layerItems[slotI]
                const asset = slot?.assetId ? assets[slot.assetId] : undefined
                return (
                  <div
                    key={vi}
                    className="preset-item-anchor"
                    style={{ left: vi * step + layerBaseSize / 2, top: 0 }}
                  >
                    <AssetVisual asset={asset} size={layerBaseSize} scale={slot?.scale ?? 1} />
                  </div>
                )
              })}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
