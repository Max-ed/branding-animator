import type { DropShadowSettings } from '../types'

export function dropShadowFilter(d: DropShadowSettings): string {
  if (!d.enabled) return 'none'
  return `drop-shadow(0 ${d.offsetY}px ${d.blur}px rgba(0, 0, 0, ${d.opacity}))`
}
