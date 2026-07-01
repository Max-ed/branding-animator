import { DndContext, closestCenter, type DragEndEvent } from '@dnd-kit/core'
import { useApp } from '../../state/AppContext'
import { SlotRow } from './SlotRow'

export function SlotList() {
  const { state, dispatch } = useApp()
  const slots = state.presetSlots[state.preset]
  const assetsById = Object.fromEntries(state.assets.map((a) => [a.id, a]))

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const fromIndex = slots.findIndex((s) => s.id === active.id)
    const toIndex = slots.findIndex((s) => s.id === over.id)
    if (fromIndex === -1 || toIndex === -1) return
    dispatch({ type: 'REORDER_SLOTS', fromIndex, toIndex })
  }

  if (slots.length === 0) {
    return <p className="slot-list-empty">Click an asset above to add it to this preset.</p>
  }

  return (
    <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <div className="slot-list">
        {slots.map((slot) => (
          <SlotRow key={slot.id} slot={slot} asset={assetsById[slot.assetId ?? '']} assets={state.assets} />
        ))}
      </div>
    </DndContext>
  )
}
