import { useTheme } from '@/constants/theme';
import type { CreateConversationStyles } from '@/features/conversation/styles/createConversationStyles';
import { Ionicons } from '@expo/vector-icons';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ConversationImageField } from './ConversationImageField';

type Props = {
  announce: boolean;
  content: string;
  image: string | null;
  styles: CreateConversationStyles;
  title: string;
  onContentChange: (value: string) => void;
  onImagePick: () => void;
  onImageRemove: () => void;
  onTitleChange: (value: string) => void;
  onToggleAnnounce: () => void;
};

export const CreateConversationForm = memo(function CreateConversationForm(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const tips = [
    ['bulb-outline', t('conversations.tip1')],
    ['heart-outline', t('conversations.tip2')],
    ['chatbubble-outline', t('conversations.tip3')],
  ] as const;
  return (
    <ScrollView style={props.styles.content} contentContainerStyle={props.styles.scrollContent} showsVerticalScrollIndicator={false}>
      <View style={props.styles.inputContainer}>
        <Text style={props.styles.inputLabel}>{t('conversations.titleLabel')}</Text>
        <TextInput
          style={[props.styles.titleInput, { color: colors.text, borderColor: colors.border }]}
          placeholder={t('conversations.titlePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={props.title}
          onChangeText={props.onTitleChange}
          maxLength={100}
          multiline
        />
        <Text style={props.styles.characterCount}>{props.title.length}/100</Text>
      </View>
      <View style={props.styles.inputContainer}>
        <Text style={props.styles.inputLabel}>{t('conversations.contentLabel')}</Text>
        <TextInput
          style={[props.styles.contentInput, { color: colors.text, borderColor: colors.border }]}
          placeholder={t('conversations.contentPlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={props.content}
          onChangeText={props.onContentChange}
          multiline
        />
      </View>
      <ConversationImageField image={props.image} styles={props.styles} onPick={props.onImagePick} onRemove={props.onImageRemove} />
      <View style={props.styles.announceContainer}>
        <TouchableOpacity style={props.styles.announceButton} onPress={props.onToggleAnnounce} activeOpacity={0.7}>
          <View style={props.styles.announceCheckbox}>
            <Ionicons name={props.announce ? 'checkbox' : 'square-outline'} size={20} color={props.announce ? colors.primary : colors.textSecondary} />
          </View>
          <View style={props.styles.announceTextContainer}>
            <Text style={props.styles.announceTitle}>{t('conversations.announceTitle')}</Text>
            <Text style={props.styles.announceSubtitle}>{t('conversations.announceSubtitle')}</Text>
          </View>
        </TouchableOpacity>
      </View>
      <View style={props.styles.tipsContainer}>
        <Text style={props.styles.tipsTitle}>{t('conversations.tipsTitle')}</Text>
        {tips.map(([icon, text]) => (
          <View key={icon} style={props.styles.tipItem}>
            <Ionicons name={icon} size={16} color={colors.primary} />
            <Text style={props.styles.tipText}>{text}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
});
