import { createContext, useContext, useReducer, type ReactNode } from 'react'
import {
  DEFAULT_CANVAS_SETTINGS,
  DEFAULT_PRESET_PARAMS,
  type Asset,
  type CanvasSettings,
  type DropShadowSettings,
  type EasingMode,
  type FormatId,
  type PresetId,
  type PresetParamsMap,
  type SharedAnimationSettings,
  type Slot,
} from '../types'
import { makeId } from '../lib/id'
import { arrayMove } from '../lib/arrayMove'

interface AppState {
  format: FormatId
  assets: Asset[]
  preset: PresetId
  presetSlots: Record<PresetId, Slot[]>
  shared: SharedAnimationSettings
  presetParams: PresetParamsMap
  canvas: CanvasSettings
  playKey: number
  isPlaying: boolean
}

type Action =
  | { type: 'SET_FORMAT'; format: FormatId }
  | { type: 'ADD_ASSETS'; assets: Asset[] }
  | { type: 'REMOVE_ASSET'; id: string }
  | { type: 'SET_PRESET'; preset: PresetId }
  | { type: 'ADD_SLOT'; assetId: string }
  | { type: 'REMOVE_SLOT'; slotId: string }
  | { type: 'REPLACE_SLOT_ASSET'; slotId: string; assetId: string }
  | { type: 'SET_SLOT_SCALE'; slotId: string; scale: number }
  | { type: 'REORDER_SLOTS'; fromIndex: number; toIndex: number }
  | { type: 'SET_EASING'; easing: EasingMode }
  | { type: 'SET_SPEED'; speed: number }
  | { type: 'SET_PRESET_PARAMS'; preset: PresetId; params: Partial<PresetParamsMap[PresetId]> }
  | { type: 'SET_BACKGROUND_COLOR'; color: string }
  | { type: 'SET_DROP_SHADOW'; dropShadow: Partial<DropShadowSettings> }
  | { type: 'SET_CORNER_RADIUS'; cornerRadius: number }
  | { type: 'RESTART' }
  | { type: 'SET_PLAYING'; isPlaying: boolean }

const emptySlots: Record<PresetId, Slot[]> = {
  simpleStack: [],
  carousel: [],
  foldingStack: [],
  parallaxFloat: [],
  parallaxStack: [],
  maskReveal: [],
}

const initialState: AppState = {
  format: '1920x1080',
  assets: [],
  preset: 'simpleStack',
  presetSlots: emptySlots,
  shared: { easing: 'gentle', speed: 1 },
  presetParams: DEFAULT_PRESET_PARAMS,
  canvas: DEFAULT_CANVAS_SETTINGS,
  playKey: 0,
  isPlaying: true,
}

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_FORMAT':
      return { ...state, format: action.format }

    case 'ADD_ASSETS':
      return { ...state, assets: [...state.assets, ...action.assets] }

    case 'REMOVE_ASSET': {
      const asset = state.assets.find((a) => a.id === action.id)
      if (asset) URL.revokeObjectURL(asset.url)
      const presetSlots = Object.fromEntries(
        Object.entries(state.presetSlots).map(([preset, slots]) => [
          preset,
          slots.filter((s) => s.assetId !== action.id),
        ]),
      ) as Record<PresetId, Slot[]>
      return {
        ...state,
        assets: state.assets.filter((a) => a.id !== action.id),
        presetSlots,
      }
    }

    case 'SET_PRESET':
      return { ...state, preset: action.preset }

    case 'ADD_SLOT': {
      const slot: Slot = { id: makeId(), assetId: action.assetId, scale: 1 }
      return {
        ...state,
        presetSlots: {
          ...state.presetSlots,
          [state.preset]: [...state.presetSlots[state.preset], slot],
        },
      }
    }

    case 'REMOVE_SLOT':
      return {
        ...state,
        presetSlots: {
          ...state.presetSlots,
          [state.preset]: state.presetSlots[state.preset].filter((s) => s.id !== action.slotId),
        },
      }

    case 'REPLACE_SLOT_ASSET':
      return {
        ...state,
        presetSlots: {
          ...state.presetSlots,
          [state.preset]: state.presetSlots[state.preset].map((s) =>
            s.id === action.slotId ? { ...s, assetId: action.assetId } : s,
          ),
        },
      }

    case 'SET_SLOT_SCALE':
      return {
        ...state,
        presetSlots: {
          ...state.presetSlots,
          [state.preset]: state.presetSlots[state.preset].map((s) =>
            s.id === action.slotId ? { ...s, scale: action.scale } : s,
          ),
        },
      }

    case 'REORDER_SLOTS':
      return {
        ...state,
        presetSlots: {
          ...state.presetSlots,
          [state.preset]: arrayMove(state.presetSlots[state.preset], action.fromIndex, action.toIndex),
        },
      }

    case 'SET_EASING':
      return { ...state, shared: { ...state.shared, easing: action.easing } }

    case 'SET_SPEED':
      return { ...state, shared: { ...state.shared, speed: action.speed } }

    case 'SET_PRESET_PARAMS':
      return {
        ...state,
        presetParams: {
          ...state.presetParams,
          [action.preset]: { ...state.presetParams[action.preset], ...action.params },
        },
      }

    case 'SET_BACKGROUND_COLOR':
      return { ...state, canvas: { ...state.canvas, backgroundColor: action.color } }

    case 'SET_DROP_SHADOW':
      return { ...state, canvas: { ...state.canvas, dropShadow: { ...state.canvas.dropShadow, ...action.dropShadow } } }

    case 'SET_CORNER_RADIUS':
      return { ...state, canvas: { ...state.canvas, cornerRadius: action.cornerRadius } }

    case 'RESTART':
      return { ...state, playKey: state.playKey + 1, isPlaying: true }

    case 'SET_PLAYING':
      return { ...state, isPlaying: action.isPlaying }

    default:
      return state
  }
}

interface AppContextValue {
  state: AppState
  dispatch: React.Dispatch<Action>
}

const AppContext = createContext<AppContextValue | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  return <AppContext.Provider value={{ state, dispatch }}>{children}</AppContext.Provider>
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
