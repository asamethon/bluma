import { emailAuthActions } from '@/features/auth/services/emailAuth';
import { followRelationsActions } from '@/features/auth/services/followRelations';
import { sessionActions } from '@/features/auth/services/session';
import { socialAuthActions } from '@/features/auth/services/socialAuth';
import { userProfileActions } from '@/features/auth/services/userProfile';

export const authActions = {
  ...sessionActions,
  ...emailAuthActions,
  ...socialAuthActions,
  ...userProfileActions,
  ...followRelationsActions,
};
