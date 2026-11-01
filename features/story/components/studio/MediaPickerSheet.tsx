import { ListRow, Sheet, useSheetAction } from '@/components/ui';
import { VIDEO_MAX_SECONDS } from '@/services/media/limits';
import type { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

type Props = {
  visible: boolean;
  onClose: () => void;
  onPickImage: () => void;
  onPickGif: () => void;
  onPickVideo: () => void;
  /** KLIPY anahtarı yoksa hazır GIF arama satırı hiç gösterilmez. */
  gifSearchEnabled: boolean;
  onSearchGif: () => void;
};

type Row = {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
  action: () => void;
};

/**
 * Bölüm metnine medya ekleme sayfası. Sistem seçicisi `useSheetAction` ile
 * sayfa KAPANDIKTAN sonra açılır: iOS'ta kapanmakta olan bir modalın üstünde
 * galeri açılamaz (bkz. docs/ARCHITECTURE.md).
 */
export function MediaPickerSheet(props: Props) {
  const { t } = useTranslation();
  const after = useSheetAction(props.onClose);

  const rows: Row[] = [
    { icon: 'image-outline', title: t('studio.mediaImage'), action: props.onPickImage },
    ...(props.gifSearchEnabled
      ? [{ icon: 'happy-outline' as const, title: t('studio.mediaGifSearch'), action: props.onSearchGif }]
      : []),
    { icon: 'film-outline', title: t('studio.mediaGif'), action: props.onPickGif },
    {
      icon: 'videocam-outline',
      title: t('studio.mediaVideo'),
      subtitle: t('studio.mediaVideoHint', { seconds: VIDEO_MAX_SECONDS }),
      action: props.onPickVideo,
    },
  ];

  return (
    <Sheet
      visible={props.visible}
      onClose={props.onClose}
      onClosed={after.run}
      title={t('studio.mediaSheetTitle')}
    >
      <View>
        {rows.map((row, index) => (
          <ListRow
            key={row.icon}
            icon={row.icon}
            title={row.title}
            subtitle={row.subtitle}
            showChevron={false}
            divider={index < rows.length - 1}
            onPress={() => after.schedule(row.action)}
          />
        ))}
      </View>
    </Sheet>
  );
}
