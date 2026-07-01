import { useEffect, useState } from 'react'
import type { Asset, PresetRenderProps, SimpleStackParams } from '../../types'
import { speedScale } from '../../lib/easing'
import { TIMING } from '../../lib/presetTiming'
import { BASE_SIZE_FRACTION } from '../../lib/baseSize'
import { AssetVisual } from './AssetVisual'

function StackItem({
  asset,
  baseSize,
  scale,
  left,
  top,
  showAtMs,
  hideAtMs,
}: {
  asset: Asset | undefined
  baseSize: number
  scale: number
  left: number
  top: number
  showAtMs: number
  hideAtMs: number | undefined
}) {
  const [visible, setVisible] = useState(showAtMs <= 0)

  useEffect(() => {
    const showTimer = showAtMs > 0 ? setTimeout(() => setVisible(true), showAtMs) : undefined
    const hideTimer = hideAtMs !== undefined ? setTimeout(() => setVisible(false), hideAtMs) : undefined
    return () => {
      if (showTimer) clearTimeout(showTimer)
      if (hideTimer) clearTimeout(hideTimer)
    }
  }, [showAtMs, hideAtMs])

  return (
    <div className="preset-item-anchor" style={{ left, top }}>
      <div className="preset-item" style={{ opacity: visible ? 1 : 0 }}>
        <AssetVisual asset={asset} size={baseSize} scale={scale} />
      </div>
    </div>
  )
}

export function SimpleStack({ slots, assets, shared, playKey, width, height }: PresetRenderProps<SimpleStackParams>) {
  const baseSize = Math.min(width, height) * BASE_SIZE_FRACTION.simpleStack
  const center = { x: width / 2, y: height / 2 }
  const intervalMs = TIMING.simpleStack.intervalMs

  return (
    <div key={playKey} className="preset-stage">
      {slots.map((slot, index) => {
        const asset = slot.assetId ? assets[slot.assetId] : undefined
        const showAtMs = speedScale(intervalMs * index, shared.speed)
        const hideAtMs = index < slots.length - 1 ? speedScale(intervalMs * (index + 1), shared.speed) : undefined

        return (
          <StackItem
            key={slot.id}
            asset={asset}
            baseSize={baseSize}
            scale={slot.scale}
            left={center.x}
            top={center.y}
            showAtMs={showAtMs}
            hideAtMs={hideAtMs}
          />
        )
      })}
    </div>
  )
}
