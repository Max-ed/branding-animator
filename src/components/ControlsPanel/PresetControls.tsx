import { useApp } from '../../state/AppContext'
import type { CarouselParams, FoldingStackParams, MaskRevealParams, ParallaxFloatParams, ParallaxStackParams } from '../../types'

export function PresetControls() {
  const { state, dispatch } = useApp()
  const preset = state.preset

  function set<P>(params: Partial<P>) {
    dispatch({ type: 'SET_PRESET_PARAMS', preset, params: params as never })
  }

  if (preset === 'carousel') {
    const p = state.presetParams.carousel
    return (
      <div className="control-group">
        <div className="control-field">
          <label>Mode</label>
          <select
            value={p.mode}
            onChange={(e) => set<CarouselParams>({ mode: e.target.value as CarouselParams['mode'] })}
          >
            <option value="continuous">Continuous</option>
            <option value="snappy">Snappy</option>
            <option value="magnetic">Magnetic</option>
          </select>
        </div>
        <div className="control-field">
          <label>Gap — {p.gap}px</label>
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={p.gap}
            onChange={(e) => set<CarouselParams>({ gap: Number(e.target.value) })}
          />
        </div>
        <div className="control-field">
          <label>Hold Duration — {p.holdMs}ms{p.mode !== 'snappy' ? ' (snappy only)' : ''}</label>
          <input
            type="range"
            min={200}
            max={2500}
            step={50}
            value={p.holdMs}
            disabled={p.mode !== 'snappy'}
            onChange={(e) => set<CarouselParams>({ holdMs: Number(e.target.value) })}
          />
        </div>
      </div>
    )
  }

  if (preset === 'foldingStack') {
    const p = state.presetParams.foldingStack
    return (
      <div className="control-group">
        <div className="control-field">
          <label>Fold Axis</label>
          <select
            value={p.axis}
            onChange={(e) => set<FoldingStackParams>({ axis: e.target.value as FoldingStackParams['axis'] })}
          >
            <option value="horizontal">Horizontal</option>
            <option value="vertical">Vertical</option>
          </select>
        </div>
        <div className="control-field">
          <label>Perspective Depth — {p.perspective}px</label>
          <input
            type="range"
            min={300}
            max={2000}
            step={50}
            value={p.perspective}
            onChange={(e) => set<FoldingStackParams>({ perspective: Number(e.target.value) })}
          />
        </div>
      </div>
    )
  }

  if (preset === 'parallaxFloat') {
    const p = state.presetParams.parallaxFloat
    return (
      <div className="control-group">
        <div className="control-field">
          <label>Images per Layer — {p.imagesPerLayer}</label>
          <input
            type="range"
            min={1}
            max={10}
            step={1}
            value={p.imagesPerLayer}
            onChange={(e) => set<ParallaxFloatParams>({ imagesPerLayer: Number(e.target.value) })}
          />
        </div>
        <div className="control-field">
          <label>Gap — {p.gap}px</label>
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={p.gap}
            onChange={(e) => set<ParallaxFloatParams>({ gap: Number(e.target.value) })}
          />
        </div>
      </div>
    )
  }

  if (preset === 'parallaxStack') {
    const p = state.presetParams.parallaxStack
    return (
      <div className="control-group">
        <div className="control-field">
          <label>Gap — {p.gap}px</label>
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={p.gap}
            onChange={(e) => set<ParallaxStackParams>({ gap: Number(e.target.value) })}
          />
        </div>
      </div>
    )
  }

  if (preset === 'maskReveal') {
    const p = state.presetParams.maskReveal
    return (
      <div className="control-group">
        <div className="control-field">
          <label>Mask Shape</label>
          <select
            value={p.shape}
            onChange={(e) => set<MaskRevealParams>({ shape: e.target.value as MaskRevealParams['shape'] })}
          >
            <option value="rectangle">Rectangle</option>
            <option value="circle">Circle</option>
            <option value="diagonal">Diagonal</option>
          </select>
        </div>
        <div className="control-field">
          <label>Reveal Direction</label>
          <select
            value={p.direction}
            onChange={(e) => set<MaskRevealParams>({ direction: e.target.value as MaskRevealParams['direction'] })}
          >
            <option value="left">Left</option>
            <option value="right">Right</option>
            <option value="up">Up</option>
            <option value="down">Down</option>
          </select>
        </div>
      </div>
    )
  }

  return null
}
