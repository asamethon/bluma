import { useTheme } from '@/constants/theme';
import { storyActions } from '@/store/storyStore';
import { Story } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { Screen } from '@/components/ui';
import { useAppSelector } from '@/store/hooks';

export default function DraftsScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { user: currentUser } = useAppSelector(s => s.auth);
  const { userStories, isLoading } = useAppSelector(s => s.story);
  
  const [refreshing, setRefreshing] = useState(false);
  const [drafts, setDrafts] = useState<Story[]>([]);

  const styles = createStyles(colors);

  useEffect(() => {
    if (currentUser?.id) {
      loadDrafts();
    }
  }, [currentUser?.id]);

  useEffect(() => {
    // Filter drafts from userStories
    const draftStories = userStories.filter(story => !story.isPublished);
    setDrafts(draftStories);
  }, [userStories]);

  const loadDrafts = async () => {
    if (!currentUser?.id) return;
    
    try {
      await storyActions.loadUserStories(currentUser.id);
    } catch (error) {
      console.error('Load drafts error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDrafts();
    setRefreshing(false);
  };

  const handleEditDraft = (storyId: string) => {
    router.push(`/story/edit/${storyId}`);
  };

  const handlePublishDraft = async (story: Story) => {
    Alert.alert(
      'Taslağı Yayınla',
      `"${story.title}" hikayesini yayınlamak istediğinizden emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Yayınla',
          style: 'default',
          onPress: async () => {
            try {
              const result = await storyActions.updateStory(story.id, {
                isPublished: true,
              });
              
              if (result.success) {
                Alert.alert('Başarılı', 'Hikayeniz yayınlandı!');
                await loadDrafts();
              } else {
                Alert.alert('Hata', result.error || 'Hikaye yayınlanırken bir hata oluştu.');
              }
            } catch (error) {
              console.error('Publish draft error:', error);
              Alert.alert('Hata', 'Hikaye yayınlanırken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const handleDeleteDraft = async (story: Story) => {
    Alert.alert(
      'Taslağı Sil',
      `"${story.title}" hikayesini silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await storyActions.deleteStory(story.id);
              
              if (result.success) {
                Alert.alert('Başarılı', 'Taslak silindi.');
                await loadDrafts();
              } else {
                Alert.alert('Hata', result.error || 'Taslak silinirken bir hata oluştu.');
              }
            } catch (error) {
              console.error('Delete draft error:', error);
              Alert.alert('Hata', 'Taslak silinirken bir hata oluştu.');
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Yeni';
    
    const now = new Date();
    const storyDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - storyDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return storyDate.toLocaleDateString('tr-TR');
  };

  const renderDraftCard = (story: Story) => {
    return (
      <View key={story.id} style={styles.draftCard}>
        <View style={styles.draftHeader}>
          <View style={styles.draftInfo}>
            <Text style={styles.draftTitle}>{story.title}</Text>
            <Text style={styles.draftTime}>{formatTimeAgo(story.updatedAt)}</Text>
          </View>
          
          <View style={styles.draftStats}>
            <Text style={styles.draftStat}>
              {story.content?.split(/\s+/).filter(word => word.length > 0).length || 0} kelime
            </Text>
            <Text style={styles.draftStat}>
              {story.readingTime || 0} dk okuma
            </Text>
          </View>
        </View>

        {story.description && (
          <Text style={styles.draftDescription} numberOfLines={2}>
            {story.description}
          </Text>
        )}

        <View style={styles.draftActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleEditDraft(story.id)}
          >
            <Ionicons name="create-outline" size={16} color={colors.primary} />
            <Text style={styles.actionText}>Düzenle</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handlePublishDraft(story)}
          >
            <Ionicons name="send-outline" size={16} color={colors.accent} />
            <Text style={[styles.actionText, { color: colors.accent }]}>Yayınla</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleDeleteDraft(story)}
          >
            <Ionicons name="trash-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.actionText}>Sil</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (!currentUser?.id) {
    return (
      <Screen style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Taslak Hikayeler</Text>
          <View style={styles.backButton} />
        </View>
        
        <View style={styles.emptyState}>
          <Ionicons name="log-in-outline" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyStateTitle}>Giriş Gerekli</Text>
          <Text style={styles.emptyStateMessage}>
            Taslak hikayelerinizi görmek için giriş yapmalısınız.
          </Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Taslak Hikayeler</Text>
        <TouchableOpacity 
          style={styles.newDraftButton}
          onPress={() => router.push('/(tabs)/write')}
        >
          <Ionicons name="add" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 120 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Taslaklar yükleniyor...</Text>
          </View>
        ) : drafts.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Henüz taslak yok</Text>
            <Text style={styles.emptyStateMessage}>
              İlk hikayenizi yazmaya başlayın ve taslak olarak kaydedin.
            </Text>
            <TouchableOpacity
              style={styles.createDraftButton}
              onPress={() => router.push('/(tabs)/write')}
            >
              <Text style={styles.createDraftButtonText}>Yeni Hikaye Yaz</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.draftsContainer}>
            {drafts.map(draft => renderDraftCard(draft))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
}

const createStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backButton: {
      padding: 8,
      width: 40,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    newDraftButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    loadingContainer: {
      paddingVertical: 40,
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
      paddingHorizontal: 40,
    },
    emptyStateTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginTop: 16,
      marginBottom: 8,
    },
    emptyStateMessage: {
      fontSize: 14,
      color: colors.textSecondary,
      textAlign: 'center',
      lineHeight: 20,
      marginBottom: 24,
    },
    createDraftButton: {
      backgroundColor: colors.primary,
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 8,
    },
    createDraftButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.white,
    },
    draftsContainer: {
      paddingTop: 16,
    },
    draftCard: {
      marginHorizontal: 20,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    draftHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 12,
    },
    draftInfo: {
      flex: 1,
    },
    draftTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    draftTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    draftStats: {
      alignItems: 'flex-end',
    },
    draftStat: {
      fontSize: 12,
      color: colors.textSecondary,
      marginBottom: 2,
    },
    draftDescription: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
      marginBottom: 16,
    },
    draftActions: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingTop: 12,
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      padding: 8,
    },
    actionText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
  }); 