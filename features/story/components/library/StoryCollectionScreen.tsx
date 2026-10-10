import { PageHeader, Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useAppSelector } from '@/store/hooks';
import type { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useMemo, type ComponentProps, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';
import { RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { createStoryCollectionStyles } from '../../styles/storyCollectionStyles';

type Props = {
  title: string;
  stories: Story[];
  reload: () => Promise<unknown>;
  loginMessage: string;
  loadingLabel: string;
  empty: {
    icon: ComponentProps<typeof Ionicons>['name'];
    title: string;
    message: string;
    action?: { label: string; onPress: () => void };
  };
  renderItem: (story: Story) => ReactElement;
};

/** Başlıklı, yenilenebilir hikâye listesi (favoriler, kaydedilenler). */
export function StoryCollectionScreen(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const isSignedIn = useAppSelector(state => !!state.auth.user?.id);
  const isLoading = useAppSelector(state => state.story.isLoading);
  const styles = useMemo(() => createStoryCollectionStyles(colors), [colors]);
  const { refreshing, onRefresh } = usePullToRefresh(props.reload);

  return (
    <Screen style={styles.container}>
      <PageHeader title={props.title} onBack={() => router.back()} />

      {!isSignedIn ? (
        <View style={styles.emptyState}>
          <Ionicons name="log-in-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyTitle}>{t('studio.loginRequiredTitle')}</Text>
          <Text style={styles.emptyMessage}>{props.loginMessage}</Text>
        </View>
      ) : (
        <FlashList
          data={props.stories}
          keyExtractor={story => story.id}
          renderItem={({ item }) => props.renderItem(item)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>{props.loadingLabel}</Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name={props.empty.icon} size={48} color={colors.textSecondary} />
                <Text style={styles.emptyTitle}>{props.empty.title}</Text>
                <Text style={styles.emptyMessage}>{props.empty.message}</Text>
                {props.empty.action ? (
                  <TouchableOpacity style={styles.emptyAction} onPress={props.empty.action.onPress}>
                    <Text style={styles.emptyActionText}>{props.empty.action.label}</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            )
          }
        />
      )}
    </Screen>
  );
}
