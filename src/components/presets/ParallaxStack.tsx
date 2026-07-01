import { motion } from 'framer-motion'
import type { ParallaxStackParams, PresetRenderProps } from '../../types'
import { speedScale } from '../../lib/easing'
import { BASE_SIZE_FRACTION } from '../../lib/baseSize'
import { getContinuousDurationMs } from '../../lib/carouselTiming'
import { AssetVisual } from './AssetVisual'

// Scale factor applied per depth layer: each step back is 85% the size of the
// layer in front. Smaller images → smaller step → less distance scrolled in
// the shared loop duration → naturally slower, creating the parallax.
const SCALE_PER_LAYER = 0.85

export function ParallaxStack({ slots, assets, params, shared, playKey, width, height }: PresetRenderProps<ParallaxStackParams>) {
  const baseSize = Math.min(width, height) * BASE_SIZE_FRACTION.parallaxStack
  const cy = height / 2

  const filledSlots = slots.filter(s => s.assetId && assets[s.assetId])
  if (filledSlots.length === 0) return <div key={playKey} className="preset-stage" />

  const N = filledSlots.length
  // One shared loop duration for every layer. Front layer scrolls its (larger)
  // step in T; back layer scrolls its (smaller) step in the same T → slower.
  // All layers reset simultaneously → no sync issues.
  const T = getContinuousDurationMs(N)
  const durationSec = speedScale(T, shared.speed) / 1000

  return (
    <div key={playKey} className="preset-stage">
      {filledSlots.map((slot, L) => {
        const layerBaseSize = baseSize * Math.pow(SCALE_PER_LAYER, L)
        const step = layerBaseSize + params.gap
        const copies = Math.ceil(width / step) + 2
        const asset = slot.assetId ? assets[slot.assetId] : undefined
        // Front layer (L=0) on top; back layers underneath.
        const zIndex = N - L

        return (
          <div
            key={L}
            style={{ position: 'absolute', left: 0, top: cy, width: '100%', zIndex }}
          >
            {/* Scroll exactly one step width and loop — seamless because
                every item in the strip is the same image. */}
            <motion.div
              style={{ position: 'absolute', left: 0, top: 0 }}
              initial={{ x: 0 }}
              animate={{ x: -step }}
              transition={{ duration: durationSec, repeat: Infinity, repeatType: 'loop', ease: 'linear' }}
            >
              {Array.from({ length: copies }, (_, vi) => (
                <div
                  key={vi}
                  className="preset-item-anchor"
                  style={{ left: vi * step + layerBaseSize / 2, top: 0 }}
                >
                  <AssetVisual asset={asset} size={layerBaseSize} scale={slot.scale} />
                </div>
              ))}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
