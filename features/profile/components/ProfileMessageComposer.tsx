import { Avatar, IconButton, ListRow, Screen, Switch } from '@/components/ui';
import { ContentMaxWidth, useTheme } from '@/constants/theme';
import { MentionSuggestions } from '@/features/mentions/components/MentionSuggestions';
import type { User } from '@/types';
import { Image } from 'expo-image';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Modal, Platform, ScrollView, TextInput, View } from 'react-native';
import { useProfileMessageComposer } from '../hooks/useProfileMessageComposer';
import { composerStyles as styles } from '../styles/composerStyles';
import { ProfileComposerHeader } from './composer/ProfileComposerHeader';
import { ProfileComposerToolbar } from './composer/ProfileComposerToolbar';

const MAX_LENGTH = 500;
/** Sayaç ancak sınır yaklaşınca görünür; boş alanda sayı gürültüdür. */
const COUNTER_FROM = 400;

type Props = {
  visible: boolean;
  user: User;
  /** Verilirse gönderi bu kişinin panosuna bırakılır. */
  boardOwner?: User;
  onClose: () => void;
};

export function ProfileMessageComposer({ visible, user, boardOwner, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const composer = useProfileMessageComposer(user, boardOwner, onClose);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={composer.close}>
      <Screen style={{ flex: 1, backgroundColor: colors.background }} maxContentWidth={ContentMaxWidth.content}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ProfileComposerHeader
            boardOwnerName={boardOwner ? (boardOwner.displayName || boardOwner.username) : undefined}
            canPost={composer.canPost}
            posting={composer.posting}
            onCancel={composer.close}
            onPost={composer.post}
          />
          <ScrollView style={styles.flex} keyboardShouldPersistTaps="handled">
            <View style={styles.body}>
              <Avatar uri={user.profileImage} name={user.displayName} size={36} />
              <TextInput
                style={[styles.input, { color: colors.text }]}
                placeholder={t(boardOwner ? 'profileScreen.boardMessagePlaceholder' : 'profileScreen.messagePlaceholder')}
                placeholderTextColor={colors.textLight}
                value={composer.content}
                onChangeText={composer.setContent}
                multiline autoFocus maxLength={MAX_LENGTH}
              />
            </View>
            <MentionSuggestions suggestions={composer.mentions.suggestions} onSelect={composer.mentions.select} />
            {composer.image && (
              <View style={styles.preview}>
                <Image
                  source={{ uri: composer.image }}
                  style={[styles.previewImage, { backgroundColor: colors.surfaceVariant }]}
                  contentFit="cover"
                />
                <IconButton
                  icon="close"
                  variant="sunk"
                  size={32}
                  iconSize={18}
                  accessibilityLabel={t('common.delete')}
                  onPress={composer.removeImage}
                  style={styles.previewRemove}
                />
              </View>
            )}
            {/* Başkasının panosuna bırakılan gönderide duyuru seçeneği yok. */}
            {!boardOwner && (
              <View style={styles.announce}>
                <ListRow
                  icon="megaphone-outline"
                  title={t('profileScreen.announceToFollowers')}
                  subtitle={t('profileScreen.announceToFollowersSub')}
                  showChevron={false}
                  divider={false}
                  right={<Switch checked={composer.notify} onChange={composer.toggleNotify} />}
                />
              </View>
            )}
          </ScrollView>
          <ProfileComposerToolbar
            length={composer.content.length}
            maxLength={MAX_LENGTH}
            counterFrom={COUNTER_FROM}
            onPickImage={composer.pickImage}
          />
        </KeyboardAvoidingView>
      </Screen>
    </Modal>
  );
}
