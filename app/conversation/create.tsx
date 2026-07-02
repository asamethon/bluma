import { imageUploadService } from '@/services/imageUploadService';
import { pushNotificationService } from '@/services/pushNotificationService';
import { authState$ } from '@/store/authStore';
import { conversationActions } from '@/store/conversationStore';
import { Ionicons } from '@expo/vector-icons';
import { observer } from '@legendapp/state/react';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Screen } from '@/components/ui';
import { useTheme } from '@/constants/theme';

export default observer(function CreateConversationScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const currentUser = authState$.user.get();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [announceToFollowers, setAnnounceToFollowers] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const handleSelectImage = async () => {
    try {
      const imageUri = await imageUploadService.pickCommentImage();
      if (imageUri) {
        const processedImage = await imageUploadService.uploadCommentImage(imageUri);
        setSelectedImage(processedImage);
      }
    } catch (error) {
      console.error('Error selecting image:', error);
      Alert.alert('Hata', 'Resim seçilirken bir hata oluştu.');
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleCreateConversation = async () => {
    if (!currentUser?.id) {
      Alert.alert('Hata', 'Kullanıcı bilgileri bulunamadı.');
      return;
    }

    if (!title.trim()) {
      Alert.alert('Hata', 'Lütfen konuşma başlığı girin.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Hata', 'Lütfen konuşma içeriği girin.');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await conversationActions.createConversation({
        authorId: currentUser.id,
        author: currentUser,
        title: title.trim(),
        content: content.trim(),
        image: selectedImage || undefined,
        isActive: true,
      });

      if (result.success) {
        console.log('Conversation created successfully:', result.conversationId);
        
        // Send notification to followers if announced
        if (announceToFollowers && result.conversationId) {
          try {
            await conversationActions.announceConversationToFollowers(result.conversationId, currentUser);
            console.log('Announcement sent to followers');
          } catch (error) {
            console.error('Error sending announcement to followers:', error);
          }
        }
        
        Alert.alert(
          'Başarılı',
          announceToFollowers 
            ? 'Konuşma başarıyla oluşturuldu ve takipçilerinize duyuruldu!' 
            : 'Konuşma başarıyla oluşturuldu!',
          [
            {
              text: 'Tamam',
              onPress: () => {
                router.back();
                // Force refresh user conversations
                if (currentUser?.id) {
                  conversationActions.getUserConversations(currentUser.id);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert('Hata', result.error || 'Konuşma oluşturulurken bir hata oluştu.');
      }
    } catch (error) {
      console.error('Create conversation error:', error);
      Alert.alert('Hata', 'Konuşma oluşturulurken bir hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        'Çıkış',
        'Değişiklikleriniz kaydedilmeyecek. Çıkmak istediğinizden emin misiniz?',
        [
          { text: 'İptal', style: 'cancel' },
          { text: 'Çık', style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const styles = createStyles(colors);

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
            <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>
              İptal
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Konuşma Başlat</Text>
          <TouchableOpacity
            style={[
              styles.headerButton,
              (!title.trim() || !content.trim() || isSubmitting) && styles.headerButtonDisabled,
            ]}
            onPress={handleCreateConversation}
            disabled={!title.trim() || !content.trim() || isSubmitting}
          >
            <Text
              style={[
                styles.headerButtonText,
                { color: colors.primary },
                (!title.trim() || !content.trim() || isSubmitting) && { color: colors.textSecondary },
              ]}
            >
              {isSubmitting ? 'Oluşturuluyor...' : 'Paylaş'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Başlık</Text>
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Konuşma başlığını girin..."
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              multiline
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          {/* Content Input */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>İçerik</Text>
            <TextInput
              style={[styles.contentInput, { color: colors.text, borderColor: colors.border }]}
              placeholder="Ne düşünüyorsun? Takipçilerinle paylaş..."
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Image Selection */}
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Resim (Opsiyonel)</Text>
            
            {selectedImage ? (
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
                  <Ionicons name="close-circle" size={24} color={colors.accent} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={[styles.imageSelectButton, { borderColor: colors.border }]}
                onPress={handleSelectImage}
              >
                <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
                <Text style={[styles.imageSelectText, { color: colors.textSecondary }]}>
                  Resim Ekle
                </Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Announce to Followers Option */}
          <View style={styles.announceContainer}>
            <TouchableOpacity
              style={styles.announceButton}
              onPress={() => setAnnounceToFollowers(!announceToFollowers)}
              activeOpacity={0.7}
            >
              <View style={styles.announceCheckbox}>
                <Ionicons
                  name={announceToFollowers ? "checkbox" : "square-outline"}
                  size={20}
                  color={announceToFollowers ? colors.primary : colors.textSecondary}
                />
              </View>
              <View style={styles.announceTextContainer}>
                <Text style={styles.announceTitle}>Bunu duyur</Text>
                <Text style={styles.announceSubtitle}>
                  Takipçilerinize bu konuşmayı başlattığınıza dair bildirim gönder
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Tips */}
          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>İpuçları:</Text>
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={16} color={colors.primary} />
              <Text style={styles.tipText}>Takipçilerinle etkileşim kurmak için sorular sorun</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="heart-outline" size={16} color={colors.primary} />
              <Text style={styles.tipText}>Güncel konular hakkında düşüncelerinizi paylaşın</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
              <Text style={styles.tipText}>Takipçilerinizin yorum yapmasını teşvik edin</Text>
            </View>
          </View>

          {/* Debug Section */}
          {__DEV__ && (
            <View style={styles.debugContainer}>
              <Text style={styles.debugTitle}>Debug (Sadece Geliştirme)</Text>
              <TouchableOpacity
                style={styles.debugButton}
                onPress={async () => {
                  if (currentUser?.id) {
                    console.log('Testing push notification for user:', currentUser.id);
                    const result = await pushNotificationService.sendNotificationToUser(
                      currentUser.id,
                      'Test Bildirimi',
                      'Bu bir test bildirimidir!',
                      { test: true }
                    );
                    console.log('Test push notification result:', result);
                    Alert.alert('Test Sonucu', `Push notification gönderildi: ${result}`);
                  }
                }}
              >
                <Text style={styles.debugButtonText}>Test Push Notification</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
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
      paddingVertical: 8,
      paddingHorizontal: 12,
    },
    headerButtonDisabled: {
      opacity: 0.5,
    },
    headerButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    content: {
      flex: 1,
      paddingHorizontal: 20,
    },
    inputContainer: {
      marginTop: 24,
    },
    inputLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    titleInput: {
      fontSize: 20,
      fontWeight: '600',
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    contentInput: {
      fontSize: 16,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      minHeight: 200,
      textAlignVertical: 'top',
    },
    characterCount: {
      fontSize: 12,
      color: colors.textSecondary,
      textAlign: 'right',
      marginTop: 4,
    },
    tipsContainer: {
      marginTop: 32,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
    },
    tipsTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    tipItem: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      marginBottom: 8,
      gap: 8,
    },
    tipText: {
      fontSize: 14,
      color: colors.textSecondary,
      flex: 1,
      lineHeight: 20,
    },
    announceContainer: {
      marginTop: 24,
    },
    announceButton: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    announceCheckbox: {
      marginRight: 12,
    },
    announceTextContainer: {
      flex: 1,
    },
    announceTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 4,
    },
    announceSubtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 20,
    },
    debugContainer: {
      marginTop: 24,
      padding: 16,
      backgroundColor: colors.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    debugTitle: {
      fontSize: 16,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 12,
    },
    debugButton: {
      backgroundColor: colors.primary,
      padding: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    debugButtonText: {
      color: colors.background,
      fontSize: 14,
      fontWeight: '600',
    },
    imageSelectButton: {
      borderWidth: 2,
      borderStyle: 'dashed',
      borderRadius: 12,
      padding: 24,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 8,
    },
    imageSelectText: {
      fontSize: 16,
      fontWeight: '500',
      marginTop: 8,
    },
    imagePreviewContainer: {
      position: 'relative',
      marginTop: 8,
      borderRadius: 12,
      overflow: 'hidden',
    },
    imagePreview: {
      width: '100%',
      height: 200,
      borderRadius: 12,
    },
    removeImageButton: {
      position: 'absolute',
      top: 12,
      right: 12,
      backgroundColor: 'rgba(255, 255, 255, 0.9)',
      borderRadius: 12,
      padding: 4,
    },
  }); 