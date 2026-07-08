import { Text } from "@/components/ui";
import { Radius, Spacing, useTheme } from "@/constants/theme";
import { useResponsiveGrid } from "@/hooks/useResponsive";
import { Story } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import {
    FlatList,
    Pressable,
    RefreshControl,
    StyleSheet,
    View,
} from "react-native";
import { StudioStoryCard } from "./StudioStoryCard";

type Props = {
  stories: Story[];
  refreshing: boolean;
  onRefresh: () => void;
  expandedId: string | null;
  onToggle: (id: string) => void;
  onNewStory: () => void;
  onImportStory: () => void;
  onOpenChapter: (id: string, index: number) => void;
  onAddChapter: (id: string) => void;
  onEditInfo: (id: string) => void;
  onDelete: (story: Story) => void;
  bottomInset: number;
};

// Yazı Stüdyosu (Hub) — yeni hikâye CTA'sı + yazarın hikâye listesi.
export function StudioHub({
  stories,
  refreshing,
  onRefresh,
  expandedId,
  onToggle,
  onNewStory,
  onImportStory,
  onOpenChapter,
  onAddChapter,
  onEditInfo,
  onDelete,
  bottomInset,
}: Props) {
  const { colors, shadows } = useTheme();
  const { numColumns, columnWidth } = useResponsiveGrid();

  const header = (
    <View>
      <Text variant="title" style={{ marginBottom: 4 }}>
        Yazı Stüdyosu
      </Text>
      <Text
        variant="body"
        tone="textSecondary"
        style={{ marginBottom: Spacing.xl }}
      >
        Hikâyelerin, taslakların ve bölümlerin — hepsi burada.
      </Text>

      <Pressable
        onPress={onNewStory}
        style={[
          styles.cta,
          { backgroundColor: colors.primarySoft, borderColor: colors.primary },
        ]}
      >
        <View
          style={[
            styles.ctaIcon,
            shadows.bloom,
            { backgroundColor: colors.bloom },
          ]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading" style={{ fontSize: 16.5 }}>
            Yeni Hikâye Başlat
          </Text>
          <Text variant="caption" tone="textSecondary" style={{ marginTop: 2 }}>
            Başlığını ve türünü seç, ilk bölümünü yaz
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.primary} />
      </Pressable>

      <Pressable
        onPress={onImportStory}
        style={[
          styles.cta,
          { backgroundColor: colors.surfaceVariant, borderColor: colors.border, marginTop: Spacing.sm },
        ]}
      >
        <View
          style={[
            styles.ctaIcon,
            { backgroundColor: colors.surface },
          ]}
        >
          <Ionicons name="download-outline" size={20} color={colors.text} />
        </View>
        <View style={{ flex: 1 }}>
          <Text variant="heading" style={{ fontSize: 16.5 }}>
            Hikâyeni Taşı
          </Text>
          <Text variant="caption" tone="textSecondary" style={{ marginTop: 2 }}>
            Wattpad'den tek seferde yapıştır, otomatik bölümlere ayrılsın
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color={colors.textSecondary} />
      </Pressable>

      {stories.length > 0 && (
        <View style={styles.sectionRow}>
          <View style={[styles.tick, { backgroundColor: colors.bloom }]} />
          <Text variant="heading" style={{ fontSize: 20 }}>
            Hikâyelerin
          </Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      key={`grid-${numColumns}`}
      data={stories}
      keyExtractor={(s) => s.id}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? { gap: Spacing.gutter } : undefined}
      ListHeaderComponent={header}
      contentContainerStyle={{
        paddingHorizontal: Spacing.screenX,
        paddingTop: Spacing.sm,
        paddingBottom: bottomInset + Spacing.xxl,
        gap: Spacing.md + 2,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
      }
      showsVerticalScrollIndicator={false}
      renderItem={({ item }) => (
        <View style={numColumns > 1 ? { width: columnWidth } : undefined}>
          <StudioStoryCard
            story={item}
            expanded={expandedId === item.id}
            onToggle={() => onToggle(item.id)}
            onOpenChapter={(i) => onOpenChapter(item.id, i)}
            onAddChapter={() => onAddChapter(item.id)}
            onEditInfo={() => onEditInfo(item.id)}
            onDelete={() => onDelete(item)}
          />
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.empty}>
          <Ionicons
            name="document-text-outline"
            size={44}
            color={colors.textLight}
          />
          <Text variant="subheading" style={{ marginTop: Spacing.md }}>
            Henüz hikâyen yok
          </Text>
          <Text
            variant="body"
            tone="textSecondary"
            center
            style={{ marginTop: 4 }}
          >
            Yukarıdaki “Yeni Hikâye Başlat” ile ilk hikâyeni yazmaya başla.
          </Text>
        </View>
      }
    />
  );
}

const styles = StyleSheet.create({
  cta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md + 2,
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
    borderRadius: Radius.xl,
    borderWidth: 1.5,
    borderStyle: "dashed",
  },
  ctaIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm + 2,
    marginBottom: Spacing.md,
  },
  tick: { width: 5, height: 20, borderRadius: Radius.pill },
  empty: {
    alignItems: "center",
    paddingVertical: Spacing.huge,
    paddingHorizontal: Spacing.xl,
  },
});
