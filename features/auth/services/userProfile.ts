import { getUserById } from './userCache';
import { deleteAccount } from './profile/accountDeletion';
import { completeOnboarding } from './profile/onboardingProfile';
import { updateUserProfile } from './profile/profileUpdate';
import { checkUsernameAvailability } from './profile/usernameAvailability';

export const userProfileActions = {
  checkUsernameAvailability,
  completeOnboarding,
  deleteAccount,
  getUserById,
  updateUserProfile,
};
