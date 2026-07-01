import type { PresetId, PresetParamsMap, PresetRenderProps } from '../../types'
import { SimpleStack } from './SimpleStack'
import { Carousel } from './Carousel'
import { FoldingStack } from './FoldingStack'
import { ParallaxFloat } from './ParallaxFloat'
import { ParallaxStack } from './ParallaxStack'
import { MaskReveal } from './MaskReveal'

type PresetComponent = {
  [K in PresetId]: (props: PresetRenderProps<PresetParamsMap[K]>) => React.ReactElement
}

export const PRESET_COMPONENTS: PresetComponent = {
  simpleStack: SimpleStack,
  carousel: Carousel,
  foldingStack: FoldingStack,
  parallaxFloat: ParallaxFloat,
  parallaxStack: ParallaxStack,
  maskReveal: MaskReveal,
}
