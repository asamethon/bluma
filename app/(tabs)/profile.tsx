import ImageModal from '@/components/ImageModal';
import { GuestState } from '@/components/GuestState';
import {
  Screen,
  Avatar,
  Badge,
  BloomMark,
  Button,
  IconButton,
  SegmentedControl,
  StoryCardSpine,
  StoryRow,
  Text,
} from '@/components/ui';
import { Colors } from '@/constants/Colors';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { CHALLENGE_DEFS, RANKS, challengeActions, challengeState$, getRankIndex } from '@/store/challengeStore';
import { imageUploadService } from '@/services/imageUploadService';
import { authActions, authState$ } from '@/store/authStore';
import { conversationActions, conversationState$ } from '@/store/conversationStore';
import { storyActions, storyState$ } from '@/store/storyStore';
import { Conversation, Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { Image } from 'expo-image';
import { useFocusEffect, useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  Share,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
  useColorScheme,
} from 'react-native';
import { buildProfileShareUrl } from '@/utils/deepLinks';

export default observer(function ProfileScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { colors: themeColors } = useTheme();
  const router = useRouter();
  const { user: currentUser, isGuest } = authState$.get();
  const { isLoading, publishedUserStories } = storyState$.get();
  const { userConversations } = conversationState$.get();
  const [imageModalVisible, setImageModalVisible] = React.useState(false);
  const [selectedModalImage, setSelectedModalImage] = React.useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<'stories' | 'conversations'>('stories');

  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageContent, setMessageContent] = useState('');
  const [messageImage, setMessageImage] = useState<string | null>(null);
  const [notifyFollowers, setNotifyFollowers] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (currentUser?.id) {
      storyActions.initializeRealTimeListeners();
      storyActions.setupPublishedUserStoriesListener(currentUser.id);
      authActions.setupUserListener(currentUser.id);
      conversationActions.getUserConversations(currentUser.id);
      conversationActions.getLikedConversations(currentUser.id);
      challengeActions.loadProgress(currentUser.id);
      return () => {
        storyActions.cleanupRealTimeListeners();
        authActions.cleanupUserListener();
        conversationActions.cleanupListeners();
      };
    }
  }, [currentUser?.id]);

  useFocusEffect(
    useCallback(() => {
      if (currentUser?.id) {
        storyActions.setupPublishedUserStoriesListener(currentUser.id);
        authActions.setupUserListener(currentUser.id);
      }
    }, [currentUser?.id])
  );

  useEffect(() => {
    if (userConversations && userConversations.length > 0) {
      const unsubscribers: (() => void)[] = [];
      userConversations.forEach(conversation => {
        conversationActions.getConversationRealTimeUpdates(conversation.id).then(unsubscribe => {
          if (unsubscribe) unsubscribers.push(unsubscribe);
        });
      });
      return () => unsubscribers.forEach(u => u());
    }
  }, [userConversations]);

  const handleOpenImageModal = (imageUri: string) => {
    setSelectedModalImage(imageUri);
    setImageModalVisible(true);
  };

  const handleCloseMessageModal = () => {
    setShowMessageModal(false);
    setMessageContent('');
    setMessageImage(null);
    setNotifyFollowers(false);
  };

  const handlePickMessageImage = async () => {
    try {
      const imageUri = await imageUploadService.pickCommentImage();
      if (imageUri) setMessageImage(imageUri);
    } catch (error) {
      Alert.alert('Hata', error instanceof Error ? error.message : 'Resim seçilirken bir hata oluştu.');
    }
  };

  const handlePostMessage = async () => {
    if (!messageContent.trim()) {
      Alert.alert('Uyarı', 'Lütfen bir mesaj yazın.');
      return;
    }
    if (!currentUser?.id) {
      Alert.alert('Hata', 'Giriş yapmanız gerekiyor.');
      return;
    }
    try {
      setIsPosting(true);
      let imageUrl: string | undefined = undefined;
      if (messageImage) {
        try {
          imageUrl = await imageUploadService.uploadCommentImage(messageImage);
        } catch {}
      }
      const conversationData: any = {
        title: '',
        content: messageContent.trim(),
        authorId: currentUser.id,
        isActive: true,
      };
      if (imageUrl) conversationData.image = imageUrl;
      const authorData: any = {
        id: currentUser.id,
        email: currentUser.email,
        displayName: currentUser.displayName,
        authProvider: currentUser.authProvider,
      };
      if (currentUser.username) authorData.username = currentUser.username;
      if (currentUser.bio) authorData.bio = currentUser.bio;
      if (currentUser.profileImage) authorData.profileImage = currentUser.profileImage;
      conversationData.author = authorData;
      const result = await conversationActions.createConversation(conversationData);
      if (result.success) {
        if (notifyFollowers && result.conversationId) {
          try {
            await conversationActions.announceConversationToFollowers(result.conversationId, currentUser);
          } catch {}
        }
        Alert.alert('Başarılı', 'Mesajınız paylaşıldı!');
        handleCloseMessageModal();
      } else {
        Alert.alert('Hata', result.error || 'Mesaj paylaşılırken bir hata oluştu.');
      }
    } catch {
      Alert.alert('Hata', 'Mesaj paylaşılırken bir hata oluştu.');
    } finally {
      setIsPosting(false);
    }
  };

  const handleShareProfile = async () => {
    if (!currentUser?.id) return;
    try {
      const url = buildProfileShareUrl(currentUser.id);
      const name = currentUser.displayName || `@${currentUser.username || 'bluma'}`;
      // Pass ONLY `message` (with the link inside). Passing `url` *as well* makes
      // iOS append a serialized "bplist00…" blob to the shared text in some
      // targets, so we keep the URL in the message string only.
      await Share.share({
        title: `${name} • Bluma`, // Android-only dialog title
        message: `${name} adlı yazarı Bluma'da keşfet:\n${url}`,
      });
    } catch (e) {
      console.error('Share profile error', e);
    }
  };

  const handleStoryPress = (storyId: string) => {
    router.push(`/story/${storyId}/preview`);
  };

  const handleStoryMenu = (story: Story) => {
    Alert.alert('Hikaye Seçenekleri', 'Ne yapmak istiyorsunuz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Düzenle', onPress: () => router.push(`/story/edit/${story.id}` as any) },
      {
        text: 'Taslağa Geri Al',
        onPress: async () => {
          Alert.alert('Taslağa Geri Al', `"${story.title}" hikayesini taslağa geri almak istediğinizden emin misiniz?`, [
            { text: 'İptal', style: 'cancel' },
            { text: 'Taslağa Geri Al', onPress: async () => {
              try {
                await storyActions.updateStory(story.id, { isPublished: false });
              } catch { Alert.alert('Hata', 'Hikaye taslağa geri alınırken bir hata oluştu.'); }
            }},
          ]);
        },
      },
      {
        text: 'Sil',
        style: 'destructive',
        onPress: () => {
          Alert.alert('Hikayeyi Sil', `"${story.title}" hikayesini silmek istediğinizden emin misiniz?`, [
            { text: 'İptal', style: 'cancel' },
            { text: 'Sil', style: 'destructive', onPress: async () => {
              try { await storyActions.deleteStory(story.id); } catch {}
            }},
          ]);
        },
      },
    ]);
  };

  const handleDeleteConversation = (conversation: Conversation) => {
    Alert.alert('Konuşmayı Sil', 'Bu konuşmayı silmek istediğinizden emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Sil', style: 'destructive', onPress: async () => {
        try { await conversationActions.deleteConversation(conversation.id); } catch {}
      }},
    ]);
  };

  const handleSignOut = () => {
    Alert.alert('Çıkış Yap', 'Hesabından çıkış yapmak istediğinden emin misin?', [
      { text: 'İptal', style: 'cancel' },
      { text: 'Çıkış Yap', style: 'destructive', onPress: () => {
        authActions.signOut();
        router.push('/(auth)/signin');
      }},
    ]);
  };

  const getStoryStatus = (story: Story) => {
    if (!story.isPublished) return 'Taslak';
    if (story.isCompleted) return 'Tamamlandı';
    return 'Devam ediyor';
  };

  const menuItems = [
    { icon: 'document-outline', title: 'Taslaklarım', subtitle: 'Yazdığın hikayeler', route: '/profile/drafts' },
    { icon: 'bookmarks-outline', title: 'Okuma Listelerim', subtitle: 'Oluşturduğun koleksiyonlar', route: '/profile/lists' },
    { icon: 'bookmark-outline', title: 'Kaydedilenler', subtitle: 'Kaydettiğin hikayeler', route: '/profile/saved' },
    { icon: 'heart-outline', title: 'Favorilerim', subtitle: 'Beğendiğin hikayeler', route: '/profile/favorites' },
    { icon: 'cloud-download-outline', title: 'Offline Kütüphane', subtitle: 'İndirilen hikayeler', route: '/profile/offline' },
    { icon: 'settings-outline', title: 'Ayarlar', subtitle: 'Hesap ve uygulama ayarları', route: '/profile/settings' },
    { icon: 'help-circle-outline', title: 'Yardım', subtitle: 'SSS ve destek', route: '/help' },
  ];

  const userStats = {
    stories: publishedUserStories.length,
    followers: currentUser?.followersCount || 0,
    following: currentUser?.followingCount || 0,
    likes: publishedUserStories.reduce((sum: number, s: Story) => sum + (s.likesCount || 0), 0),
  };

  // Guest check MUST come before currentUser check (guest has no currentUser)
  if (isGuest) {
    return (
      <Screen style={{ flex: 1, backgroundColor: colors.background }}>
        <GuestState kind="profile" />
      </Screen>
    );
  }

  if (!currentUser) {
    return (
      <Screen style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <Text variant="body" tone="textSecondary">Kullanıcı bilgileri yükleniyor...</Text>
      </Screen>
    );
  }

  const tabOptions = [
    { value: 'stories', label: 'Hikayelerim', icon: 'library-outline' as const },
    { value: 'conversations', label: 'Konuşmalarım', icon: 'chatbubble-ellipses-outline' as const },
  ];

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>

        {/* ── Gradient hero ─────────────────────────────────────── */}
        <View>
          <View style={styles.hero}>
            {/* diagonal darker base */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: -60,
                bottom: -60,
                width: 220,
                height: 220,
                borderRadius: 110,
                backgroundColor: '#4B2DA8',
                opacity: 0.55,
              }}
            />
            {/* petal-rose blush — upper-right */}
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                right: -30,
                top: -30,
                width: 160,
                height: 160,
                borderRadius: 80,
                backgroundColor: '#FF85A8',
                opacity: 0.38,
              }}
            />
            {/* BloomMark watermark */}
            <View style={styles.heroWatermark} pointerEvents="none">
              <BloomMark size={132} color="#fff" coreColor="#fff" />
            </View>
            <View style={styles.heroActions}>
              <IconButton
                icon="settings-outline"
                onPress={() => router.push('/profile/settings' as any)}
                color="#fff"
                size={40}
              />
              <IconButton
                icon="log-out-outline"
                onPress={handleSignOut}
                color="#fff"
                size={40}
              />
            </View>
          </View>
          {/* Avatar dışarıda — hero overflow'dan etkilenmiyor */}
          <View style={styles.heroAvatarWrap}>
            <Avatar
              uri={currentUser.profileImage}
              name={currentUser.displayName}
              size={88}
              ring
            />
          </View>
        </View>

        {/* ── Identity ──────────────────────────────────────────── */}
        <View style={styles.identity}>
          <View style={styles.nameRow}>
            <Text
              variant="title"
              style={{ fontWeight: '700' }}
            >
              {currentUser.displayName}
            </Text>
            <Badge label="Filizlenen Yazar" tone="bloom" icon="ribbon" style={{ marginLeft: 8 }} />
          </View>
          <Text variant="label" tone="primary" style={{ marginTop: 2 }}>
            @{currentUser.username || currentUser.email?.split('@')[0] || 'user'}
          </Text>
          {(currentUser.bio) && (
            <Text
              variant="body"
              tone="textSecondary"
              style={{ marginTop: 10, fontStyle: 'italic' }}
            >
              {currentUser.bio}
            </Text>
          )}

          {/* Action buttons */}
          <View style={styles.actionRow}>
            <Button
              label="Profili Düzenle"
              variant="primary"
              size="md"
              icon="create-outline"
              onPress={() => router.push('/profile/edit')}
              style={{ flex: 1 }}
            />
            <Button
              label="Paylaş"
              variant="secondary"
              size="md"
              icon="share-social-outline"
              onPress={handleShareProfile}
            />
          </View>

          {/* Rank / XP progression — opens Görevler */}
          <RankProgressCard
            onPress={() => router.push('/profile/challenges' as any)}
            style={{ marginTop: 16 }}
          />

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <StatCell icon="book" value={userStats.stories} label="Hikâye" color={themeColors.primary} />
            <View style={styles.statsDivider} />
            <StatCell
              icon="people"
              value={userStats.followers}
              label="Takipçi"
              color="#4C6FE0"
              onPress={() => router.push(`/profile/followers/${currentUser.id}` as any)}
            />
            <View style={styles.statsDivider} />
            <StatCell
              icon="leaf"
              value={userStats.following}
              label="Takip"
              color={themeColors.primary}
              onPress={() => router.push(`/profile/following/${currentUser.id}` as any)}
            />
            <View style={styles.statsDivider} />
            <StatCell icon="heart" value={userStats.likes} label="Beğeni" color={themeColors.bloom} />
          </View>
        </View>

        {/* ── Bahçem — published stories shelf ─────────────────── */}
        {publishedUserStories.length > 0 && (
          <View style={{ marginTop: 8 }}>
            <View style={styles.gardenHeader}>
              <Text variant="heading" style={{ fontWeight: '700' }}>Bahçem</Text>
              <Text variant="caption" tone="textLight">{publishedUserStories.length} açan hikâye</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.gardenShelf}
            >
              {publishedUserStories.slice(0, 6).map((story: Story) => (
                <StoryCardSpine
                  key={story.id}
                  story={story}
                  width={118}
                  onPress={() => handleStoryPress(story.id)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Tabs ──────────────────────────────────────────────── */}
        <View style={styles.tabsWrap}>
          <SegmentedControl
            options={tabOptions}
            value={activeTab}
            onChange={(v) => setActiveTab(v as any)}
          />
        </View>

        {/* ── Tab content ───────────────────────────────────────── */}
        <View style={styles.tabContent}>
          {activeTab === 'stories' ? (
            isLoading ? (
              <ActivityIndicator color={themeColors.primary} style={{ marginVertical: 32 }} />
            ) : publishedUserStories.length === 0 ? (
              <View style={styles.empty}>
                <Ionicons name="document-outline" size={32} color={themeColors.textSecondary} />
                <Text variant="body" tone="textSecondary" style={{ marginTop: 8 }}>Henüz yayınlanan hikaye yok</Text>
                <Button
                  label="İlk Hikayeni Yaz"
                  variant="primary"
                  size="sm"
                  onPress={() => router.push('/(tabs)/write')}
                  style={{ marginTop: 12 }}
                />
              </View>
            ) : (
              <View style={{ gap: Spacing.md }}>
                {publishedUserStories.map((story: Story) => (
                  <StoryRow
                    key={story.id}
                    story={story}
                    status={getStoryStatus(story)}
                    onPress={() => handleStoryPress(story.id)}
                    onMenu={() => handleStoryMenu(story)}
                  />
                ))}
              </View>
            )
          ) : (
            <>
              {/* Message composer button */}
              <TouchableOpacity
                style={[styles.composeBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                onPress={() => setShowMessageModal(true)}
              >
                <Text variant="body" tone="textSecondary" style={{ flex: 1 }}>Bir mesaj yaz...</Text>
                <Ionicons name="camera-outline" size={20} color={themeColors.textSecondary} />
              </TouchableOpacity>

              {userConversations.length === 0 ? (
                <View style={styles.empty}>
                  <Ionicons name="chatbubble-ellipses-outline" size={32} color={themeColors.textSecondary} />
                  <Text variant="body" tone="textSecondary" style={{ marginTop: 8 }}>Henüz mesaj paylaşmadın</Text>
                </View>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  {userConversations.map((conversation: Conversation) => (
                    <TouchableOpacity
                      key={conversation.id}
                      style={[styles.convCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                      onPress={() => router.push(`/conversation/${conversation.id}` as any)}
                    >
                      <Text variant="body" style={{ flex: 1 }}>{conversation.content}</Text>
                      {conversation.image && (
                        <TouchableOpacity onPress={() => handleOpenImageModal(conversation.image!)}>
                          <Image source={{ uri: conversation.image }} style={styles.convImg} contentFit="cover" />
                        </TouchableOpacity>
                      )}
                      <View style={styles.convStats}>
                        <StatPill icon="heart-outline" value={conversation.likesCount || 0} color={themeColors.textSecondary} />
                        <StatPill icon="chatbubble-outline" value={conversation.commentsCount || 0} color={themeColors.textSecondary} />
                        <TouchableOpacity onPress={() => handleDeleteConversation(conversation)} style={{ marginLeft: 'auto' }}>
                          <Ionicons name="ellipsis-vertical" size={16} color={themeColors.textLight} />
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </>
          )}
        </View>

        {/* ── Menu items ────────────────────────────────────────── */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <View style={[styles.menuIcon, { backgroundColor: themeColors.primarySoft }]}>
                <Ionicons name={item.icon as any} size={20} color={themeColors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text variant="subheading" style={{ fontSize: 15 }}>{item.title}</Text>
                <Text variant="caption" tone="textSecondary">{item.subtitle}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={themeColors.textLight} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      {/* Image Modal */}
      <ImageModal
        visible={imageModalVisible}
        imageUri={selectedModalImage || ''}
        onClose={() => { setImageModalVisible(false); setSelectedModalImage(null); }}
      />

      {/* Message Modal */}
      <Modal visible={showMessageModal} animationType="slide" presentationStyle="pageSheet" onRequestClose={handleCloseMessageModal}>
        <Screen style={{ flex: 1, backgroundColor: colors.background }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={handleCloseMessageModal}>
              <Text variant="body" tone="textSecondary">İptal</Text>
            </TouchableOpacity>
            <Text variant="subheading">Mesaj Paylaş</Text>
            <TouchableOpacity
              style={[styles.shareBtn, { backgroundColor: themeColors.primary, opacity: !messageContent.trim() || isPosting ? 0.5 : 1 }]}
              onPress={handlePostMessage}
              disabled={!messageContent.trim() || isPosting}
            >
              {isPosting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text variant="label" color="#fff">Paylaş</Text>
              )}
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1, paddingHorizontal: 20 }}>
            <TextInput
              style={[styles.msgInput, { color: colors.text, borderBottomColor: colors.border }]}
              placeholder="Mesaj yaz..."
              placeholderTextColor={colors.textSecondary}
              value={messageContent}
              onChangeText={setMessageContent}
              multiline
              autoFocus
              maxLength={500}
            />
            {messageImage && (
              <View style={{ position: 'relative', marginBottom: 16 }}>
                <Image source={{ uri: messageImage }} style={{ width: '100%', height: 180, borderRadius: Radius.lg }} contentFit="cover" />
                <TouchableOpacity style={{ position: 'absolute', top: 8, right: 8 }} onPress={() => setMessageImage(null)}>
                  <Ionicons name="close-circle" size={24} color={themeColors.error} />
                </TouchableOpacity>
              </View>
            )}
            <TouchableOpacity
              style={[styles.photoBtn, { backgroundColor: colors.surface }]}
              onPress={handlePickMessageImage}
            >
              <Ionicons name="camera-outline" size={20} color={themeColors.primary} />
              <Text variant="label" tone="primary">Fotoğraf Ekle</Text>
            </TouchableOpacity>
            <View style={[styles.notifyRow, { backgroundColor: colors.surface }]}>
              <View style={{ flex: 1 }}>
                <Text variant="label" style={{ fontWeight: '600' }}>Takipçilere Duyur</Text>
                <Text variant="caption" tone="textSecondary">Takipçilerin bu mesajı bildirim olarak alsın</Text>
              </View>
              <TouchableOpacity
                style={[styles.toggle, { backgroundColor: notifyFollowers ? themeColors.primary : colors.border }]}
                onPress={() => setNotifyFollowers(!notifyFollowers)}
              >
                <View style={[styles.toggleThumb, notifyFollowers && styles.toggleThumbOn]} />
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Screen>
      </Modal>
    </Screen>
  );
});


function RankProgressCard({ onPress, style }: { onPress?: () => void; style?: any }) {
  const { colors } = useTheme();
  const { xp, streak, challengeProgress, claimedChallenges } = challengeState$.get();
  const rankIndex = getRankIndex(xp);
  const rank = RANKS[rankIndex];
  const nextRank = RANKS[rankIndex + 1];
  const floor = rank.min;
  const ceil = nextRank ? nextRank.min : rank.min;
  const xpPct = nextRank ? Math.min((xp - floor) / (ceil - floor), 1) : 1;
  const fmt = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}b` : `${n}`;
  const totalChallenges = CHALLENGE_DEFS.length;
  const doneChallenges = claimedChallenges.length;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      style={[
        {
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: Radius.lg,
          padding: 16,
          shadowColor: colors.shadow,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 1,
          shadowRadius: 8,
          elevation: 2,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <View style={{
          width: 44, height: 44, borderRadius: 13,
          alignItems: 'center', justifyContent: 'center',
          backgroundColor: '#5E3FB0',
        }}>
          <Ionicons name={rank.icon as any} size={23} color="#fff" />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text variant="caption" style={{ fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7, color: colors.textLight }}>
            Seviye {rankIndex + 1}
          </Text>
          <Text variant="heading" style={{ fontSize: 18, fontWeight: '700', fontFamily: Fonts.serif, color: colors.text, lineHeight: 22 }}>
            {rank.name}
          </Text>
        </View>
        <View style={{
          flexDirection: 'row', alignItems: 'center', gap: 5,
          height: 28, paddingHorizontal: 11, borderRadius: Radius.pill,
          backgroundColor: colors.surfaceVariant,
        }}>
          <Ionicons name="sparkles" size={12} color="#E6B95C" />
          <Text style={{ fontFamily: Fonts.mono, fontSize: 12, fontWeight: '700', color: colors.text }}>
            {fmt(xp)}
          </Text>
        </View>
      </View>

      <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surfaceVariant, overflow: 'hidden', marginTop: 13, marginBottom: 8 }}>
        <View style={{ width: `${xpPct * 100}%` as any, height: '100%', borderRadius: 4, backgroundColor: '#7C5CD0' }} />
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="flame" size={13} color="#E6B95C" />
            <Text variant="caption" tone="textSecondary" style={{ fontWeight: '600' }}>
              {streak} gün seri
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="checkmark-circle" size={13} color={colors.primary} />
            <Text variant="caption" tone="textSecondary" style={{ fontWeight: '600' }}>
              {doneChallenges}/{totalChallenges} görev
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
          <Text variant="caption" style={{ fontWeight: '700', color: colors.primary }}>Görevler</Text>
          <Ionicons name="chevron-forward" size={13} color={colors.primary} />
        </View>
      </View>
    </TouchableOpacity>
  );
}

function StatCell({
  icon,
  value,
  label,
  color,
  onPress,
}: {
  icon: any;
  value: number;
  label: string;
  color: string;
  onPress?: () => void;
}) {
  const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}b` : `${n}`);
  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <Ionicons name={icon} size={16} color={color} />
      <Text variant="heading" style={{ fontSize: 20, lineHeight: 24, fontWeight: '700' }}>{fmt(value)}</Text>
      <Text variant="caption" tone="textLight">{label}</Text>
    </TouchableOpacity>
  );
}

function StatPill({ icon, value, color }: { icon: any; value: number; color: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Ionicons name={icon} size={14} color={color} />
      <Text variant="caption" tone="textSecondary">{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 108,
    overflow: 'hidden',
    backgroundColor: '#6644C0',
  },
  heroWatermark: {
    position: 'absolute',
    right: -14,
    top: -14,
    opacity: 0.18,
  },
  heroActions: {
    position: 'absolute',
    top: 10,
    right: Spacing.screenX,
    flexDirection: 'row',
    gap: 4,
  },
  heroAvatarWrap: {
    position: 'absolute',
    left: Spacing.screenX,
    top: 56,
    zIndex: 10,
  },
  identity: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 48,
    paddingBottom: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
    marginBottom: 0,
  },
  statsBar: {
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: Radius.lg,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginTop: 16,
    marginBottom: 8,
  },
  statsDivider: {
    width: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 4,
  },
  gardenHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.screenX,
    marginBottom: 12,
  },
  gardenShelf: {
    paddingHorizontal: Spacing.screenX,
    gap: Spacing.md,
    paddingBottom: 8,
  },
  tabsWrap: {
    paddingHorizontal: Spacing.screenX,
    marginTop: 20,
    marginBottom: 16,
  },
  tabContent: {
    paddingHorizontal: Spacing.screenX,
    paddingBottom: 8,
  },
  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  convCard: {
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    marginBottom: Spacing.md,
  },
  convImg: {
    width: '100%',
    height: 150,
    borderRadius: Radius.md,
    marginTop: 8,
    marginBottom: 4,
  },
  convStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  menuSection: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 24,
    gap: Spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: 12,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  shareBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    minWidth: 70,
    alignItems: 'center',
  },
  msgInput: {
    fontSize: 16,
    paddingVertical: 16,
    minHeight: 120,
    textAlignVertical: 'top',
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  photoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: 16,
  },
  notifyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: Radius.md,
    marginBottom: 40,
  },
  toggle: {
    width: 50,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
    elevation: 3,
  },
  toggleThumbOn: {
    transform: [{ translateX: 20 }],
  },
});
