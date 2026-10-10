import { useTheme } from '@/constants/theme';
import { readingListStyles as styles } from '@/features/library/styles/readingListStyles';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { TextInput, TouchableOpacity, View } from 'react-native';

type Props = { value: string; onChange: (value: string) => void; onSubmit: () => void };

export function CreateListRow({ value, onChange, onSubmit }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.createRow}>
      <TextInput
        style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface }]}
        value={value}
        onChangeText={onChange}
        placeholder={t('lists.newListPlaceholder')}
        placeholderTextColor={colors.textLight}
        autoFocus
        maxLength={60}
        onSubmitEditing={onSubmit}
        returnKeyType="done"
      />
      <TouchableOpacity style={[styles.createBtn, { backgroundColor: colors.primary }]} onPress={onSubmit}>
        <Ionicons name="checkmark" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );
}
