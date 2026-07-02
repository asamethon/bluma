import { authState$ } from '@/store/authStore';
import { observer } from '@legendapp/state/react';
import { Redirect } from 'expo-router';
import React from 'react';

export default observer(function Index() {
  const { isAuthenticated, hasCompletedOnboarding, isGuest } = authState$.get();

  if (isGuest) return <Redirect href="/(tabs)" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/walkthrough" />;
  if (!hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(tabs)" />;
});