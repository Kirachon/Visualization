import type { PayloadAction } from '@reduxjs/toolkit';
import { createSlice } from '@reduxjs/toolkit';
import type {
  ComponentConfigBase,
  DashboardDefinition,
  DashboardComponentType,
  LayoutItem,
} from '../types/dashboard';

interface HistoryState<T> {
  past: T[];
  present: T;
  future: T[];
}

export interface BuilderState {
  dashboardId: string | null;
  history: HistoryState<DashboardDefinition> | null;
  selectedId: string | null;
  saving: boolean;
  saveError: string | null;
  dirty: boolean;
}

const MAX_HISTORY = 50;

function pushHistory<T>(h: HistoryState<T>, next: T): HistoryState<T> {
  const past = [...h.past, h.present].slice(-MAX_HISTORY);
  return { past, present: next, future: [] };
}

function undo<T>(h: HistoryState<T>): HistoryState<T> | null {
  if (h.past.length === 0) return null;
  const previous = h.past[h.past.length - 1];
  const newPast = h.past.slice(0, -1);
  return { past: newPast, present: previous, future: [h.present, ...h.future] };
}

function redo<T>(h: HistoryState<T>): HistoryState<T> | null {
  if (h.future.length === 0) return null;
  const next = h.future[0];
  const newFuture = h.future.slice(1);
  return { past: [...h.past, h.present], present: next, future: newFuture };
}

const initialState: BuilderState = {
  dashboardId: null,
  history: null,
  selectedId: null,
  saving: false,
  saveError: null,
  dirty: false,
};

const builderSlice = createSlice({
  name: 'builder',
  initialState,
  reducers: {
    setInitial(state, action: PayloadAction<DashboardDefinition>) {
      state.dashboardId = action.payload.id;
      state.history = { past: [], present: action.payload, future: [] };
      state.selectedId = null;
      state.dirty = false;
      state.saveError = null;
    },
    addComponent(
      state,
      action: PayloadAction<{
        type: DashboardComponentType;
        layout: LayoutItem;
        defaults?: Partial<ComponentConfigBase>;
      }>,
    ) {
      if (!state.history) return;
      const current = state.history.present;
      const id = action.payload.layout.i;
      const comp: ComponentConfigBase = {
        id,
        type: action.payload.type,
        title: action.payload.defaults?.title || action.payload.type.toUpperCase(),
        description: action.payload.defaults?.description,
        bindings: action.payload.defaults?.bindings,
        options: action.payload.defaults?.options || {},
      };
      const next: DashboardDefinition = {
        ...current,
        layout: [...current.layout, action.payload.layout],
        components: [...current.components, comp],
      };
      state.history = pushHistory(state.history, next);
      state.selectedId = id;
      state.dirty = true;
    },
    updateLayout(state, action: PayloadAction<LayoutItem[]>) {
      if (!state.history) return;
      const current = state.history.present;
      const next: DashboardDefinition = { ...current, layout: action.payload };
      state.history = pushHistory(state.history, next);
      state.dirty = true;
    },
    updateComponent(
      state,
      action: PayloadAction<{ id: string; patch: Partial<ComponentConfigBase> }>,
    ) {
      if (!state.history) return;
      const current = state.history.present;
      const next: DashboardDefinition = {
        ...current,
        components: current.components.map((c) =>
          c.id === action.payload.id ? { ...c, ...action.payload.patch } : c,
        ),
      };
      state.history = pushHistory(state.history, next);
      state.dirty = true;
    },
    removeComponent(state, action: PayloadAction<string>) {
      if (!state.history) return;
      const current = state.history.present;
      const next: DashboardDefinition = {
        ...current,
        components: current.components.filter((c) => c.id !== action.payload),
        layout: current.layout.filter((l) => l.i !== action.payload),
      };
      state.history = pushHistory(state.history, next);
      state.selectedId = null;
      state.dirty = true;
    },
    selectComponent(state, action: PayloadAction<string | null>) {
      state.selectedId = action.payload;
    },
    markSaved(state) {
      state.dirty = false;
      state.saving = false;
      state.saveError = null;
    },
    setSaving(state, action: PayloadAction<boolean>) {
      state.saving = action.payload;
    },
    setSaveError(state, action: PayloadAction<string | null>) {
      state.saveError = action.payload;
    },
    undoAction(state) {
      if (!state.history) return;
      const next = undo(state.history);
      if (next) {
        state.history = next;
        state.dirty = true;
      }
    },
    redoAction(state) {
      if (!state.history) return;
      const next = redo(state.history);
      if (next) {
        state.history = next;
        state.dirty = true;
      }
    },
  },
});

export const {
  setInitial,
  addComponent,
  updateLayout,
  updateComponent,
  removeComponent,
  selectComponent,
  markSaved,
  setSaving,
  setSaveError,
  undoAction,
  redoAction,
} = builderSlice.actions;
export default builderSlice.reducer;
