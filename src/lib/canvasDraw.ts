type Media = HTMLImageElement | HTMLVideoElement

function intrinsicSize(media: Media): [number, number] {
  if (media instanceof HTMLVideoElement) return [media.videoWidth, media.videoHeight]
  return [media.naturalWidth, media.naturalHeight]
}

export interface DropShadowDraw {
  color: string
  blur: number
  offsetY: number
}

function roundedRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  ry: number,
) {
  const cRx = Math.max(0, Math.min(rx, w / 2))
  const cRy = Math.max(0, Math.min(ry, h / 2))
  ctx.moveTo(x + cRx, y)
  ctx.lineTo(x + w - cRx, y)
  ctx.ellipse(x + w - cRx, y + cRy, cRx, cRy, 0, -Math.PI / 2, 0)
  ctx.lineTo(x + w, y + h - cRy)
  ctx.ellipse(x + w - cRx, y + h - cRy, cRx, cRy, 0, 0, Math.PI / 2)
  ctx.lineTo(x + cRx, y + h)
  ctx.ellipse(x + cRx, y + h - cRy, cRx, cRy, 0, Math.PI / 2, Math.PI)
  ctx.lineTo(x, y + cRy)
  ctx.ellipse(x + cRx, y + cRy, cRx, cRy, 0, Math.PI, Math.PI * 1.5)
  ctx.closePath()
}

export function drawContain(
  ctx: CanvasRenderingContext2D,
  media: Media,
  cx: number,
  cy: number,
  boxSize: number,
  opacity: number,
  squash?: { axis: 'x' | 'y'; amount: number },
  dropShadow?: DropShadowDraw,
  cornerRadiusPercent?: number,
) {
  const [iw, ih] = intrinsicSize(media)
  if (!iw || !ih || opacity <= 0) return

  const fit = Math.min(boxSize / iw, boxSize / ih)
  const dw = iw * fit
  const dh = ih * fit
  const left = cx - dw / 2
  const top = cy - dh / 2

  const sx = squash?.axis === 'x' ? Math.max(squash.amount, 0.02) : 1
  const sy = squash?.axis === 'y' ? Math.max(squash.amount, 0.02) : 1
  const clampedOpacity = Math.max(0, Math.min(opacity, 1))

  // A single uniform radius based on the shorter side, not a per-axis
  // percentage (which would stretch into an ellipse on non-square
  // assets) — so corners are always a true circular arc.
  const hasRadius = Boolean(cornerRadiusPercent && cornerRadiusPercent > 0)
  const radius = hasRadius ? (cornerRadiusPercent! / 100) * Math.min(dw, dh) : 0
  const rx = radius
  const ry = radius

  // Pass 1: cast the shadow from a filled silhouette matching the
  // image's (rounded, if applicable) outline — unclipped, so the shadow
  // can extend beyond the image's own bounds. This filled shape is fully
  // covered by the clipped image drawn in pass 2, so its own color is
  // irrelevant; only its shape and alpha (for casting a correctly
  // outlined shadow at the current fade level) matter.
  if (dropShadow) {
    ctx.save()
    ctx.globalAlpha = clampedOpacity
    ctx.shadowColor = dropShadow.color
    ctx.shadowBlur = dropShadow.blur
    ctx.shadowOffsetY = dropShadow.offsetY
    ctx.translate(left, top)
    ctx.scale(sx, sy)
    ctx.fillStyle = '#000'
    ctx.beginPath()
    if (hasRadius) roundedRectPath(ctx, 0, 0, dw, dh, rx, ry)
    else ctx.rect(0, 0, dw, dh)
    ctx.fill()
    ctx.restore()
  }

  // Pass 2: the actual image, clipped to the rounded rect when corner
  // rounding is on. Clipping (unlike erasing) never touches pixels
  // outside its own region, so the four corners simply keep whatever the
  // canvas's background fill already painted there — no risk of leaving
  // a transparent hole (which WebM export can't represent and would
  // otherwise flatten to a fallback color) or a fringe of the image's
  // own corner pixels peeking through.
  ctx.save()
  ctx.globalAlpha = clampedOpacity
  ctx.translate(left, top)
  ctx.scale(sx, sy)
  if (hasRadius) {
    ctx.beginPath()
    roundedRectPath(ctx, 0, 0, dw, dh, rx, ry)
    ctx.clip()
  }
  ctx.drawImage(media, 0, 0, dw, dh)
  ctx.restore()
}

export function clipRectReveal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  boxSize: number,
  direction: 'left' | 'right' | 'up' | 'down',
  progress: number,
) {
  const p = Math.max(0, Math.min(progress, 1))
  const left = cx - boxSize / 2
  const top = cy - boxSize / 2
  let x = left
  let y = top
  let w = boxSize
  let h = boxSize

  if (direction === 'left') w = boxSize * p
  else if (direction === 'right') {
    w = boxSize * p
    x = left + boxSize * (1 - p)
  } else if (direction === 'up') {
    h = boxSize * p
  } else {
    h = boxSize * p
    y = top + boxSize * (1 - p)
  }

  ctx.beginPath()
  ctx.rect(x, y, w, h)
  ctx.clip()
}

export function clipCircleReveal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  boxSize: number,
  progress: number,
) {
  const p = Math.max(0, Math.min(progress, 1))
  const radius = p * boxSize * 0.75
  ctx.beginPath()
  ctx.arc(cx, cy, Math.max(radius, 0.01), 0, Math.PI * 2)
  ctx.clip()
}

function rotateAround(px: number, py: number, cx: number, cy: number, angleRad: number): [number, number] {
  const dx = px - cx
  const dy = py - cy
  return [
    cx + dx * Math.cos(angleRad) - dy * Math.sin(angleRad),
    cy + dx * Math.sin(angleRad) + dy * Math.cos(angleRad),
  ]
}

export function clipDiagonalReveal(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  boxSize: number,
  direction: 'left' | 'right' | 'up' | 'down',
  progress: number,
) {
  const p = Math.max(0, Math.min(progress, 1))
  const big = boxSize * 0.8
  const vertical = direction === 'up' || direction === 'down'
  const reverse = direction === 'right' || direction === 'down'
  const sweep = (reverse ? 1 - p : p) * (boxSize + big * 2) - big
  const angle = vertical ? Math.PI / 2 : 0
  const mirror = reverse ? -1 : 1

  const localPoints: [number, number][] = [
    [-boxSize * mirror, -boxSize],
    [sweep * mirror, -boxSize],
    [(sweep - big * 0.5) * mirror, boxSize],
    [-boxSize * mirror, boxSize],
  ]

  ctx.beginPath()
  localPoints.forEach(([lx, ly], i) => {
    const [x, y] = rotateAround(cx + lx, cy + ly, cx, cy, angle)
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.clip()
}
