import {
  Screen, BloomMark } from '@/components/ui';
import { Fonts, Spacing, useTheme } from '@/constants/theme';
import {
  CHALLENGE_DEFS,
  PILLAR_COLORS,
  RANKS,
  WEEKLY_FEATURED,
  challengeActions,
  getRankIndex,
  type Pillar,
} from '@/store/challengeStore';
import { useAppSelector } from '@/store/hooks';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

type FilterValue = 'all' | Pillar;

const GOLD = '#E6B95C';

function fmtXp(n: number) {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}b` : `${n}`;
}

export default function ChallengesScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const currentUser = useAppSelector(s => s.auth.user);
  const { xp, streak, challengeProgress, claimedChallenges } = useAppSelector(s => s.challenge);

  const [filter, setFilter] = useState<FilterValue>('all');

  const rankIndex = getRankIndex(xp);
  const rank = RANKS[rankIndex];
  const nextRank = RANKS[rankIndex + 1];
  const floor = rank.min;
  const ceil = nextRank ? nextRank.min : rank.min;
  const lvlPct = nextRank ? Math.min((xp - floor) / (ceil - floor), 1) : 1;

  const getCur = (id: string) => challengeProgress[id] || 0;
  const isClaimed = (id: string) => claimedChallenges.includes(id);
  const isDone = (id: string) => isClaimed(id);

  const handleClaim = async (challengeId: string) => {
    if (!currentUser?.id) return;
    await challengeActions.claimChallenge(currentUser.id, challengeId);
  };

  const list = CHALLENGE_DEFS
    .filter(c => filter === 'all' || c.pillar === filter)
    .sort((a, b) => {
      const aDone = isDone(a.id);
      const bDone = isDone(b.id);
      if (aDone === bDone) return 0;
      return aDone ? 1 : -1;
    });

  const doneCount = claimedChallenges.length;
  const wfCur = (challengeProgress['r1'] || 0) + (challengeProgress['c1'] || 0);
  const wfPct = Math.min(wfCur / WEEKLY_FEATURED.goal, 1);

  const FILTERS: { value: FilterValue; label: string; icon?: string }[] = [
    { value: 'all',     label: 'Tümü' },
    { value: 'write',   label: 'Yaz',       icon: 'create-outline' },
    { value: 'read',    label: 'Oku',        icon: 'book-outline' },
    { value: 'comment', label: 'Topluluk',   icon: 'chatbubbles-outline' },
  ];

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.text, fontFamily: Fonts.serif }]}>Görevler</Text>
          <Text style={[styles.headerSub, { color: colors.textLight }]}>
            {doneCount}/{CHALLENGE_DEFS.length} tamamlandı
          </Text>
        </View>
        <View style={[styles.xpChip, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}>
          <Ionicons name="sparkles" size={13} color={GOLD} />
          <Text style={[styles.xpChipText, { color: colors.text, fontFamily: Fonts.mono }]}>{fmtXp(xp)}</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

        {/* ── Rank Hero ─────────────────────────────────────────── */}
        <View style={styles.rankHero}>
          <View pointerEvents="none" style={{ position: 'absolute', left: -40, bottom: -40, width: 180, height: 180, borderRadius: 90, backgroundColor: '#5E3FB0', opacity: 0.6 }} />
          <View pointerEvents="none" style={{ position: 'absolute', right: -30, top: -30, width: 160, height: 160, borderRadius: 80, backgroundColor: '#7C5CD0', opacity: 0.4 }} />
          <View pointerEvents="none" style={{ position: 'absolute', right: -16, bottom: -22, opacity: 0.14 }}>
            <BloomMark size={120} color="#fff" coreColor="#fff" />
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
            <View style={styles.rankIconWrap}>
              <Ionicons name={rank.icon as any} size={26} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.rankLevelLabel}>Seviye {rankIndex + 1}</Text>
              <Text style={[styles.rankName, { fontFamily: Fonts.serif }]}>{rank.name}</Text>
            </View>
          </View>

          <View style={{ marginTop: 16 }}>
            <View style={styles.xpRowLabels}>
              <Text style={styles.xpSmall}>{fmtXp(xp)} XP</Text>
              {nextRank ? (
                <Text style={styles.xpSmall}>
                  Sonraki: {nextRank.name} · {fmtXp(ceil - xp)} XP kaldı
                </Text>
              ) : (
                <Text style={styles.xpSmall}>En yüksek seviye</Text>
              )}
            </View>
            <View style={styles.xpBarBg}>
              <View style={[styles.xpBarFill, { width: `${lvlPct * 100}%` as any }]} />
            </View>
          </View>

          <View style={{ flexDirection: 'row', gap: 10, marginTop: 14 }}>
            <View style={styles.heroPill}>
              <Ionicons name="flame" size={20} color={GOLD} />
              <View>
                <Text style={[styles.heroPillValue, { fontFamily: Fonts.serif }]}>
                  {streak} gün
                </Text>
                <Text style={styles.heroPillLabel}>seri</Text>
              </View>
            </View>
            <View style={styles.heroPill}>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <View>
                <Text style={[styles.heroPillValue, { fontFamily: Fonts.serif }]}>
                  {doneCount}/{CHALLENGE_DEFS.length}
                </Text>
                <Text style={styles.heroPillLabel}>görev</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Haftalık Öne Çıkan ──────────────────────────────────── */}
        <View style={[styles.weeklyCard, { backgroundColor: colors.bloomSoft, borderColor: colors.bloomLight }]}>
          <View style={[styles.weeklyIcon, { backgroundColor: colors.bloom }]}>
            <Ionicons name="trophy" size={22} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={[styles.weeklyTitle, { flex: 1, color: colors.text, fontFamily: Fonts.serif }]}>
                {WEEKLY_FEATURED.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="hourglass-outline" size={13} color={colors.bloom} />
                <Text style={[styles.weeklyMeta, { color: colors.bloom }]}>{WEEKLY_FEATURED.endsIn}</Text>
              </View>
            </View>
            <Text style={[styles.weeklyDesc, { color: colors.textSecondary }]}>{WEEKLY_FEATURED.desc}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 9 }}>
              <View style={[styles.progressBg, { flex: 1, backgroundColor: colors.surface }]}>
                <View style={[styles.progressFill, { width: `${wfPct * 100}%` as any, backgroundColor: colors.bloom }]} />
              </View>
              <Text style={[styles.progressLabel, { color: colors.textSecondary, fontFamily: Fonts.mono }]}>
                {wfCur}/{WEEKLY_FEATURED.goal}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                <Ionicons name="sparkles" size={12} color={GOLD} />
                <Text style={[styles.progressLabel, { color: colors.bloom, fontFamily: Fonts.mono }]}>
                  {WEEKLY_FEATURED.xp}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Filtreler ────────────────────────────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: Spacing.screenX, gap: 8, paddingBottom: 4 }}
          style={{ marginBottom: 14 }}
        >
          {FILTERS.map(f => {
            const on = filter === f.value;
            const col = f.value === 'all' ? '#7C5CD0' : PILLAR_COLORS[f.value as Pillar];
            return (
              <TouchableOpacity
                key={f.value}
                onPress={() => setFilter(f.value)}
                style={[
                  styles.filterChip,
                  on
                    ? { backgroundColor: col, borderColor: col }
                    : { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                {f.icon && (
                  <Ionicons name={f.icon as any} size={16} color={on ? '#fff' : colors.textSecondary} />
                )}
                <Text style={[styles.filterLabel, { color: on ? '#fff' : colors.text }]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* ── Görev Listesi ────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: Spacing.screenX, gap: 11 }}>
          {list.map(c => {
            const cur = getCur(c.id);
            const done = isDone(c.id);
            const ready = cur >= c.goal && !done;
            const pct = Math.min(cur / c.goal, 1);
            const col = PILLAR_COLORS[c.pillar];

            return (
              <View
                key={c.id}
                style={[
                  styles.challengeCard,
                  {
                    backgroundColor: done ? colors.surfaceVariant : colors.surface,
                    borderColor: ready ? col : colors.border,
                    borderWidth: ready ? 1.5 : 1,
                    opacity: done ? 0.72 : 1,
                  },
                ]}
              >
                <View style={{ flexDirection: 'row', gap: 13 }}>
                  <View
                    style={[
                      styles.challengeIconWrap,
                      {
                        backgroundColor: done ? colors.surface : col,
                        borderWidth: done ? 1 : 0,
                        borderColor: done ? col : 'transparent',
                      },
                    ]}
                  >
                    <Ionicons
                      name={(done ? 'checkmark' : c.icon) as any}
                      size={23}
                      color={done ? col : '#fff'}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
                      <Text style={[styles.challengeTitle, { flex: 1, color: colors.text }]}>
                        {c.title}
                      </Text>
                      <View
                        style={[
                          styles.xpBadge,
                          {
                            backgroundColor: done ? 'transparent' : colors.surfaceVariant,
                            borderWidth: done ? 0 : 1,
                            borderColor: colors.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name={done ? 'checkmark' : 'sparkles'}
                          size={done ? 13 : 12}
                          color={done ? colors.success : GOLD}
                        />
                        <Text
                          style={[
                            styles.xpBadgeText,
                            { color: done ? colors.success : colors.text, fontFamily: Fonts.mono },
                          ]}
                        >
                          {c.xp}
                        </Text>
                      </View>
                    </View>

                    <Text style={[styles.challengeDesc, { color: colors.textSecondary }]}>
                      {c.desc}
                    </Text>

                    {c.badge && !done && (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 }}>
                        <Ionicons name="ribbon" size={13} color={col} />
                        <Text style={[styles.badgeNote, { color: col }]}>"{c.badge}" rozeti</Text>
                      </View>
                    )}

                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 11 }}>
                      {ready ? (
                        <TouchableOpacity
                          style={[styles.claimBtn, { backgroundColor: col }]}
                          onPress={() => handleClaim(c.id)}
                          activeOpacity={0.8}
                        >
                          <Text style={styles.claimBtnText}>Ödülü Al</Text>
                        </TouchableOpacity>
                      ) : done ? (
                        <Text style={[styles.doneLabel, { color: colors.success }]}>Tamamlandı</Text>
                      ) : (
                        <>
                          <View style={[styles.progressBg, { flex: 1, backgroundColor: colors.surfaceVariant }]}>
                            <View
                              style={[
                                styles.progressFill,
                                { width: `${pct * 100}%` as any, backgroundColor: col },
                              ]}
                            />
                          </View>
                          <Text style={[styles.progressLabel, { color: colors.textLight, fontFamily: Fonts.mono }]}>
                            {c.goal > 1 ? `${cur}/${c.goal}` : '0/1'}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenX,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  backBtn: {
    width: 38, height: 38,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 20, fontWeight: '700' },
  headerSub: { fontSize: 12, marginTop: 1 },
  xpChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    height: 30, paddingHorizontal: 12, borderRadius: 999,
    borderWidth: 1,
  },
  xpChipText: { fontSize: 13, fontWeight: '700' },

  rankHero: {
    margin: Spacing.screenX,
    borderRadius: 20,
    padding: 22,
    backgroundColor: '#4B2DA8',
    overflow: 'hidden',
  },
  rankIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  rankLevelLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.65)',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rankName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginTop: 2,
  },
  xpRowLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 7,
  },
  xpSmall: {
    fontSize: 12,
    fontFamily: Fonts.mono,
    color: 'rgba(255,255,255,0.72)',
  },
  xpBarBg: {
    height: 8, borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  xpBarFill: {
    height: '100%', borderRadius: 4,
    backgroundColor: '#E6B95C',
  },
  heroPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  heroPillValue: {
    fontSize: 17, fontWeight: '700', color: '#fff',
  },
  heroPillLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1,
  },

  weeklyCard: {
    flexDirection: 'row',
    gap: 14,
    marginHorizontal: Spacing.screenX,
    marginBottom: 18,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  weeklyIcon: {
    width: 44, height: 44, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
  },
  weeklyTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  weeklyDesc: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  weeklyMeta: { fontSize: 12, fontWeight: '600' },

  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1,
  },
  filterLabel: { fontSize: 13, fontWeight: '600' },

  challengeCard: {
    borderRadius: 16,
    padding: 16,
  },
  challengeIconWrap: {
    width: 46, height: 46, borderRadius: 14,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  challengeTitle: {
    fontSize: 14, fontWeight: '700', lineHeight: 19,
  },
  challengeDesc: {
    fontSize: 12, lineHeight: 17, marginTop: 4,
  },
  badgeNote: {
    fontSize: 12, fontWeight: '600',
  },
  xpBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999,
  },
  xpBadgeText: {
    fontSize: 12, fontWeight: '700',
  },
  progressBg: {
    height: 5, borderRadius: 3, overflow: 'hidden',
  },
  progressFill: {
    height: '100%', borderRadius: 3,
  },
  progressLabel: {
    fontSize: 12, fontWeight: '600',
  },
  claimBtn: {
    paddingHorizontal: 16, paddingVertical: 7,
    borderRadius: 999,
  },
  claimBtnText: {
    fontSize: 13, fontWeight: '700', color: '#fff',
  },
  doneLabel: {
    fontSize: 13, fontWeight: '700',
  },
});
