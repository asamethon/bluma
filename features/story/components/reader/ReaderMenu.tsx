import { MenuButton, type MenuItem } from '@/components/ui';
import { useGuestGate } from '@/contexts/GuestContext';
import { moderationActions } from '@/store/moderationStore';
import type { Story } from '@/types';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert } from 'react-native';

type Props = {
  story: Story;
  currentUserId?: string;
  color: string;
  glassScheme: 'light' | 'dark';
  onOpenList: () => void;
  onReport: () => void;
};

/** Okuyucunun taşma menüsü — sistem menüsü olarak, butonun altında açılır. */
export function ReaderMenu(props: Props) {
  const { t } = useTranslation();
  const router = useRouter();
  const { requireAuth } = useGuestGate();

  const blockAuthor = () => {
    if (!requireAuth('default')) return;
    Alert.alert(t('reader.blockAuthorTitle'), t('userProfile.blockConfirm', {
      name: props.story.author?.displayName || t('reader.thisAuthor'),
    }), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('userProfile.block'), style: 'destructive', onPress: () => {
          void moderationActions.blockUser(props.story.authorId).then(result => {
            if (result.success) {
              Alert.alert(t('userProfile.blockedTitle'), t('reader.authorBlocked'));
              router.back();
            } else Alert.alert(t('common.error'), result.error || t('moderation.blockFailed'));
          });
        },
      },
    ]);
  };

  const items: MenuItem[] = [
    {
      id: 'list',
      label: t('lists.addToList'),
      symbol: 'bookmark',
      onPress: () => { if (requireAuth('save')) props.onOpenList(); },
    },
    {
      id: 'report',
      label: t('report.targetStory'),
      symbol: 'flag',
      onPress: () => { if (requireAuth('default')) props.onReport(); },
    },
  ];
  if (props.currentUserId !== props.story.authorId) {
    items.push({
      id: 'block',
      label: t('reader.blockAuthorTitle'),
      symbol: 'person.slash',
      destructive: true,
      onPress: blockAuthor,
    });
  }

  return (
    <MenuButton
      items={items}
      size={38}
      iconSize={20}
      color={props.color}
      glassColorScheme={props.glassScheme}
      accessibilityLabel={t('common.more')}
    />
  );
}
