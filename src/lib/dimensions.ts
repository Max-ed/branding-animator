import type { CSSProperties } from 'react'
import { FORMATS, type FormatId } from '../types'

export function formatStyleVars(formatId: FormatId): CSSProperties {
  const format = FORMATS[formatId]
  return {
    '--stage-w': `${format.width}px`,
    '--stage-h': `${format.height}px`,
  } as CSSProperties
}
