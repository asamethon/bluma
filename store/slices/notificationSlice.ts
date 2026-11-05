import { Notification, NotificationSettings, PushPermission, PushPromptReason } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  settings: NotificationSettings | null;
  /** `null` = henüz okunmadı (şerit o sırada gösterilmez). */
  pushPermission: PushPermission | null;
  /**
   * Yumuşak izin kartı. `open` false olunca kart kapanma animasyonuna girer;
   * sistem penceresi ancak kart TAMAMEN kapandıktan sonra açılabilir.
   */
  pushPrompt: { reason: PushPromptReason; open: boolean; accepted: boolean } | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  settings: null,
  pushPermission: null,
  pushPrompt: null,
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    patchNotification(state, action: PayloadAction<Partial<NotificationState>>) {
      Object.assign(state, action.payload);
    },
  },
});

export const { patchNotification } = notificationSlice.actions;
export default notificationSlice.reducer;
