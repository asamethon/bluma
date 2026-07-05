import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ReadingListMeta {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  storyIds: string[];
  createdAt?: any;
  updatedAt?: any;
}

export interface ReadingListState {
  lists: ReadingListMeta[];
  loaded: boolean;
}

const initialState: ReadingListState = {
  lists: [],
  loaded: false,
};

const readingListSlice = createSlice({
  name: 'readingList',
  initialState,
  reducers: {
    patchReadingList(state, action: PayloadAction<Partial<ReadingListState>>) {
      Object.assign(state, action.payload);
    },
    upsertList(state, action: PayloadAction<ReadingListMeta>) {
      state.lists.unshift(action.payload);
    },
    updateList(state, action: PayloadAction<{ listId: string; patch: Partial<ReadingListMeta> }>) {
      const list = state.lists.find(l => l.id === action.payload.listId);
      if (list) Object.assign(list, action.payload.patch);
    },
    removeList(state, action: PayloadAction<string>) {
      state.lists = state.lists.filter(l => l.id !== action.payload);
    },
    addStoryToList(state, action: PayloadAction<{ listId: string; storyId: string }>) {
      const list = state.lists.find(l => l.id === action.payload.listId);
      if (list && !list.storyIds.includes(action.payload.storyId)) {
        list.storyIds.push(action.payload.storyId);
      }
    },
    removeStoryFromList(state, action: PayloadAction<{ listId: string; storyId: string }>) {
      const list = state.lists.find(l => l.id === action.payload.listId);
      if (list) list.storyIds = list.storyIds.filter(s => s !== action.payload.storyId);
    },
  },
});

export const {
  patchReadingList,
  upsertList,
  updateList,
  removeList,
  addStoryToList,
  removeStoryFromList,
} = readingListSlice.actions;
export default readingListSlice.reducer;
