import ImageModal from '@/components/ui/ImageModal';
import ReportSheet from '@/features/moderation/components/ReportSheet';
import type { User } from '@/types';
import type { useConversationMenu } from '../hooks/useConversationMenu';
import type { useUserProfileModel } from '../hooks/useUserProfileModel';
import { ProfileMessageComposer } from './ProfileMessageComposer';
import { UserProfileMenu } from './UserProfileMenu';

type Props = {
  user: User;
  topInset: number;
  model: ReturnType<typeof useUserProfileModel>;
  menu: ReturnType<typeof useConversationMenu>;
};

/** Ekranın üstünde yüzen katmanlar: görsel, pano yazıcısı, şikâyet ve menü. */
export function UserProfileOverlays({ user, topInset, model, menu }: Props) {
  return (
    <>
      <ImageModal
        visible={!!model.imageUri}
        imageUri={model.imageUri || ''}
        onClose={() => model.setImageUri(null)}
      />
      {model.currentUser && (
        <ProfileMessageComposer
          visible={model.composerVisible}
          user={model.currentUser}
          boardOwner={model.currentUser.id === user.id ? undefined : user}
          onClose={() => model.setComposerVisible(false)}
        />
      )}
      <ReportSheet
        visible={!!menu.reportTarget}
        onClose={menu.closeReport}
        target={menu.reportTarget ? { type: 'conversation', ...menu.reportTarget } : null}
      />
      <UserProfileMenu
        user={user}
        top={topInset + 52}
        blocked={model.blocked}
        menuVisible={model.menuVisible}
        reportVisible={model.reportVisible}
        onCloseMenu={() => model.setMenuVisible(false)}
        onReport={model.report}
        onCloseReport={() => model.setReportVisible(false)}
        onToggleBlock={model.toggleBlock}
      />
    </>
  );
}
