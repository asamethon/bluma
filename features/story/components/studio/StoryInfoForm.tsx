import { Button, CategoryChip, IconButton, Text } from '@/components/ui';
import { categoryColor, Fonts, Radius, Spacing, useTheme } from '@/constants/theme';
import { StoryCategory } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useRef } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';
import type { useStoryInfoForm } from '../../hooks/useStoryInfoForm';
import { CoverPickerSheet } from '../CoverPickerSheet';

const WRITE_GENRES: StoryCategory[] = [
  'fantasy', 'romance', 'mystery', 'sci_fi', 'drama', 'adventure', 'horror', 'poetry', 'comedy',
];

type Form = ReturnType<typeof useStoryInfoForm>;

// "Hikâye Bilgilerini Düzenle" formu — yeni + düzenleme ekranlarınca paylaşılır.
export function StoryInfoForm({ form, safeBottom }: { form: Form; safeBottom: number }) {
  const { colors } = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  // Her alanın scroll içeriğindeki y konumu — odaklanınca klavyenin üstüne kaydırmak için.
  const fieldOffsets = useRef({ title: 0, description: 0 });

  // KeyboardAvoidingView'ın kendi otomatik ölçümüne güvenmiyoruz: iOS'ta
  // QuickType şeridiyle gelen gerçek yükseklik eksik hesaplanıyordu; Android'de
  // ise edge-to-edge (gradle.properties: edgeToEdgeEnabled) native pencere
  // resize'ını devre dışı bırakıyor, bu yüzden Keyboard.addListener'ın
  // resize-tabanlı ölçümü hiç tetiklenmiyor / 0 kalıyordu. useAnimatedKeyboard
  // ise Android'de WindowInsetsAnimationCompat (IME inset) kullanır — edge-to-edge'den
  // bağımsız, her iki platformda da güvenilir.
  const keyboard = useAnimatedKeyboard();
  const containerAnimStyle = useAnimatedStyle(() => ({ paddingBottom: keyboard.height.value }));
  const fillerAnimStyle = useAnimatedStyle(() => ({ height: keyboard.height.value }));
  const footerAnimStyle = useAnimatedStyle(() => ({
    paddingBottom: keyboard.height.value > 0 ? 12 : safeBottom + 12,
  }));

  const scrollToField = (field: keyof typeof fieldOffsets.current) => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ y: Math.max(fieldOffsets.current[field] - Spacing.xl, 0), animated: true });
    }, Platform.OS === 'ios' ? 120 : 250);
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Klavyenin yuvarlak üst köşelerinden sızan boşluğu footer'la aynı
          renkte doldurur — sabit ekran altına, klavyeden bağımsız konumlanır. */}
      <Animated.View
        pointerEvents="none"
        style={[styles.keyboardFiller, fillerAnimStyle, { backgroundColor: colors.surface }]}
      />
      <Animated.View style={[{ flex: 1 }, containerAnimStyle]}>
        <View style={styles.header}>
          <IconButton icon="chevron-back" onPress={form.cancel} />
          <Text variant="heading" style={{ fontSize: 18 }}>
            {form.isNew ? 'Yeni Hikâye' : 'Hikâye Bilgilerini Düzenle'}
          </Text>
        </View>

        <ScrollView
          ref={scrollRef}
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: Spacing.screenX, gap: Spacing.xl }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Kapak */}
          <View style={{ alignItems: 'center', paddingTop: Spacing.sm }}>
            <View style={styles.coverWrap}>
              <View
                style={[styles.cover, { backgroundColor: colors.surfaceVariant, borderColor: colors.border }]}
              >
                {form.coverImage ? (
                  <Image source={{ uri: form.coverImage }} style={StyleSheet.absoluteFill} contentFit="cover" />
                ) : (
                  <Ionicons name="book-outline" size={34} color={categoryColor(form.category)} />
                )}
              </View>
              <IconButton
                icon="camera-outline"
                variant="bloom"
                size={34}
                color="#fff"
                onPress={() => form.setCoverSheet(true)}
                style={[styles.coverBtn, { backgroundColor: colors.primary, borderColor: colors.background }]}
              />
            </View>
          </View>

          {/* Başlık */}
          <View
            style={{ gap: Spacing.sm }}
            onLayout={e => { fieldOffsets.current.title = e.nativeEvent.layout.y; }}
          >
            <Text variant="label" tone="textSecondary">Hikâye Başlığı</Text>
            <TextInput
              value={form.title}
              onChangeText={v => { form.setTitle(v); if (v.trim()) form.setTitleError(false); }}
              onFocus={() => scrollToField('title')}
              placeholder="Okurların göreceği ana başlık"
              placeholderTextColor={colors.textLight}
              maxLength={100}
              style={[
                styles.input,
                { color: colors.text, backgroundColor: colors.surface, borderColor: form.titleError ? colors.error : colors.border },
              ]}
            />
            {form.titleError && <Text variant="caption" tone="error">Başlık en az 3 karakter olmalı.</Text>}
          </View>

          {/* Tür */}
          <View style={{ gap: Spacing.md }}>
            <Text variant="label" tone="textSecondary">Tür</Text>
            <View style={styles.chips}>
              {WRITE_GENRES.map(g => (
                <CategoryChip
                  key={g}
                  category={g}
                  active={form.category === g}
                  onPress={() => form.setCategory(g)}
                />
              ))}
            </View>
          </View>

          {/* Açıklama */}
          <View
            style={{ gap: Spacing.sm }}
            onLayout={e => { fieldOffsets.current.description = e.nativeEvent.layout.y; }}
          >
            <Text variant="label" tone="textSecondary">Kısa Açıklama</Text>
            <TextInput
              value={form.description}
              onChangeText={form.setDescription}
              onFocus={() => scrollToField('description')}
              placeholder="Okurların kapakta göreceği kısa özet"
              placeholderTextColor={colors.textLight}
              maxLength={160}
              multiline
              style={[
                styles.input,
                styles.multiline,
                { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            />
          </View>

          {!form.isNew && (
            <Button label="Hikâyeyi Sil" variant="ghost" icon="trash-outline" onPress={form.remove} />
          )}
        </ScrollView>

        <Animated.View style={[styles.footer, footerAnimStyle, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <Button label="Vazgeç" variant="secondary" onPress={form.cancel} style={{ flex: 1 }} />
          <Button
            label="Kaydet"
            variant="primary"
            icon="checkmark"
            loading={form.saving}
            onPress={form.save}
            style={{ flex: 1.4 }}
          />
        </Animated.View>

        <CoverPickerSheet
          visible={form.coverSheet}
          onClose={() => form.setCoverSheet(false)}
          onPickGallery={form.pickCover}
          onTakePhoto={form.takePhoto}
          safeBottom={safeBottom}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.screenX, paddingBottom: Spacing.sm },
  coverWrap: { position: 'relative' },
  cover: {
    width: 108,
    height: 152,
    borderRadius: Radius.lg,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  coverBtn: { position: 'absolute', right: -6, bottom: -6, borderWidth: 3 },
  input: {
    fontFamily: Fonts.sans,
    fontSize: 15, lineHeight: 20,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Radius.md,
    borderWidth: 1,
  },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  keyboardFiller: { position: 'absolute', left: 0, right: 0, bottom: 0, zIndex: -1 },
  footer: {
    flexDirection: 'row',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.screenX,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
});
