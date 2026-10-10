import {
  addComment,
  getConversationComments,
} from '@/features/conversation/services/conversationComments';
import {
  cleanupConversationLikes,
  getLikedConversations,
  likeConversation,
  performLikeConversationFirebaseOperation,
  toggleLikeConversationUI,
} from '@/features/conversation/services/conversationLikes';
import { announceConversationToFollowers } from '@/features/conversation/services/conversationNotifications';
import {
  cleanupConversationQueries,
  createConversation,
  deleteConversation,
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
  performLikeConversationFirebaseOperation,
  toggleLikeConversationUI,
  revertLikeConversationUI: toggleLikeConversationUI,
  cleanupListeners() {
    cleanupConversationLikes();
    cleanupConversationQueries();
  },
};
