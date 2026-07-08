import { Comment, Story } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface StoryState {
  stories: Story[];
  discoverStories: Story[];
  followingStories: Story[];
  userStories: Story[];
  publishedUserStories: Story[];
  savedStories: Story[];
  likedStories: Story[];
  offlineStories: Story[];
  currentStory: Story | null;
  storyComments: Comment[];
  isLoading: boolean;
  /** Genel hikâye akışı ilk sonucunu ürettiğinde true olur (splash ekranını
   *  tutmak için — ekranlar boş durum flash'ı görmesin). */
  storiesLoaded: boolean;
  /** Ana sayfadaki "Okumaya Devam Et" rafı — misafir/hikaye geçmişi olmayan
   *  kullanıcılarda boş kalır ama yine de true'ya döner (bkz. splash gate). */
  continueReading: { story: Story; chapterIndex: number }[];
  continueReadingLoaded: boolean;
  isDownloading: { [storyId: string]: number }; // progress 0-100
  error: string | null;
}

const initialState: StoryState = {
  stories: [],
  discoverStories: [],
  followingStories: [],
  userStories: [],
  publishedUserStories: [],
  savedStories: [],
  likedStories: [],
  offlineStories: [],
  currentStory: null,
  storyComments: [],
  isLoading: false,
  storiesLoaded: false,
  continueReading: [],
  continueReadingLoaded: false,
  isDownloading: {},
  error: null,
};

const storySlice = createSlice({
  name: 'story',
  initialState,
  reducers: {
    patchStory(state, action: PayloadAction<Partial<StoryState>>) {
      Object.assign(state, action.payload);
    },
    setDownloadProgress(state, action: PayloadAction<{ storyId: string; progress: number }>) {
      state.isDownloading[action.payload.storyId] = action.payload.progress;
    },
    clearDownloadProgress(state, action: PayloadAction<string>) {
      delete state.isDownloading[action.payload];
    },
    resetStory() {
      return initialState;
    },
  },
});

export const { patchStory, setDownloadProgress, clearDownloadProgress, resetStory } =
  storySlice.actions;
export default storySlice.reducer;
