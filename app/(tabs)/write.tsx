import { Screen } from "@/components/ui";
import { useTheme } from "@/constants/theme";
import { StudioHub } from "@/features/story/components/studio/StudioHub";
import { useWriteStudio } from "@/features/story/hooks/useWriteStudio";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function WriteScreen() {
  const { colors } = useTheme();
  const { bottom } = useSafeAreaInsets();
  const s = useWriteStudio();

  const tabBar = 64 + Math.max(bottom, 10);

  return (
    <Screen
      edges={[]}
      style={{ flex: 1, backgroundColor: colors.background }}
    >
      <StudioHub
        stories={s.stories}
        refreshing={s.refreshing}
        onRefresh={s.onRefresh}
        expandedId={s.expandedId}
        onToggle={s.toggleExpand}
        onNewStory={s.newStory}
        onOpenChapter={s.openChapter}
        onAddChapter={s.addChapter}
        onEditInfo={s.editInfo}
        onLaunch={s.launchStory}
        onDelete={s.deleteStory}
        bottomInset={tabBar}
      />
    </Screen>
  );
}
