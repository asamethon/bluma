import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

const STEP_MS = 480;
const STAGGER_MS = 120;
const FLOAT_MS = 2800;

/** Karşılama ekranının kademeli girişi ve amblemin süzülme döngüsü. */
export function useWalkthroughIntro() {
  const word = useRef(new Animated.Value(0)).current;
  const tagline = useRef(new Animated.Value(0)).current;
  const body = useRef(new Animated.Value(0)).current;
  const actions = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const step = (value: Animated.Value) =>
      Animated.timing(value, {
        toValue: 1,
        duration: STEP_MS,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      });

    Animated.stagger(STAGGER_MS, [step(word), step(tagline), step(body), step(actions)]).start();

    const drift = (toValue: number) =>
      Animated.timing(float, {
        toValue,
        duration: FLOAT_MS,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      });
    const loop = Animated.loop(Animated.sequence([drift(-10), drift(0)]));
    loop.start();
    return () => loop.stop();
  }, [word, tagline, body, actions, float]);

  const fadeUp = (value: Animated.Value) => ({
    opacity: value,
    transform: [{ translateY: value.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
  });

  return { word, tagline, body, actions, float, fadeUp };
}
