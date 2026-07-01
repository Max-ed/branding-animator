import { useEffect, useState, type SyntheticEvent } from 'react'
import type { Asset } from '../../types'
import { useApp } from '../../state/AppContext'
import { dropShadowFilter } from '../../lib/dropShadow'

interface AssetVisualProps {
  asset: Asset | undefined
  size: number
  scale: number
}

// Natural (intrinsic) size of the asset, used to compute its actual
// contain-fitted rect the same way canvasDraw.ts does, so the corner
// radius (a uniform pixel value based on the shorter side) matches
// between the live preview and the exported video.
function useNaturalSize(assetId: string | undefined) {
  const [natural, setNatural] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    setNatural(null)
  }, [assetId])

  function fromImage(img: HTMLImageElement | null) {
    if (img && img.complete && img.naturalWidth) setNatural({ w: img.naturalWidth, h: img.naturalHeight })
  }

  function onImageLoad(e: SyntheticEvent<HTMLImageElement>) {
    setNatural({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })
  }

  function onVideoLoadedMetadata(e: SyntheticEvent<HTMLVideoElement>) {
    setNatural({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })
  }

  return { natural, fromImage, onImageLoad, onVideoLoadedMetadata }
}

export function AssetVisual({ asset, size, scale }: AssetVisualProps) {
  const { state } = useApp()
  const boxSize = size * scale
  const { natural, fromImage, onImageLoad, onVideoLoadedMetadata } = useNaturalSize(asset?.id)

  const fit = natural ? Math.min(boxSize / natural.w, boxSize / natural.h) : 1
  const dw = natural ? natural.w * fit : boxSize
  const dh = natural ? natural.h * fit : boxSize
  const radiusPx = (state.canvas.cornerRadius / 100) * Math.min(dw, dh)

  const wrapperStyle: React.CSSProperties = { width: boxSize, height: boxSize }
  const mediaStyle: React.CSSProperties = {
    filter: dropShadowFilter(state.canvas.dropShadow),
    borderRadius: `${radiusPx}px`,
  }

  if (!asset) {
    return (
      <div className="asset-visual-wrapper" style={wrapperStyle}>
        <div className="asset-visual asset-visual-empty" style={{ ...mediaStyle, width: boxSize, height: boxSize }} />
      </div>
    )
  }

  if (asset.type === 'video') {
    return (
      <div className="asset-visual-wrapper" style={wrapperStyle}>
        <video
          className="asset-visual"
          style={mediaStyle}
          src={asset.url}
          muted
          loop
          autoPlay
          playsInline
          onLoadedMetadata={onVideoLoadedMetadata}
        />
      </div>
    )
  }

  return (
    <div className="asset-visual-wrapper" style={wrapperStyle}>
      <img
        ref={fromImage}
        className="asset-visual"
        style={mediaStyle}
        src={asset.url}
        alt={asset.name}
        onLoad={onImageLoad}
      />
    </div>
  )
}
