import { Screen } from "@/components/ui";
import { useTheme } from "@/constants/theme";
import { StudioHub } from "@/features/story/components/studio/StudioHub";
import { useWriteStudio } from "@/features/story/hooks/useWriteStudio";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Yazma sekmesi = Yazı Stüdyosu (Hub). Ekran yalnızca hook'u çağırıp
// bileşeni dizer — tüm iş mantığı useWriteStudio içinde.
export default function WriteScreen() {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const s = useWriteStudio();

  // Özel tab bar: 64px + safe-area (min 10px)
  const tabBar = 64 + Math.max(bottom, 10);

  return (
    <Screen
      edges={["top"]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StudioHub
        stories={s.stories}
        refreshing={s.refreshing}
        onRefresh={s.onRefresh}
        expandedId={s.expandedId}
        onToggle={s.toggleExpand}
        onNewStory={s.newStory}
        onImportStory={s.importStory}
        onOpenChapter={s.openChapter}
        onAddChapter={s.addChapter}
        onEditInfo={s.editInfo}
        onDelete={s.deleteStory}
        bottomInset={tabBar}
      />
    </Screen>
  );
}
