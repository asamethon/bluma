import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type ReadingTheme = 'light' | 'sepia' | 'dark' | 'black';
export type ReadingFont = 'serif' | 'sans';
export type ReadingLineSpacing = 'compact' | 'normal' | 'relaxed';

export interface PreferencesState {
  showMatureContent: boolean;
  loaded: boolean;
  readingTheme: ReadingTheme;
  readingFont: ReadingFont;
  readingLineSpacing: ReadingLineSpacing;
}

const initialState: PreferencesState = {
  showMatureContent: false,
  loaded: false,
  readingTheme: 'light',
  readingFont: 'serif',
  readingLineSpacing: 'normal',
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
