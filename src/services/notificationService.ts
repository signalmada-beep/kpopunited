// ========== src/services/notificationService.ts ==========
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
  Timestamp,
  setDoc,
} from 'firebase/firestore';
import { isNotificationEnabled } from './notificationSettingsService';
import type { User } from 'firebase/auth';

// ============================================================
// TYPES
// ============================================================
export interface Notification {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'like' | 'comment' | 'share' | 'reaction' | 'event_going' | 'event_interested' | 'vote' | 'follow' | 'mention' | 'story_reply';
  target: string;
  targetId: string;
  timestamp: number;
  read: boolean;
  link: string;
}

// ============================================================
// CONSTANTES
// ============================================================
const NOTIFICATIONS_COLLECTION = 'notifications';

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================
const getCurrentUserId = () => auth.currentUser?.uid || '';

// ============================================================
// 🔥 MAP TYPE -> SETTINGS KEY
// ============================================================
const getSettingsKey = (type: Notification['type']): keyof NotificationSettings => {
  const map: Record<Notification['type'], keyof NotificationSettings> = {
    'like': 'likes',
    'comment': 'comments',
    'mention': 'mentions',
    'follow': 'follows',
    'reaction': 'reactions',
    'share': 'shares',
    'story_reply': 'storyReplies',
    'event_going': 'events',
    'event_interested': 'events',
    'vote': 'events',
  };
  return map[type] || 'likes';
};

// ============================================================
// 🔥 AJOUTER UNE NOTIFICATION AVEC VÉRIFICATION
// ============================================================
export const addNotification = async (
  notification: Omit<Notification, 'id' | 'timestamp' | 'read'>
): Promise<string> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    // ✅ Vérifier si l'utilisateur a activé ce type de notification
    const settingsKey = getSettingsKey(notification.type);
    const enabled = await isNotificationEnabled(settingsKey);
    
    if (!enabled) {
      console.log(`🔕 Notification ${notification.type} désactivée par l'utilisateur`);
      return '';
    }

    const notificationData = {
      ...notification,
      timestamp: serverTimestamp(),
      read: false,
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(firestore, NOTIFICATIONS_COLLECTION), notificationData);
    console.log('✅ Notification ajoutée:', notificationData);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur ajout notification:', error);
    throw error;
  }
};

// ============================================================
// 🔥 RÉCUPÉRER LES NOTIFICATIONS D'UN UTILISATEUR (REALTIME)
// ============================================================
export const getUserNotifications = (
  callback: (notifications: Notification[]) => void,
  limitCount: number = 50
): (() => void) => {
  const userId = getCurrentUserId();
  if (!userId) {
    callback([]);
    return () => {};
  }

  const q = query(
    collection(firestore, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );

  let timeoutId: NodeJS.Timeout;
  let isFirstLoad = true;

  // ✅ Timeout 5 segondra
  timeoutId = setTimeout(() => {
    if (isFirstLoad) {
      console.warn('Notifications loading timeout after 5s');
      callback([]);
      isFirstLoad = false;
    }
  }, 5000);

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notifications: Notification[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      notifications.push({
        id: doc.id,
        userId: data.userId || '',
        userName: data.userName || '',
        userAvatar: data.userAvatar || '',
        type: data.type || 'like',
        target: data.target || '',
        targetId: data.targetId || '',
        timestamp: data.timestamp?.toMillis?.() || Date.now(),
        read: data.read || false,
        link: data.link || '',
      });
    });
    
    if (isFirstLoad) {
      clearTimeout(timeoutId);
      isFirstLoad = false;
    }
    
    callback(notifications);
  }, (error) => {
    console.error('Error loading notifications:', error);
    callback([]);
  });

  return () => {
    clearTimeout(timeoutId);
    unsubscribe();
  };
};

// ============================================================
// 🔥 RÉCUPÉRER LE NOMBRE DE NOTIFICATIONS NON LUES
// ============================================================
export const getUnreadCount = (callback: (count: number) => void): (() => void) => {
  const userId = getCurrentUserId();
  if (!userId) {
    callback(0);
    return () => {};
  }

  const q = query(
    collection(firestore, NOTIFICATIONS_COLLECTION),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  return onSnapshot(q, (snapshot) => {
    callback(snapshot.size);
  });
};

// ============================================================
// 🔥 MARQUER UNE NOTIFICATION COMME LUE
// ============================================================
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(firestore, NOTIFICATIONS_COLLECTION, notificationId);
    await updateDoc(docRef, { read: true });
    console.log('✅ Notification marquée comme lue:', notificationId);
  } catch (error) {
    console.error('❌ Erreur marquage notification:', error);
    throw error;
  }
};

// ============================================================
// 🔥 MARQUER TOUTES LES NOTIFICATIONS COMME LUES
// ============================================================
export const markAllNotificationsAsRead = async (): Promise<void> => {
  try {
    const userId = getCurrentUserId();
    if (!userId) throw new Error('User not authenticated');

    const q = query(
      collection(firestore, NOTIFICATIONS_COLLECTION),
      where('userId', '==', userId),
      where('read', '==', false)
    );

    const snapshot = await getDocs(q);
    const batch = [];
    snapshot.docs.forEach((doc) => {
      batch.push(updateDoc(doc.ref, { read: true }));
    });

    await Promise.all(batch);
    console.log('✅ Toutes les notifications marquées comme lues');
  } catch (error) {
    console.error('❌ Erreur marquage toutes notifications:', error);
    throw error;
  }
};

// ============================================================
// 🔥 SUPPRIMER UNE NOTIFICATION
// ============================================================
export const deleteNotification = async (notificationId: string): Promise<void> => {
  try {
    const docRef = doc(firestore, NOTIFICATIONS_COLLECTION, notificationId);
    await deleteDoc(docRef);
    console.log('✅ Notification supprimée:', notificationId);
  } catch (error) {
    console.error('❌ Erreur suppression notification:', error);
    throw error;
  }
};

// ============================================================
// 🔥 FONCTIONS DE CRÉATION AVEC VÉRIFICATION
// ============================================================
export const createLikeNotification = async (
  targetUserId: string,
  targetId: string,
  targetContent: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid === targetUserId) return;

  await addNotification({
    userId: targetUserId,
    userName: user.displayName || 'Utilisateur',
    userAvatar: user.photoURL || '',
    type: 'like',
    target: targetContent.slice(0, 50) + (targetContent.length > 50 ? '...' : ''),
    targetId: targetId,
    link: `/post/${targetId}`,
  });
};

export const createCommentNotification = async (
  targetUserId: string,
  targetId: string,
  targetContent: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid === targetUserId) return;

  await addNotification({
    userId: targetUserId,
    userName: user.displayName || 'Utilisateur',
    userAvatar: user.photoURL || '',
    type: 'comment',
    target: targetContent.slice(0, 50) + (targetContent.length > 50 ? '...' : ''),
    targetId: targetId,
    link: `/post/${targetId}`,
  });
};

export const createMentionNotification = async (
  targetUserId: string,
  targetId: string,
  targetContent: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid === targetUserId) return;

  await addNotification({
    userId: targetUserId,
    userName: user.displayName || 'Utilisateur',
    userAvatar: user.photoURL || '',
    type: 'mention',
    target: targetContent.slice(0, 50) + (targetContent.length > 50 ? '...' : ''),
    targetId: targetId,
    link: `/post/${targetId}`,
  });
};

export const createFollowNotification = async (
  targetUserId: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid === targetUserId) return;

  await addNotification({
    userId: targetUserId,
    userName: user.displayName || 'Utilisateur',
    userAvatar: user.photoURL || '',
    type: 'follow',
    target: 'vous suit maintenant',
    targetId: user.uid,
    link: `/profile/${user.uid}`,
  });
};

export const createShareNotification = async (
  targetUserId: string,
  targetId: string,
  targetContent: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid === targetUserId) return;

  await addNotification({
    userId: targetUserId,
    userName: user.displayName || 'Utilisateur',
    userAvatar: user.photoURL || '',
    type: 'share',
    target: targetContent.slice(0, 50) + (targetContent.length > 50 ? '...' : ''),
    targetId: targetId,
    link: `/post/${targetId}`,
  });
};

export const createReactionNotification = async (
  targetUserId: string,
  targetId: string,
  targetContent: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid === targetUserId) return;

  await addNotification({
    userId: targetUserId,
    userName: user.displayName || 'Utilisateur',
    userAvatar: user.photoURL || '',
    type: 'reaction',
    target: targetContent.slice(0, 50) + (targetContent.length > 50 ? '...' : ''),
    targetId: targetId,
    link: `/post/${targetId}`,
  });
};

export const createStoryReplyNotification = async (
  targetUserId: string,
  targetId: string,
  targetContent: string
): Promise<void> => {
  const user = auth.currentUser;
  if (!user || user.uid === targetUserId) return;

  await addNotification({
    userId: targetUserId,
    userName: user.displayName || 'Utilisateur',
    userAvatar: user.photoURL || '',
    type: 'story_reply',
    target: targetContent.slice(0, 50) + (targetContent.length > 50 ? '...' : ''),
    targetId: targetId,
    link: `/story/${targetId}`,
  });
};

// ============================================================
// 🔥 EXPORTER TOUTES LES FONCTIONS
// ============================================================
export default {
  addNotification,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  createLikeNotification,
  createCommentNotification,
  createMentionNotification,
  createFollowNotification,
  createShareNotification,
  createReactionNotification,
  createStoryReplyNotification,
};