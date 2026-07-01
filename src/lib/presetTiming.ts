// Single source of truth for per-preset timing constants, shared by the live
// DOM/Framer Motion preview and the canvas export renderer so loop length and
// per-item timing stay in sync between the two.
export const TIMING = {
  simpleStack: { intervalMs: 600, endHoldMs: 1200 },
  carousel: { travelMs: 600, continuousPerItemMs: 900, magneticLegMs: 800 },
  foldingStack: { foldMs: 550, delayFactor: 0.7 },
  parallaxFloat: { continuousCycleBaseMs: 3200, triggeredStaggerMs: 280, triggeredDurationMs: 700 },
  maskReveal: { staggerMs: 450, durationMs: 650 },
}
