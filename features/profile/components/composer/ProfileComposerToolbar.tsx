import { IconButton, Text } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { composerStyles as styles } from '../../styles/composerStyles';

type Props = {
  length: number;
  maxLength: number;
  /** Sayaç ancak sınıra yaklaşınca görünür. */
  counterFrom: number;
  onPickImage: () => void;
};

/** Klavyenin üstünde duran ince araç çubuğu: görsel ekleme + kalan karakter. */
export const ProfileComposerToolbar = memo(function ProfileComposerToolbar(props: Props) {
  const { colors, borders } = useTheme();
  const { t } = useTranslation();
  return (
    <View style={[styles.toolbar, { borderTopWidth: borders.hair, borderTopColor: colors.divider }]}>
      <IconButton
        icon="image-outline"
        size={38}
        iconSize={20}
        accessibilityLabel={t('profileScreen.addPhoto')}
        onPress={props.onPickImage}
      />
      {props.length > props.counterFrom && (
        <Text variant="caption" tone="textLight" style={styles.counter}>
          {`${props.maxLength - props.length} / ${props.maxLength}`}
        </Text>
      )}
    </View>
  );
});
