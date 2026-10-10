import { Platform } from 'react-native';
import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Input'un altındaki nefes payı (klavye kapalıyken güvenli alana eklenir). */
const BASE_PADDING = 12;

/**
 * Yazma alanını klavyenin tam üstüne taşır.
 *
 * Klavye olaylarına `withSpring` ile tepki vermek yerine `useAnimatedKeyboard`
 * ile klavyenin kendi ilerlemesini birebir takip eder: yay yok, gecikme yok,
 * dolayısıyla input açılırken aşağı yukarı zıplamaz.
 *
 * Kabuk ekranın en altına (güvenli alan boşluğu OLMADAN) mutlak konumlanmalı;
 * alt güvenli alan boşluğunu bu hook `pad` içinde verir, böylece klavye
 * yüksekliğiyle taşıma birebir eşleşir.
 *
 * - `lift`: kabuğun klavye yüksekliği kadar yükselmesi. Android'de pencere
 *           zaten `adjustResize` ile küçüldüğü için taşıma yapılmaz.
 * - `pad`:  kabuk içindeki alt boşluk: kapalıyken güvenli alan + nefes payı,
 *           klavye yükseldikçe güvenli alan payı kapanır (klavye zaten o alanı
 *           kaplar) ve input klavyeye yapışır.
 */
export function useKeyboardLift() {
  const { bottom } = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();

  const lift = useAnimatedStyle(() => ({
    transform: [{ translateY: Platform.OS === 'ios' ? -keyboard.height.value : 0 }],
  }));

  const pad = useAnimatedStyle(() => ({
    paddingBottom: Math.max(bottom + BASE_PADDING - keyboard.height.value, BASE_PADDING),
  }));

  return { lift, pad };
}
