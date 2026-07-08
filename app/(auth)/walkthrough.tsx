import {
  Screen, BloomMark } from '@/components/ui';
import { Fonts } from '@/constants/theme';
import { authActions } from '@/store/authStore';
import { openPrivacyPolicy, openTermsOfService } from '@/utils/legal';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import { useAppSelector } from '@/store/hooks';
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { height: H } = Dimensions.get('window');

// Bluma'nın marka animasyonu artık uygulama açılışında global splash olarak
// gösteriliyor (bkz. app/_layout.tsx + components/ui/SplashAnimation.tsx),
// bu yüzden bu ekran doğrudan "welcome" içeriğiyle başlar — aynı animasyonu
// ikinci kez oynatmaz.
export default function WalkthroughScreen() {
  const router = useRouter();

  /* ── welcome animations ───────────────────────────────────── */
  const wmWord  = useRef(new Animated.Value(0)).current;
  const wmTag   = useRef(new Animated.Value(0)).current;
  const wmBody  = useRef(new Animated.Value(0)).current;
  const wmBtns  = useRef(new Animated.Value(0)).current;
  const wmFloat = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
  }, [wmWord, wmTag, wmBody, wmBtns, wmFloat]);

  /* ── auth redirects ────────────────────────────────────── */
  const { isAuthenticated, hasCompletedOnboarding } = useAppSelector(s => s.auth);
  if (isAuthenticated && hasCompletedOnboarding) return <Redirect href="/" />;
  if (isAuthenticated && !hasCompletedOnboarding) return <Redirect href="/(auth)/onboarding" />;

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
            <Text style={styles.wTermsLink} onPress={openTermsOfService}>Kullanım Koşulları</Text>
            {' '}ve{' '}
            <Text style={styles.wTermsLink} onPress={openPrivacyPolicy}>Gizlilik Politikası</Text>
            {'\''}nı kabul edersin.
          </Text>
        </Animated.View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  gradLayer: {
    position: 'absolute',
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
    lineHeight: 62,
  },
  wTagline: {
    fontFamily: Fonts.serif,
    fontSize: 19, lineHeight: 27,
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
    fontSize: 16, lineHeight: 21,
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
    fontSize: 15, lineHeight: 20,
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
    fontSize: 14.5, lineHeight: 19,
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
