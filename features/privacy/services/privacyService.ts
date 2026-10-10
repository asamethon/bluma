import {
  canSendMessageTo,
  canViewProfile,
  filterDiscoverable,
  filterPrivateContent,
  isFollowerOf,
} from './privacy/access';
import { applyLocally, load, update } from './privacy/settings';

export const privacyActions = {
  applyLocally,
  canSendMessageTo,
  canViewProfile,
  filterDiscoverable,
  filterPrivateContent,
  isFollowerOf,
  load,
  update,
};
