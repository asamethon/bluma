import { Button, IconButton, Screen, SkeletonRow, Text } from '@/components/ui';
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useConversationMenu } from '../hooks/useConversationMenu';
import { useUserProfileModel } from '../hooks/useUserProfileModel';
import { pinnedThreshold } from '../profileLayout';
import { buildProfileRows, skeletonRows, tabLabel, type ProfileRow, type ProfileTab } from '../profileRows';
import { profileStyles as styles } from '../styles/profileStyles';
import { UserProfileEmptyState } from './UserProfileEmptyState';
import { UserProfileHeader } from './UserProfileHeader';
import { UserProfileListItem } from './UserProfileListItem';
import { UserProfileOverlays } from './UserProfileOverlays';
import { ProfileComposePrompt } from './ProfileComposePrompt';
import { ProfilePinnedBar } from './ProfilePinnedBar';
import { ProfileTabsRow } from './ProfileTabsRow';

export function UserProfileScreen({ profileId }: { profileId: string }) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const [headerHeight, setHeaderHeight] = useState(0);
  const [pinned, setPinned] = useState(false);
  const model = useUserProfileModel(profileId);
  const { user, content, tab, guest, setImageUri, setTab, startAuth } = model;
  const menu = useConversationMenu();

  // Panoya yazma: misafir önce girişe yönlenir.
  const openBoardComposer = useCallback(() => {
    if (guest) startAuth('signup');
    else model.setComposerVisible(true);
  }, [guest, model, startAuth]);

  const openStory = useCallback((story: { id: string }) => router.push(`/story/${story.id}/preview`), [router]);
  const openConversation = useCallback(
    (conversation: { id: string }) => router.push(`/conversation/${conversation.id}`),
    [router],
  );
  const openFollowers = useCallback(() => user && router.push(`/profile/followers/${user.id}`), [router, user]);
  const openFollowing = useCallback(() => user && router.push(`/profile/following/${user.id}`), [router, user]);
  const openMessage = useCallback(() => {
    if (guest) startAuth('signup');
    else if (user) router.push(`/messages/${user.id}`);
  }, [guest, router, startAuth, user]);
  const onHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => setHeaderHeight(event.nativeEvent.layout.height),
    [],
  );

  // Künye kayıp gittiğinde kompakt başlık devralır: geri, kim olduğu ve sekmeler.
  const threshold = pinnedThreshold(headerHeight, top);
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) =>
      setPinned(event.nativeEvent.contentOffset.y >= threshold),
    [threshold],
  );
  const tabs = useCallback((isPinned?: boolean) => (
    <ProfileTabsRow
      value={tab}
      onChange={(next: ProfileTab) => setTab(next)}
      pinned={isPinned}
      storiesLabel={tabLabel(t('userProfile.storiesTab'), content.stories.length)}
      conversationsLabel={tabLabel(t('userProfile.conversationsTab'), content.conversations.length)}
    />
  ), [content.conversations.length, content.stories.length, setTab, t, tab]);

  // Gizli hesapta içerik yerine kilit künyesi durur: sekme de gösterilmez.
  // Erişim kontrolü sürerken sekme yerine iskelet gösterilir ki ekran boş kalmasın.
  const rows = useMemo(() => {
    if (model.access.locked) return [];
    if (model.access.checking) return skeletonRows();
    return buildProfileRows({
      tab,
      stories: content.stories,
      conversations: content.conversations,
      loading: tab === 'stories' ? content.storiesLoading : content.conversationsLoading,
      composer: model.canPostToBoard,
    });
  }, [content, model.access.checking, model.access.locked, model.canPostToBoard, tab]);

  const renderItem = useCallback<ListRenderItem<ProfileRow>>(({ item }) => {
    if (item.kind === 'tabs') return tabs();
    if (item.kind === 'skeleton') return <View style={styles.tabRow}><SkeletonRow /></View>;
    if (item.kind === 'empty') return <UserProfileEmptyState tab={tab} />;
    if (item.kind === 'composer') {
      return <ProfileComposePrompt onPress={openBoardComposer} label={t('profileScreen.boardMessagePlaceholder')} />;
    }
    return (
      <UserProfileListItem
        kind={item.kind}
        item={item.kind === 'story' ? item.story : item.conversation}
        onStory={openStory}
        onConversation={openConversation}
        onImage={setImageUri}
        onConversationMenu={menu.open}
      />
    );
  }, [menu.open, openBoardComposer, openConversation, openStory, setImageUri, t, tab, tabs]);

  if (model.isLoading) {
    return (
      <Screen style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </Screen>
    );
  }
  if (!user) {
    return (
      <Screen style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <Text variant="body" tone="textSecondary" center>{t('errors.userNotFound')}</Text>
        <Button label={t('userProfile.goBack')} variant="ghost" size="sm" onPress={router.back} />
      </Screen>
    );
  }

  return (
    <Screen edges={[]} style={{ flex: 1, backgroundColor: colors.background }} maxContentWidth={ContentMaxWidth.content}>
      <FlashList
        data={rows}
        keyExtractor={row => row.key}
        getItemType={row => row.kind}
        renderItem={renderItem}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
        ListHeaderComponent={
          <View onLayout={onHeaderLayout}>
            <UserProfileHeader
              user={user}
              storyCount={content.stories.length}
              topInset={top}
              ownProfile={model.currentUserId === user.id}
              guest={guest}
              following={model.follow.isFollowing}
              requested={model.follow.isRequested}
              accessLocked={model.access.locked}
              messageAllowed={model.message.allowed}
              messageChecking={model.message.checking}
              onBack={router.back}
              onMenu={() => model.setMenuVisible(true)}
              onFollow={model.toggleFollow}
              onMessage={openMessage}
              onFollowers={openFollowers}
              onFollowing={openFollowing}
            />
          </View>
        }
      />
      {pinned && rows[0]?.kind === 'tabs' && (
        <ProfilePinnedBar
          topInset={top}
          name={user.displayName}
          avatarUri={user.profileImage}
          leading={
            <IconButton
              icon="arrow-back"
              size={36}
              accessibilityLabel={t('userProfile.goBack')}
              onPress={router.back}
            />
          }
          trailing={
            <IconButton
              icon="ellipsis-horizontal"
              size={36}
              accessibilityLabel={t('common.more')}
              onPress={() => model.setMenuVisible(true)}
            />
          }
        >
          {tabs(true)}
        </ProfilePinnedBar>
      )}
      <UserProfileOverlays user={user} topInset={top} model={model} menu={menu} />
    </Screen>
  );
}
