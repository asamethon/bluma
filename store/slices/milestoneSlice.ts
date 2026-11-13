import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Milestone } from '@/features/milestone/types';

interface MilestoneState {
  current: Milestone | null;
  /** Belge en az bir kez başarıyla okundu mu (yok olması da bir cevaptır). */
  loaded: boolean;
}

const initialState: MilestoneState = { current: null, loaded: false };

const milestoneSlice = createSlice({
  name: 'milestone',
  initialState,
  reducers: {
    setMilestone(state, action: PayloadAction<Milestone | null>) {
      state.current = action.payload;
      state.loaded = true;
    },
  },
});

export const { setMilestone } = milestoneSlice.actions;
export default milestoneSlice.reducer;
