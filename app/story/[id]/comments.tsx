import ReportSheet from '@/components/ReportSheet';
import { Colors } from '@/constants/Colors';
import { authState$ } from '@/store/authStore';
import { storyActions, storyState$ } from '@/store/storyStore';
import { Comment } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Keyboard,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';
import { Screen } from '@/components/ui';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export default observer(function CommentsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme === 'dark' ? 'dark' : 'light'];
  const { user: currentUser } = authState$.get();
  const { storyComments = [] } = storyState$.get();
  
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [reportTarget, setReportTarget] = useState<{ targetId: string; reportedUserId?: string } | null>(null);

  // Keyboard animation
  const keyboardHeight = useSharedValue(0);
  const screenHeight = Dimensions.get('window').height;

  const styles = createStyles(colors);

  // Load comments when component mounts
  useEffect(() => {
    if (id) {
      // Real-time comments listener'ı başlat
      storyActions.setupCommentsListener(id);
    }

    // Cleanup on unmount
    return () => {
      // Comments listener cleanup is handled in storyStore
    };
  }, [id]);

  // Keyboard listeners
  useEffect(() => {
    let showTimeout: any;
    let hideTimeout: any;

    const keyboardWillShow = (event: any) => {
      clearTimeout(hideTimeout);
      const { height } = event.endCoordinates;

      showTimeout = setTimeout(() => {
        keyboardHeight.value = withSpring(height, {
          damping: 20,
          stiffness: 200,
        });
      }, 50);
    };

    const keyboardWillHide = () => {
      clearTimeout(showTimeout);

      hideTimeout = setTimeout(() => {
        keyboardHeight.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      }, 50);
    };

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSubscription = Keyboard.addListener(showEvent, keyboardWillShow);
    const hideSubscription = Keyboard.addListener(hideEvent, keyboardWillHide);

    return () => {
      clearTimeout(showTimeout);
      clearTimeout(hideTimeout);
      showSubscription?.remove();
      hideSubscription?.remove();
    };
  }, [keyboardHeight]);

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push(`/story/${id}/preview`);
    }
  };

  // Animated style for input container
  const animatedInputStyle = useAnimatedStyle(() => {
    return {
      transform: [
        {
          translateY: withSpring(-keyboardHeight.value, {
            damping: 20,
            stiffness: 200,
          }),
        },
      ],
    };
  });

  // Animated style for input container padding
  const animatedInputContainerStyle = useAnimatedStyle(() => {
    return {
      paddingBottom: withSpring(keyboardHeight.value > 0 ? 40 : 40, {
        damping: 20,
        stiffness: 200,
      }),
    };
  });

  // Static scroll view padding
  const scrollContentStyle = {
    paddingBottom: 180,
  };

  const handleLikeComment = async (commentId: string) => {
    if (!currentUser?.id) {
      Alert.alert('Giriş Gerekli', 'Bu işlemi yapmak için giriş yapmalısınız.');
      return;
    }

    try {
      // Tam liste reload'u YOK — ekrandaki real-time listener sayaç
      // değişikliğini kendisi getirir; reload tüm listeyi titretiyordu.
      await storyActions.likeComment(id, commentId);
    } catch (error) {
      console.error('Like comment error:', error);
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim()) return;
    
    if (!currentUser?.id) {
      Alert.alert('Giriş Gerekli', 'Yorum yapmak için giriş yapmalısınız.');
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await storyActions.addComment(id, newComment, replyingTo || undefined);
      
      if (result.success) {
        setNewComment('');
        setReplyingTo(null);
        // Real-time listener otomatik olarak yeni yorumu gösterecek
      } else {
        Alert.alert('Hata', result.error || 'Yorum eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Submit comment error:', error);
      Alert.alert('Hata', 'Yorum eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert(
      'Yorumu Sil',
      'Bu yorumu silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              // Reload gereksiz — real-time listener silinen yorumu düşürür.
              await storyActions.deleteComment(id, commentId);
            } catch (error) {
              console.error('Delete comment error:', error);
            }
          },
        },
      ]
    );
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return 'Şimdi';
    
    const now = new Date();
    const commentDate = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - commentDate.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    return commentDate.toLocaleDateString('tr-TR');
  };

  const renderComment = (comment: Comment, level: number = 0) => (
    <View
      key={comment.id}
      style={[styles.commentItem, { marginLeft: level * 20 }]}
    >
      <View style={styles.commentHeader}>
        <TouchableOpacity
          style={styles.userAvatar}
          onPress={() => router.push(`/user/${comment.user.id}`)}
        >
          {comment.user.profileImage ? (
            <Image
              source={{ uri: comment.user.profileImage }}
              style={styles.userAvatarImage}
            />
          ) : (
            <Ionicons name="person" size={16} color={colors.primary} />
          )}
        </TouchableOpacity>
        <View style={styles.commentInfo}>
          <View style={styles.userNameContainer}>
            <Text style={styles.userName}>{comment.user.displayName}</Text>
          </View>
          <Text style={styles.userHandle}>
            @{comment.user.username || "user"}
          </Text>
        </View>
        <Text style={styles.commentTime}>
          {formatTimeAgo(comment.createdAt)}
        </Text>
      </View>

      <Text style={styles.commentContent}>{comment.content}</Text>

      <View style={styles.commentActions}>
        <TouchableOpacity
          style={styles.commentAction}
          onPress={() => handleLikeComment(comment.id)}
        >
          <Ionicons
            name="heart-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.actionText}>{comment.likesCount || 0}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.commentAction}
          onPress={() => setReplyingTo(comment.id)}
        >
          <Ionicons
            name="chatbubble-outline"
            size={16}
            color={colors.textSecondary}
          />
          <Text style={styles.actionText}>Yanıtla</Text>
        </TouchableOpacity>

        {/* Show delete button only for comment author */}
        {currentUser?.id === comment.user.id ? (
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => handleDeleteComment(comment.id)}
          >
            <Ionicons
              name="trash-outline"
              size={16}
              color={colors.textSecondary}
            />
            <Text style={styles.actionText}>Sil</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.commentAction}
            onPress={() => setReportTarget({ targetId: comment.id, reportedUserId: comment.user.id })}
          >
            <Ionicons name="flag-outline" size={16} color={colors.textSecondary} />
            <Text style={styles.actionText}>Bildir</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Render replies */}
      {comment.replies && comment.replies.length > 0 && (
        <View style={styles.repliesContainer}>
          {comment.replies.map((reply) => renderComment(reply, level + 1))}
        </View>
      )}
    </View>
  );

  return (
    <Screen style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.headerButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Yorumlar ({storyComments?.length || 0})</Text>
        <View style={styles.headerButton} />
      </View>

      {/* Comments List */}
      <ScrollView
        style={styles.commentsList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={scrollContentStyle}
      >
        {!storyComments || storyComments.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-outline" size={48} color={colors.textSecondary} />
            <Text style={styles.emptyStateTitle}>Henüz yorum yok</Text>
            <Text style={styles.emptyStateMessage}>
              İlk yorumu sen yap ve tartışmayı başlat!
            </Text>
          </View>
        ) : (
          (storyComments || []).map(comment => renderComment(comment))
        )}
      </ScrollView>

      {/* Comment Input - Animated with keyboard */}
      <Animated.View style={[styles.keyboardAvoidingView, animatedInputStyle]}>
        <Animated.View style={[styles.commentInputContainer, animatedInputContainerStyle]}>
          {replyingTo && (
            <View style={styles.replyingToContainer}>
              <Text style={styles.replyingToText}>
                Yanıtlıyorsun: {(storyComments || []).find(c => c.id === replyingTo)?.user.displayName}
              </Text>
              <TouchableOpacity onPress={() => setReplyingTo(null)}>
                <Ionicons name="close" size={16} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputRow}>
            <View style={styles.inputAvatar}>
              {currentUser?.profileImage ? (
                <Image
                  source={{ uri: currentUser.profileImage }}
                  style={styles.inputAvatarImage}
                />
              ) : (
                <Ionicons name="person" size={16} color={colors.primary} />
              )}
            </View>
            <TextInput
              style={styles.commentInput}
              placeholder={replyingTo ? "Yanıtını yaz..." : "Yorumunu yaz..."}
              placeholderTextColor={colors.textSecondary}
              value={newComment}
              onChangeText={setNewComment}
              multiline
              maxLength={500}
              editable={!isSubmitting}
            />
            <TouchableOpacity
              style={[
                styles.sendButton, 
                (!newComment.trim() || isSubmitting) && styles.sendButtonDisabled
              ]}
              onPress={handleSubmitComment}
              disabled={!newComment.trim() || isSubmitting}
            >
              <Ionicons
                name="send"
                size={18}
                color={newComment.trim() && !isSubmitting ? colors.white : colors.textLight}
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>

      <ReportSheet
        visible={!!reportTarget}
        onClose={() => setReportTarget(null)}
        target={reportTarget ? { type: 'comment', targetId: reportTarget.targetId, reportedUserId: reportTarget.reportedUserId, contextId: String(id) } : null}
      />
    </Screen>
  );
});

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
    headerButton: {
      padding: 8,
      width: 40,
    },
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    commentsList: {
      flex: 1,
      paddingHorizontal: 20,
    },
    emptyState: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: 60,
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
    },
    commentItem: {
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    userAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: 12,
    },
    userAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    commentInfo: {
      flex: 1,
    },
    userNameContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    userName: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    verifiedBadge: {
      width: 14,
      height: 14,
    },
    userHandle: {
      fontSize: 12,
      color: colors.primary,
    },
    commentTime: {
      fontSize: 12,
      color: colors.textSecondary,
    },
    commentContent: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 12,
    },
    commentActions: {
      flexDirection: 'row',
      gap: 20,
    },
    commentAction: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    actionText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    repliesContainer: {
      marginTop: 8,
      borderLeftWidth: 2,
      borderLeftColor: colors.border,
      paddingLeft: 12,
    },
    keyboardAvoidingView: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
    },
    commentInputContainer: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      paddingHorizontal: 20,
      paddingTop: 12,
      shadowColor: colors.shadow,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 4,
    },
    replyingToContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: colors.primaryLight + '30',
      borderRadius: 8,
      paddingHorizontal: 12,
      paddingVertical: 8,
      marginBottom: 12,
    },
    replyingToText: {
      fontSize: 12,
      color: colors.primary,
      fontWeight: '500',
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 12,
    },
    inputAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    inputAvatarImage: {
      width: 32,
      height: 32,
      borderRadius: 16,
    },
    commentInput: {
      flex: 1,
      backgroundColor: colors.background,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
      maxHeight: 100,
      borderWidth: 1,
      borderColor: colors.border,
    },
    sendButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    sendButtonDisabled: {
      backgroundColor: colors.textLight,
    },
  });