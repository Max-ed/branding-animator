function A(a1: number, a2: number) {
  return 1 - 3 * a2 + 3 * a1
}
function B(a1: number, a2: number) {
  return 3 * a2 - 6 * a1
}
function C(a1: number) {
  return 3 * a1
}

function bezier(t: number, a1: number, a2: number) {
  return ((A(a1, a2) * t + B(a1, a2)) * t + C(a1)) * t
}

function bezierSlope(t: number, a1: number, a2: number) {
  return 3 * A(a1, a2) * t * t + 2 * B(a1, a2) * t + C(a1)
}

export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  return (x: number): number => {
    if (x <= 0) return 0
    if (x >= 1) return 1
    let t = x
    for (let i = 0; i < 8; i++) {
      const slope = bezierSlope(t, x1, x2)
      if (Math.abs(slope) < 1e-6) break
      t -= (bezier(t, x1, x2) - x) / slope
    }
    return bezier(t, y1, y2)
  }
}
