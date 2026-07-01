export type FormatId = '1920x1080' | '1080x1350'

export interface FormatDef {
  id: FormatId
  label: string
  width: number
  height: number
}

export const FORMATS: Record<FormatId, FormatDef> = {
  '1920x1080': { id: '1920x1080', label: '1920×1080', width: 1920, height: 1080 },
  '1080x1350': { id: '1080x1350', label: '1080×1350', width: 1080, height: 1350 },
}

export type AssetType = 'image' | 'video'

export interface Asset {
  id: string
  type: AssetType
  name: string
  url: string
  file: File
}

export type PresetId =
  | 'carousel'
  | 'foldingStack'
  | 'parallaxFloat'
  | 'simpleStack'
  | 'maskReveal'

export const PRESET_ORDER: PresetId[] = [
  'simpleStack',
  'carousel',
  'foldingStack',
  'parallaxFloat',
  'maskReveal',
]

export const PRESET_LABELS: Record<PresetId, string> = {
  simpleStack: 'Simple Stack',
  carousel: 'Carousel',
  foldingStack: 'Folding Stack',
  parallaxFloat: 'Parallax Float',
  maskReveal: 'Mask Reveal',
}

export type EasingMode = 'gentle' | 'spring' | 'linear'

export interface Slot {
  id: string
  assetId: string | null
  scale: number // 0.2 - 2.0
}

export interface CarouselParams {
  mode: 'continuous' | 'snappy' | 'magnetic'
  gap: number
  holdMs: number
}

export interface FoldingStackParams {
  axis: 'horizontal' | 'vertical'
  perspective: number
}

export interface ParallaxFloatParams {
  imagesPerLayer: number
  gap: number
}

export type SimpleStackParams = Record<string, never>

export interface MaskRevealParams {
  shape: 'rectangle' | 'circle' | 'diagonal'
  direction: 'left' | 'right' | 'up' | 'down'
}

export interface PresetParamsMap {
  carousel: CarouselParams
  foldingStack: FoldingStackParams
  parallaxFloat: ParallaxFloatParams
  simpleStack: SimpleStackParams
  maskReveal: MaskRevealParams
}

export const DEFAULT_PRESET_PARAMS: PresetParamsMap = {
  carousel: { mode: 'snappy', gap: 40, holdMs: 900 },
  foldingStack: { axis: 'horizontal', perspective: 900 },
  parallaxFloat: { imagesPerLayer: 3, gap: 40 },
  simpleStack: {},
  maskReveal: { shape: 'rectangle', direction: 'left' },
}

export interface SharedAnimationSettings {
  easing: EasingMode
  speed: number // 0.5 - 3
}

export interface DropShadowSettings {
  enabled: boolean
  offsetY: number // px
  blur: number // px
  opacity: number // 0 - 1
}

export interface CanvasSettings {
  backgroundColor: string
  dropShadow: DropShadowSettings
  cornerRadius: number // 0 - 50, percent of each asset's box
}

export const DEFAULT_CANVAS_SETTINGS: CanvasSettings = {
  backgroundColor: '#000000',
  dropShadow: { enabled: true, offsetY: 12, blur: 24, opacity: 0.45 },
  cornerRadius: 0,
}

export interface PresetRenderProps<P> {
  slots: Slot[]
  assets: Record<string, Asset>
  params: P
  shared: SharedAnimationSettings
  playKey: number
  width: number
  height: number
}
