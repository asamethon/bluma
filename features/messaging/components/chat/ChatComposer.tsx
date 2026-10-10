import { MenuButton, Text, type MenuItem } from '@/components/ui';
import { alpha, useTheme } from '@/constants/theme';
import type { ChatStyles } from '@/features/messaging/styles/chatStyles';
import type { DirectMessage, MessageReply } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, Pressable, TextInput, View } from 'react-native';
import { ComposerReplyBar } from './ComposerReplyBar';
import { VoiceRecordingBar } from './VoiceRecordingBar';

type Props = {
  blocked: boolean;
  canSend: boolean;
  draft: string;
  isSending: boolean;
  editing: DirectMessage | null;
  otherName?: string;
  replyTo: MessageReply | null;
  replyAuthor: string;
  selectedImage: string | null;
  recording: boolean;
  recordingMs: number;
  styles: ChatStyles;
  viewOnce: boolean;
  onCancelEdit: () => void;
  onCancelRecording: () => void;
  onCancelReply: () => void;
  onDraftChange: (value: string) => void;
  onImagePick: () => void;
  onImageRemove: () => void;
  onOpenGifs: () => void;
  onTakePhoto: () => void;
  onSend: () => void;
  onSendRecording: () => void;
  onStartRecording: () => void;
  onToggleViewOnce: () => void;
};

export const ChatComposer = memo(function ChatComposer(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const attachments: MenuItem[] = [
    { id: 'library', label: t('messages.attachPhoto'), symbol: 'photo', onPress: props.onImagePick },
    { id: 'camera', label: t('messages.attachCamera'), symbol: 'camera', onPress: props.onTakePhoto },
    { id: 'gif', label: t('messages.attachGif'), symbol: 'play.rectangle', onPress: props.onOpenGifs },
  ];

  return (
    <>
      {props.editing ? (
        <ComposerReplyBar
          text={props.editing.text}
          label={t('messages.editingMessage')}
          styles={props.styles}
          onCancel={props.onCancelEdit}
        />
      ) : props.replyTo ? (
        <ComposerReplyBar
          text={props.replyTo.text}
          label={t('messages.replyingTo', { name: props.replyAuthor })}
          styles={props.styles}
          onCancel={props.onCancelReply}
        />
      ) : null}
      {props.selectedImage ? (
        <View style={props.styles.previewArea}>
          <View style={props.styles.preview}>
            <Image source={{ uri: props.selectedImage }} style={props.styles.previewImage} contentFit="cover" />
            <Pressable onPress={props.onImageRemove} style={props.styles.previewRemove}>
              <Ionicons name="close" size={14} color="#fff" />
            </Pressable>
          </View>
          {/* Tek seferlik: alıcı fotoğrafı bir kez açar, sonra iki tarafta da kapanır. */}
          <Pressable
            onPress={props.onToggleViewOnce}
            accessibilityRole="switch"
            accessibilityState={{ checked: props.viewOnce }}
            style={[
              props.styles.viewOnceToggle,
              {
                borderColor: props.viewOnce ? colors.primary : colors.border,
                backgroundColor: props.viewOnce ? alpha(colors.primary, 0.1) : 'transparent',
              },
            ]}
          >
            <Ionicons
              name={props.viewOnce ? 'flame' : 'flame-outline'}
              size={16}
              color={props.viewOnce ? colors.primary : colors.textLight}
            />
            <Text variant="label" color={props.viewOnce ? colors.primary : colors.textSecondary}>
              {t('messages.viewOnceTitle')}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {props.recording ? (
        <VoiceRecordingBar
          durationMs={props.recordingMs}
          styles={props.styles}
          onCancel={props.onCancelRecording}
          onSend={props.onSendRecording}
        />
      ) : props.blocked ? (
        <View style={props.styles.blocked}>
          <Ionicons name="lock-closed-outline" size={18} color={colors.textLight} />
          <Text variant="caption" tone="textSecondary" style={props.styles.blockedText}>
            {t('privacy.messagesOff', { name: props.otherName || t('common.user') })}
          </Text>
        </View>
      ) : (
        <View style={props.styles.composer}>
          <View style={[props.styles.roundButton, { backgroundColor: colors.surfaceVariant }]}>
            <MenuButton
              icon="add"
              size={42}
              iconSize={23}
              glass={false}
              color={colors.textLight}
              accessibilityLabel={t('messages.attach')}
              items={attachments}
            />
          </View>
          <View style={props.styles.inputShell}>
            <TextInput
              value={props.draft}
              onChangeText={props.onDraftChange}
              placeholder={t('messages.composerPlaceholder')}
              placeholderTextColor={colors.textLight}
              multiline
              style={[props.styles.input, { paddingVertical: Platform.OS === 'ios' ? 12 : 8 }]}
            />
          </View>
          {/* Yazacak bir şey yoksa gönder tuşunun yerinde mikrofon durur. */}
          <Pressable
            onPress={props.canSend ? props.onSend : props.onStartRecording}
            disabled={props.isSending}
            accessibilityRole="button"
            accessibilityLabel={props.canSend ? t('messages.send') : t('messages.recordVoice')}
            style={[props.styles.roundButton, { backgroundColor: props.canSend ? colors.primary : colors.surfaceVariant }]}
          >
            <Ionicons
              name={props.isSending ? 'hourglass-outline' : props.canSend ? 'arrow-up' : 'mic'}
              size={19}
              color={props.canSend ? colors.onPrimary : colors.textLight}
            />
          </Pressable>
        </View>
      )}
    </>
  );
});
