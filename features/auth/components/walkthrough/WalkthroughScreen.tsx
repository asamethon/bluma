import { BloomMark, Screen } from '@/components/ui';
import { useWalkthroughIntro } from '@/features/auth/hooks/useWalkthroughIntro';
import { walkthroughStyles as styles } from '@/features/auth/styles/walkthroughStyles';
import { useAppSelector } from '@/store/hooks';
import { Redirect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Animated, StatusBar, View } from 'react-native';
import { WalkthroughActions } from './WalkthroughActions';
import { WalkthroughBackdrop } from './WalkthroughBackdrop';

export default function WalkthroughScreen() {
  const { t } = useTranslation();
  const intro = useWalkthroughIntro();
  const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);
  const hasCompletedOnboarding = useAppSelector(state => state.auth.hasCompletedOnboarding);

  if (isAuthenticated) {
    return <Redirect href={hasCompletedOnboarding ? '/' : '/(auth)/onboarding'} />;
  }

  return (
    <View style={styles.welcome}>
      <StatusBar barStyle="light-content" />
      <WalkthroughBackdrop />

      <Screen style={styles.screen}>
        <View style={styles.wHero}>
          <Animated.View style={{ transform: [{ translateY: intro.float }] }}>
            <BloomMark size={72} color="#fff" coreColor="#E6B95C" />
          </Animated.View>
          <Animated.Text style={[styles.wWordmark, intro.fadeUp(intro.word)]}>bluma</Animated.Text>
          <Animated.Text style={[styles.wTagline, intro.fadeUp(intro.tagline)]}>
            {t('walkthrough.tagline')}
          </Animated.Text>
          <Animated.View style={[styles.wRule, intro.fadeUp(intro.body)]} />
          <Animated.Text style={[styles.wBody, intro.fadeUp(intro.body)]}>
            {t('walkthrough.body')}
          </Animated.Text>
        </View>

        <WalkthroughActions style={intro.fadeUp(intro.actions)} />
      </Screen>
    </View>
  );
}
