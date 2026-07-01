import type {
  Asset,
  CarouselParams,
  DropShadowSettings,
  FoldingStackParams,
  MaskRevealParams,
  ParallaxFloatParams,
  ParallaxStackParams,
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

const PARALLAX_SCALE_PER_LAYER = 0.82

function drawParallaxFloat(f: FrameCtx, params: ParallaxFloatParams) {
  const baseSize = Math.min(f.width, f.height) * BASE_SIZE_FRACTION.parallaxFloat
  const n = Math.max(params.imagesPerLayer, 1)
  const cy = f.height / 2

  const filledSlots = f.slots.filter(s => s.assetId && f.assets[s.assetId])
  const layerSlots: Slot[][] = []
  for (let i = 0; i < filledSlots.length; i += n) {
    layerSlots.push(filledSlots.slice(i, i + n))
  }
  if (layerSlots.length === 0) return

  const numLayers = layerSlots.length
  const baseLoopMs = getContinuousDurationMs(Math.max(layerSlots[0].length, 1))

  // Draw back to front (painter's algorithm — highest L index = back)
  for (let L = numLayers - 1; L >= 0; L--) {
    const layerItems = layerSlots[L]
    const count = Math.max(layerItems.length, 1)
    const scaleMultiplier = Math.pow(PARALLAX_SCALE_PER_LAYER, L)
    const layerBaseSize = baseSize * scaleMultiplier
    const step = layerBaseSize + params.gap
    const totalWidth = count * step
    const loopMs = speedScale(baseLoopMs * Math.pow(2, L), f.shared.speed)
    const progress = loopMs > 0 ? (f.elapsedMs % loopMs) / loopMs : 0
    const offsetX = -progress * totalWidth
    const copies = Math.ceil(f.width / totalWidth) + 2

    for (let copy = 0; copy < copies; copy++) {
      for (let i = 0; i < layerItems.length; i++) {
        const slot = layerItems[i]
        const asset = slot.assetId ? f.assets[slot.assetId] : undefined
        if (!asset) continue
        const x = copy * totalWidth + i * step + layerBaseSize / 2 + offsetX
        if (x + layerBaseSize / 2 < 0 || x - layerBaseSize / 2 > f.width) continue
        drawContain(f.ctx, getMediaElement(asset), x, cy, layerBaseSize * (slot.scale ?? 1), 1, undefined, f.dropShadow, f.cornerRadius)
      }
    }
  }
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

const PARALLAX_STACK_SCALE_PER_LAYER = 0.85

function drawParallaxStack(f: FrameCtx, params: ParallaxStackParams) {
  const baseSize = Math.min(f.width, f.height) * BASE_SIZE_FRACTION.parallaxStack
  const cy = f.height / 2

  const filledSlots = f.slots.filter(s => s.assetId && f.assets[s.assetId])
  if (filledSlots.length === 0) return

  const N = filledSlots.length
  const T = getContinuousDurationMs(N)
  const loopMs = speedScale(T, f.shared.speed)

  // Draw back to front (painter's algorithm)
  for (let L = N - 1; L >= 0; L--) {
    const slot = filledSlots[L]
    const asset = slot.assetId ? f.assets[slot.assetId] : undefined
    if (!asset) continue
    const layerBaseSize = baseSize * Math.pow(PARALLAX_STACK_SCALE_PER_LAYER, L)
    const step = layerBaseSize + params.gap
    const progress = loopMs > 0 ? (f.elapsedMs % loopMs) / loopMs : 0
    const offsetX = -progress * step
    const copies = Math.ceil(f.width / step) + 2

    for (let copy = 0; copy < copies; copy++) {
      const x = copy * step + offsetX + layerBaseSize / 2
      if (x + layerBaseSize / 2 < 0 || x - layerBaseSize / 2 > f.width) continue
      drawContain(f.ctx, getMediaElement(asset), x, cy, layerBaseSize * (slot.scale ?? 1), 1, undefined, f.dropShadow, f.cornerRadius)
    }
  }
}

const RENDERERS: { [K in PresetId]: (f: FrameCtx, params: PresetParamsMap[K]) => void } = {
  simpleStack: drawSimpleStack,
  carousel: drawCarousel,
  foldingStack: drawFoldingStack,
  parallaxFloat: drawParallaxFloat,
  parallaxStack: drawParallaxStack,
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
