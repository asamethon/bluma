import ImageModal from '@/components/ImageModal';
import { imageUploadService } from '@/services/imageUploadService';
import { authState$ } from '@/store/authStore';
import { conversationActions, conversationState$ } from '@/store/conversationStore';
import { ConversationComment } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { collection, getDocs, getFirestore, query, where } from '@react-native-firebase/firestore';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';

export default observer(function ConversationDetailScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const currentUser = authState$.user.get();
  const unsubscribeRef = useRef<(() => void) | null>(null);
  const commentsUnsubscribeRef = useRef<(() => void) | null>(null);

  const { currentConversation, currentConversationComments, likedConversations } = conversationState$.get();
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedModalImage, setSelectedModalImage] = useState<string | null>(null);

  // Check if current conversation is liked
  const isLiked = likedConversations.some(conversation => conversation.id === id);
  
  console.log('Like status check:', {
    conversationId: id,
    likedConversationsIds: likedConversations.map(c => c.id),
    isLiked,
  });

  // Check like status directly from Firebase
  const [isLikedDirect, setIsLikedDirect] = useState(false);
  
  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!id || !currentUser?.id) return;
      
      try {
        const db = getFirestore();
        const likeDoc = await getDocs(query(collection(db, 'conversations', id, 'likes'), where('userId', '==', currentUser.id)));
        const liked = !likeDoc.empty;
        console.log('Direct like check:', { conversationId: id, userId: currentUser.id, liked });
        setIsLikedDirect(liked);
      } catch (error) {
        console.error('Error checking like status:', error);
      }
    };
    
    checkLikeStatus();
  }, [id, currentUser?.id]);



  useEffect(() => {
    if (id) {
      console.log('Setting up real-time listeners for conversation:', id);
      
      // Load conversation with real-time updates
      conversationActions.getConversationById(id);
      
      // Set up real-time conversation listener using the store method
      conversationActions.getConversationRealTimeUpdates(id).then((unsubscribe) => {
        if (unsubscribe) {
          unsubscribeRef.current = unsubscribe;
        }
      });
      
      // Load comments
      conversationActions.getConversationComments(id).then((unsubscribe) => {
        if (unsubscribe) {
          commentsUnsubscribeRef.current = unsubscribe;
        }
      });
      
      // Load liked conversations for current user
      if (currentUser?.id) {
        conversationActions.getLikedConversations(currentUser.id);
      }
    }

    return () => {
      if (commentsUnsubscribeRef.current) {
        commentsUnsubscribeRef.current();
      }
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [id]);

  const handleAddComment = async () => {
    if (!currentUser?.id || !id) {
      Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı.');
      return;
    }

    if (!commentText.trim() && !selectedImage) {
      Alert.alert('Hata', 'Lütfen yorum yazın veya resim ekleyin.');
      return;
    }

    setIsSubmitting(true);

    try {
      let imageData: string | undefined;
      if (selectedImage) {
        imageData = await imageUploadService.uploadCommentImage(selectedImage);
      }

      const result = await conversationActions.addComment(id, commentText.trim(), imageData);
      
      if (result.success) {
        console.log('Comment added successfully, clearing input');
        setCommentText('');
        setSelectedImage(null);
        // Force refresh comments
        if (id) {
          conversationActions.getConversationComments(id);
        }
      } else {
        Alert.alert('Hata', result.error || 'Yorum eklenirken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Add comment error:', error);
      Alert.alert('Hata', 'Yorum eklenirken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectImage = async () => {
    try {
      const imageUri = await imageUploadService.pickCommentImage();
      if (imageUri) {
        setSelectedImage(imageUri);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Hata', 'Resim seçilirken bir hata oluştu.');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleOpenImageModal = (imageUri: string) => {
    setSelectedModalImage(imageUri);
    setImageModalVisible(true);
  };

  const handleCloseImageModal = () => {
    setImageModalVisible(false);
    setSelectedModalImage(null);
  };

  const handleLikeConversation = async () => {
    if (!id) return;
    
    try {
      console.log('Liking conversation:', id);
      await conversationActions.likeConversation(id);
      console.log('Conversation liked successfully');
      
      // Update like status directly
      if (currentUser?.id) {
        const db = getFirestore();
        const likeDoc = await getDocs(query(collection(db, 'conversations', id, 'likes'), where('userId', '==', currentUser.id)));
        const liked = !likeDoc.empty;
        console.log('Updated like status:', { conversationId: id, liked });
        setIsLikedDirect(liked);
      }
    } catch (error) {
      console.error('Like conversation error:', error);
    }
  };

  const formatTimeAgo = (timestamp: any) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const time = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Şimdi';
    if (diffInMinutes < 60) return `${diffInMinutes} dk önce`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} saat önce`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} gün önce`;
    
    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) return `${diffInWeeks} hafta önce`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths} ay önce`;
  };

  const renderComment = ({ item }: { item: ConversationComment }) => (
    <View style={styles.commentItem}>
      <View style={styles.commentHeader}>
        {item.user?.profileImage ? (
          <Image source={{ uri: item.user.profileImage }} style={styles.commentAvatar} />
        ) : (
          <View style={[styles.commentAvatar, { backgroundColor: colors.primaryLight }]}>
            <Ionicons name="person" size={16} color={colors.primary} />
          </View>
        )}
        <View style={styles.commentInfo}>
          <Text style={styles.commentAuthor}>{item.user?.displayName || 'Kullanıcı'}</Text>
          <Text style={styles.commentTime}>{formatTimeAgo(item.createdAt)}</Text>
        </View>
      </View>
      {item.content && <Text style={styles.commentContent}>{item.content}</Text>}
      {item.image && (
        <TouchableOpacity
          onPress={() => handleOpenImageModal(item.image!)}
          activeOpacity={0.9}
        >
          <Image 
            source={{ uri: item.image }} 
            style={styles.commentImage}
            contentFit="contain"
          />
        </TouchableOpacity>
      )}
    </View>
  );

  const renderConversationHeader = () => {
    if (!currentConversation) return null;

    return (
      <View style={styles.conversationHeader}>
        <View style={styles.authorInfo}>
          {currentConversation.author?.profileImage ? (
            <Image source={{ uri: currentConversation.author.profileImage }} style={styles.authorAvatar} />
          ) : (
            <View style={[styles.authorAvatar, { backgroundColor: colors.primaryLight }]}>
              <Ionicons name="person" size={24} color={colors.primary} />
            </View>
          )}
          <View style={styles.authorDetails}>
            <Text style={styles.authorName}>{currentConversation.author?.displayName || 'Kullanıcı'}</Text>
            <Text style={styles.conversationTime}>{formatTimeAgo(currentConversation.createdAt)}</Text>
          </View>
        </View>
        
        <Text style={styles.conversationContent}>{currentConversation.content}</Text>
        
        {currentConversation.image && (
          <TouchableOpacity
            onPress={() => handleOpenImageModal(currentConversation.image!)}
            activeOpacity={0.9}
          >
            <Image 
              source={{ uri: currentConversation.image }} 
              style={styles.conversationImage}
              contentFit="contain"
            />
          </TouchableOpacity>
        )}
        
        <View style={styles.conversationStats}>
          <TouchableOpacity 
            style={styles.statItem} 
            onPress={handleLikeConversation}
            activeOpacity={0.7}
          >
            <Ionicons 
              name={isLikedDirect ? "heart" : "heart-outline"} 
              size={20} 
              color={isLikedDirect ? colors.accent : colors.textSecondary} 
            />
            <Text style={[styles.statText, isLikedDirect && { color: colors.accent }]}>
              {currentConversation.likesCount || 0}
            </Text>
          </TouchableOpacity>
          <View style={styles.statItem}>
            <Ionicons name="chatbubble-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.statText}>{currentConversation.commentsCount || 0}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="eye-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.statText}>{currentConversation.viewsCount || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  const styles = createStyles(colors);

  if (!currentConversation) {
    return (
      <Screen style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Konuşma yükleniyor...</Text>
        </View>
      </Screen>
    );
  }

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Konuşma</Text>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="share-outline" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* Conversation and Comments */}
        <FlatList
          data={currentConversationComments || []}
          renderItem={renderComment}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderConversationHeader}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={() => (
            <View style={styles.emptyCommentsContainer}>
              <Text style={styles.emptyCommentsText}>Henüz yorum yok</Text>
              <Text style={styles.emptyCommentsSubtext}>İlk yorumu sen yap!</Text>
            </View>
          )}
        />

        {/* Comment Input */}
        <View style={styles.commentInputSection}>
          {/* Image Preview */}
          {selectedImage && (
            <View style={styles.imagePreviewContainer}>
              <Image 
                source={{ uri: selectedImage }} 
                style={styles.imagePreview}
                contentFit="cover"
              />
              <TouchableOpacity 
                style={styles.removeImageButton}
                onPress={handleRemoveImage}
              >
                <Ionicons name="close" size={16} color={colors.white} />
              </TouchableOpacity>
            </View>
          )}
          
          <View style={styles.commentInputContainer}>
            <TouchableOpacity
              style={styles.imageButton}
              onPress={handleSelectImage}
            >
              <Ionicons
                name="image-outline"
                size={20}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
            
            <TextInput
              style={[styles.commentInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Yorum yazın..."
              placeholderTextColor={colors.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
            />
            
            <TouchableOpacity
              style={[
                styles.sendButton,
                { backgroundColor: colors.primary },
                (!commentText.trim() && !selectedImage || isSubmitting) && { opacity: 0.5 },
              ]}
              onPress={handleAddComment}
              disabled={(!commentText.trim() && !selectedImage) || isSubmitting}
            >
              <Ionicons
                name={isSubmitting ? 'hourglass-outline' : 'send'}
                size={20}
                color={colors.white}
              />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Image Modal */}
      <ImageModal
        visible={imageModalVisible}
        imageUri={selectedModalImage || ''}
        onClose={handleCloseImageModal}
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
    keyboardAvoidingView: {
      flex: 1,
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
    headerTitle: {
      fontSize: 18,
      fontWeight: '600',
      color: colors.text,
    },
    headerButton: {
      padding: 8,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      fontSize: 16,
      color: colors.textSecondary,
    },
    listContainer: {
      paddingBottom: 20,
    },
    conversationHeader: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    authorInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
    },
    authorAvatar: {
      width: 40,
      height: 40,
      borderRadius: 20,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    authorDetails: {
      flex: 1,
    },
    authorName: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
    },
    conversationTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    conversationTitle: {
      fontSize: 20,
      fontWeight: '700',
      color: colors.text,
      marginBottom: 12,
    },
    conversationContent: {
      fontSize: 16,
      color: colors.text,
      lineHeight: 24,
      marginBottom: 16,
    },
    conversationStats: {
      flexDirection: 'row',
      gap: 20,
    },
    statItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statText: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    commentItem: {
      padding: 20,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    commentHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    commentAvatar: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentInfo: {
      flex: 1,
    },
    commentAuthor: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text,
    },
    commentTime: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },
    commentContent: {
      fontSize: 14,
      color: colors.text,
      lineHeight: 20,
      marginBottom: 8,
    },
    commentImage: {
      width: '100%',
      minHeight: 150,
      maxHeight: 400,
      borderRadius: 8,
      marginTop: 8,
    },
    commentInputSection: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
    },
    imagePreviewContainer: {
      padding: 16,
      paddingBottom: 8,
      position: 'relative',
    },
    imagePreview: {
      width: 80,
      height: 80,
      borderRadius: 8,
    },
    removeImageButton: {
      position: 'absolute',
      top: 20,
      right: 20,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: 'rgba(0,0,0,0.7)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    commentInputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      padding: 16,
      gap: 12,
    },
    imageButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
    },
    commentInput: {
      flex: 1,
      borderWidth: 1,
      borderRadius: 20,
      paddingHorizontal: 16,
      paddingVertical: 12,
      maxHeight: 100,
      textAlignVertical: 'top',
    },
    sendButton: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
    },
    emptyCommentsContainer: {
      padding: 40,
      alignItems: 'center',
    },
    emptyCommentsText: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    emptyCommentsSubtext: {
      fontSize: 14,
      color: colors.textSecondary,
    },
    conversationImage: {
      width: '100%',
      minHeight: 200,
      maxHeight: 400,
      borderRadius: 12,
      marginTop: 16,
      marginBottom: 8,
    },
  }); 