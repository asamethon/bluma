import { Divider, ListRow, Sheet } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { BoardPostPolicy } from '@/features/privacy/types';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

const OPTIONS: { value: BoardPostPolicy; label: string }[] = [
  { value: 'everyone', label: 'privacy.boardPostsEveryone' },
  { value: 'following', label: 'privacy.boardPostsFollowing' },
  { value: 'nobody', label: 'privacy.boardPostsNobody' },
];

type Props = {
  value: BoardPostPolicy;
  disabled?: boolean;
  onChange: (value: BoardPostPolicy) => void;
};

/** "Panoma kimler yazabilir" — tek satır, seçenekler alt sayfada. */
export function BoardPostPolicyRow({ value, disabled, onChange }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const current = OPTIONS.find(option => option.value === value) ?? OPTIONS[0];

  return (
    <>
      <ListRow
        icon="create-outline"
        title={t('privacy.boardPosts')}
        subtitle={t('privacy.boardPostsSub')}
        value={t(current.label)}
        showChevron
        disabled={disabled}
        onPress={() => setOpen(true)}
      />
      <Sheet visible={open} onClose={() => setOpen(false)} title={t('privacy.boardPosts')}>
        <View>
          {OPTIONS.map((option, index) => (
            <View key={option.value}>
              <ListRow
                title={t(option.label)}
                right={option.value === value
                  ? <Ionicons name="checkmark" size={20} color={colors.primary} />
                  : undefined}
                onPress={() => {
                  setOpen(false);
                  if (option.value !== value) onChange(option.value);
                }}
              />
              {index < OPTIONS.length - 1 && <Divider />}
            </View>
          ))}
        </View>
      </Sheet>
    </>
  );
}
