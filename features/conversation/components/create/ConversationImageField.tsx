import { useTheme } from '@/constants/theme';
import type { CreateConversationStyles } from '@/features/conversation/styles/createConversationStyles';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, TouchableOpacity, View } from 'react-native';

type Props = { image: string | null; styles: CreateConversationStyles; onPick: () => void; onRemove: () => void };

export const ConversationImageField = memo(function ConversationImageField(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={props.styles.inputContainer}>
      <Text style={props.styles.inputLabel}>{t('conversations.imageOptional')}</Text>
      {props.image ? (
        <View style={props.styles.imagePreviewContainer}>
          <Image source={{ uri: props.image }} style={props.styles.imagePreview} contentFit="cover" />
          <TouchableOpacity style={props.styles.removeImageButton} onPress={props.onRemove}>
            <Ionicons name="close-circle" size={24} color={colors.accent} />
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity style={[props.styles.imageSelectButton, { borderColor: colors.border }]} onPress={props.onPick}>
          <Ionicons name="image-outline" size={24} color={colors.textSecondary} />
          <Text style={[props.styles.imageSelectText, { color: colors.textSecondary }]}>{t('conversations.addImage')}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
});
