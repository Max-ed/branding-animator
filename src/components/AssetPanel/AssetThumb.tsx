import type { Asset } from '../../types'

export function AssetThumb({ asset, size = 56 }: { asset: Asset; size?: number }) {
  const style = { width: size, height: size }
  if (asset.type === 'video') {
    return (
      <video
        className="asset-thumb-media"
        style={style}
        src={asset.url}
        muted
        loop
        autoPlay
        playsInline
      />
    )
  }
  return <img className="asset-thumb-media" style={style} src={asset.url} alt={asset.name} />
}
