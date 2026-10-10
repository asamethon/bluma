import { BloomMark, Button, CategoryChip, Chip, IconButton, Text } from '@/components/ui';
import { Motion, alpha, useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import type { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useAppSelector } from '@/store/hooks';
import type { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HOME_CATEGORIES } from '../constants';
import { createHomeStyles } from '../styles/homeStyles';

type Props = {
  user: User | null;
  guest: boolean;
  network: ReturnType<typeof useNetworkStatus>;
  offlineCount: number;
  selectedCategory: string | null;
  onSelectCategory: (category: string | null) => void;
};

/** Gün içindeki saate göre selamlama anahtarı. */
function greetingKey(guest: boolean, hour: number) {
  if (guest) return 'home.greetingGuest';
  if (hour < 6 || hour >= 22) return 'home.greetingNight';
  if (hour < 12) return 'home.greetingMorning';
  if (hour < 18) return 'home.greetingAfternoon';
  return 'home.greetingEvening';
}

export function HomeHeader(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { top } = useSafeAreaInsets();
  const router = useRouter();
  const { startAuth } = useGuestGate();
  const unreadNotifications = useAppSelector(state => state.notification.unreadCount);
  const unreadMessages = useAppSelector(state => (
    state.messaging.threads.reduce((total, thread) => total + (thread.unread || 0), 0)
  ));
  const styles = useMemo(() => createHomeStyles(colors), [colors]);
  const name = props.guest ? t('home.guestReader') : props.user?.displayName?.split(' ')[0] || t('home.reader');

  return (
    <>
      <View style={[styles.masthead, { paddingTop: top }]}>
        <View style={styles.mastheadTop}>
          <View style={styles.brandMark}>
            <BloomMark size={22} color={colors.primary} coreColor={colors.bloom} />
          </View>
          <Text variant="overline" tone="textLight">{t(greetingKey(props.guest, new Date().getHours()))}</Text>

          <View style={styles.headerActions}>
            {props.guest ? (
              <Button label={t('auth.signIn')} size="sm" onPress={() => startAuth('signup')} />
            ) : (
              <>
                {props.network.isOffline && (
                  <IconButton icon="cloud-offline-outline" onPress={() => router.push('/profile/offline')} color={colors.primary} />
                )}
                <IconButton icon="mail-outline" onPress={() => router.push('/messages')} size={40} badge={unreadMessages} />
                <IconButton
                  icon="notifications-outline"
                  onPress={() => router.push('/notifications')}
                  size={40}
                  badge={unreadNotifications}
                />
              </>
            )}
          </View>
        </View>

        <View style={styles.greetingBlock}>
          <Text variant="display" numberOfLines={1}>{name}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.rail}>
        <Chip
          label={t('home.all')}
          active={!props.selectedCategory}
          shape="pill"
          onPress={() => props.onSelectCategory(null)}
        />
        {HOME_CATEGORIES.map(category => (
          <CategoryChip
            key={category}
            category={category}
            active={props.selectedCategory === category}
            shape="pill"
            onPress={() => props.onSelectCategory(category)}
          />
        ))}
      </ScrollView>

      {props.network.isOffline && (
        <Pressable
          style={({ pressed }) => [
            styles.offlineNote,
            { backgroundColor: alpha(colors.primary, 0.07), borderLeftColor: colors.primary },
            { opacity: pressed ? Motion.pressOpacity : 1 },
          ]}
          onPress={() => router.push('/profile/offline')}
        >
          <Ionicons name="cloud-offline-outline" size={20} color={colors.primary} />
          <View style={styles.offlineCopy}>
            <Text variant="bodyStrong" color={colors.primary}>{t('home.offlineMode')}</Text>
            <Text variant="caption" tone="textSecondary">{t('home.offlineReadable', { count: props.offlineCount })}</Text>
          </View>
          <Ionicons name="chevron-forward" size={17} color={colors.textLight} />
        </Pressable>
      )}
    </>
  );
}
