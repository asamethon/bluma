import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { TextInput, TouchableOpacity, View } from 'react-native';
import { createConversationDetailStyles } from '../styles/conversationDetailStyles';

type Props = {
  text: string;
  image: string | null;
  submitting: boolean;
  styles: ReturnType<typeof createConversationDetailStyles>;
  onChange: (value: string) => void;
  onPickImage: () => void;
  onRemoveImage: () => void;
  onSubmit: () => void;
};

export function ConversationCommentComposer(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const disabled = (!props.text.trim() && !props.image) || props.submitting;
  return (
    <View style={props.styles.commentInputSection}>
      {props.image && (
        <View style={props.styles.imagePreviewContainer}>
          <Image source={{ uri: props.image }} style={props.styles.imagePreview} contentFit="cover" />
          <TouchableOpacity style={props.styles.removeImageButton} onPress={props.onRemoveImage}>
            <Ionicons name="close" size={16} color={colors.white} />
          </TouchableOpacity>
        </View>
      )}
      <View style={props.styles.commentInputContainer}>
        <TouchableOpacity style={props.styles.imageButton} onPress={props.onPickImage}>
          <Ionicons name="image-outline" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
        <TextInput
          style={[props.styles.commentInput, { color: colors.text, borderColor: colors.border }]}
          placeholder={t('comments.placeholder')}
          placeholderTextColor={colors.textSecondary}
          value={props.text}
          onChangeText={props.onChange}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[props.styles.sendButton, { backgroundColor: colors.primary }, disabled && props.styles.disabled]}
          onPress={props.onSubmit}
          disabled={disabled}
        >
          <Ionicons name={props.submitting ? 'hourglass-outline' : 'send'} size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
