import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { Motion, Spacing, useTheme } from "@/constants/theme";
import { Text } from "./Text";

/** Bölüm künyesi: solda başlık, sağda düz metin bağlantı. */
export function SectionHeader({
  title,
  subtitle,
  onSeeAll,
  seeAllLabel,
}: {
  title: string;
  subtitle?: string;
  onSeeAll?: () => void;
  seeAllLabel?: string;
}) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <View style={styles.copy}>
          <Text variant="heading" numberOfLines={1}>
            {title}
          </Text>
          {!!subtitle && (
            <Text variant="caption" tone="textLight" numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          )}
        </View>

        {onSeeAll && (
          <Pressable
            onPress={onSeeAll}
            hitSlop={10}
            accessibilityRole="button"
            style={({ pressed }) => [styles.seeAll, { opacity: pressed ? Motion.pressOpacity : 1 }]}
          >
            <Text variant="label" color={colors.primary}>
              {seeAllLabel ?? t("common.seeAll")}
            </Text>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: Spacing.screenX,
    marginBottom: Spacing.md,
  },
  // Alt başlık olsa da olmasa da bağlantı, BAŞLIĞIN İLK SATIRIYLA hizalanır.
  row: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: Spacing.md },
  copy: { flex: 1, minWidth: 0 },
  subtitle: { marginTop: 2 },
  // (heading 25pt satır kutusu - label 18pt) / 2 → optik ortalama.
  seeAll: { flexDirection: "row", alignItems: "center", gap: 4, paddingTop: 3 },
});
