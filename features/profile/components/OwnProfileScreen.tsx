import ImageModal from '@/components/ui/ImageModal';
import { IconButton, Screen, SkeletonRow } from '@/components/ui';
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import type { Conversation, Story, User } from '@/types';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useReducer } from 'react';
import { useTranslation } from 'react-i18next';
import { View, type LayoutChangeEvent, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useOwnProfileActions } from '../hooks/useOwnProfileActions';
import { pinnedThreshold } from '../profileLayout';
import { buildProfileRows, tabLabel, type ProfileRow, type ProfileTab } from '../profileRows';
import { profileStyles as styles } from '../styles/profileStyles';
import { OwnProfileEmpty } from './OwnProfileEmpty';
import { OwnProfileHeader } from './OwnProfileHeader';
import { OwnProfileListItem } from './OwnProfileListItem';
import { ProfileComposePrompt } from './ProfileComposePrompt';
import { ProfileMessageComposer } from './ProfileMessageComposer';
import { ProfilePinnedBar } from './ProfilePinnedBar';
import { ProfileTabsRow } from './ProfileTabsRow';

type State = { tab: ProfileTab; composerVisible: boolean; image: string | null; headerHeight: number; pinned: boolean };
type Action =
  | { type: 'tab'; value: ProfileTab }
  | { type: 'composer'; value: boolean }
  | { type: 'image'; value: string | null }
  | { type: 'headerHeight'; value: number }
  | { type: 'pinned'; value: boolean };

const reducer = (state: State, action: Action): State => {
  if (action.type === 'tab') return { ...state, tab: action.value };
  if (action.type === 'composer') return { ...state, composerVisible: action.value };
  if (action.type === 'headerHeight') {
    return state.headerHeight === action.value ? state : { ...state, headerHeight: action.value };
  }
  if (action.type === 'pinned') return state.pinned === action.value ? state : { ...state, pinned: action.value };
  return { ...state, image: action.value };
};

const INITIAL: State = { tab: 'stories', composerVisible: false, image: null, headerHeight: 0, pinned: false };

type Props = {
  user: User;
  stories: Story[];
  conversations: Conversation[];
  loading: boolean;
};

export function OwnProfileScreen({ user, stories, conversations, loading }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const { top } = useSafeAreaInsets();
  const actions = useOwnProfileActions({ user, router, t });
  const [state, dispatch] = useReducer(reducer, INITIAL);

  const openStory = useCallback((id: string) => router.push(`/story/${id}/preview` as never), [router]);
  const openConversation = useCallback((id: string) => router.push(`/conversation/${id}` as never), [router]);
  const openComposer = useCallback(() => dispatch({ type: 'composer', value: true }), []);
  const setTab = useCallback((tab: ProfileTab) => dispatch({ type: 'tab', value: tab }), []);
  const setImage = useCallback((value: string | null) => dispatch({ type: 'image', value }), []);
  const onHeaderLayout = useCallback(
    (event: LayoutChangeEvent) => dispatch({ type: 'headerHeight', value: event.nativeEvent.layout.height }),
    [],
  );

  // Künye kayıp gittiğinde kompakt başlık devralır; eşik iki sekme şeridini
  // üst üste getirdiği için geçiş göze çarpmaz.
  const threshold = pinnedThreshold(state.headerHeight, top);
  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) =>
      dispatch({ type: 'pinned', value: event.nativeEvent.contentOffset.y >= threshold }),
    [threshold],
  );
  const tabs = useCallback((pinned?: boolean) => (
    <ProfileTabsRow
      value={state.tab}
      onChange={setTab}
      pinned={pinned}
      storiesLabel={tabLabel(t('profileScreen.myStories'), stories.length)}
      conversationsLabel={tabLabel(t('profileScreen.myConversations'), conversations.length)}
    />
  ), [conversations.length, setTab, state.tab, stories.length, t]);

  const rows = useMemo(
    // `loading` yalnızca hikâye dinleyicisini anlatır; konuşma sekmesini bekletmez.
    () => buildProfileRows({
      tab: state.tab,
      stories,
      conversations,
      loading: state.tab === 'stories' && loading,
      composer: true,
    }),
    [conversations, loading, state.tab, stories],
  );

  const renderItem = useCallback<ListRenderItem<ProfileRow>>(({ item }) => {
    if (item.kind === 'tabs') return tabs();
    if (item.kind === 'composer') return <ProfileComposePrompt onPress={openComposer} />;
    if (item.kind === 'skeleton') return <View style={styles.tabRow}><SkeletonRow /></View>;
    if (item.kind === 'empty') return <OwnProfileEmpty tab={state.tab} onCompose={openComposer} />;
    return (
      <OwnProfileListItem
        kind={item.kind}
        item={item.kind === 'story' ? item.story : item.conversation}
        onPressStory={openStory}
        onStoryMenu={actions.openStoryMenu}
        onPressConversation={openConversation}
        onConversationImage={setImage}
        onDeleteConversation={actions.deleteConversation}
      />
    );
  }, [actions.deleteConversation, actions.openStoryMenu, openComposer, openConversation, openStory, setImage,
    state.tab, tabs]);

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
        contentContainerStyle={{ paddingBottom: 120 }}
        ListHeaderComponent={
          <View onLayout={onHeaderLayout}>
            <OwnProfileHeader user={user} stories={stories} topInset={top} onShare={actions.shareProfile} />
          </View>
        }
      />
      {state.pinned && (
        <ProfilePinnedBar
          topInset={top}
          name={user.displayName}
          avatarUri={user.profileImage}
          trailing={
            <IconButton
              icon="settings-outline"
              size={36}
              accessibilityLabel={t('settings.title')}
              onPress={() => router.push('/profile/settings')}
            />
          }
        >
          {tabs(true)}
        </ProfilePinnedBar>
      )}
      <ImageModal
        visible={!!state.image}
        imageUri={state.image || ''}
        onClose={() => setImage(null)}
      />
      <ProfileMessageComposer
        visible={state.composerVisible}
        user={user}
        onClose={() => dispatch({ type: 'composer', value: false })}
      />
    </Screen>
  );
}
