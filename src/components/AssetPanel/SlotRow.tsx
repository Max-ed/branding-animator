import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Asset, Slot } from '../../types'
import { useApp } from '../../state/AppContext'
import { AssetThumb } from './AssetThumb'

export function SlotRow({ slot, asset, assets }: { slot: Slot; asset: Asset | undefined; assets: Asset[] }) {
  const { dispatch } = useApp()
  const { attributes, listeners, setNodeRef: setDragRef, transform, isDragging } = useDraggable({
    id: slot.id,
  })
  const { setNodeRef: setDropRef, isOver } = useDroppable({ id: slot.id })

  return (
    <div
      ref={setDropRef}
      className={`slot-row ${isOver ? 'slot-row-over' : ''} ${isDragging ? 'slot-row-dragging' : ''}`}
    >
      <div className="slot-row-top">
        <div
          ref={setDragRef}
          className="slot-drag-handle"
          style={{ transform: CSS.Translate.toString(transform) }}
          {...listeners}
          {...attributes}
        >
          ⠿
        </div>

        {asset ? <AssetThumb asset={asset} size={40} /> : <div className="slot-empty">empty</div>}

        <select
          className="slot-replace"
          value={slot.assetId ?? ''}
          onChange={(e) => dispatch({ type: 'REPLACE_SLOT_ASSET', slotId: slot.id, assetId: e.target.value })}
        >
          <option value="" disabled>
            Replace…
          </option>
          {assets.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        <button className="slot-remove" onClick={() => dispatch({ type: 'REMOVE_SLOT', slotId: slot.id })}>
          ✕
        </button>
      </div>

      <div className="slot-scale-row">
        <input
          type="range"
          min={20}
          max={200}
          value={Math.round(slot.scale * 100)}
          onChange={(e) =>
            dispatch({ type: 'SET_SLOT_SCALE', slotId: slot.id, scale: Number(e.target.value) / 100 })
          }
        />
        <input
          type="number"
          className="slot-scale-number"
          min={20}
          max={200}
          value={Math.round(slot.scale * 100)}
          onChange={(e) => {
            const value = Number(e.target.value)
            if (Number.isNaN(value)) return
            const clamped = Math.min(200, Math.max(20, value))
            dispatch({ type: 'SET_SLOT_SCALE', slotId: slot.id, scale: clamped / 100 })
          }}
        />
      </div>
    </div>
  )
}
