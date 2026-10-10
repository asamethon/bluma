import { Button, Text } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { StyleSheet, View } from 'react-native';
import type { LaunchTarget } from '../types';

type Props = {
  ready: boolean;
  sharing: LaunchTarget | null;
  onShare: (target: LaunchTarget) => void;
};

export function LaunchShareActions({ ready, sharing, onShare }: Props) {
  const { t } = useTranslation();
  return (
    <View style={styles.root}>
      <Text variant="overline" tone="textLight">{t('launch.shareWhere')}</Text>
      <Button
        label={t('launch.instagramStory')}
        icon="logo-instagram"
        fullWidth
        loading={sharing === 'instagramStory'}
        disabled={!ready || (!!sharing && sharing !== 'instagramStory')}
        onPress={() => onShare('instagramStory')}
      />
      <View style={styles.row}>
        <Button
          label={t('launch.instagramPost')}
          icon="grid-outline"
          variant="outline"
          loading={sharing === 'instagramPost'}
          disabled={!ready || (!!sharing && sharing !== 'instagramPost')}
          style={styles.button}
          onPress={() => onShare('instagramPost')}
        />
        <Button
          label={t('launch.message')}
          icon="paper-plane-outline"
          variant="outline"
          loading={sharing === 'message'}
          disabled={!ready || (!!sharing && sharing !== 'message')}
          style={styles.button}
          onPress={() => onShare('message')}
        />
      </View>
      <Text variant="caption" tone="textLight" center>
        {t('launch.linkHint')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: Spacing.md },
  row: { flexDirection: 'row', gap: Spacing.md },
  button: { flex: 1 },
});
