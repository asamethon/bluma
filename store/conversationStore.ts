import {
  addComment,
  getConversationComments,
} from '@/features/conversation/services/conversationComments';
import {
  cleanupConversationLikes,
  getLikedConversations,
  likeConversation,
} from '@/features/conversation/services/conversationLikes';
import { announceConversationToFollowers } from '@/features/conversation/services/conversationNotifications';
import { deleteConversation } from '@/features/conversation/services/conversationDeletion';
import {
  cleanupConversationQueries,
  createConversation,
  getConversationById,
  getConversationRealTimeUpdates,
  getUserConversations,
} from '@/features/conversation/services/conversationQueries';

export const conversationActions = {
  addComment,
  announceConversationToFollowers,
  createConversation,
  deleteConversation,
  getConversationById,
  getConversationComments,
  getConversationRealTimeUpdates,
  getLikedConversations,
  getUserConversations,
  likeConversation,
  cleanupListeners() {
    cleanupConversationLikes();
    cleanupConversationQueries();
  },
};
