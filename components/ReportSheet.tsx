import { Radius, Spacing, useTheme } from '@/constants/theme';
import {
  moderationActions,
  REPORT_REASONS,
  ReportReason,
  ReportTargetType,
} from '@/store/moderationStore';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  story: 'Hikâyeyi bildir',
  comment: 'Yorumu bildir',
  user: 'Kullanıcıyı bildir',
  conversation: 'Gönderiyi bildir',
};

export default function ReportSheet({ visible, onClose, target, onReported }: Props) {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
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
      Alert.alert('Teşekkürler', 'Bildirimin alındı. Ekibimiz en kısa sürede inceleyecek.');
    } else {
      Alert.alert('Hata', r.error || 'Bildirim gönderilemedi.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" statusBarTranslucent onRequestClose={close}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={[styles.sheet, { backgroundColor: colors.surface, paddingBottom: bottom + 16 }]}>
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <Text style={[styles.title, { color: colors.text }]}>
            {target ? TARGET_LABEL[target.type] : 'Bildir'}
          </Text>
          <Text style={[styles.sub, { color: colors.textSecondary }]}>
            Bir neden seç. Bildirimin gizli tutulur.
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
                  <Text style={[styles.reasonText, { color: active ? colors.primary : colors.text }]}>{r.label}</Text>
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
              placeholder="İstersen ek bilgi ekle (opsiyonel)"
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
              : <Text style={styles.submitText}>Bildir</Text>}
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancel} onPress={close}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Vazgeç</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)' },
  sheet: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 10,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 2, marginBottom: 14 },
  title: { fontSize: 19, lineHeight: 25, fontWeight: '700', textAlign: 'center' },
  sub: { fontSize: 13, lineHeight: 17, textAlign: 'center', marginTop: 4, marginBottom: 16 },
  reasonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderRadius: Radius.md,
    borderWidth: 1,
    marginBottom: 8,
  },
  reasonText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
  details: {
    borderWidth: 1,
    borderRadius: Radius.md,
    padding: 12,
    minHeight: 70,
    fontSize: 14, lineHeight: 18,
    marginTop: 4,
    marginBottom: 4,
  },
  submit: { height: 50, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  submitText: { color: '#fff', fontSize: 16, lineHeight: 21, fontWeight: '700' },
  cancel: { paddingVertical: 12, alignItems: 'center' },
  cancelText: { fontSize: 15, lineHeight: 20, fontWeight: '600' },
});
