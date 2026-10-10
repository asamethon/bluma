import ImageModal from '@/components/ui/ImageModal';
import { Avatar } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { Image } from 'expo-image';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

interface ProfileHeroProps {
  avatarUri?: string;
  coverUri?: string | null;
  avatarName?: string;
  actions?: React.ReactNode;
  /** Avatarın sağında, kapağın hemen altında duran birincil aksiyonlar. */
  aside?: React.ReactNode;
  /** Kapak durum çubuğunun altından başlar; güvenli alan yüksekliğe eklenir. */
  topInset: number;
}

/**
 * Editoryal profil başlığı: renkli bant/gradyan yok. Kimlik, solda hizalı
 * büyük avatarla kurulur; aksan kuralı kimlik bloğunun kendisinde durur.
 *
 * Kapak tam kanamalıdır: durum çubuğunun altına kadar uzanır, kırpılmaz.
 * Kapak yoksa bant dekoratif bir gri kutuya dönüşmesin diye kısalır ve sayfa
 * zeminine karışır — yalnızca aksiyonlara ve avatarın taşmasına yer bırakır.
 *
 * Aksiyonlar avatarın sağında, onun alt hizasında durur: kimlik bloğu bir
 * satır kazanır ve birincil aksiyon ekranın üstünde kalır.
 */
export function ProfileHero({
  avatarUri,
  coverUri,
  avatarName,
  actions,
  aside,
  topInset,
}: ProfileHeroProps) {
  const { colors } = useTheme();
  const [viewerVisible, setViewerVisible] = useState(false);

  return (
    <View>
      <View
        style={[
          styles.cover,
          coverUri
            ? { height: topInset + 132, backgroundColor: colors.surfaceVariant }
            : { height: topInset + 104, backgroundColor: colors.background },
        ]}
      >
        {coverUri ? (
          <Image
            source={{ uri: coverUri }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
            recyclingKey={coverUri}
            transition={180}
          />
        ) : null}
        <View style={[styles.actions, { paddingTop: topInset + Spacing.sm }]}>{actions}</View>
      </View>

      <View style={styles.avatarRow}>
        <Pressable
          onLongPress={() => avatarUri && setViewerVisible(true)}
          style={({ pressed }) => (pressed && avatarUri ? { opacity: 0.85 } : undefined)}
        >
          <View style={[styles.avatarFrame, { backgroundColor: colors.background }]}>
            <Avatar uri={avatarUri} name={avatarName} size={84} shape="rounded" />
          </View>
        </Pressable>
        <View style={styles.asideSpacer} />
        {aside}
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
  cover: { position: 'relative', overflow: 'hidden' },
  actions: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.screenX,
    paddingBottom: Spacing.sm,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.screenX,
    marginTop: -46,
  },
  asideSpacer: { flex: 1 },
  avatarFrame: {
    width: 92,
    height: 92,
    padding: 4,
    borderRadius: Radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
