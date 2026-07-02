import {
  Screen, BloomMark } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { authActions, authState$ } from '@/store/authStore';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: H } = Dimensions.get('window');
const SPLASH_MS = 2600;

type Phase = 'splash' | 'welcome';

// Persist across remounts so back-navigating from signin/signup skips splash
let _splashShown = false;

export default observer(function WalkthroughScreen() {
  const router = useRouter();
  const [phase, setPhase] = React.useState<Phase>(_splashShown ? 'welcome' : 'splash');

  /* ── animations ────────────────────────────────────────── */
  const splashMark = useRef(new Animated.Value(0)).current;
  const splashWord = useRef(new Animated.Value(0)).current;
  const splashTag  = useRef(new Animated.Value(0)).current;
  const dot0 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  const wmWord  = useRef(new Animated.Value(0)).current;
  const wmTag   = useRef(new Animated.Value(0)).current;
  const wmBody  = useRef(new Animated.Value(0)).current;
  const wmBtns  = useRef(new Animated.Value(0)).current;
  const wmFloat = useRef(new Animated.Value(0)).current;

  /* splash animations */
  useEffect(() => {
    if (phase !== 'splash') return;

    const dotPulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(dot, { toValue: 1, duration: 420, delay, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(dot, { toValue: 0.28, duration: 420, useNativeDriver: true }),
        ])
      );

    const ringExpand = (ring: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.timing(ring, { toValue: 1, duration: 2600, delay, useNativeDriver: true, easing: Easing.out(Easing.ease) }),
          Animated.timing(ring, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );

    Animated.stagger(140, [
      Animated.spring(splashMark, { toValue: 1, damping: 14, stiffness: 140, useNativeDriver: true }),
      Animated.timing(splashWord, { toValue: 1, duration: 520, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(splashTag,  { toValue: 1, duration: 520, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    dotPulse(dot0, 0).start();
    dotPulse(dot1, 180).start();
    dotPulse(dot2, 360).start();
    ringExpand(ring1, 800).start();
    ringExpand(ring2, 1600).start();

    const t = setTimeout(() => { _splashShown = true; setPhase('welcome'); }, SPLASH_MS);
    return () => clearTimeout(t);
  }, [phase]);

  /* welcome animations */
  useEffect(() => {
    if (phase !== 'welcome') return;

    Animated.stagger(120, [
      Animated.timing(wmWord, { toValue: 1, duration: 480, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(wmTag,  { toValue: 1, duration: 480, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(wmBody, { toValue: 1, duration: 480, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(wmBtns, { toValue: 1, duration: 480, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    const float = Animated.loop(
      Animated.sequence([
        Animated.timing(wmFloat, { toValue: -10, duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(wmFloat, { toValue: 0,   duration: 2800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    );
    float.start();
    return () => float.stop();
  }, [phase]);

  /* ── auth redirects ────────────────────────────────────── */
  const { isAuthenticated, hasCompletedOnboarding } = authState$.get();
  if (isAuthenticated && hasCompletedOnboarding) return <Redirect href="/" />;
  if (isAuthenticated && !hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;

  /* ── Splash ────────────────────────────────────────────── */
  if (phase === 'splash') {
    const markScale = splashMark.interpolate({ inputRange: [0, 1], outputRange: [0.55, 1] });
    const wordY = splashWord.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
    const tagY  = splashTag.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
    const ring1Scale = ring1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });
    const ring2Scale = ring2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });

    return (
      <Pressable style={styles.splash} onPress={() => { _splashShown = true; setPhase('welcome'); }}>
        <StatusBar barStyle="light-content" />
        {/* gradient blobs */}
        <View pointerEvents="none" style={[styles.gradLayer, { backgroundColor: '#7C5CD0', opacity: 0.6, borderRadius: H * 0.5, top: -H * 0.3, left: -80, right: -80 }]} />
        <View pointerEvents="none" style={[styles.gradLayer, { backgroundColor: '#FF5C8A', opacity: 0.35, borderRadius: H * 0.5, bottom: -H * 0.35, left: -80, right: -80 }]} />

        {/* mark + expanding rings */}
        <View style={{ alignItems: 'center', justifyContent: 'center', marginBottom: 30 }}>
          <Animated.View pointerEvents="none" style={[styles.ring, { opacity: ring1.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.55, 0.4, 0] }), transform: [{ scale: ring1Scale }] }]} />
          <Animated.View pointerEvents="none" style={[styles.ring, { opacity: ring2.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 0.3, 0] }), transform: [{ scale: ring2Scale }] }]} />
          <Animated.View style={{ opacity: splashMark, transform: [{ scale: markScale }] }}>
            <BloomMark size={132} color="#fff" coreColor="#E6B95C" />
          </Animated.View>
        </View>

        {/* wordmark */}
        <Animated.Text style={[styles.splashWordmark, { opacity: splashWord, transform: [{ translateY: wordY }] }]}>
          bluma
        </Animated.Text>
        <Animated.Text style={[styles.splashTagline, { opacity: splashTag, transform: [{ translateY: tagY }] }]}>
          her hikâye bir tohum
        </Animated.Text>

        {/* loading dots */}
        <View style={styles.dotsWrap}>
          {[dot0, dot1, dot2].map((d, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
          ))}
        </View>
      </Pressable>
    );
  }

  /* ── Welcome ───────────────────────────────────────────── */
  const fadeUp = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  return (
    <View style={styles.welcome}>
      <StatusBar barStyle="light-content" />
      {/* gradient blobs */}
      <View pointerEvents="none" style={[styles.gradLayer, { backgroundColor: '#7C5CD0', opacity: 0.55, borderRadius: H * 0.5, top: -H * 0.25, right: -60, width: H * 0.65, height: H * 0.65 }]} />
      <View pointerEvents="none" style={[styles.gradLayer, { backgroundColor: '#ED3F72', opacity: 0.30, borderRadius: H * 0.5, bottom: -H * 0.25, left: -60, width: H * 0.6, height: H * 0.6 }]} />
      {/* faint ghost marks */}
      <View pointerEvents="none" style={{ position: 'absolute', top: 82, left: -26, opacity: 0.1 }}>
        <BloomMark size={150} color="#fff" coreColor="#fff" />
      </View>
      <View pointerEvents="none" style={{ position: 'absolute', bottom: 210, right: -30, opacity: 0.08 }}>
        <BloomMark size={120} color="#fff" coreColor="#fff" />
      </View>

      <Screen style={{ flex: 1 }}>
        {/* hero */}
        <View style={styles.wHero}>
          <Animated.View style={{ transform: [{ translateY: wmFloat }] }}>
            <BloomMark size={104} color="#fff" coreColor="#E6B95C" />
          </Animated.View>
          <Animated.Text style={[styles.wWordmark, fadeUp(wmWord)]}>bluma</Animated.Text>
          <Animated.Text style={[styles.wTagline, fadeUp(wmTag)]}>her hikâye bir tohum</Animated.Text>
          <Animated.Text style={[styles.wBody, fadeUp(wmBody)]}>
            Okumayı ve yazmayı tek bir sıcak sayfada buluşturan hikâye platformu. Başlamaya hazır mısın?
          </Animated.Text>
        </View>

        {/* CTAs */}
        <Animated.View style={[styles.wActions, fadeUp(wmBtns)]}>
          {/* primary — bloom petal rose */}
          <TouchableOpacity
            style={styles.wBtnPrimary}
            onPress={() => router.push('/(auth)/signup')}
            activeOpacity={0.88}
          >
            <Text style={styles.wBtnPrimaryText}>Hesap Oluştur</Text>
            <Ionicons name="arrow-forward" size={19} color="#fff" />
          </TouchableOpacity>

          {/* secondary — ghost glass */}
          <TouchableOpacity
            style={styles.wBtnSecondary}
            onPress={() => router.push('/(auth)/signin')}
            activeOpacity={0.88}
          >
            <Text style={styles.wBtnSecondaryText}>Giriş Yap</Text>
          </TouchableOpacity>

          {/* tertiary — guest browse */}
          <TouchableOpacity
            style={styles.wBtnGuest}
            onPress={() => { authActions.continueAsGuest(); router.replace('/'); }}
            activeOpacity={0.7}
          >
            <Text style={styles.wBtnGuestText}>Hesap olmadan keşfet</Text>
            <Ionicons name="arrow-forward" size={16} color="rgba(255,255,255,0.82)" />
          </TouchableOpacity>

          <Text style={styles.wTerms}>
            Devam ederek{' '}
            <Text style={styles.wTermsLink}>Kullanım Koşulları</Text>
            {' '}ve{' '}
            <Text style={styles.wTermsLink}>Gizlilik Politikası</Text>
            {'\''}nı kabul edersin.
          </Text>
        </Animated.View>
      </Screen>
    </View>
  );
});

const styles = StyleSheet.create({
  /* splash */
  splash: {
    flex: 1,
    backgroundColor: '#2A1B52',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  gradLayer: {
    position: 'absolute',
  },
  ring: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  splashWordmark: {
    fontFamily: Fonts.serif,
    fontSize: 54,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1.4,
    lineHeight: 56,
  },
  splashTagline: {
    fontFamily: Fonts.serif,
    fontSize: 18,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.8)',
    marginTop: 10,
  },
  dotsWrap: {
    position: 'absolute',
    bottom: 54,
    flexDirection: 'row',
    gap: 9,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },

  /* welcome */
  welcome: {
    flex: 1,
    backgroundColor: '#432778',
    overflow: 'hidden',
  },
  wHero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  wWordmark: {
    fontFamily: Fonts.serif,
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: -1.2,
    marginTop: 24,
    lineHeight: 52,
  },
  wTagline: {
    fontFamily: Fonts.serif,
    fontSize: 19,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.84)',
    marginTop: 6,
  },
  wBody: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    lineHeight: 23,
    color: 'rgba(255,255,255,0.72)',
    textAlign: 'center',
    maxWidth: 280,
    marginTop: 18,
  },
  wActions: {
    paddingHorizontal: 26,
    paddingBottom: 30,
    gap: 12,
  },
  wBtnPrimary: {
    height: 56,
    borderRadius: 999,
    backgroundColor: '#FF5C8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 22,
    elevation: 8,
  },
  wBtnPrimaryText: {
    fontFamily: Fonts.sans,
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  wBtnSecondary: {
    height: 54,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wBtnSecondaryText: {
    fontFamily: Fonts.sans,
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  wBtnGuest: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    marginTop: 2,
  },
  wBtnGuestText: {
    fontFamily: Fonts.sans,
    fontSize: 14.5,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.82)',
  },
  wTerms: {
    fontFamily: Fonts.sans,
    fontSize: 11.5,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.58)',
    textAlign: 'center',
    marginTop: 2,
    marginHorizontal: 14,
  },
  wTermsLink: {
    textDecorationLine: 'underline',
    color: 'rgba(255,255,255,0.75)',
  },
});
