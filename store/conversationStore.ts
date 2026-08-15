import { Conversation, ConversationComment, User } from '@/types';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  query as firestoreQuery,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  limit,
  onSnapshot,
  orderBy,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from '@react-native-firebase/firestore';
import { authActions } from './authStore';
import { notificationActions } from './notificationStore';
import i18n from '@/i18n';
import { store } from './index';
import { patchConversation } from './slices/conversationSlice';
import { logger } from '@/utils/logger';

export type { ConversationState } from './slices/conversationSlice';

let userConversationsUnsub: (() => void) | null = null;
let userConversationsUserId: string | null = null;
let likedConversationsUnsub: (() => void) | null = null;
let likedConversationsUserId: string | null = null;

async function enrichConversation(snapDoc: any): Promise<Conversation> {
  const conversationData = { id: snapDoc.id, ...snapDoc.data() } as Conversation;
  if (conversationData.authorId) {
    const author = await authActions.getUserById(conversationData.authorId);
    if (author) conversationData.author = author;
  }
  return conversationData;
}

export const conversationActions = {
  async initializeConversations() {
    try {
      store.dispatch(patchConversation({ isLoading: true }));
      
      const db = getFirestore();
      const conversationsRef = collection(db, 'conversations');
      
      const q = firestoreQuery(
        conversationsRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const conversations: Conversation[] = snapshot
          ? await Promise.all(snapshot.docs.map(d => enrichConversation(d)))
          : [];

        store.dispatch(patchConversation({ conversations, isLoading: false }));
      });

      return unsubscribe;
    } catch (error) {
      logger.error('Initialize conversations error:', error);
      store.dispatch(patchConversation({ isLoading: false }));
    }
  },

  async getUserConversations(userId: string) {
    try {
      if (userConversationsUnsub && userConversationsUserId === userId) return userConversationsUnsub;
      if (userConversationsUnsub) userConversationsUnsub();
      userConversationsUserId = userId;

      const db = getFirestore();
      const conversationsRef = collection(db, 'conversations');

      const q = firestoreQuery(
        conversationsRef,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(50)
      );

      userConversationsUnsub = onSnapshot(q, async (snapshot) => {
        const conversations: Conversation[] = snapshot
          ? await Promise.all(snapshot.docs.map(d => enrichConversation(d)))
          : [];
        store.dispatch(patchConversation({ userConversations: conversations }));
      });

      return userConversationsUnsub;
    } catch (error) {
      logger.error('Get user conversations error:', error);
    }
  },

  async getConversationRealTimeUpdates(conversationId: string) {
    try {
      const db = getFirestore();

      const conversationRef = doc(db, 'conversations', conversationId);

      const unsubscribe = onSnapshot(conversationRef, async (doc) => {
        if (doc.exists()) {
          const conversationData = await enrichConversation(doc);

          const currentUserConversations = store.getState().conversation.userConversations;
          const updatedConversations = currentUserConversations.map(conv =>
            conv.id === conversationId ? conversationData : conv
          );
          store.dispatch(patchConversation({ userConversations: updatedConversations }));

          const currentConversation = store.getState().conversation.currentConversation;
          if (currentConversation?.id === conversationId) {
            store.dispatch(patchConversation({ currentConversation: conversationData }));
          }
        }
      });
      
      return unsubscribe;
    } catch (error) {
      logger.error('Get conversation real-time updates error:', error);
    }
  },

  async getLikedConversations(userId: string) {
    try {
      if (likedConversationsUnsub && likedConversationsUserId === userId) return likedConversationsUnsub;
      if (likedConversationsUnsub) likedConversationsUnsub();
      likedConversationsUserId = userId;

      const db = getFirestore();

      const q = firestoreQuery(
        collection(db, 'users', userId, 'likedConversations'),
        orderBy('createdAt', 'desc')
      );

      likedConversationsUnsub = onSnapshot(q, (snapshot) => {
        const likedConversationIds = snapshot
          ? snapshot.docs
              .map(d => (d.data() as any)?.conversationId)
              .filter((id: unknown): id is string => typeof id === 'string')
          : [];

        store.dispatch(patchConversation({ likedConversationIds }));
      });

      return likedConversationsUnsub;
    } catch (error) {
      logger.error('Get liked conversations error:', error);
    }
  },

  async createConversation(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'viewsCount'>) {
    try {
      logger.debug('Creating conversation:', conversation);
      const db = getFirestore();
      const conversationsRef = collection(db, 'conversations');
      
      const newConversation = {
        ...conversation,
        likesCount: 0,
        commentsCount: 0,
        viewsCount: 0,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      
      logger.debug('New conversation data:', newConversation);
      const docRef = await addDoc(conversationsRef, newConversation);
      logger.debug('Conversation created with ID:', docRef.id);
      
      return { success: true, conversationId: docRef.id };
    } catch (error) {
      logger.error('Create conversation error:', error);
      return { success: false, error: i18n.t('conversations.createFailed') };
    }
  },

  async getConversationById(conversationId: string) {
    try {
      const db = getFirestore();
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = { id: conversationDoc.id, ...conversationDoc.data() } as Conversation;
        
        if (conversationData.authorId) {
          const author = await authActions.getUserById(conversationData.authorId);
          if (author) {
            conversationData.author = author;
          }
        }
        
        store.dispatch(patchConversation({ currentConversation: conversationData }));
        return conversationData;
      }
      
      return null;
    } catch (error) {
      logger.error('Get conversation error:', error);
      return null;
    }
  },

  async getConversationComments(conversationId: string) {
    try {
      logger.debug('Getting comments for conversation:', conversationId);
      const db = getFirestore();
      const commentsRef = collection(db, 'conversationComments');
      

      
      const q = firestoreQuery(
        commentsRef,
        where('conversationId', '==', conversationId),
        orderBy('createdAt', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const comments: ConversationComment[] = [];
        
        if (snapshot && !snapshot.empty) {
          for (const doc of snapshot.docs) {
            const commentData = { id: doc.id, ...doc.data() } as ConversationComment;
            
            if (commentData.userId) {
              const user = await authActions.getUserById(commentData.userId);
              if (user) {
                commentData.user = user;
              }
            }
            
            comments.push(commentData);
          }
        }
        
        store.dispatch(patchConversation({ currentConversationComments: comments }));
      });
      
      return unsubscribe;
    } catch (error) {
      logger.error('Get conversation comments error:', error);
    }
  },

  async addComment(conversationId: string, content: string, image?: string) {
    try {
      const currentUser = store.getState().auth.user;
      if (!currentUser) {
        return { success: false, error: i18n.t('errors.userNotFound') };
      }

      const db = getFirestore();
      const commentsRef = collection(db, 'conversationComments');
      
      const newComment: any = {
        conversationId,
        userId: currentUser.id,
        content,
        likesCount: 0,
        createdAt: serverTimestamp(),
      };

      if (image) {
        if (image.length > 1000000) {
          return { success: false, error: i18n.t('imageUpload.tooLarge') };
        }
        newComment.image = image;
      }
      
      await addDoc(commentsRef, newComment);
      
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      
      this.sendConversationCommentNotification(conversationId, currentUser.id, content);
      
      return { success: true };
    } catch (error) {
      logger.error('Add comment error:', error);
      return { success: false, error: i18n.t('conversations.commentFailed') };
    }
  },

  async likeConversation(conversationId: string) {
    try {
      const currentUser = store.getState().auth.user;
      if (!currentUser) {
        return { success: false, error: i18n.t('errors.userNotFound') };
      }

      conversationActions.toggleLikeConversationUI(conversationId);

      conversationActions.performLikeConversationFirebaseOperation(conversationId, currentUser.id);

      return { success: true };
    } catch (error) {
      logger.error('Like conversation error:', error);
      return { success: false, error: i18n.t('conversations.likeFailed') };
    }
  },

  toggleLikeConversationUI(conversationId: string) {
    const state = store.getState().conversation;
    const isLiked = state.likedConversationIds.includes(conversationId);
    const delta = isLiked ? -1 : 1;
    const bump = (list: Conversation[]) =>
      list.map(c => c.id === conversationId
        ? { ...c, likesCount: Math.max(0, (c.likesCount || 0) + delta) }
        : c
      );

    store.dispatch(patchConversation({
      likedConversationIds: isLiked
        ? state.likedConversationIds.filter(id => id !== conversationId)
        : [...state.likedConversationIds, conversationId],
      conversations: bump(state.conversations),
      userConversations: bump(state.userConversations),
      ...(state.currentConversation?.id === conversationId
        ? {
            currentConversation: {
              ...state.currentConversation,
              likesCount: Math.max(0, (state.currentConversation.likesCount || 0) + delta),
            },
          }
        : {}),
    }));
  },

  async performLikeConversationFirebaseOperation(conversationId: string, userId: string) {
    try {
      const db = getFirestore();
      const conversationRef = doc(db, 'conversations', conversationId);
      const likesRef = collection(db, 'conversations', conversationId, 'likes');
      const userLikedRef = collection(db, 'users', userId, 'likedConversations');

      const likeDocs = await getDocs(firestoreQuery(likesRef, where('userId', '==', userId)));

      if (!likeDocs.empty) {
        const userLikedDocs = await getDocs(firestoreQuery(userLikedRef, where('conversationId', '==', conversationId)));
        await Promise.all([
          ...likeDocs.docs.map(d => deleteDoc(d.ref)),
          ...userLikedDocs.docs.map(d => deleteDoc(d.ref)),
          updateDoc(conversationRef, { likesCount: increment(-1) }),
        ]);
      } else {
        await Promise.all([
          setDoc(doc(likesRef, userId), { userId, createdAt: serverTimestamp() }),
          setDoc(doc(userLikedRef, conversationId), { conversationId, createdAt: serverTimestamp() }),
          updateDoc(conversationRef, { likesCount: increment(1) }),
        ]);

        this.sendConversationLikeNotification(conversationId, userId);
      }
    } catch (error) {
      logger.error('Firebase like operation error:', error);
      conversationActions.revertLikeConversationUI(conversationId);
    }
  },

  async sendConversationLikeNotification(conversationId: string, likerId: string) {
    try {
      const currentUser = store.getState().auth.user;
      if (!currentUser) return;

      const db = getFirestore();
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      
      if (!conversationDoc.exists()) {
        logger.debug('Conversation not found for like notification:', conversationId);
        return;
      }

      const conversationData = conversationDoc.data();
      const conversationAuthorId = conversationData.author?.id || conversationData.authorId;
      
      if (conversationAuthorId === likerId) {
        return;
      }

      const likerName = currentUser.displayName || currentUser.username || i18n.t('notifications.someone');
      const conversationTitle = conversationData.title || i18n.t('conversations.yourConversation');

      try {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
          userId: conversationAuthorId,
          senderId: likerId,
          type: 'like',
          title: i18n.t('notifications.newLikeTitle'),
          message: i18n.t('notifications.conversationLikedMessage', { name: likerName, conversation: conversationTitle }),
          data: {
            conversationId,
            likerId,
            likerProfileImage: currentUser.profileImage,
          },
          isRead: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        logger.error('Conversation like notification error:', error);
      }
    } catch (error) {
      logger.error('Send conversation like notification error:', error);
    }
  },

  async sendConversationCommentNotification(conversationId: string, commenterId: string, commentText: string) {
    try {
      const currentUser = store.getState().auth.user;
      if (!currentUser) return;

      const db = getFirestore();
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      
      if (!conversationDoc.exists()) {
        logger.debug('Conversation not found for comment notification:', conversationId);
        return;
      }

      const conversationData = conversationDoc.data();
      const conversationAuthorId = conversationData.author?.id || conversationData.authorId;
      
      if (conversationAuthorId === commenterId) {
        return;
      }

      const commenterName = currentUser.displayName || currentUser.username || i18n.t('notifications.someone');
      const conversationTitle = conversationData.title || i18n.t('conversations.yourConversation');

      try {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
          userId: conversationAuthorId,
          senderId: commenterId,
          type: 'comment',
          title: i18n.t('notifications.newCommentTitle'),
          message: i18n.t('notifications.conversationCommentMessage', { name: commenterName, conversation: conversationTitle }),
          data: {
            conversationId,
            commenterId,
            commentText,
            commenterProfileImage: currentUser.profileImage,
          },
          isRead: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } catch (error) {
        logger.error('Conversation comment notification error:', error);
      }
    } catch (error) {
      logger.error('Send conversation comment notification error:', error);
    }
  },

  revertLikeConversationUI(conversationId: string) {
    conversationActions.toggleLikeConversationUI(conversationId);
  },

  isConversationLiked(conversationId: string): boolean {
    return store.getState().conversation.likedConversationIds.includes(conversationId);
  },

  async deleteConversation(conversationId: string) {
    try {
      const db = getFirestore();
      const conversationRef = doc(db, 'conversations', conversationId);
      await deleteDoc(conversationRef);
      
      return { success: true };
    } catch (error) {
      logger.error('Delete conversation error:', error);
      return { success: false, error: i18n.t('conversations.deleteFailed') };
    }
  },

  async updateConversation(conversationId: string, updates: Partial<Conversation>) {
    try {
      const db = getFirestore();
      const conversationRef = doc(db, 'conversations', conversationId);
      
      await updateDoc(conversationRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      
      return { success: true };
    } catch (error) {
      logger.error('Update conversation error:', error);
      return { success: false, error: i18n.t('conversations.updateFailed') };
    }
  },

  async announceConversationToFollowers(conversationId: string, author: User) {
    try {
      logger.debug('Announcing conversation to followers:', conversationId);
      const db = getFirestore();
      
      const followersQuery = firestoreQuery(
        collection(db, 'users', author.id, 'followers')
      );
      
      const followersSnapshot = await getDocs(followersQuery);
      
      if (followersSnapshot.empty) {
        logger.debug('No followers found for user:', author.id);
        return;
      }
      
      logger.debug('Found', followersSnapshot.docs.length, 'followers');
      
      const params = { name: author.displayName || author.username || i18n.t('notifications.someone') };
      const title = i18n.t('notifications.newConversationTitle', params);
      const message = i18n.t('notifications.newConversationMessage', params);
      const notificationPromises = followersSnapshot.docs.map(async (followerDoc: any) => {
        const followerId = followerDoc.id;
        if (followerId === author.id) return;

        await notificationActions.createNotification({
          userId: followerId,
          senderId: author.id,
          type: 'conversation_announcement',
          title,
          message,
          data: {
            conversationId,
            authorId: author.id,
            authorName: author.displayName || author.username,
            i18n: {
              titleKey: 'notifications.newConversationTitle',
              messageKey: 'notifications.newConversationMessage',
              params,
            },
          },
          isRead: false,
        });
      });
      
      await Promise.all(notificationPromises);
      logger.debug('All follower notifications sent successfully');
      
    } catch (error) {
      logger.error('Announce conversation to followers error:', error);
      throw error;
    }
  },

  cleanupListeners() {
    if (userConversationsUnsub) userConversationsUnsub();
    userConversationsUnsub = null;
    userConversationsUserId = null;
    if (likedConversationsUnsub) likedConversationsUnsub();
    likedConversationsUnsub = null;
    likedConversationsUserId = null;
  },
};
