import { useAppSelector } from '@/store/hooks';
import { toMillis } from '@/utils/time';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, View } from 'react-native';
import { FOUNDER_LIMIT, isFounder } from '../constants';
import type { MilestoneStats } from '../types';
import { formatJoinDate, formatNumber } from '../utils/milestoneFormat';
import { createMilestoneArtworkStyles, MILESTONE_BASE_WIDTH } from './milestoneArtworkStyles';

/**
 * Paylaşılabilir 1K kartı. Hem önizlemede hem ekran dışı dışa aktarımda aynı
 * bileşen çizilir; kişisel satırlar (üye no, katılış) store'dan okunur.
 */
export function MilestoneArtwork({ stats }: { stats: MilestoneStats }) {
  const { t, i18n } = useTranslation();
  const memberNumber = useAppSelector(s => s.auth.user?.memberNumber);
  const joinedAt = useAppSelector(s => toMillis(s.auth.user?.createdAt));
  const [width, setWidth] = useState(0);
  const scale = width / MILESTONE_BASE_WIDTH;
  const styles = useMemo(() => createMilestoneArtworkStyles(scale || 1), [scale]);
  const lang = i18n.language;
  const upper = (key: string) => t(key).toLocaleUpperCase(lang);
  const joined = formatJoinDate(joinedAt, lang);
  const statItems = [
    { key: 'stories', value: stats.stories },
    { key: 'reads', value: stats.reads },
    { key: 'comments', value: stats.comments },
  ].filter(item => item.value > 0);

  return (
    <View style={styles.canvas} collapsable={false} onLayout={e => setWidth(e.nativeEvent.layout.width)}>
      {scale > 0 ? (
        <>
          <View style={[styles.orb, styles.orbTop]} />
          <View style={[styles.orb, styles.orbBottom]} />
          <View style={styles.brandRow}>
            <View style={styles.mark}>
              <Image source={require('../../../assets/images/icon.png')} style={[StyleSheet.absoluteFill, styles.markImage]} contentFit="cover" />
            </View>
            <Text style={styles.brand}>bluma</Text>
            <View style={styles.pill}><Text style={styles.pillLabel}>1K</Text></View>
          </View>

          <View style={styles.hero}>
            <Text style={styles.eyebrow}>{upper('milestone.eyebrow')}</Text>
            <Text style={styles.number}>{formatNumber(FOUNDER_LIMIT, lang)}</Text>
            <Text style={styles.headline}>{t('milestone.headline')}</Text>
          </View>

          <View style={styles.member}>
            {memberNumber ? (
              <>
                <Text style={styles.memberNumber}>#{formatNumber(memberNumber, lang)}</Text>
                <Text style={styles.memberLine}>{t('milestone.memberLine', { number: formatNumber(memberNumber, lang) })}</Text>
              </>
            ) : (
              <Text style={styles.memberLine}>{t('milestone.memberFallback')}</Text>
            )}
            {isFounder(memberNumber) ? (
              <View style={styles.founder}>
                <Ionicons name="sparkles" size={Math.round(10 * scale)} color="#8A6413" />
                <Text style={styles.founderLabel}>{upper('milestone.founder')}</Text>
              </View>
            ) : null}
            {joined ? <Text style={styles.joined}>{t('milestone.joined', { date: joined })}</Text> : null}
          </View>

          {statItems.length ? (
            <View style={styles.stats}>
              {statItems.map(item => (
                <View key={item.key} style={styles.stat}>
                  <Text style={styles.statValue}>{formatNumber(item.value, lang)}</Text>
                  <Text style={styles.statLabel}>{upper(`milestone.stat.${item.key}`)}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <View style={styles.footer}>
            <View style={styles.cta}><Text style={styles.ctaText}>{t('milestone.cta')}</Text></View>
          </View>
        </>
      ) : null}
    </View>
  );
}
