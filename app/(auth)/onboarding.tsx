import {
  Screen, BloomMark, Button, Text } from '@/components/ui';
import { CategoryMeta, Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { authActions } from '@/store/authStore';
import { useAvatarPicker } from '@/features/profile/hooks/useAvatarPicker';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Redirect } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAppSelector } from '@/store/hooks';
import {
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

const INTENTS = [
  { id: 'reader', icon: 'book',   title: 'onboarding.intentReader',  sub: 'onboarding.intentReaderSub', color: '#7C5CD0' },
  { id: 'writer', icon: 'create', title: 'onboarding.intentWriter',  sub: 'onboarding.intentWriterSub', color: '#FF5C8A' },
  { id: 'both',   icon: 'leaf',   title: 'onboarding.intentBoth',    sub: 'onboarding.intentBothSub',   color: '#2FA98A' },
] as const;

type Intent = typeof INTENTS[number]['id'] | null;

const GENRE_KEYS = [
  'romance', 'fantasy', 'sci_fi', 'mystery',
  'adventure', 'horror', 'comedy', 'drama', 'poetry',
] as const;

const STEPS = [
  { title: 'onboarding.step1Title', sub: 'onboarding.step1Sub' },
  { title: 'onboarding.step2Title', sub: 'onboarding.step2Sub' },
  { title: 'onboarding.step3Title', sub: 'onboarding.step3Sub' },
  { title: 'onboarding.step4Title', sub: '' },
];
const TOTAL = STEPS.length;

export default function OnboardingScreen() {
  const { colors, fonts } = useTheme();
  const { t } = useTranslation();
  const [step, setStep]   = useState(0);
  const [intent, setIntent] = useState<Intent>(null);
  const [userData, setUserData] = useState({ username: '', displayName: '', interests: [] as string[], bio: '' });
  const [usernameStatus, setUsernameStatus] = useState<'checking' | 'available' | 'taken' | null>(null);
  const { image: avatarUri, showOptions: showAvatarOptions } = useAvatarPicker();

  const isLoading = useAppSelector(s => s.auth.isLoading);
  const isAuthenticated = useAppSelector(s => s.auth.isAuthenticated);
  const hasCompletedOnboarding = useAppSelector(s => s.auth.hasCompletedOnboarding);
  if (!isAuthenticated) return <Redirect href="/(auth)/signin" />;

  if (hasCompletedOnboarding)
    return <Redirect href={intent && intent !== 'reader' ? '/(tabs)/write' : '/'} />;

  const toggleGenre = (key: string) =>
    setUserData(prev => ({
      ...prev,
      interests: prev.interests.includes(key)
        ? prev.interests.filter(k => k !== key)
        : [...prev.interests, key],
    }));

  const updateUsername = async (raw: string) => {
    const clean = raw.toLowerCase().replace(/[^a-z0-9_]/g, '');
    setUserData(prev => ({ ...prev, username: clean }));
    if (clean.length >= 3) {
      setUsernameStatus('checking');
      try {
        const ok = await authActions.checkUsernameAvailability(clean);
        setUsernameStatus(ok ? 'available' : 'taken');
      } catch {
        setUsernameStatus('taken');
      }
    } else {
      setUsernameStatus(null);
    }
  };

  const canProceed =
    step === 0 ? !!intent
    : step === 1 ? userData.interests.length >= 3
    : step === 2 ? userData.username.length >= 3 && usernameStatus === 'available'
    : true;

  const handleNext = () => { if (step < TOTAL - 1) setStep(s => s + 1); };
  const back = () => step > 0 && setStep(s => s - 1);

  const handleFinish = async () => {
    const result = await authActions.completeOnboarding({ ...userData, displayName: userData.displayName || undefined, profileImage: avatarUri, intent: intent ?? 'both' } as any);
    if (!result?.success) Alert.alert(t('common.error'), result?.error || t('account.onboardingFailed'));
  };

  const isCompletion = step === TOTAL - 1;
  const progressFraction = (step + 1) / TOTAL;

  const renderIntent = () => (
    <View style={{ gap: 12, marginTop: 22 }}>
      {INTENTS.map(it => {
        const on = intent === it.id;
        return (
          <TouchableOpacity
            key={it.id}
            onPress={() => setIntent(it.id)}
            activeOpacity={0.8}
            style={[
              s.intentCard,
              {
                backgroundColor: on ? colors.surface : colors.surfaceVariant,
                borderColor: on ? it.color : 'transparent',
                borderWidth: 2,
              },
            ]}
          >
            <View style={[s.intentIcon, { backgroundColor: on ? it.color : colors.surface }]}>
              <Ionicons name={it.icon as any} size={25} color={on ? '#fff' : it.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[s.intentTitle, { fontFamily: Fonts.serif, color: colors.text }]}>{t(it.title)}</Text>
              <Text variant="caption" tone="textSecondary" style={{ marginTop: 2, lineHeight: 18 }}>{t(it.sub)}</Text>
            </View>
            <View style={[s.intentCheck, { backgroundColor: on ? it.color : 'transparent', borderColor: on ? it.color : colors.border, borderWidth: on ? 0 : 2 }]}>
              {on && <Ionicons name="checkmark" size={15} color="#fff" />}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  const renderGenres = () => (
    <View style={{ marginTop: 22 }}>
      <Text variant="caption" tone="textSecondary" style={{ marginBottom: 16 }}>
        {t('onboarding.genresSelected', { count: userData.interests.length })}
      </Text>
      <View style={s.genreGrid}>
        {GENRE_KEYS.map(key => {
          const meta = CategoryMeta[key];
          const on = userData.interests.includes(key);
          return (
            <TouchableOpacity
              key={key}
              onPress={() => toggleGenre(key)}
              activeOpacity={0.78}
              style={[
                s.genreCard,
                {
                  backgroundColor: on ? meta.color : colors.surface,
                  borderColor: on ? 'transparent' : colors.border,
                },
              ]}
            >
              <View style={[s.genreIcon, { backgroundColor: on ? 'rgba(255,255,255,0.24)' : colors.surfaceVariant }]}>
                <Ionicons name={meta.icon as any} size={22} color={on ? '#fff' : meta.color} />
              </View>
              <Text variant="label" style={{ fontWeight: '700', color: on ? '#fff' : colors.text, marginTop: 8 }}>
                {t(meta.label)}
              </Text>
              {on && (
                <View style={s.genreCheck}>
                  <Ionicons name="checkmark" size={13} color={meta.color} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderUsername = () => (
    <View style={{ marginTop: 22, gap: 16 }}>
      <TouchableOpacity style={s.avatarWrap} onPress={showAvatarOptions} activeOpacity={0.85}>
        <View style={[s.avatarCircle, { backgroundColor: colors.primary + '22', borderColor: colors.primary + '44', borderWidth: 2, overflow: 'hidden' }]}>
          {avatarUri ? (
            <Image source={{ uri: avatarUri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
          ) : (
            <Text style={[s.avatarInitial, { color: colors.primary, fontFamily: fonts.serif }]}>
              {userData.displayName ? userData.displayName.charAt(0).toUpperCase() : '?'}
            </Text>
          )}
        </View>
        <View style={[s.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Ionicons name="camera" size={15} color="#fff" />
        </View>
      </TouchableOpacity>

      <View style={[s.inputRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="happy-outline" size={20} color={colors.textSecondary} />
        <TextInput
          style={[s.textInput, { color: colors.text, fontFamily: fonts.sans }]}
          placeholder={t('onboarding.displayNamePlaceholder')}
          placeholderTextColor={colors.textSecondary}
          value={userData.displayName}
          onChangeText={v => setUserData(prev => ({ ...prev, displayName: v }))}
          autoCapitalize="words"
          autoCorrect={false}
        />
      </View>

      <View>
        <View style={[s.inputRow, { backgroundColor: colors.surface, borderColor: userData.username.length >= 3 && usernameStatus === 'available' ? colors.success : colors.border }]}>
          <Text style={[s.atPrefix, { color: colors.primary, fontFamily: fonts.sans }]}>@</Text>
          <TextInput
            style={[s.textInput, { color: colors.text, fontFamily: fonts.sans }]}
            placeholder={t('onboarding.usernamePlaceholder')}
            placeholderTextColor={colors.textSecondary}
            value={userData.username}
            onChangeText={updateUsername}
            maxLength={20}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text variant="caption" tone="textSecondary" style={{ textAlign: 'center', marginTop: 8 }}>
          {t('onboarding.usernameHint', { length: userData.username.length })}
        </Text>
        {userData.username.length >= 3 && (
          <View style={s.usernameStatus}>
            {usernameStatus === 'checking' && (
              <>
                <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
                <Text variant="caption" tone="textSecondary">{t('onboarding.checking')}</Text>
              </>
            )}
            {usernameStatus === 'available' && (
              <>
                <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                <Text variant="caption" style={{ color: colors.success }}>{t('onboarding.usernameAvailable', { username: userData.username })}</Text>
              </>
            )}
            {usernameStatus === 'taken' && (
              <>
                <Ionicons name="close-circle" size={16} color={colors.error} />
                <Text variant="caption" style={{ color: colors.error }}>{t('onboarding.usernameTaken', { username: userData.username })}</Text>
              </>
            )}
          </View>
        )}
      </View>
    </View>
  );

  const renderCompletion = () => (
    <View style={[s.completionWrap]}>
      <BloomMark size={108} />
      <Text style={[s.completionHeading, { fontFamily: fonts.serif, color: colors.text }]}>
        {t('onboarding.step4Title')}
      </Text>
      <Text variant="body" tone="textSecondary" style={{ textAlign: 'center', maxWidth: 290, lineHeight: 24, marginTop: 8 }}>
        {t('onboarding.completionSub', { count: userData.interests.length })}
      </Text>
      {userData.interests.length > 0 && (
        <View style={s.genrePills}>
          {userData.interests.map(k => (
            <View key={k} style={[s.genrePill, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[s.genreDot, { backgroundColor: CategoryMeta[k as keyof typeof CategoryMeta]?.color }]} />
              <Text variant="caption" style={{ fontWeight: '700', color: colors.text }}>
                {CategoryMeta[k as keyof typeof CategoryMeta]?.label ? t(CategoryMeta[k as keyof typeof CategoryMeta].label) : k}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );

  const renderStep = () => {
    if (step === 0) return renderIntent();
    if (step === 1) return renderGenres();
    if (step === 2) return renderUsername();
    return renderCompletion();
  };

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[s.progressHeader, { paddingHorizontal: Spacing.screenX }]}>
        <TouchableOpacity
          onPress={back}
          style={[s.backCircle, { backgroundColor: colors.surface, opacity: step === 0 || isCompletion ? 0.35 : 1 }]}
          disabled={step === 0 || isCompletion}
        >
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>

        <View style={[s.progressTrack, { backgroundColor: colors.border }]}>
          <View style={[s.progressFill, { width: `${progressFraction * 100}%` }]} />
        </View>

        <Text variant="caption" tone="textLight" style={[s.stepCounter, { fontFamily: Fonts.mono }]}>
          {step + 1}/{TOTAL}
        </Text>
      </View>

      <ScrollView
        style={{ flex: 1, paddingHorizontal: Spacing.screenX }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {!isCompletion && (
          <View style={{ marginTop: 22, marginBottom: 4 }}>
            <Text style={[s.stepTitle, { fontFamily: fonts.serif, color: colors.text }]}>
              {t(STEPS[step].title)}
            </Text>
            <Text variant="body" tone="textSecondary" style={{ marginTop: 6, lineHeight: 22 }}>
              {STEPS[step].sub ? t(STEPS[step].sub) : ''}
            </Text>
          </View>
        )}

        {renderStep()}
      </ScrollView>

      <View style={[s.footer, { borderTopColor: isCompletion ? 'transparent' : colors.border }]}>
        {isCompletion ? (
          <Button
            label={isLoading ? t('onboarding.savingProgress') : t('onboarding.enterBluma')}
            variant="primary"
            size="lg"
            iconRight="arrow-forward"
            onPress={handleFinish}
            disabled={isLoading}
          />
        ) : (
          <Button
            label={t('common.continue')}
            variant="primary"
            size="lg"
            iconRight="arrow-forward"
            onPress={handleNext}
            disabled={!canProceed || isLoading}
          />
        )}
      </View>
    </Screen>
  );
}

const s = StyleSheet.create({
  progressHeader: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, gap: 12,
  },
  backCircle: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: 'center', justifyContent: 'center',
    marginLeft: -6,
  },
  progressTrack: {
    flex: 1, height: 6, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
    backgroundColor: '#7C5CD0',
  },
  stepCounter: {
    fontWeight: '600', minWidth: 32, textAlign: 'right',
  },
  stepTitle: {
    fontSize: 26, fontWeight: '700', letterSpacing: -0.5, lineHeight: 36,
  },

  intentCard: {
    flexDirection: 'row', alignItems: 'center', gap: 16,
    padding: 18, borderRadius: Radius.xl,
    shadowColor: 'rgba(60,40,100,0.08)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1, shadowRadius: 8, elevation: 2,
  },
  intentIcon: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
  },
  intentTitle: {
    fontSize: 18, lineHeight: 23, fontWeight: '700',
  },
  intentCheck: {
    width: 24, height: 24, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },

  genreGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 12,
  },
  genreCard: {
    width: '47%', borderRadius: Radius.lg, borderWidth: 2,
    padding: 16, minHeight: 92, overflow: 'hidden',
    position: 'relative',
  },
  genreIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
  },
  genreCheck: {
    position: 'absolute', top: 10, right: 10,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },

  avatarWrap: {
    alignItems: 'center',
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 4,
  },
  avatarCircle: {
    width: 96, height: 96, borderRadius: 48,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 36, lineHeight: 47, fontWeight: '700',
  },
  cameraBadge: {
    position: 'absolute', right: -2, bottom: -2,
    width: 34, height: 34, borderRadius: 17,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 3,
  },

  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderRadius: Radius.lg, borderWidth: 2,
    paddingHorizontal: 16, paddingVertical: 16,
  },
  atPrefix: { fontSize: 18, lineHeight: 23, fontWeight: '600', marginRight: 4 },
  textInput: { flex: 1, fontSize: 18, lineHeight: 23, fontWeight: '500' },
  usernameStatus: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 10,
  },

  completionWrap: {
    alignItems: 'center', paddingTop: 40,
  },
  completionHeading: {
    fontSize: 30, fontWeight: '700', letterSpacing: -0.5,
    marginTop: 28, lineHeight: 38, textAlign: 'center',
  },
  genrePills: {
    flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center',
    gap: 8, marginTop: 20, maxWidth: 300,
  },
  genrePill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    height: 32, paddingHorizontal: 12, borderRadius: Radius.pill,
    borderWidth: 1,
  },
  genreDot: { width: 8, height: 8, borderRadius: 4 },

  footer: {
    paddingHorizontal: Spacing.screenX,
    paddingTop: 12, paddingBottom: 26,
    borderTopWidth: 1,
  },
});
