import { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Screen alt güvenli alanı zaten ayırır; klavye açılınca ikinci kez eklenmez. */
export function useChatKeyboardInset() {
  const { bottom } = useSafeAreaInsets();
  const keyboard = useAnimatedKeyboard();

  return useAnimatedStyle(() => ({
    paddingBottom: Math.max(0, keyboard.height.value - bottom),
  }));
}
