import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { DarkTheme, DefaultTheme } from 'expo-router';
import { useMemo } from 'react';

/**
 * Gezinti katmanının renkleri. Varsayılan tema zeminleri BEYAZ: bir ekran
 * çizilene kadar (ilk açılış, ağır sekme geçişi) o beyaz görünüyordu. Zemin
 * uygulama paletinden gelince boşluk göze çarpmaz.
 */
export function useNavigationTheme() {
  const scheme = useColorScheme() ?? 'light';
  return useMemo(() => {
    const base = scheme === 'dark' ? DarkTheme : DefaultTheme;
    const palette = Colors[scheme === 'dark' ? 'dark' : 'light'];
    return {
      ...base,
      colors: {
        ...base.colors,
        background: palette.background,
        card: palette.surface,
        text: palette.text,
        border: palette.border,
        primary: palette.primary,
      },
    };
  }, [scheme]);
}
