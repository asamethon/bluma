import { pushNotificationService } from '@/services/pushNotificationService';
import { Conversation, ConversationComment, User } from '@/types';
import { observable } from '@legendapp/state';
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
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from '@react-native-firebase/firestore';
import { authActions, authState$ } from './authStore';

export interface ConversationState {
  conversations: Conversation[];
  userConversations: Conversation[];
  likedConversations: Conversation[];
  isLoading: boolean;
  currentConversation: Conversation | null;
  currentConversationComments: ConversationComment[];
}

// Create observable state
export const conversationState$ = observable<ConversationState>({
  conversations: [],
  userConversations: [],
  likedConversations: [],
  isLoading: true,
  currentConversation: null,
  currentConversationComments: [],
});

// Conversation actions
export const conversationActions = {
  // Initialize conversations
  async initializeConversations() {
    try {
      conversationState$.isLoading.set(true);
      
      const db = getFirestore();
      const conversationsRef = collection(db, 'conversations');
      
      // Get all active conversations
      const q = firestoreQuery(
        conversationsRef,
        where('isActive', '==', true),
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      
      // Listen for real-time updates
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const conversations: Conversation[] = [];
        
        if (snapshot && !snapshot.empty) {
          for (const doc of snapshot.docs) {
            const conversationData = { id: doc.id, ...doc.data() } as Conversation;
            
            // Get author data
            if (conversationData.authorId) {
              const author = await authActions.getUserById(conversationData.authorId);
              if (author) {
                conversationData.author = author;
              }
            }
            
            conversations.push(conversationData);
          }
        }
        
        conversationState$.conversations.set(conversations);
        conversationState$.isLoading.set(false);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Initialize conversations error:', error);
      conversationState$.isLoading.set(false);
    }
  },

  // Get user's conversations with real-time updates
  async getUserConversations(userId: string) {
    try {
      console.log('Getting conversations for user:', userId);
      const db = getFirestore();
      const conversationsRef = collection(db, 'conversations');
      
      const q = firestoreQuery(
        conversationsRef,
        where('authorId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log('User conversations snapshot:', {
          empty: snapshot.empty,
          size: snapshot.size,
          docs: snapshot.docs.length,
        });
        
        const conversations: Conversation[] = [];
        
        if (snapshot && !snapshot.empty) {
          for (const doc of snapshot.docs) {
            const conversationData = { id: doc.id, ...doc.data() } as Conversation;
            console.log('Conversation data:', conversationData);
            
            // Get author data
            if (conversationData.authorId) {
              const author = await authActions.getUserById(conversationData.authorId);
              if (author) {
                conversationData.author = author;
              }
            }
            
            conversations.push(conversationData);
          }
        }
        
        console.log('Final conversations array:', conversations.length);
        conversationState$.userConversations.set(conversations);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Get user conversations error:', error);
    }
  },

  // Get real-time updates for a specific conversation
  async getConversationRealTimeUpdates(conversationId: string) {
    try {
      console.log('Setting up real-time updates for conversation:', conversationId);
      const db = getFirestore();
      
      const conversationRef = doc(db, 'conversations', conversationId);
      
      const unsubscribe = onSnapshot(conversationRef, async (doc) => {
        if (doc.exists()) {
          const conversationData = { id: doc.id, ...doc.data() } as Conversation;
          console.log('Real-time conversation update:', {
            id: conversationData.id,
            likesCount: conversationData.likesCount,
            commentsCount: conversationData.commentsCount,
            viewsCount: conversationData.viewsCount,
          });
          
          // Get author data
          if (conversationData.authorId) {
            const author = await authActions.getUserById(conversationData.authorId);
            if (author) {
              conversationData.author = author;
            }
          }
          
          // Update the conversation in userConversations if it exists
          const currentUserConversations = conversationState$.userConversations.get();
          const updatedConversations = currentUserConversations.map(conv => 
            conv.id === conversationId ? conversationData : conv
          );
          conversationState$.userConversations.set(updatedConversations);
          
          // Also update in currentConversation if it's the same
          const currentConversation = conversationState$.currentConversation.get();
          if (currentConversation?.id === conversationId) {
            conversationState$.currentConversation.set(conversationData);
          }
        }
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Get conversation real-time updates error:', error);
    }
  },

  // Get user's liked conversations
  async getLikedConversations(userId: string) {
    try {
      console.log('Getting liked conversations for user:', userId);
      const db = getFirestore();
      
      const q = firestoreQuery(
        collection(db, 'users', userId, 'likedConversations'),
        orderBy('createdAt', 'desc')
      );
      
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        console.log('Liked conversations snapshot:', {
          empty: snapshot.empty,
          size: snapshot.size,
          docs: snapshot.docs.length,
        });
        
        const likedConversationIds: string[] = [];
        
        if (snapshot && !snapshot.empty) {
          for (const doc of snapshot.docs) {
            const likeData = doc.data() as any;
            if (likeData.conversationId) {
              likedConversationIds.push(likeData.conversationId);
            }
          }
        }
        
        console.log('Liked conversation IDs:', likedConversationIds);
        
        // For now, just store the IDs to avoid type issues
        // We'll create a simple structure with just the ID
        const likedConversations = likedConversationIds.map(id => ({
          id,
          authorId: '',
          title: '',
          content: '',
          likesCount: 0,
          commentsCount: 0,
          viewsCount: 0,
          isActive: true,
          createdAt: null,
          updatedAt: null,
          author: undefined,
        } as unknown as Conversation));
        
        console.log('Final liked conversations array:', likedConversations.length);
        conversationState$.likedConversations.set(likedConversations);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Get liked conversations error:', error);
    }
  },

  // Create new conversation
  async createConversation(conversation: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'viewsCount'>) {
    try {
      console.log('Creating conversation:', conversation);
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
      
      console.log('New conversation data:', newConversation);
      const docRef = await addDoc(conversationsRef, newConversation);
      console.log('Conversation created with ID:', docRef.id);
      
      return { success: true, conversationId: docRef.id };
    } catch (error) {
      console.error('Create conversation error:', error);
      return { success: false, error: 'Konuşma oluşturulurken bir hata oluştu.' };
    }
  },

  // Get conversation by ID
  async getConversationById(conversationId: string) {
    try {
      const db = getFirestore();
      const conversationRef = doc(db, 'conversations', conversationId);
      const conversationDoc = await getDoc(conversationRef);
      
      if (conversationDoc.exists()) {
        const conversationData = { id: conversationDoc.id, ...conversationDoc.data() } as Conversation;
        
        // Get author data
        if (conversationData.authorId) {
          const author = await authActions.getUserById(conversationData.authorId);
          if (author) {
            conversationData.author = author;
          }
        }
        
        conversationState$.currentConversation.set(conversationData);
        return conversationData;
      }
      
      return null;
    } catch (error) {
      console.error('Get conversation error:', error);
      return null;
    }
  },

  // Get conversation comments
  async getConversationComments(conversationId: string) {
    try {
      console.log('Getting comments for conversation:', conversationId);
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
            
            // Get user data
            if (commentData.userId) {
              const user = await authActions.getUserById(commentData.userId);
              if (user) {
                commentData.user = user;
              }
            }
            
            comments.push(commentData);
          }
        }
        
        conversationState$.currentConversationComments.set(comments);
      });
      
      return unsubscribe;
    } catch (error) {
      console.error('Get conversation comments error:', error);
    }
  },

  // Add comment to conversation
  async addComment(conversationId: string, content: string, image?: string) {
    try {
      const currentUser = authState$.user.get();
      if (!currentUser) {
        return { success: false, error: 'Kullanıcı bulunamadı.' };
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

      // Add image if provided
      if (image) {
        if (image.length > 1000000) { // 1MB check
          return { success: false, error: 'Resim çok büyük. Lütfen daha küçük bir resim seçin.' };
        }
        newComment.image = image;
      }
      
      await addDoc(commentsRef, newComment);
      
      // Update conversation comment count
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        commentsCount: increment(1),
        updatedAt: serverTimestamp(),
      });
      
      // Send notification to conversation author (background task)
      this.sendConversationCommentNotification(conversationId, currentUser.id, content);
      
      return { success: true };
    } catch (error) {
      console.error('Add comment error:', error);
      return { success: false, error: 'Yorum eklenirken bir hata oluştu.' };
    }
  },

  // Like conversation
  async likeConversation(conversationId: string) {
    try {
      const currentUser = authState$.user.get();
      if (!currentUser) {
        return { success: false, error: 'Kullanıcı bulunamadı.' };
      }

      // Firebase işlemlerini yap
      await conversationActions.performLikeConversationFirebaseOperation(conversationId, currentUser.id);
      
      return { success: true };
    } catch (error) {
      console.error('Like conversation error:', error);
      return { success: false, error: 'Beğeni eklenirken bir hata oluştu.' };
    }
  },

  // Firebase like işlemlerini arka planda yap
  async performLikeConversationFirebaseOperation(conversationId: string, userId: string) {
    try {
      const db = getFirestore();
      const conversationRef = doc(db, 'conversations', conversationId);
      
      // Check if already liked
      const likeDoc = await getDocs(firestoreQuery(collection(db, 'conversations', conversationId, 'likes'), where('userId', '==', userId)));
      
      if (!likeDoc.empty) {
        // Unlike - conversations/{conversationId}/likes koleksiyonundan sil
        await deleteDoc(likeDoc.docs[0].ref);
        
        // Unlike - users/{userId}/likedConversations koleksiyonundan sil
        const userLikedConversationsQuery = firestoreQuery(
          collection(db, 'users', userId, 'likedConversations'),
          where('conversationId', '==', conversationId)
        );
        const userLikedConversationsDoc = await getDocs(userLikedConversationsQuery);
        if (!userLikedConversationsDoc.empty) {
          await deleteDoc(userLikedConversationsDoc.docs[0].ref);
        }
        
        // Gerçek beğeni sayısını hesapla
        const allLikes = await getDocs(collection(db, 'conversations', conversationId, 'likes'));
        await updateDoc(conversationRef, { likesCount: allLikes.size });
      } else {
        // Like - conversations/{conversationId}/likes koleksiyonuna ekle
        await addDoc(collection(db, 'conversations', conversationId, 'likes'), {
          userId,
          createdAt: serverTimestamp(),
        });
        
        // Like - users/{userId}/likedConversations koleksiyonuna ekle
        await addDoc(collection(db, 'users', userId, 'likedConversations'), {
          conversationId,
          createdAt: serverTimestamp(),
        });
        
        // Gerçek beğeni sayısını hesapla
        const allLikes = await getDocs(collection(db, 'conversations', conversationId, 'likes'));
        await updateDoc(conversationRef, { likesCount: allLikes.size });
        
        // Bildirim gönderme işlemini arka planda yap
        this.sendConversationLikeNotification(conversationId, userId);
      }
    } catch (error) {
      console.error('Firebase like operation error:', error);
      // Hata durumunda UI'yi geri al
      conversationActions.revertLikeConversationUI(conversationId);
    }
  },

  // Conversation beğeni bildirimi gönder
  async sendConversationLikeNotification(conversationId: string, likerId: string) {
    try {
      const currentUser = authState$.user.get();
      if (!currentUser) return;

      const db = getFirestore();
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      
      if (!conversationDoc.exists()) {
        console.log('Conversation not found for like notification:', conversationId);
        return;
      }

      const conversationData = conversationDoc.data();
      const conversationAuthorId = conversationData.author?.id || conversationData.authorId;
      
      // Kendi konuşmasını beğenmişse bildirim gönderme
      if (conversationAuthorId === likerId) {
        return;
      }

      const likerName = currentUser.displayName || currentUser.username || "Bir kullanıcı";
      const conversationTitle = conversationData.title || "Konuşmanız";

      // Bildirim işlemlerini paralel yap
      Promise.all([
        // Firestore notification
        (async () => {
          try {
            const notificationsRef = collection(db, 'notifications');
            await addDoc(notificationsRef, {
              userId: conversationAuthorId,
              type: 'like',
              title: 'Yeni Beğeni',
              message: `${likerName} "${conversationTitle}" konuşmanızı beğendi`,
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
            console.error('Error creating like notification in Firestore:', error);
          }
        })(),
        // Push notification
        pushNotificationService.sendNotificationToUser(
          conversationAuthorId,
          'Yeni Beğeni!',
          `${likerName} "${conversationTitle}" konuşmanızı beğendi.`,
          {
            type: 'conversation',
            conversationId,
            likerId,
            profileImage: currentUser.profileImage,
          }
        ),
      ]).catch((error) => {
        console.error('Conversation like notification error:', error);
      });
    } catch (error) {
      console.error('Send conversation like notification error:', error);
    }
  },

  // Conversation yorum bildirimi gönder
  async sendConversationCommentNotification(conversationId: string, commenterId: string, commentText: string) {
    try {
      const currentUser = authState$.user.get();
      if (!currentUser) return;

      const db = getFirestore();
      const conversationDoc = await getDoc(doc(db, 'conversations', conversationId));
      
      if (!conversationDoc.exists()) {
        console.log('Conversation not found for comment notification:', conversationId);
        return;
      }

      const conversationData = conversationDoc.data();
      const conversationAuthorId = conversationData.author?.id || conversationData.authorId;
      
      // Kendi konuşmasına yorum yapmışsa bildirim gönderme
      if (conversationAuthorId === commenterId) {
        return;
      }

      const commenterName = currentUser.displayName || currentUser.username || "Bir kullanıcı";
      const conversationTitle = conversationData.title || "Konuşmanız";

      // Bildirim işlemlerini paralel yap
      Promise.all([
        // Firestore notification
        (async () => {
          try {
            const notificationsRef = collection(db, 'notifications');
            await addDoc(notificationsRef, {
              userId: conversationAuthorId,
              type: 'comment',
              title: 'Yeni Yorum',
              message: `${commenterName} "${conversationTitle}" konuşmanıza yorum yaptı`,
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
            console.error('Error creating comment notification in Firestore:', error);
          }
        })(),
        // Push notification
        pushNotificationService.sendNotificationToUser(
          conversationAuthorId,
          'Yeni Yorum!',
          `${commenterName} "${conversationTitle}" konuşmanıza yorum yaptı: ${commentText.substring(0, 50)}${commentText.length > 50 ? '...' : ''}`,
          {
            type: 'conversation',
            conversationId,
            commenterId,
            profileImage: currentUser.profileImage,
          }
        ),
      ]).catch((error) => {
        console.error('Conversation comment notification error:', error);
      });
    } catch (error) {
      console.error('Send conversation comment notification error:', error);
    }
  },

  // UI'yi geri al (hata durumunda)
  revertLikeConversationUI(conversationId: string) {
    const currentConversations = conversationState$.conversations.get();
    const conversationIndex = currentConversations.findIndex(c => c.id === conversationId);
    
    if (conversationIndex !== -1) {
      const conversation = currentConversations[conversationIndex];
      const isCurrentlyLiked = conversationState$.likedConversations.get().some(c => c.id === conversationId);
      
      if (isCurrentlyLiked) {
        // Geri al: unlike yapılmışsa like'a çevir
        conversationState$.conversations.set(prev => 
          prev.map(c => c.id === conversationId 
            ? { ...c, likesCount: (c.likesCount || 0) + 1 }
            : c
          )
        );
        conversationState$.likedConversations.set(prev => [...prev, conversation]);
      } else {
        // Geri al: like yapılmışsa unlike'a çevir
        conversationState$.conversations.set(prev => 
          prev.map(c => c.id === conversationId 
            ? { ...c, likesCount: Math.max(0, (c.likesCount || 0) - 1) }
            : c
          )
        );
        conversationState$.likedConversations.set(prev => prev.filter(c => c.id !== conversationId));
      }
    }
  },

  // Check if conversation is liked
  async isConversationLiked(conversationId: string): Promise<boolean> {
    try {
      const currentUser = authState$.user.get();
      if (!currentUser?.id) return false;

      // Real-time likedConversations state'inden kontrol et
      const likedConversations = conversationState$.likedConversations.get();
      return likedConversations.some(conversation => conversation.id === conversationId);
    } catch (error) {
      console.error('Check conversation like error:', error);
      return false;
    }
  },

  // Delete conversation
  async deleteConversation(conversationId: string) {
    try {
      const db = getFirestore();
      const conversationRef = doc(db, 'conversations', conversationId);
      await deleteDoc(conversationRef);
      
      return { success: true };
    } catch (error) {
      console.error('Delete conversation error:', error);
      return { success: false, error: 'Konuşma silinirken bir hata oluştu.' };
    }
  },

  // Update conversation
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
      console.error('Update conversation error:', error);
      return { success: false, error: 'Konuşma güncellenirken bir hata oluştu.' };
    }
  },

  // Announce conversation to followers
  async announceConversationToFollowers(conversationId: string, author: User) {
    try {
      console.log('Announcing conversation to followers:', conversationId);
      const db = getFirestore();
      
      // Get author's followers
      const followersQuery = firestoreQuery(
        collection(db, 'users', author.id, 'followers')
      );
      
      const followersSnapshot = await getDocs(followersQuery);
      
      if (followersSnapshot.empty) {
        console.log('No followers found for user:', author.id);
        return;
      }
      
      console.log('Found', followersSnapshot.docs.length, 'followers');
      
      // Create notifications for each follower
      const notificationPromises = followersSnapshot.docs.map(async (followerDoc: any) => {
        const followerId = followerDoc.id;
        
        const notificationData = {
          id: `${conversationId}_${followerId}_${Date.now()}`,
          userId: followerId,
          type: 'conversation_announcement',
          title: `${author.displayName || author.username} yeni bir konuşma başlattı`,
          message: `"${author.displayName || author.username}" takip ettiğiniz kişi yeni bir konuşma başlattı. Hemen katılın!`,
          data: {
            conversationId: conversationId,
            authorId: author.id,
            authorName: author.displayName || author.username,
          },
          isRead: false,
          createdAt: serverTimestamp(),
        };
        
        // Add notification to user's notifications collection
        const notificationRef = doc(db, 'notifications', notificationData.id);
        await setDoc(notificationRef, notificationData);
        
        // Send push notification
        try {
          console.log('Attempting to send push notification to follower:', followerId);
          const pushResult = await pushNotificationService.sendNotificationToUser(
            followerId,
            notificationData.title,
            notificationData.message,
            notificationData.data
          );
          console.log('Push notification result for follower:', followerId, 'Success:', pushResult);
        } catch (error) {
          console.error('Error sending push notification to follower:', followerId, error);
        }
        
        console.log('Notification created for follower:', followerId);
      });
      
      await Promise.all(notificationPromises);
      console.log('All follower notifications sent successfully');
      
    } catch (error) {
      console.error('Announce conversation to followers error:', error);
      throw error;
    }
  },

  // Cleanup listeners
  cleanupListeners() {
    // Cleanup will be handled by individual unsubscribe functions
  },
}; 