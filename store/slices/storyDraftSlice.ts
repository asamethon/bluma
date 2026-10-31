import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { DraftSummary } from '@/features/story/services/chapterMetadata';

type State = { ownerId: string | null; summaries: Record<string, DraftSummary> };
const initialState: State = { ownerId: null, summaries: {} };
const slice = createSlice({
  name: 'storyDraft', initialState,
  reducers: {
    replaceDraftSummaries: (_state, action: PayloadAction<{ ownerId: string; summaries: State['summaries'] }>) => action.payload,
    rememberDraftSummary(state, action: PayloadAction<{ ownerId: string; storyId: string; summary: DraftSummary }>) {
      if (state.ownerId !== action.payload.ownerId) state.summaries = {};
      state.ownerId = action.payload.ownerId;
      state.summaries[action.payload.storyId] = action.payload.summary;
    },
    forgetDraftSummary(state, action: PayloadAction<string>) { delete state.summaries[action.payload]; },
    resetStoryDrafts: () => initialState,
  },
});
export const { replaceDraftSummaries, rememberDraftSummary, forgetDraftSummary, resetStoryDrafts } = slice.actions;
export default slice.reducer;
