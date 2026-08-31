import ImageModal from '@/components/ImageModal';
import { Avatar, BloomMark } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface ProfileGradientHeroProps {
  avatarUri?: string;
  avatarName?: string;
  actions?: React.ReactNode;
  accentColor?: string;
  height?: number;
  watermarkSize?: number;
  avatarTop?: number;
  topInset?: number;
}

export function ProfileGradientHero({
  avatarUri,
  avatarName,
  actions,
  accentColor = '#FF85A8',
  height = 108,
  watermarkSize = 132,
  avatarTop = 56,
  topInset = 0,
}: ProfileGradientHeroProps) {
  const [viewerVisible, setViewerVisible] = useState(false);
  const extendedHeight = height + topInset;

  return (
    <View>
      <View style={[styles.hero, { paddingTop: extendedHeight }]}> 
        <View pointerEvents="none" style={styles.baseBlob} />
        <View pointerEvents="none" style={[styles.accentBlob, { backgroundColor: accentColor }]} />
        <View style={[styles.heroWatermark, { right: -14, top: -14 }]} pointerEvents="none">
          <BloomMark size={watermarkSize} color="#fff" coreColor="#fff" />
        </View>
        {actions && (
          <View style={[styles.heroActions, { top: topInset + Spacing.sm }]}>{actions}</View>
        )}
      </View>
      <View style={[styles.heroAvatarWrap, { top: avatarTop + topInset }]}> 
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
    paddingTop: 50,
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
