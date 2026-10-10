import { IconButton, Text } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import type { Story } from '@/types';
import { useTranslation } from 'react-i18next';
import type { Animated as AnimatedType } from 'react-native';
import { Animated, Pressable, View } from 'react-native';
import { readerStyles as styles } from '../../styles/readerStyles';
import { ReaderMenu } from './ReaderMenu';
import type { ReaderColors } from './types';

type Props = {
  story: Story;
  colors: ReaderColors;
  safeTop: number;
  height: number;
  animation: AnimatedType.Value;
  visible: boolean;
  /** "Bölüm 3 / 12 · 7dk" — künye satırı, içindekilere açılan kapı. */
  chapterLabel: string;
  /** Cam kapsüller uygulama temasını değil, OKUMA paletini izler. */
  glassScheme: 'light' | 'dark';
  currentUserId?: string;
  onBack: () => void;
  onOpenChapters: () => void;
  onOpenSettings: () => void;
  onOpenList: () => void;
  onReport: () => void;
};

/**
 * Üst çubuk: geri, künye ve görünüm. Künyeye dokunmak içindekileri açar —
 * bölüm gezinmesi artık metnin içine gömülü oklarda değil, tek bir yerde.
 */
export function ReaderTopBar(props: Props) {
  const { t } = useTranslation();

  return (
    <Animated.View
      style={[
        styles.topChrome,
        {
          paddingTop: props.safeTop,
          backgroundColor: props.colors.background,
          borderBottomColor: props.colors.border,
          opacity: props.animation,
          transform: [{
            translateY: props.animation.interpolate({ inputRange: [0, 1], outputRange: [-props.height, 0] }),
          }],
        },
      ]}
      pointerEvents={props.visible ? 'auto' : 'none'}
    >
      <IconButton
        icon="chevron-back"
        size={40}
        iconSize={24}
        color={props.colors.text}
        glassColorScheme={props.glassScheme}
        accessibilityLabel={t('userProfile.goBack')}
        onPress={props.onBack}
      />
      <Pressable
        style={styles.chromeTitle}
        accessibilityRole="button"
        accessibilityLabel={t('reader.chapters')}
        onPress={props.onOpenChapters}
      >
        <Text variant="subheading" numberOfLines={1} style={[styles.chromeTitleText, { color: props.colors.text }]}>
          {props.story.title}
        </Text>
        <View style={styles.chromeSubtitle}>
          <Text variant="caption" color={props.colors.textSecondary} numberOfLines={1}>
            {props.chapterLabel}
          </Text>
          <Ionicons name="chevron-down" size={11} color={props.colors.textSecondary} />
        </View>
      </Pressable>
      <IconButton
        icon="text"
        size={38}
        iconSize={20}
        color={props.colors.text}
        glassColorScheme={props.glassScheme}
        accessibilityLabel={t('reader.settings')}
        onPress={props.onOpenSettings}
      />
      <ReaderMenu
        story={props.story}
        currentUserId={props.currentUserId}
        color={props.colors.text}
        glassScheme={props.glassScheme}
        onOpenList={props.onOpenList}
        onReport={props.onReport}
      />
    </Animated.View>
  );
}
