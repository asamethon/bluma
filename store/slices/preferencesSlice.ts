import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface PreferencesState {
  showMatureContent: boolean;
  loaded: boolean;
}

const initialState: PreferencesState = {
  showMatureContent: false,
  loaded: false,
};

const preferencesSlice = createSlice({
  name: 'preferences',
  initialState,
  reducers: {
    patchPreferences(state, action: PayloadAction<Partial<PreferencesState>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { patchPreferences } = preferencesSlice.actions;
export default preferencesSlice.reducer;
