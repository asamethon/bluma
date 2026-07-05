import { Redirect } from 'expo-router';
import React from 'react';
import { useAppSelector } from '@/store/hooks';

export default function Index() {
  const { isAuthenticated, hasCompletedOnboarding, isGuest } = useAppSelector(s => s.auth);

  if (isGuest) return <Redirect href="/(tabs)" />;
  if (!isAuthenticated) return <Redirect href="/(auth)/walkthrough" />;
  if (!hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;
  return <Redirect href="/(tabs)" />;
}