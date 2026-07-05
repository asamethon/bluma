import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface ChallengeState {
  xp: number;
  streak: number;
  challengeProgress: Record<string, number>;
  claimedChallenges: string[];
  isLoaded: boolean;
}

const initialState: ChallengeState = {
  xp: 0,
  streak: 0,
  challengeProgress: {},
  claimedChallenges: [],
  isLoaded: false,
};

const challengeSlice = createSlice({
  name: 'challenge',
  initialState,
  reducers: {
    setChallengeState(_state, action: PayloadAction<ChallengeState>) {
      return action.payload;
    },
    patchChallenge(state, action: PayloadAction<Partial<ChallengeState>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { setChallengeState, patchChallenge } = challengeSlice.actions;
export default challengeSlice.reducer;
