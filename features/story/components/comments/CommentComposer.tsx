import { useTheme } from '@/constants/theme';
import { useKeyboardLift } from '@/features/story/hooks/useKeyboardLift';
import type { User } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { createCommentsStyles } from '../../styles/commentsStyles';

type Props = {
  user: User | null;
  content: string;
  replyingToName?: string;
  submitting: boolean;
  styles: ReturnType<typeof createCommentsStyles>;
  onChange: (value: string) => void;
  onCancelReply: () => void;
  onSubmit: () => void;
};

export function CommentComposer(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const keyboard = useKeyboardLift();
  const enabled = !!props.content.trim() && !props.submitting;

  return (
    <Animated.View style={[props.styles.keyboardAvoidingView, keyboard.lift]}>
      <Animated.View style={[props.styles.commentInputContainer, keyboard.pad]}>
        {props.replyingToName && (
          <View style={props.styles.replyingToContainer}>
            <Text style={props.styles.replyingToText}>
              {t('commentsScreen.replyingTo', { name: props.replyingToName })}
            </Text>
            <TouchableOpacity onPress={props.onCancelReply}>
              <Ionicons name="close" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>
        )}
        <View style={props.styles.inputRow}>
          <View style={props.styles.inputAvatar}>
            {props.user?.profileImage ? (
              <Image source={{ uri: props.user.profileImage }} style={props.styles.inputAvatarImage} />
            ) : (
              <Ionicons name="person" size={16} color={colors.primary} />
            )}
          </View>
          <TextInput
            style={props.styles.commentInput}
            placeholder={props.replyingToName ? t('commentsScreen.replyPlaceholder') : t('commentsScreen.commentPlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={props.content}
            onChangeText={props.onChange}
            multiline
            maxLength={500}
            editable={!props.submitting}
          />
          <TouchableOpacity
            style={[props.styles.sendButton, !enabled && props.styles.sendButtonDisabled]}
            onPress={props.onSubmit}
            disabled={!enabled}
          >
            <Ionicons name="send" size={18} color={enabled ? colors.white : colors.textLight} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </Animated.View>
  );
}
