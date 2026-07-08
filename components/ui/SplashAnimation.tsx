import { Fonts } from "@/constants/theme";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  StatusBar,
  StyleSheet,
  View,
} from "react-native";
import { BloomMark } from "./BloomMark";

const { height: H } = Dimensions.get("window");

// Minimum time the animation plays before onFinish fires — keeps the intro
// from feeling like a flash even when the app is ready almost instantly.
export const SPLASH_MIN_MS = 2600;

/**
 * SplashAnimation — Bluma's brand intro (bloom mark + wordmark + tagline).
 *
 * Shown as the app's actual splash screen (app/_layout.tsx renders this
 * while fonts/auth/the stories feed load) so users see this animation
 * instead of the native static launch image. The native launch image still
 * has to render for an instant while the JS bundle boots — that's an OS
 * requirement on both iOS and Android — but it uses the exact same purple
 * background + centered mark as this animation's resting frame, so the
 * handoff reads as one continuous piece instead of two screens.
 */
export function SplashAnimation({ onFinish }: { onFinish?: () => void }) {
  // Kasıtlı olarak animasyonsuz: native açılış ekranı zaten aynı mark'ı tam
  // boyut/opaklıkta bırakıyor. Mark'ı da 0'dan büyüterek başlatırsak, devir
  // anında logo görünüp sonra küçülüp yeniden büyüyormuş gibi bir "atlama"
  // oluyor — sanki iki ayrı ekranmış hissi veriyordu. Sadece etrafındaki
  // (native ekranda hiç olmayan) metin/halka/nokta öğeleri beliriyor.
  const word = useRef(new Animated.Value(0)).current;
  const tag = useRef(new Animated.Value(0)).current;
  const dot0 = useRef(new Animated.Value(0)).current;
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const ring1 = useRef(new Animated.Value(0)).current;
  const ring2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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
      Animated.timing(word, { toValue: 1, duration: 520, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(tag, { toValue: 1, duration: 520, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    const dotAnims = [dotPulse(dot0, 0), dotPulse(dot1, 180), dotPulse(dot2, 360)];
    const ringAnims = [ringExpand(ring1, 800), ringExpand(ring2, 1600)];
    dotAnims.forEach(a => a.start());
    ringAnims.forEach(a => a.start());

    const t = setTimeout(() => onFinish?.(), SPLASH_MIN_MS);
    return () => {
      clearTimeout(t);
      [...dotAnims, ...ringAnims].forEach(a => a.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const wordY = word.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const tagY = tag.interpolate({ inputRange: [0, 1], outputRange: [14, 0] });
  const ring1Scale = ring1.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });
  const ring2Scale = ring2.interpolate({ inputRange: [0, 1], outputRange: [1, 2.1] });

  return (
    <View style={styles.splash}>
      <StatusBar barStyle="light-content" />
      <View pointerEvents="none" style={[styles.gradLayer, { backgroundColor: "#7C5CD0", opacity: 0.6, borderRadius: H * 0.5, top: -H * 0.3, left: -80, right: -80 }]} />
      <View pointerEvents="none" style={[styles.gradLayer, { backgroundColor: "#FF5C8A", opacity: 0.35, borderRadius: H * 0.5, bottom: -H * 0.35, left: -80, right: -80 }]} />

      <View style={{ alignItems: "center", justifyContent: "center", marginBottom: 30 }}>
        <Animated.View pointerEvents="none" style={[styles.ring, { opacity: ring1.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.55, 0.4, 0] }), transform: [{ scale: ring1Scale }] }]} />
        <Animated.View pointerEvents="none" style={[styles.ring, { opacity: ring2.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 0.3, 0] }), transform: [{ scale: ring2Scale }] }]} />
        <BloomMark size={132} color="#fff" coreColor="#E6B95C" />
      </View>

      <Animated.Text style={[styles.wordmark, { opacity: word, transform: [{ translateY: wordY }] }]}>
        bluma
      </Animated.Text>
      <Animated.Text style={[styles.tagline, { opacity: tag, transform: [{ translateY: tagY }] }]}>
        her hikâye bir tohum
      </Animated.Text>

      <View style={styles.dotsWrap}>
        {[dot0, dot1, dot2].map((d, i) => (
          <Animated.View key={i} style={[styles.dot, { opacity: d }]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: "#2A1B52",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gradLayer: { position: "absolute" },
  ring: {
    position: "absolute",
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },
  wordmark: {
    fontFamily: Fonts.serif,
    fontSize: 54,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: -1.4,
    lineHeight: 70,
  },
  tagline: {
    fontFamily: Fonts.serif,
    fontSize: 18, lineHeight: 25,
    fontStyle: "italic",
    color: "rgba(255,255,255,0.8)",
    marginTop: 10,
  },
  dotsWrap: {
    position: "absolute",
    bottom: 54,
    flexDirection: "row",
    gap: 9,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "rgba(255,255,255,0.85)",
  },
});
