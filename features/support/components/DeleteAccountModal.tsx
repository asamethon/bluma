import { Button, PageHeader, Screen, Text, TextField } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, View } from 'react-native';
import { createDeleteAccountStyles } from '../styles/deleteAccountStyles';

type Props = {
  visible: boolean;
  password: string;
  deleting: boolean;
  onPassword: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

export function DeleteAccountModal(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createDeleteAccountStyles(colors), [colors]);

  return (
    <Modal visible={props.visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={props.onClose}>
      <Screen style={styles.container}>
        <PageHeader
          title={t('help.deleteAccount')}
          onBack={props.onClose}
          right={<View style={{ width: 38 }} />}
        />
        <View style={styles.content}>
          <View style={styles.warning}>
            <Ionicons name="warning-outline" size={20} color={colors.warning} />
            <View style={styles.warningCopy}>
              <Text variant="bodyStrong" color={colors.warning}>{t('help.warningTitle')}</Text>
              <Text variant="caption" tone="textSecondary">{t('help.warningText')}</Text>
            </View>
          </View>

          <TextField
            label={t('help.enterPasswordLabel')}
            placeholder={t('help.passwordPlaceholder')}
            value={props.password}
            onChangeText={props.onPassword}
            secureTextEntry
            autoFocus
            containerStyle={styles.field}
          />

          <Button
            label={t(props.deleting ? 'help.deleting' : 'help.deletePermanently')}
            variant="danger"
            size="lg"
            fullWidth
            loading={props.deleting}
            disabled={props.deleting || !props.password.trim()}
            onPress={props.onSubmit}
          />
        </View>
      </Screen>
    </Modal>
  );
}
