import { Book, Chapter } from '@/types';
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDoc,
    getDocs,
    getFirestore,
    orderBy,
    query,
    serverTimestamp,
    where,
} from '@react-native-firebase/firestore';
import { authState$ } from '../../../store/authStore';
import { storyState$ } from '../../../store/storyStore';
import { updateUserStoriesCount } from './storyApi';
import { getUserById } from './userCache';

// Book CRUD operations
export async function createBook(bookData: Omit<Book, 'id' | 'createdAt' | 'updatedAt' | 'likesCount' | 'commentsCount' | 'viewsCount' | 'author'>) {
  try {
    storyState$.isLoading.set(true);
    const { user } = authState$.get();

    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const firestore = getFirestore();
    const booksRef = collection(firestore, 'books');

    const newBook = {
      ...bookData,
      authorId: user.id,
      likesCount: 0,
      commentsCount: 0,
      viewsCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(booksRef, newBook);

    // Update user's stories count only for published books
    if (bookData.isPublished) {
      await updateUserStoriesCount(user.id, 1);
    }

    storyState$.isLoading.set(false);
    return { success: true, bookId: docRef.id };
  } catch (error) {
    console.error('Create book error:', error);
    storyState$.isLoading.set(false);
    storyState$.error.set(error instanceof Error ? error.message : 'Book creation failed');
    return { success: false, error: error instanceof Error ? error.message : 'Book creation failed' };
  }
}

export async function createChapter(bookId: string, chapterData: Omit<Chapter, 'id' | 'createdAt' | 'updatedAt'>) {
  try {
    const firestore = getFirestore();
    const chaptersRef = collection(firestore, 'books', bookId, 'chapters');

    const newChapter = {
      ...chapterData,
      bookId,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(chaptersRef, newChapter);

    return { success: true, chapterId: docRef.id };
  } catch (error) {
    console.error('Create chapter error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Chapter creation failed' };
  }
}

export async function loadUserBooks(userId: string): Promise<Book[]> {
  try {
    const firestore = getFirestore();
    const booksQuery = query(
      collection(firestore, 'books'),
      where('authorId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    const snapshot = await getDocs(booksQuery);
    const books: Book[] = [];

    for (const bookDoc of snapshot.docs) {
      const bookData = bookDoc.data() as Book;
      const author = await getUserById(bookData.authorId);

      books.push({
        ...bookData,
        id: bookDoc.id,
        author: author || { id: '', email: '', displayName: '', authProvider: 'email' },
      });
    }

    return books;
  } catch (error) {
    console.error('Load user books error:', error);
    return [];
  }
}

export async function deleteBook(bookId: string) {
  try {
    const { user } = authState$.get();
    if (!user?.id) {
      throw new Error('User not authenticated');
    }

    const firestore = getFirestore();
    const bookRef = doc(firestore, 'books', bookId);

    // Delete book
    await deleteDoc(bookRef);

    // Delete all chapters for this book
    const chaptersRef = collection(firestore, 'books', bookId, 'chapters');
    const chaptersSnapshot = await getDocs(chaptersRef);
    const deleteChaptersPromises = chaptersSnapshot.docs.map((doc: any) => deleteDoc(doc.ref));
    await Promise.all(deleteChaptersPromises);

    // Delete all likes for this book
    const likesRef = collection(firestore, 'books', bookId, 'likes');
    const likesSnapshot = await getDocs(likesRef);
    const deleteLikesPromises = likesSnapshot.docs.map((doc: any) => deleteDoc(doc.ref));
    await Promise.all(deleteLikesPromises);

    // Delete all comments for this book
    const commentsRef = collection(firestore, 'books', bookId, 'comments');
    const commentsSnapshot = await getDocs(commentsRef);
    const deleteCommentsPromises = commentsSnapshot.docs.map((doc: any) => deleteDoc(doc.ref));
    await Promise.all(deleteCommentsPromises);

    // Get book data to check if it was published
    const bookDoc = await getDoc(bookRef);
    if (bookDoc.exists()) {
      const bookData = bookDoc.data() as Book;
      // Update user's stories count only if it was published
      if (bookData.isPublished) {
        await updateUserStoriesCount(user.id, -1);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('Delete book error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Book deletion failed' };
  }
}

export const booksActions = {
  createBook,
  createChapter,
  loadUserBooks,
  deleteBook,
};
