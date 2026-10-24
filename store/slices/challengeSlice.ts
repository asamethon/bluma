import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { applyChallengeOperation, emptyChallengeData, type ChallengeData, type ChallengeOperation } from '@/features/challenges/services/challengeState';
import { patchAuth } from './authSlice';

interface PendingOperation { id: number; operation: ChallengeOperation }
interface ChallengeState {
  userId: string | null;
  confirmed: ChallengeData;
  pending: PendingOperation[];
  isLoaded: boolean;
}
const initialState: ChallengeState = { userId: null, confirmed: emptyChallengeData, pending: [], isLoaded: false };
const challengeSlice = createSlice({
  name: 'challenge',
  initialState,
  reducers: {
    resetChallenges: () => initialState,
    beginChallenges: (_state, action: PayloadAction<string>) => ({ ...initialState, userId: action.payload }),
    queueChallenge(state, action: PayloadAction<PendingOperation>) { state.pending.push(action.payload); },
    settleChallenge(state, action: PayloadAction<{ id?: number; data?: ChallengeData }>) {
      state.pending = state.pending.filter(item => item.id !== action.payload.id);
      if (action.payload.data) {
        state.confirmed = action.payload.data;
        state.isLoaded = true;
      }
    },
  },
  extraReducers: builder => builder.addCase(patchAuth, (state, { payload }) => {
    if (payload.isGuest || payload.isAuthenticated === false
      || ('user' in payload && payload.user?.id !== state.userId)) return initialState;
  }),
});

export const { resetChallenges, beginChallenges, queueChallenge, settleChallenge } = challengeSlice.actions;
const selectChallengeView = createSelector(
  [(state: { challenge: ChallengeState }) => state.challenge.confirmed,
    (state: { challenge: ChallengeState }) => state.challenge.pending],
  (confirmed, pending) => pending.reduce((data, item) => applyChallengeOperation(data, item.operation), confirmed),
);
export const selectChallengeXp = (state: { challenge: ChallengeState }) => selectChallengeView(state).xp;
export const selectChallengeStreak = (state: { challenge: ChallengeState }) => selectChallengeView(state).streak;
export const selectChallengeProgress = (state: { challenge: ChallengeState }) => selectChallengeView(state).challengeProgress;
export const selectClaimedChallenges = (state: { challenge: ChallengeState }) => selectChallengeView(state).claimedChallenges;
export default challengeSlice.reducer;
