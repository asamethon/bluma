import ImageModal from '@/components/ImageModal';
import { Avatar, BloomMark } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface ProfileGradientHeroProps {
  avatarUri?: string;
  avatarName?: string;
  /** Sağ üstteki ikon butonları (settings/logout ya da back/menu gibi ekrana özgü aksiyonlar). */
  actions?: React.ReactNode;
  /** Genre/rozet gibi ekstra vurgu rengi — verilmezse sadece varsayılan petal-rose top gösterilir. */
  accentColor?: string;
  height?: number;
  watermarkSize?: number;
  /** Avatar'ın hero'nun neresinde (top offset) taşacağı — ekranlar arası küçük fark. */
  avatarTop?: number;
}

/** Gradient hero + BloomMark watermark + taşan avatar deseni — profil ekranlarının ortak üst bölümü. */
export function ProfileGradientHero({
  avatarUri,
  avatarName,
  actions,
  accentColor = '#FF85A8',
  height = 108,
  watermarkSize = 132,
  avatarTop = 56,
}: ProfileGradientHeroProps) {
  // Avatar resmi varsa basılı tutunca büyütülmüş halini ortada göster.
  const [viewerVisible, setViewerVisible] = useState(false);

  return (
    <View>
      <View style={[styles.hero, { height }]}>
        {/* diagonal darker base */}
        <View pointerEvents="none" style={styles.baseBlob} />
        {/* petal-rose / genre-accent blush — upper-right */}
        <View pointerEvents="none" style={[styles.accentBlob, { backgroundColor: accentColor }]} />
        {/* BloomMark watermark */}
        <View style={[styles.heroWatermark, { right: -14, top: -14 }]} pointerEvents="none">
          <BloomMark size={watermarkSize} color="#fff" coreColor="#fff" />
        </View>
        {actions && <View style={styles.heroActions}>{actions}</View>}
      </View>
      {/* Avatar dışarıda — hero overflow'dan etkilenmiyor */}
      <View style={[styles.heroAvatarWrap, { top: avatarTop }]}>
        <Pressable
          onLongPress={() => avatarUri && setViewerVisible(true)}
          style={({ pressed }) => pressed && avatarUri ? { opacity: 0.85 } : undefined}
        >
          <Avatar uri={avatarUri} name={avatarName} size={88} ring />
        </Pressable>
      </View>

      <ImageModal
        visible={viewerVisible}
        imageUri={avatarUri || ''}
        onClose={() => setViewerVisible(false)}
        shape="circle"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    overflow: 'hidden',
    backgroundColor: '#6644C0',
  },
  baseBlob: {
    position: 'absolute',
    left: -60,
    bottom: -60,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#4B2DA8',
    opacity: 0.55,
  },
  accentBlob: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 160,
    height: 160,
    borderRadius: 80,
    opacity: 0.38,
  },
  heroWatermark: {
    position: 'absolute',
    opacity: 0.18,
  },
  heroActions: {
    position: 'absolute',
    top: 10,
    left: Spacing.screenX,
    right: Spacing.screenX,
    flexDirection: 'row',
  },
  heroAvatarWrap: {
    position: 'absolute',
    left: Spacing.screenX,
    zIndex: 10,
  },
});
