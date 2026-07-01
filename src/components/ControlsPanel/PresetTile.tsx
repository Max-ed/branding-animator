import type { PresetId } from '../../types'
import { PRESET_LABELS } from '../../types'

export function PresetTile({
  preset,
  active,
  onSelect,
}: {
  preset: PresetId
  active: boolean
  onSelect: () => void
}) {
  return (
    <button className={`preset-tile ${active ? 'active' : ''}`} onClick={onSelect}>
      <span className={`preset-tile-art preset-tile-art-${preset}`}>
        <i />
        <i />
        <i />
      </span>
      <span className="preset-tile-label">{PRESET_LABELS[preset]}</span>
    </button>
  )
}
