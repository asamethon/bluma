import { Notification, NotificationSettings } from '@/types';
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  settings: NotificationSettings | null;
}

const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  settings: null,
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
