import { BloomMark, Text } from '@/components/ui';
import { Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { useGuestGate } from '@/contexts/GuestContext';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';

interface Props {
  kind: 'library' | 'profile';
}

const CONTENT = {
  library: {
    title: 'guest.library.title',
    sub: 'guest.library.sub',
    rows: [
      { icon: 'bookmark-outline',             label: 'guest.library.rowSave' },
      { icon: 'book-outline',                 label: 'guest.library.rowContinue' },
      { icon: 'cloud-offline-outline',        label: 'guest.library.rowOffline' },
    ],
  },
  profile: {
    title: 'guest.profile.title',
    sub: 'guest.profile.sub',
    rows: [
      { icon: 'create-outline',       label: 'guest.profile.rowWrite' },
      { icon: 'people-outline',       label: 'guest.profile.rowFollow' },
      { icon: 'sparkles-outline',     label: 'guest.profile.rowLevelUp' },
    ],
  },
};

export function GuestState({ kind }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { startAuth } = useGuestGate();
  const c = CONTENT[kind];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.wrap}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.heroWrap}>
        <View style={[styles.glowRing, { backgroundColor: colors.primarySoft }]} />
        <View style={[styles.iconBox, { shadowColor: '#7C5CD0' }]}>
          <BloomMark size={52} color="#fff" coreColor="#E6B95C" />
        </View>
      </View>

      <Text style={[styles.title, { fontFamily: Fonts.serif, color: colors.text }]}>
        {t(c.title)}
      </Text>
      <Text style={[styles.sub, { color: colors.textSecondary }]}>
        {t(c.sub)}
      </Text>

      <View style={styles.rows}>
        {c.rows.map(row => (
          <View
            key={row.label}
            style={[styles.row, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <View style={[styles.rowIcon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={row.icon as any} size={19} color={colors.primary} />
            </View>
            <Text style={[styles.rowLabel, { color: colors.text }]}>{t(row.label)}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => startAuth('signup')}
          activeOpacity={0.88}
        >
          <Text style={styles.primaryBtnText}>{t('guest.createAccount')}</Text>
          <Ionicons name="arrow-forward" size={18} color="#fff" />
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={[styles.loginText, { color: colors.textSecondary }]}>
            {t('guest.alreadyHaveAccount')}{' '}
          </Text>
          <TouchableOpacity onPress={() => startAuth('login')}>
            <Text style={[styles.loginLink, { color: colors.primary }]}>{t('guest.signIn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  wrap: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingTop: Spacing.lg,
    paddingBottom: 120,
    textAlign: 'center',
  },
  heroWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    width: 132,
    height: 132,
  },
  glowRing: {
    position: 'absolute',
    width: 132,
    height: 132,
    borderRadius: 66,
    opacity: 0.7,
  },
  iconBox: {
    width: 96,
    height: 96,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#7C5CD0',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.4,
    textAlign: 'center',
    marginBottom: 10,
    lineHeight: 34,
  },
  sub: {
    fontSize: 14.5,
    lineHeight: 23,
    textAlign: 'center',
    marginBottom: 26,
    maxWidth: 300,
  },
  rows: {
    width: '100%',
    maxWidth: 320,
    gap: 10,
    marginBottom: 28,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 13,
    padding: 13,
    borderRadius: Radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowIcon: {
    flexShrink: 0,
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    fontSize: 14, lineHeight: 18,
    fontWeight: '600',
  },
  actions: {
    width: '100%',
    maxWidth: 320,
    gap: 14,
  },
  primaryBtn: {
    width: '100%',
    height: 54,
    borderRadius: Radius.pill,
    backgroundColor: '#FF5C8A',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#FF5C8A',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.42,
    shadowRadius: 20,
    elevation: 7,
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16, lineHeight: 21,
  },
  loginRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loginText: {
    fontSize: 14, lineHeight: 18,
  },
  loginLink: {
    fontSize: 14, lineHeight: 18,
    fontWeight: '700',
  },
});
