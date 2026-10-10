import {
  HankenGrotesk_400Regular,
  HankenGrotesk_500Medium,
  HankenGrotesk_600SemiBold,
  HankenGrotesk_700Bold,
  HankenGrotesk_800ExtraBold,
} from '@expo-google-fonts/hanken-grotesk';
import { Ionicons } from '@expo/vector-icons';
import {
  Spectral_400Regular,
  Spectral_400Regular_Italic,
  Spectral_700Bold,
  Spectral_700Bold_Italic,
  useFonts,
} from '@expo-google-fonts/spectral';

/**
 * Uygulamanın tüm yazı tipleri; yüklenene kadar hiçbir ekran çizilmez.
 *
 * İkon ailesi de buraya dahildir: `@expo/vector-icons` fontunu ilk kullanımda
 * KENDİ BAŞINA yüklüyor, o yüzden ekran açıldıktan saniyeler sonra ikonlar
 * tek tek "beliriyordu". Önden yüklenince ilk karede yerlerindeler.
 */
export function useAppFonts(): boolean {
  const [loaded] = useFonts({
    ...Ionicons.font,
    SpaceMono: require('../../../assets/fonts/SpaceMono-Regular.ttf'),
    Spectral_400Regular,
    Spectral_400Regular_Italic,
    Spectral_700Bold,
    Spectral_700Bold_Italic,
    HankenGrotesk_400Regular,
    HankenGrotesk_500Medium,
    HankenGrotesk_600SemiBold,
    HankenGrotesk_700Bold,
    HankenGrotesk_800ExtraBold,
  });
  return loaded;
}
