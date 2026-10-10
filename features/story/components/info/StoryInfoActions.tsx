import { Button, IconButton } from '@/components/ui';
import { useTheme } from '@/constants/theme';
import type { StoryInfoStyles } from '@/features/story/styles/storyInfoStyles';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

type Props = {
  downloaded: boolean;
  downloading: boolean;
  saved: boolean;
  styles: StoryInfoStyles;
  onDownload: () => void;
  onSave: () => void;
  onShare: () => void;
};

export const StoryInfoActions = memo(function StoryInfoActions(props: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { downloaded, downloading, saved, styles, onDownload, onSave, onShare } = props;

  return (
    <View style={styles.actionsRow}>
      <Button
        label={saved ? t('storyScreen.inLibrary') : t('storyScreen.addToLibrary')}
        icon={saved ? 'bookmark' : 'bookmark-outline'}
        variant={saved ? 'secondary' : 'outline'}
        size="md"
        onPress={onSave}
        style={styles.primaryAction}
      />
      {downloading ? (
        <View style={{ width: 46, height: 46, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : (
        <IconButton
          icon={downloaded ? 'checkmark-circle' : 'download-outline'}
          variant="outline"
          size={46}
          iconSize={19}
          color={downloaded ? colors.primary : colors.text}
          onPress={onDownload}
        />
      )}
      <IconButton icon="share-social-outline" variant="outline" size={46} iconSize={19} onPress={onShare} />
    </View>
  );
});
