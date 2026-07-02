import { BloomMark, Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { GATE_REASONS, useGuestGate } from '@/contexts/GuestContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const BENEFITS = [
  { icon: 'infinite-outline', label: 'Sınırsız okuma' },
  { icon: 'bookmark-outline', label: 'Kütüphanem' },
  { icon: 'people-outline',   label: 'Yazarları takip et' },
];

// Built on react-native's Modal (not @gorhom/bottom-sheet) so the gate works
// reliably on the New Architecture / Reanimated 4 across iOS and Android.
export function AuthGateSheet() {
  const { gate, closeGate, startAuth } = useGuestGate();
  const { colors, fonts } = useTheme();
  const insets = useSafeAreaInsets();

  const reason = gate ? GATE_REASONS[gate.reason] : GATE_REASONS.default;

  return (
    <Modal
      visible={!!gate}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={closeGate}
    >
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={closeGate} />
        <View
          style={[
            styles.sheet,
            { backgroundColor: colors.surface, paddingBottom: insets.bottom + 24 },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: colors.border }]} />
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Logo + reason badge */}
            <View style={styles.logoWrap}>
              <View style={[styles.logoBox, { backgroundColor: colors.primarySoft }]}>
                <BloomMark size={40} />
                <View style={[styles.reasonBadge, { backgroundColor: '#FF5C8A', borderColor: colors.surface }]}>
                  <Ionicons name={reason.icon as any} size={13} color="#fff" />
                </View>
              </View>
            </View>

            <Text style={[styles.title, { fontFamily: fonts.serif, color: colors.text }]}>
              {reason.title}
            </Text>
            <Text style={[styles.sub, { color: colors.textSecondary }]}>
              {reason.sub}
            </Text>

            {/* 3-up benefit boxes */}
            <View style={styles.benefits}>
              {BENEFITS.map(b => (
                <View key={b.label} style={[styles.benefitBox, { backgroundColor: colors.surfaceVariant }]}>
                  <Ionicons name={b.icon as any} size={20} color={colors.primary} />
                  <Text style={[styles.benefitLabel, { color: colors.textSecondary }]}>{b.label}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.primaryBtn}
              onPress={() => startAuth('signup')}
              activeOpacity={0.88}
            >
              <Text style={styles.primaryBtnText}>Ücretsiz Hesap Oluştur</Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={{ color: colors.textSecondary, fontSize: 14 }}>Zaten hesabın var mı? </Text>
              <TouchableOpacity onPress={() => startAuth('login')}>
                <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 14 }}>Giriş yap</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity onPress={closeGate} style={styles.skipBtn}>
              <Text style={{ color: colors.textLight, fontSize: 13, fontWeight: '600' }}>Şimdilik gerek yok</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    maxHeight: '88%',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 10,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 4,
    borderRadius: 2,
    marginBottom: 6,
  },
  content: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 8,
    alignItems: 'center',
  },
  logoWrap: { marginBottom: 14, marginTop: 8 },
  logoBox: {
    position: 'relative',
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  reasonBadge: {
    position: 'absolute', right: -5, bottom: -5,
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2,
  },
  title: {
    fontSize: 24, lineHeight: 30, fontWeight: '700', letterSpacing: -0.3,
    textAlign: 'center', marginBottom: 8,
  },
  sub: {
    fontSize: 14, lineHeight: 21, textAlign: 'center',
    marginBottom: 20, maxWidth: 300,
  },
  benefits: {
    flexDirection: 'row', gap: 8, width: '100%',
    marginBottom: 22,
  },
  benefitBox: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    gap: 7, paddingVertical: 14, paddingHorizontal: 6,
    borderRadius: Radius.lg,
  },
  benefitLabel: {
    fontSize: 11, fontWeight: '600', textAlign: 'center', lineHeight: 14,
  },
  primaryBtn: {
    width: '100%', height: 54, borderRadius: Radius.pill,
    backgroundColor: '#FF5C8A',
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42, shadowRadius: 18, elevation: 7,
  },
  primaryBtnText: {
    color: '#fff', fontWeight: '700', fontSize: 16,
  },
  loginRow: {
    flexDirection: 'row', alignItems: 'center', marginTop: 16,
  },
  skipBtn: {
    paddingVertical: 10, marginTop: 4,
  },
});
