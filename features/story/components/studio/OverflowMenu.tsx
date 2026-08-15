import { Text } from '@/components/ui';
import { Radius, Spacing, useTheme } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

export type OverflowItem = {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  danger?: boolean;
  onPress: () => void;
};

export function OverflowMenu({
  visible,
  onClose,
  items,
  top = 88,
}: {
  visible: boolean;
  onClose: () => void;
  items: OverflowItem[];
  top?: number;
}) {
  const { colors, shadows } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View
          style={[
            styles.menu,
            shadows.lg,
            { top, backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          {items.map((it, i) => (
            <Pressable
              key={i}
              onPress={() => { onClose(); it.onPress(); }}
              style={({ pressed }) => [
                styles.item,
                { backgroundColor: pressed ? colors.surfaceVariant : 'transparent' },
              ]}
            >
              <Ionicons name={it.icon} size={18} color={it.danger ? colors.error : colors.text} />
              <Text variant="bodyStrong" color={it.danger ? colors.error : colors.text}>
                {it.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1 },
  menu: {
    position: 'absolute',
    right: Spacing.screenX,
    minWidth: 212,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.xs + 2,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md - 2,
    borderRadius: Radius.sm,
  },
});
