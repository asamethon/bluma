import { Sheet } from '@/components/ui';
import { reportSheetStyles as styles } from '@/features/moderation/styles/reportSheetStyles';
import { useTheme } from '@/constants/theme';
import { moderationActions, REPORT_REASONS, ReportReason, ReportTargetType } from '@/store/moderationStore';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity } from 'react-native';

interface ReportTarget {
  type: ReportTargetType;
  targetId: string;
  reportedUserId?: string;
  contextId?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  target: ReportTarget | null;
  onReported?: () => void;
}

const TARGET_LABEL: Record<ReportTargetType, string> = {
  story: 'report.targetStory',
  comment: 'report.targetComment',
  user: 'report.targetUser',
  conversation: 'report.targetConversation',
};

export default function ReportSheet({ visible, onClose, target, onReported }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const reset = () => { setReason(null); setDetails(''); setSubmitting(false); };
  const close = () => { reset(); onClose(); };

  const submit = async () => {
    if (!target || !reason || submitting) return;
    setSubmitting(true);
    const r = await moderationActions.reportContent({
      type: target.type,
      targetId: target.targetId,
      reason,
      details: details.trim(),
      reportedUserId: target.reportedUserId,
      contextId: target.contextId,
    });
    setSubmitting(false);
    if (r.success) {
      close();
      onReported?.();
      Alert.alert(t('report.thanksTitle'), t('report.thanksMessage'));
    } else {
      Alert.alert(t('common.error'), r.error || t('report.submitFailed'));
    }
  };

  return (
    <Sheet visible={visible} onClose={close} contentStyle={styles.body}>
      <Text style={[styles.title, { color: colors.text }]}>
        {target ? t(TARGET_LABEL[target.type]) : t('report.report')}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {t('report.pickReason')}
      </Text>

      <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
        {REPORT_REASONS.map(r => {
          const active = reason === r.value;
          return (
            <TouchableOpacity
              key={r.value}
              style={[
                styles.reasonRow,
                { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : 'transparent' },
              ]}
              onPress={() => setReason(r.value)}
            >
              <Text style={[styles.reasonText, { color: active ? colors.primary : colors.text }]}>{t(r.label)}</Text>
              <Ionicons
                name={active ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={active ? colors.primary : colors.textLight}
              />
            </TouchableOpacity>
          );
        })}

        <TextInput
          style={[styles.details, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          value={details}
          onChangeText={setDetails}
          placeholder={t('report.detailsPlaceholder')}
          placeholderTextColor={colors.textLight}
          multiline
          maxLength={500}
          textAlignVertical="top"
        />
      </ScrollView>

      <TouchableOpacity
        style={[styles.submit, { backgroundColor: reason ? colors.primary : colors.border }]}
        onPress={submit}
        disabled={!reason || submitting}
      >
        {submitting
          ? <ActivityIndicator color="#fff" />
          : <Text style={styles.submitText}>{t('report.report')}</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancel} onPress={close}>
        <Text style={[styles.cancelText, { color: colors.textSecondary }]}>{t('common.cancel')}</Text>
      </TouchableOpacity>
    </Sheet>
  );
}
