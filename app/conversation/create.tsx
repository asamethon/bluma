import { imageUploadService } from '@/services/imageUploadService';
import { conversationActions } from '@/store/conversationStore';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
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
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import { useAppSelector } from '@/store/hooks';
import { logger } from '@/utils/logger';

export default function CreateConversationScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const router = useRouter();
  const currentUser = useAppSelector(s => s.auth.user);

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
      logger.error('Error selecting image:', error);
      Alert.alert(t('common.error'), t('imageUpload.pickError'));
    }
  };

  const handleRemoveImage = () => {
    setSelectedImage(null);
  };

  const handleCreateConversation = async () => {
    if (!currentUser?.id) {
      Alert.alert(t('common.error'), t('errors.userNotFound'));
      return;
    }

    if (!title.trim()) {
      Alert.alert(t('common.error'), t('conversations.enterTitle'));
      return;
    }

    if (!content.trim()) {
      Alert.alert(t('common.error'), t('conversations.enterContent'));
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
        logger.debug('Conversation created successfully:', result.conversationId);
        
        if (announceToFollowers && result.conversationId) {
          try {
            await conversationActions.announceConversationToFollowers(result.conversationId, currentUser);
            logger.debug('Announcement sent to followers');
          } catch (error) {
            logger.error('Error sending announcement to followers:', error);
          }
        }
        
        Alert.alert(
          t('common.success'),
          announceToFollowers
            ? t('conversations.createdAnnounced')
            : t('conversations.created'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                router.back();
                if (currentUser?.id) {
                  conversationActions.getUserConversations(currentUser.id);
                }
              },
            },
          ]
        );
      } else {
        Alert.alert(t('common.error'), result.error || t('conversations.createFailed'));
      }
    } catch (error) {
      logger.error('Create conversation error:', error);
      Alert.alert(t('common.error'), t('conversations.createFailed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (title.trim() || content.trim()) {
      Alert.alert(
        t('conversations.exitTitle'),
        t('conversations.exitConfirm'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          { text: t('conversations.exit'), style: 'destructive', onPress: () => router.back() },
        ]
      );
    } else {
      router.back();
    }
  };

  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Screen style={styles.container} maxContentWidth={ContentMaxWidth.content}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={handleCancel}>
            <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>
              {t('common.cancel')}
            </Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('conversations.startConversation')}</Text>
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
              {isSubmitting ? t('conversations.creating') : t('messages.share')}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('conversations.titleLabel')}</Text>
            <TextInput
              style={[styles.titleInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={t('conversations.titlePlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
              maxLength={100}
              multiline
            />
            <Text style={styles.characterCount}>{title.length}/100</Text>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('conversations.contentLabel')}</Text>
            <TextInput
              style={[styles.contentInput, { color: colors.text, borderColor: colors.border }]}
              placeholder={t('conversations.contentPlaceholder')}
              placeholderTextColor={colors.textSecondary}
              value={content}
              onChangeText={setContent}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>{t('conversations.imageOptional')}</Text>
            
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
                  {t('conversations.addImage')}
                </Text>
              </TouchableOpacity>
            )}
          </View>

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
                <Text style={styles.announceTitle}>{t('conversations.announceTitle')}</Text>
                <Text style={styles.announceSubtitle}>
                  {t('conversations.announceSubtitle')}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.tipsContainer}>
            <Text style={styles.tipsTitle}>{t('conversations.tipsTitle')}</Text>
            <View style={styles.tipItem}>
              <Ionicons name="bulb-outline" size={16} color={colors.primary} />
              <Text style={styles.tipText}>{t('conversations.tip1')}</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="heart-outline" size={16} color={colors.primary} />
              <Text style={styles.tipText}>{t('conversations.tip2')}</Text>
            </View>
            <View style={styles.tipItem}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.primary} />
              <Text style={styles.tipText}>{t('conversations.tip3')}</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

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
      fontSize: 18, lineHeight: 23,
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
      fontSize: 16, lineHeight: 21,
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
      fontSize: 16, lineHeight: 21,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 8,
    },
    titleInput: {
      fontSize: 20, lineHeight: 26,
      fontWeight: '600',
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      minHeight: 60,
      textAlignVertical: 'top',
    },
    contentInput: {
      fontSize: 16, lineHeight: 21,
      borderWidth: 1,
      borderRadius: 12,
      padding: 16,
      minHeight: 200,
      textAlignVertical: 'top',
    },
    characterCount: {
      fontSize: 12, lineHeight: 16,
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
      fontSize: 16, lineHeight: 21,
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
      fontSize: 16, lineHeight: 21,
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
      fontSize: 16, lineHeight: 21,
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
      fontSize: 14, lineHeight: 18,
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
      fontSize: 16, lineHeight: 21,
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
