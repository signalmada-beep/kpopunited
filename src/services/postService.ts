// ========== src/services/postService.ts ==========
import { auth, firestore } from '../config/firebase';
import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  increment,
  startAfter,
  DocumentSnapshot,
} from 'firebase/firestore';
import type { PostData, CommentData } from '../types';

// ============================================================
// CONSTANTES
// ============================================================
const POSTS_COLLECTION = 'posts';

// ============================================================
// CRÉER UN POST
// ============================================================
export const createPost = async (postData: Omit<PostData, 'id'>): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const newPost = {
      ...postData,
      author: {
        ...postData.author,
        id: user.uid,
      },
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(firestore, POSTS_COLLECTION), newPost);
    console.log('✅ Post créé:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur création post:', error);
    throw error;
  }
};

// ============================================================
// ✅ RÉCUPÉRER TOUS LES POSTS (ASYNC/AWAIT)
// ============================================================
export const getPostsAsync = async (): Promise<PostData[]> => {
  try {
    const q = query(
      collection(firestore, POSTS_COLLECTION),
      orderBy('timestamp', 'desc')
    );
    const snapshot = await getDocs(q);
    const posts: PostData[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        author: data.author || { id: '', name: '', username: '', avatar: '', group: '' },
        content: data.content || '',
        images: data.images || [],
        video: data.video || '',
        timestamp: data.timestamp?.toMillis?.() || Date.now(),
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        liked: data.liked || false,
        saved: data.saved || false,
        reaction: data.reaction || null,
        tags: data.tags || [],
        mentions: data.mentions || [],
        category: data.category || 'general',
        mood: data.mood || null,
        isEdited: data.isEdited || false,
        privacy: data.privacy || 'public',
        isPinned: data.isPinned || false,
        isArchived: data.isArchived || false,
        commentsDisabled: data.commentsDisabled || false,
      });
    });
    return posts;
  } catch (error) {
    console.error('❌ Erreur récupération posts:', error);
    return [];
  }
};

// ============================================================
// RÉCUPÉRER TOUS LES POSTS (REALTIME AVEC CALLBACK)
// ============================================================
export const getPosts = (callback: (posts: PostData[]) => void): (() => void) => {
  const q = query(
    collection(firestore, POSTS_COLLECTION),
    orderBy('timestamp', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const posts: PostData[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      posts.push({
        id: doc.id,
        author: data.author || { id: '', name: '', username: '', avatar: '', group: '' },
        content: data.content || '',
        images: data.images || [],
        video: data.video || '',
        timestamp: data.timestamp?.toMillis?.() || Date.now(),
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        liked: data.liked || false,
        saved: data.saved || false,
        reaction: data.reaction || null,
        tags: data.tags || [],
        mentions: data.mentions || [],
        category: data.category || 'general',
        mood: data.mood || null,
        isEdited: data.isEdited || false,
        privacy: data.privacy || 'public',
        isPinned: data.isPinned || false,
        isArchived: data.isArchived || false,
        commentsDisabled: data.commentsDisabled || false,
      });
    });
    callback(posts);
  });
};

// ============================================================
// RÉCUPÉRER UN POST PAR ID
// ============================================================
export const getPostById = async (postId: string): Promise<PostData | null> => {
  try {
    const docRef = doc(firestore, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        author: data.author || { id: '', name: '', username: '', avatar: '', group: '' },
        content: data.content || '',
        images: data.images || [],
        video: data.video || '',
        timestamp: data.timestamp?.toMillis?.() || Date.now(),
        likes: data.likes || 0,
        comments: data.comments || 0,
        shares: data.shares || 0,
        liked: data.liked || false,
        saved: data.saved || false,
        reaction: data.reaction || null,
        tags: data.tags || [],
        mentions: data.mentions || [],
        category: data.category || 'general',
        mood: data.mood || null,
        isEdited: data.isEdited || false,
        privacy: data.privacy || 'public',
        isPinned: data.isPinned || false,
        isArchived: data.isArchived || false,
        commentsDisabled: data.commentsDisabled || false,
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération post:', error);
    return null;
  }
};

// ============================================================
// METTRE À JOUR UN POST
// ============================================================
export const updatePost = async (postId: string, data: Partial<PostData>): Promise<void> => {
  try {
    const docRef = doc(firestore, POSTS_COLLECTION, postId);
    await updateDoc(docRef, data);
    console.log('✅ Post mis à jour:', postId);
  } catch (error) {
    console.error('❌ Erreur mise à jour post:', error);
    throw error;
  }
};

// ============================================================
// SUPPRIMER UN POST
// ============================================================
export const deletePost = async (postId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // ✅ Vérifier que l'utilisateur est l'auteur du post
    const postRef = doc(firestore, POSTS_COLLECTION, postId);
    const postSnap = await getDoc(postRef);
    
    if (!postSnap.exists()) {
      throw new Error('Post not found');
    }

    const postData = postSnap.data();
    if (postData.author?.id !== user.uid) {
      throw new Error('You are not authorized to delete this post');
    }

    // ✅ Supprimer le post
    await deleteDoc(postRef);
    console.log('✅ Post supprimé:', postId);

    // ✅ Supprimer également tous les commentaires associés
    const commentsRef = collection(firestore, POSTS_COLLECTION, postId, 'comments');
    const commentsSnapshot = await getDocs(commentsRef);
    const batch = [];
    commentsSnapshot.docs.forEach((doc) => {
      batch.push(deleteDoc(doc.ref));
    });
    await Promise.all(batch);
    console.log(`✅ ${batch.length} commentaires supprimés`);

  } catch (error) {
    console.error('❌ Erreur suppression post:', error);
    throw error;
  }
};

// ============================================================
// TOGGLE LIKE
// ============================================================
export const toggleLike = async (postId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(firestore, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const isLiked = data.liked || false;
      await updateDoc(docRef, {
        liked: !isLiked,
        likes: isLiked ? increment(-1) : increment(1),
      });
    }
  } catch (error) {
    console.error('❌ Erreur toggle like:', error);
    throw error;
  }
};

// ============================================================
// AJOUTER UN COMMENTAIRE
// ============================================================
export const addComment = async (postId: string, comment: CommentData): Promise<void> => {
  try {
    const docRef = doc(firestore, POSTS_COLLECTION, postId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const commentsData = docSnap.data().commentsData || [];
      commentsData.push(comment);
      await updateDoc(docRef, {
        commentsData: commentsData,
        comments: commentsData.length,
      });
    }
  } catch (error) {
    console.error('❌ Erreur ajout commentaire:', error);
    throw error;
  }
};

// ============================================================
// SUPPRIMER UN COMMENTAIRE
// ============================================================
export const deleteComment = async (postId: string, commentId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const commentRef = doc(firestore, POSTS_COLLECTION, postId, 'comments', commentId);
    
    // ✅ Vérifier que l'utilisateur est l'auteur du commentaire
    const commentSnap = await getDoc(commentRef);
    if (!commentSnap.exists()) {
      throw new Error('Comment not found');
    }

    const commentData = commentSnap.data();
    if (commentData.author?.id !== user.uid) {
      throw new Error('You are not authorized to delete this comment');
    }

    await deleteDoc(commentRef);
    console.log('✅ Commentaire supprimé:', commentId);

    // ✅ Mettre à jour le nombre de commentaires
    const postRef = doc(firestore, POSTS_COLLECTION, postId);
    await updateDoc(postRef, {
      comments: increment(-1),
    });

  } catch (error) {
    console.error('❌ Erreur suppression commentaire:', error);
    throw error;
  }
};

// ============================================================
// EXPORTER TOUTES LES FONCTIONS
// ============================================================
export default {
  createPost,
  getPosts,
  getPostsAsync,
  getPostById,
  updatePost,
  deletePost,
  deleteComment,
  toggleLike,
  addComment,
};