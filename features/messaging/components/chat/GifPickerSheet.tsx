import { EmptyState, IconButton, SegmentedControl, Sheet, Text, TextField } from '@/components/ui';
import { Motion, Radius, Spacing, useTheme } from '@/constants/theme';
import { useGifSearch } from '@/features/messaging/hooks/useGifSearch';
import { useGifPickerKeyboard } from '@/features/messaging/hooks/useGifPickerKeyboard';
import type { GifMedia } from '@/services/gif/klipy';
import type { MessageGif } from '@/types';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

const COLUMNS = 3;
const LIST_HEIGHT = 360;

type Props = { visible: boolean; onClose: () => void; onSelect: (gif: MessageGif) => void };

/**
 * GIF ve çıkartma seçici. Dokunulan öğe DOĞRUDAN gönderilir (WhatsApp/Instagram
 * alışkanlığı); Tenor adresi olduğu gibi saklanır, kendi sunucumuza kopyalanmaz.
 */
export function GifPickerSheet({ visible, onClose, onSelect }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const [sticker, setSticker] = useState(false);
  const search = useGifSearch(sticker);
  const { keyboardVisible, dismiss, close, pressBackdrop } = useGifPickerKeyboard(visible, onClose);

  const choose = useCallback((media: GifMedia) => {
    close();
    onSelect({ url: media.url, width: media.width, height: media.height, sticker });
  }, [close, onSelect, sticker]);

  const renderItem = useCallback(({ item }: { item: GifMedia }) => (
    <Pressable
      onPress={() => choose(item)}
      accessibilityRole="button"
      accessibilityLabel={item.description || t('messages.gifTab')}
      style={({ pressed }) => [styles.cell, { opacity: pressed ? Motion.pressOpacity : 1 }]}
    >
      <Image
        source={{ uri: item.preview }}
        style={[styles.thumb, { backgroundColor: sticker ? 'transparent' : colors.surfaceVariant }]}
        contentFit={sticker ? 'contain' : 'cover'}
        transition={120}
      />
    </Pressable>
  ), [choose, colors.surfaceVariant, sticker, t]);

  const body = () => {
    if (!search.enabled) {
      return <EmptyState icon="film-outline" title={t('messages.gifDisabled')} description={t('messages.gifDisabledHint')} compact />;
    }
    if (search.error) return <EmptyState icon="cloud-offline-outline" title={search.error} compact />;
    if (search.loading && !search.items.length) {
      return <ActivityIndicator color={colors.primary} style={styles.loader} />;
    }
    if (!search.items.length) return <EmptyState icon="search-outline" title={t('messages.gifNoResult')} compact />;
    // FlashList kendi yüksekliğini ölçmez: sarmalayıcıya KESİN bir yükseklik
    // verilmezse sıfır yükseklikle çizilir ve ızgara hiç görünmez.
    return (
      <View style={styles.list}>
        <FlashList
          data={search.items}
          numColumns={COLUMNS}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onScrollBeginDrag={dismiss}
          showsVerticalScrollIndicator={false}
          onEndReached={search.loadMore}
          onEndReachedThreshold={0.5}
        />
      </View>
    );
  };

  return (
    <Sheet visible={visible} onClose={close} onBackdropPress={pressBackdrop} title={t('messages.gifTitle')}>
      <View style={styles.head}>
        <SegmentedControl
          appearance="solid"
          value={sticker ? 'sticker' : 'gif'}
          options={[
            { value: 'gif', label: t('messages.gifTab') },
            { value: 'sticker', label: t('messages.stickerTab') },
          ]}
          onChange={value => { dismiss(); setSticker(value === 'sticker'); }}
        />
        <TextField
          icon="search"
          shape="pill"
          value={search.query}
          onChangeText={search.setQuery}
          placeholder={t('messages.gifSearchPlaceholder')}
          autoCorrect={false}
          returnKeyType="search"
          submitBehavior="blurAndSubmit"
          onSubmitEditing={dismiss}
          right={keyboardVisible ? (
            <IconButton icon="chevron-down" size={32} iconSize={20} glass={false}
              accessibilityLabel="Klavyeyi gizle" onPress={dismiss} />
          ) : undefined}
        />
      </View>
      {body()}
      {/* Sağlayıcının entegrasyon kuralı: arayüzde KLIPY künyesi görünmeli. */}
      {search.enabled && (
        <Text variant="labelSm" tone="textLight" center style={styles.attribution}>
          {t('messages.gifAttribution')}
        </Text>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  head: { paddingHorizontal: Spacing.screenX, paddingTop: Spacing.sm, gap: Spacing.md },
  list: { height: LIST_HEIGHT },
  listContent: { paddingHorizontal: Spacing.sm, paddingTop: Spacing.sm },
  cell: { flex: 1, padding: Spacing.xs },
  thumb: { width: '100%', aspectRatio: 1, borderRadius: Radius.sm },
  loader: { paddingVertical: Spacing.huge },
  attribution: { paddingTop: 2 },
});
