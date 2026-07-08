import ImageModal from '@/components/ImageModal';
import { Avatar, IconButton, Screen, Text } from '@/components/ui';
import { Spacing, useTheme } from '@/constants/theme';
import { MessageBubble } from '@/features/messaging/components/MessageBubble';
import { TypingBubble } from '@/features/messaging/components/TypingBubble';
import { useChat } from '@/features/messaging/hooks/useChat';
import { shouldShowStamp } from '@/features/messaging/utils/time';
import { DirectMessage } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useCallback, useRef, useState } from 'react';
import { FlatList, Platform, Pressable, TextInput, View } from 'react-native';
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

// Tek sohbet ekranı — rota parametresi karşı kullanıcının ID'si.
export default function ChatScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    currentUserId,
    otherUser,
    messages,
    draft,
    setDraft,
    canSend,
    send,
    selectedImage,
    pickImage,
    removeImage,
    isSending,
    otherTyping,
  } = useChat(id);
  const listRef = useRef<FlatList<DirectMessage>>(null);
  const [viewerImage, setViewerImage] = useState<string | null>(null);

  // KeyboardAvoidingView'ın kendi ölçümüne güvenmiyoruz: Android'de edge-to-edge
  // (gradle.properties: edgeToEdgeEnabled) native resize'ı devre dışı bırakıyor;
  // useAnimatedKeyboard WindowInsetsAnimationCompat (IME inset) kullandığından
  // edge-to-edge'den bağımsız, her iki platformda da güvenilir çalışıyor.
  const keyboard = useAnimatedKeyboard();
  const chatContainerStyle = useAnimatedStyle(() => ({ paddingBottom: keyboard.height.value }));

  const scrollToEnd = useCallback(() => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
  }, []);

  const renderItem = useCallback(
    ({ item, index }: { item: DirectMessage; index: number }) => {
      const prev = index > 0 ? messages[index - 1] : null;
      return (
        <MessageBubble
          text={item.text}
          image={item.image}
          mine={item.senderId === currentUserId}
          showStamp={shouldShowStamp(prev?.createdAt, item.createdAt)}
          stampTs={item.createdAt}
          onImagePress={setViewerImage}
        />
      );
    },
    [messages, currentUserId]
  );

  return (
    <Screen style={{ flex: 1, backgroundColor: colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingHorizontal: Spacing.screenX,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        <IconButton icon="arrow-back" onPress={() => router.back()} />
        <Pressable
          style={{ flex: 1 }}
          onPress={() => otherUser && router.push(`/user/${otherUser.id}` as any)}
        >
          <Text variant="subheading" numberOfLines={1}>
            {otherUser?.displayName || 'Sohbet'}
          </Text>
          {otherUser?.username ? (
            <Text variant="caption" tone="textLight">@{otherUser.username}</Text>
          ) : null}
        </Pressable>
        <Avatar uri={otherUser?.profileImage} name={otherUser?.displayName} size={34} />
      </View>

      <Animated.View style={[{ flex: 1 }, chatContainerStyle]}>
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: Spacing.screenX, paddingTop: 16, paddingBottom: 8 }}
          onContentSizeChange={scrollToEnd}
          keyboardShouldPersistTaps="handled"
          ListFooterComponent={otherTyping ? <TypingBubble /> : null}
          ListEmptyComponent={
            otherTyping ? null : (
              <View style={{ alignItems: 'center', paddingVertical: 64, paddingHorizontal: 24 }}>
                <Ionicons name="chatbubble-ellipses-outline" size={32} color={colors.primary} />
                <Text variant="body" tone="textLight" style={{ marginTop: 10, fontStyle: 'italic', textAlign: 'center' }}>
                  İlk mesajı sen gönder.
                </Text>
              </View>
            )
          }
        />

        {/* Seçilen görsel önizlemesi */}
        {selectedImage && (
          <View style={{ paddingHorizontal: Spacing.screenX, paddingTop: 10 }}>
            <View style={{ alignSelf: 'flex-start', position: 'relative' }}>
              <Image
                source={{ uri: selectedImage }}
                style={{ width: 72, height: 72, borderRadius: 10 }}
                contentFit="cover"
              />
              <Pressable
                onPress={removeImage}
                style={{
                  position: 'absolute',
                  top: -6,
                  right: -6,
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  backgroundColor: 'rgba(0,0,0,0.7)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="close" size={14} color="#fff" />
              </Pressable>
            </View>
          </View>
        )}

        {/* Composer */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 10,
            paddingHorizontal: Spacing.screenX,
            paddingTop: 10,
            paddingBottom: 12,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            backgroundColor: colors.background,
          }}
        >
          <Pressable
            onPress={pickImage}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: colors.surfaceVariant,
            }}
          >
            <Ionicons name="image-outline" size={22} color={colors.textLight} />
          </Pressable>
          <View
            style={{
              flex: 1,
              justifyContent: 'center',
              minHeight: 44,
              maxHeight: 120,
              paddingHorizontal: 16,
              borderRadius: 999,
              backgroundColor: colors.surfaceVariant,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Bir mesaj yaz…"
              placeholderTextColor={colors.textLight}
              multiline
              style={{ fontSize: 14.5, lineHeight: 19, color: colors.text, paddingVertical: Platform.OS === 'ios' ? 12 : 8 }}
            />
          </View>
          <Pressable
            onPress={send}
            disabled={!canSend}
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: canSend ? colors.primary : colors.surfaceVariant,
            }}
          >
            <Ionicons
              name={isSending ? 'hourglass-outline' : 'arrow-up'}
              size={19}
              color={canSend ? colors.onPrimary : colors.textLight}
            />
          </Pressable>
        </View>
      </Animated.View>

      <ImageModal visible={!!viewerImage} imageUri={viewerImage || ''} onClose={() => setViewerImage(null)} />
    </Screen>
  );
}
