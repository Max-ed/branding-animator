import type {
  Asset,
  CarouselParams,
  DropShadowSettings,
  FoldingStackParams,
  MaskRevealParams,
  ParallaxFloatParams,
  PresetId,
  PresetParamsMap,
  SharedAnimationSettings,
  SimpleStackParams,
  Slot,
} from '../types'
import { evalProgress, lerp } from './canvasEase'
import { TIMING } from './presetTiming'
import { BASE_SIZE_FRACTION } from './baseSize'
import {
  getCarouselRenderOrder,
  getCarouselStops,
  getContinuousDurationMs,
  getMagneticLegMs,
  getSnappySegments,
  MAGNETIC_EASE_POINTS,
} from './carouselTiming'
import { cubicBezier } from './cubicBezier'
import { getMediaElement } from './mediaCache'
import { clipCircleReveal, clipDiagonalReveal, clipRectReveal, drawContain, type DropShadowDraw } from './canvasDraw'

const SNAPPY_BEZIER = cubicBezier(0.65, 0, 0.35, 1)
const MAGNETIC_BEZIER = cubicBezier(...MAGNETIC_EASE_POINTS)

interface FrameCtx {
  ctx: CanvasRenderingContext2D
  slots: Slot[]
  assets: Record<string, Asset>
  shared: SharedAnimationSettings
  dropShadow: DropShadowDraw | undefined
  cornerRadius: number
  width: number
  height: number
  elapsedMs: number
}

function speedScale(ms: number, speed: number) {
  return ms / speed
}

function toDropShadowDraw(d: DropShadowSettings): DropShadowDraw | undefined {
  if (!d.enabled) return undefined
  return { color: `rgba(0, 0, 0, ${d.opacity})`, blur: d.blur, offsetY: d.offsetY }
}

function drawSimpleStack(f: FrameCtx, _params: SimpleStackParams) {
  const baseSize = Math.min(f.width, f.height) * BASE_SIZE_FRACTION.simpleStack
  const cx = f.width / 2
  const cy = f.height / 2

  f.slots.forEach((slot, index) => {
    const asset = slot.assetId ? f.assets[slot.assetId] : undefined
    if (!asset) return
    const showAtMs = speedScale(TIMING.simpleStack.intervalMs * index, f.shared.speed)
    const hideAtMs =
      index < f.slots.length - 1 ? speedScale(TIMING.simpleStack.intervalMs * (index + 1), f.shared.speed) : undefined
    if (f.elapsedMs < showAtMs || (hideAtMs !== undefined && f.elapsedMs >= hideAtMs)) return

    drawContain(f.ctx, getMediaElement(asset), cx, cy, baseSize * slot.scale, 1, undefined, f.dropShadow, f.cornerRadius)
  })
}

function drawCarousel(f: FrameCtx, params: CarouselParams) {
  const baseSize = Math.min(f.width, f.height) * BASE_SIZE_FRACTION.carousel
  const step = baseSize + params.gap
  const count = Math.max(f.slots.length, 1)
  const cy = f.height / 2
  const renderOrder = getCarouselRenderOrder(f.slots.length)
  const stops = getCarouselStops(f.slots.length)
  const stopOffset = f.slots.length > 1 ? 1 : 0
  const centerXFor = (virtualIndex: number) => f.width / 2 - (virtualIndex * step + baseSize / 2)

  let trackX: number

  if (params.mode === 'continuous' || stops.length <= 1) {
    const totalMs = speedScale(getContinuousDurationMs(count), f.shared.speed)
    const t = Math.min(Math.max(f.elapsedMs / totalMs, 0), 1)
    trackX = lerp(centerXFor(stopOffset), centerXFor(stopOffset + Math.max(stops.length - 1, 0)), t)
  } else if (params.mode === 'magnetic') {
    const legCount = stops.length - 1
    const legMs = speedScale(getMagneticLegMs(), f.shared.speed)
    const totalMs = legMs * legCount
    const elapsed = Math.min(Math.max(f.elapsedMs, 0), totalMs)
    const legIndex = Math.min(Math.floor(elapsed / legMs), legCount - 1)
    const localT = legMs > 0 ? (elapsed - legIndex * legMs) / legMs : 1
    trackX = lerp(centerXFor(stopOffset + legIndex), centerXFor(stopOffset + legIndex + 1), MAGNETIC_BEZIER(localT))
  } else {
    const segments = getSnappySegments(params.holdMs, stops.length)
    let stopIndex = 0
    let segStart = 0
    trackX = centerXFor(stopOffset)
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i]
      const segDurationMs = speedScale(seg.durationMs, f.shared.speed)
      const fromX = centerXFor(stopOffset + stopIndex)
      if (seg.isTravel) stopIndex += 1
      const toX = centerXFor(stopOffset + stopIndex)

      if (f.elapsedMs < segStart + segDurationMs || i === segments.length - 1) {
        const localT = segDurationMs > 0 ? Math.min(Math.max((f.elapsedMs - segStart) / segDurationMs, 0), 1) : 1
        const eased = seg.isTravel ? SNAPPY_BEZIER(localT) : localT
        trackX = lerp(fromX, toX, eased)
        break
      }
      segStart += segDurationMs
    }
  }

  renderOrder.forEach((slotIndex, virtualIndex) => {
    const slot = f.slots[slotIndex]
    const asset = slot?.assetId ? f.assets[slot.assetId] : undefined
    if (!asset) return
    const x = virtualIndex * step + baseSize / 2 + trackX
    drawContain(f.ctx, getMediaElement(asset), x, cy, baseSize * (slot?.scale ?? 1), 1, undefined, f.dropShadow, f.cornerRadius)
  })
}

function drawFoldingStack(f: FrameCtx, params: FoldingStackParams) {
  const baseSize = Math.min(f.width, f.height) * BASE_SIZE_FRACTION.foldingStack
  const cx = f.width / 2
  const cy = f.height / 2
  const foldMs = TIMING.foldingStack.foldMs
  const durationMs = speedScale(foldMs, f.shared.speed)
  const isHorizontal = params.axis === 'horizontal'

  f.slots.forEach((slot, index) => {
    const asset = slot.assetId ? f.assets[slot.assetId] : undefined
    if (!asset) return
    const offset = 14 * index
    const delaySec = speedScale(index * foldMs * TIMING.foldingStack.delayFactor, f.shared.speed) / 1000
    const p = evalProgress(f.shared.easing, f.elapsedMs, delaySec, durationMs)
    if (p <= 0) return

    const opacity = Math.min(p, 1)
    const angleDeg = lerp(-110, 0, p)
    const squashAmount = Math.abs(Math.cos((angleDeg * Math.PI) / 180))

    drawContain(
      f.ctx,
      getMediaElement(asset),
      cx + offset,
      cy + offset,
      baseSize * slot.scale,
      opacity,
      { axis: isHorizontal ? 'y' : 'x', amount: squashAmount },
      f.dropShadow,
      f.cornerRadius,
    )
  })
}

function drawParallaxFloat(f: FrameCtx, params: ParallaxFloatParams) {
  const baseSize = Math.min(f.width, f.height) * BASE_SIZE_FRACTION.parallaxFloat
  const count = Math.max(f.slots.length, 1)

  f.slots.forEach((slot, index) => {
    const asset = slot.assetId ? f.assets[slot.assetId] : undefined
    if (!asset) return
    const depth = count > 1 ? index / (count - 1) : 0.5
    const layerAmplitude = params.amplitude * (0.4 + 0.6 * depth)
    const layerSpeed = params.driftSpeed * (0.7 + 0.3 * depth)
    const x = ((index + 0.5) / count) * f.width
    const cy = f.height / 2

    if (params.continuous) {
      const cycleMs = speedScale(TIMING.parallaxFloat.continuousCycleBaseMs / layerSpeed, f.shared.speed)
      const phase = (f.elapsedMs % cycleMs) / cycleMs
      const y = Math.sin(phase * Math.PI * 2) * layerAmplitude
      const fadeIn = Math.min(f.elapsedMs / 400, 1)
      drawContain(f.ctx, getMediaElement(asset), x, cy + y, baseSize * slot.scale, fadeIn, undefined, f.dropShadow, f.cornerRadius)
      return
    }

    const delaySec = speedScale(index * TIMING.parallaxFloat.triggeredStaggerMs, f.shared.speed) / 1000
    const durationMs = speedScale(TIMING.parallaxFloat.triggeredDurationMs, f.shared.speed)
    const p = evalProgress(f.shared.easing, f.elapsedMs, delaySec, durationMs)
    if (p <= 0) return
    const y = lerp(-layerAmplitude * 2, 0, p)
    drawContain(f.ctx, getMediaElement(asset), x, cy + y, baseSize * slot.scale, Math.min(p, 1), undefined, f.dropShadow, f.cornerRadius)
  })
}

function drawMaskReveal(f: FrameCtx, params: MaskRevealParams) {
  const baseSize = Math.min(f.width, f.height) * BASE_SIZE_FRACTION.maskReveal
  const cx = f.width / 2
  const cy = f.height / 2
  const durationMs = speedScale(TIMING.maskReveal.durationMs, f.shared.speed)

  f.slots.forEach((slot, index) => {
    const asset = slot.assetId ? f.assets[slot.assetId] : undefined
    if (!asset) return
    const offset = 12 * index
    const delaySec = speedScale(index * TIMING.maskReveal.staggerMs, f.shared.speed) / 1000
    const p = evalProgress(f.shared.easing, f.elapsedMs, delaySec, durationMs)
    if (p <= 0) return

    const x = cx + offset
    const y = cy + offset
    const boxSize = baseSize * slot.scale

    f.ctx.save()
    if (params.shape === 'circle') clipCircleReveal(f.ctx, x, y, boxSize, p)
    else if (params.shape === 'diagonal') clipDiagonalReveal(f.ctx, x, y, boxSize, params.direction, p)
    else clipRectReveal(f.ctx, x, y, boxSize, params.direction, p)

    drawContain(f.ctx, getMediaElement(asset), x, y, boxSize, 1, undefined, f.dropShadow, f.cornerRadius)
    f.ctx.restore()
  })
}

const RENDERERS: { [K in PresetId]: (f: FrameCtx, params: PresetParamsMap[K]) => void } = {
  simpleStack: drawSimpleStack,
  carousel: drawCarousel,
  foldingStack: drawFoldingStack,
  parallaxFloat: drawParallaxFloat,
  maskReveal: drawMaskReveal,
}

export function drawPresetFrame(
  ctx: CanvasRenderingContext2D,
  preset: PresetId,
  params: PresetParamsMap[PresetId],
  slots: Slot[],
  assets: Record<string, Asset>,
  shared: SharedAnimationSettings,
  backgroundColor: string,
  dropShadow: DropShadowSettings,
  cornerRadius: number,
  width: number,
  height: number,
  elapsedMs: number,
) {
  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, width, height)
  const renderer = RENDERERS[preset] as (f: FrameCtx, params: PresetParamsMap[PresetId]) => void
  renderer(
    { ctx, slots, assets, shared, dropShadow: toDropShadowDraw(dropShadow), cornerRadius, width, height, elapsedMs },
    params,
  )
}
