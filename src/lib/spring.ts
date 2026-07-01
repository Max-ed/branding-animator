// Damped harmonic oscillator approximating Framer Motion's spring(stiffness, damping, mass)
// going from 0 to 1 with zero initial velocity. Used to sample spring progress for canvas export.
export function springProgress(
  elapsedSec: number,
  stiffness = 260,
  damping = 18,
  mass = 0.9,
): number {
  if (elapsedSec <= 0) return 0
  const omega0 = Math.sqrt(stiffness / mass)
  const zeta = damping / (2 * Math.sqrt(stiffness * mass))

  if (zeta < 1) {
    const omegaD = omega0 * Math.sqrt(1 - zeta * zeta)
    const envelope = Math.exp(-zeta * omega0 * elapsedSec)
    return 1 - envelope * (Math.cos(omegaD * elapsedSec) + (zeta * omega0) / omegaD * Math.sin(omegaD * elapsedSec))
  }

  const envelope = Math.exp(-omega0 * elapsedSec)
  return 1 - envelope * (1 + omega0 * elapsedSec)
}
