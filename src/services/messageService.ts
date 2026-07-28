// ========== src/services/messageService.ts ==========
import { 
  auth, 
  firestore, 
  database 
} from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  arrayRemove,
  runTransaction,
} from 'firebase/firestore';
import { ref, push, set, get, update, remove, onValue } from 'firebase/database';
import type { User } from 'firebase/auth';
import { isValidAvatar, getValidAvatar, DEFAULT_AVATAR } from '../utils/avatarUtils';

// ============================================================
// TYPES
// ============================================================
export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
  isRead: boolean;
  type: 'text' | 'image' | 'file' | 'audio' | 'poll' | 'share';
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  reactions?: { emoji: string; count: number; users: string[] }[];
  poll?: { question: string; options: { text: string; votes: number }[] };
  sharePreview?: {
    title: string;
    description: string;
    image: string | null;
    link: string;
    author: string;
    authorAvatar: string;
    postId: string;
  };
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  isPinned: boolean;
  isFavorite: boolean;
  isArchived: boolean;
  isGroup: boolean;
  groupName?: string;
  groupAvatar?: string;
  lastMessageTime: number;
  createdAt: number;
}

export interface UserData {
  id: string;
  name: string;
  username: string;
  avatar: string;
  isVerified: boolean;
  isOnline: boolean;
  lastSeen: number;
  bio?: string;
  country?: string;
  joinedAt: number;
  followers: number;
  following: number;
}

// ============================================================
// CONSTANTES
// ============================================================
const CONVERSATIONS_COLLECTION = 'conversations';
const MESSAGES_COLLECTION = 'messages';
const USERS_COLLECTION = 'users';

// ============================================================
// FONCTIONS UTILITAIRES
// ============================================================
const getCurrentUser = () => auth.currentUser;
const getCurrentUserId = () => auth.currentUser?.uid || '';

// Générer un ID de conversation unique pour 2 participants
export const getConversationId = (userId1: string, userId2: string): string => {
  return [userId1, userId2].sort().join('_');
};

// ============================================================
// ✅ Maka ny tena anarana sy sarin'ny mpampiasa avy amin'ny Firestore
// ============================================================
export const getUserDisplayName = async (userId: string): Promise<string> => {
  try {
    const userRef = doc(firestore, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      return data.displayName || data.name || 'Utilisateur';
    }
    return 'Utilisateur';
  } catch (error) {
    console.error('Erreur récupération nom:', error);
    return 'Utilisateur';
  }
};

export const getUserAvatar = async (userId: string): Promise<string> => {
  try {
    const userRef = doc(firestore, USERS_COLLECTION, userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const data = userSnap.data();
      const avatar = data.photoURL || data.avatar || '';
      return isValidAvatar(avatar) ? avatar : ''; // ✅ Tsy misy sary ivelany
    }
    return '';
  } catch (error) {
    console.error('Erreur récupération avatar:', error);
    return '';
  }
};

// Maka ny données complete d'un utilisateur
export const getUserData = async (userId: string): Promise<UserData | null> => {
  try {
    const docRef = doc(firestore, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const avatar = data.photoURL || data.avatar || '';
      
      return {
        id: userId,
        name: data.displayName || data.name || 'Utilisateur',
        username: data.username || '',
        avatar: isValidAvatar(avatar) ? avatar : '',
        isVerified: data.isVerified || false,
        isOnline: data.isOnline || false,
        lastSeen: data.lastSeen?.toMillis?.() || Date.now(),
        bio: data.bio || '',
        country: data.country || '',
        joinedAt: data.createdAt?.toMillis?.() || Date.now(),
        followers: data.followers?.length || 0,
        following: data.following?.length || 0,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting user data:', error);
    return null;
  }
};

// ============================================================
// CONVERSATIONS - FIRESTORE
// ============================================================

// Créer ou récupérer une conversation
export const getOrCreateConversation = async (otherUserId: string): Promise<string> => {
  const currentUserId = getCurrentUserId();
  if (!currentUserId) throw new Error('User not authenticated');
  
  console.log(`🔍 getOrCreateConversation: ${currentUserId} <-> ${otherUserId}`);
  
  const conversationId = getConversationId(currentUserId, otherUserId);
  const convRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
  const convSnap = await getDoc(convRef);
  
  if (!convSnap.exists()) {
    console.log('📝 Création nouvelle conversation');
    await setDoc(convRef, {
      id: conversationId,
      participants: [currentUserId, otherUserId],
      lastMessageTime: 0,
      unreadCount: 0,
      isPinned: false,
      isFavorite: false,
      isArchived: false,
      isGroup: false,
      createdAt: serverTimestamp(),
    });
  } else {
    console.log('✅ Conversation existante');
  }
  
  return conversationId;
};

// Récupérer les conversations d'un utilisateur
export const getUserConversations = async (): Promise<Conversation[]> => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  
  try {
    const q = query(
      collection(firestore, CONVERSATIONS_COLLECTION),
      where('participants', 'array-contains', userId)
    );
    
    const snapshot = await getDocs(q);
    const conversations: Conversation[] = [];
    
    for (const doc of snapshot.docs) {
      const data = doc.data();
      const conv: Conversation = {
        id: doc.id,
        participants: data.participants || [],
        lastMessageTime: data.lastMessageTime || 0,
        unreadCount: data.unreadCount || 0,
        isPinned: data.isPinned || false,
        isFavorite: data.isFavorite || false,
        isArchived: data.isArchived || false,
        isGroup: data.isGroup || false,
        groupName: data.groupName || '',
        groupAvatar: data.groupAvatar || '',
        createdAt: data.createdAt?.toMillis?.() || Date.now(),
      };
      
      const lastMsg = await getLastMessage(doc.id);
      conv.lastMessage = lastMsg || undefined;
      
      conversations.push(conv);
    }
    
    conversations.sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    
    console.log('✅ Conversations chargées:', conversations.length);
    return conversations;
  } catch (error) {
    console.error('❌ Error getting conversations:', error);
    return [];
  }
};

// Récupérer le dernier message d'une conversation
export const getLastMessage = async (conversationId: string): Promise<Message | null> => {
  try {
    const q = query(
      collection(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION),
      orderBy('timestamp', 'desc'),
      limit(1)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const data = snapshot.docs[0].data();
      return {
        id: snapshot.docs[0].id,
        senderId: data.senderId || '',
        senderName: data.senderName || 'Utilisateur',
        senderAvatar: data.senderAvatar || '',
        text: data.text || '',
        timestamp: data.timestamp?.toMillis?.() || Date.now(),
        isOwn: data.senderId === getCurrentUserId(),
        isRead: data.isRead || false,
        type: data.type || 'text',
        mediaUrl: data.mediaUrl || '',
        fileName: data.fileName || '',
        fileSize: data.fileSize || 0,
        reactions: data.reactions || [],
        poll: data.poll || undefined,
        sharePreview: data.sharePreview || undefined,
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting last message:', error);
    return null;
  }
};

// Récupérer tous les messages d'une conversation (REALTIME)
export const getMessages = (
  conversationId: string,
  callback: (messages: Message[]) => void,
  limitCount: number = 50
) => {
  const q = query(
    collection(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION),
    orderBy('timestamp', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = [];
    const currentUserId = getCurrentUserId();
    
    snapshot.docs.forEach((doc) => {
      const data = doc.docs();
      const avatar = data.senderAvatar || '';
      
      messages.push({
        id: doc.id,
        senderId: data.senderId || '',
        senderName: data.senderName || 'Utilisateur',
        senderAvatar: isValidAvatar(avatar) ? avatar : '',
        text: data.text || '',
        timestamp: data.timestamp?.toMillis?.() || Date.now(),
        isOwn: data.senderId === currentUserId,
        isRead: data.isRead || false,
        type: data.type || 'text',
        mediaUrl: data.mediaUrl || '',
        fileName: data.fileName || '',
        fileSize: data.fileSize || 0,
        reactions: data.reactions || [],
        poll: data.poll || undefined,
        sharePreview: data.sharePreview || undefined,
      });
    });
    
    markMessagesAsRead(conversationId);
    callback(messages.reverse());
  });
};

// ============================================================
// ✅ ENVOYER UN MESSAGE AVEC LE VRAI NOM DE L'UTILISATEUR
//    TSY MAMPISY SARY IVELANY
// ============================================================
export const sendMessage = async (
  conversationId: string,
  message: {
    text: string;
    type?: 'text' | 'image' | 'file' | 'audio' | 'poll' | 'share';
    mediaUrl?: string;
    fileName?: string;
    fileSize?: number;
    poll?: { question: string; options: { text: string; votes: number }[] };
    sharePreview?: any;
  }
): Promise<string> => {
  const user = getCurrentUser();
  if (!user) throw new Error('User not authenticated');
  
  // ✅ Maka ny tena anarana sy sarin'ilay mpampiasa avy amin'ny Firestore
  let senderName = user.displayName || 'Utilisateur';
  let senderAvatar = '';
  
  try {
    const userData = await getUserData(user.uid);
    if (userData) {
      senderName = userData.name || user.displayName || 'Utilisateur';
      if (userData.avatar && isValidAvatar(userData.avatar)) {
        senderAvatar = userData.avatar;
      }
    }
  } catch (error) {
    console.warn('⚠️ Erreur récupération données utilisateur');
  }
  
  const messageData = {
    senderId: user.uid,
    senderName: senderName,
    senderAvatar: senderAvatar,
    text: message.text || '',
    timestamp: serverTimestamp(),
    isRead: false,
    type: message.type || 'text',
    mediaUrl: message.mediaUrl || '',
    fileName: message.fileName || '',
    fileSize: message.fileSize || 0,
    reactions: [],
    poll: message.poll || null,
    sharePreview: message.sharePreview || null,
  };
  
  const messagesRef = collection(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION);
  const docRef = await addDoc(messagesRef, messageData);
  
  const convRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
  await updateDoc(convRef, {
    lastMessageTime: serverTimestamp(),
  });
  
  console.log(`✅ Message envoyé par: ${senderName} (${user.uid})`);
  return docRef.id;
};

// Marquer les messages comme lus
export const markMessagesAsRead = async (conversationId: string) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  try {
    const q = query(
      collection(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION),
      where('isRead', '==', false),
      where('senderId', '!=', userId)
    );
    const snapshot = await getDocs(q);
    
    const batch = [];
    snapshot.docs.forEach((doc) => {
      batch.push(updateDoc(doc.ref, { isRead: true }));
    });
    
    await Promise.all(batch);
    
    const convRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
    await updateDoc(convRef, {
      unreadCount: 0,
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
  }
};

// Ajouter une réaction à un message
export const addReaction = async (
  conversationId: string,
  messageId: string,
  emoji: string
) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  const msgRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION, messageId);
  
  await runTransaction(firestore, async (transaction) => {
    const docSnap = await transaction.get(msgRef);
    if (!docSnap.exists()) return;
    
    const data = docSnap.data();
    const reactions = data.reactions || [];
    
    const existingIndex = reactions.findIndex(
      (r: any) => r.emoji === emoji && r.users?.includes(userId)
    );
    
    if (existingIndex >= 0) {
      const updatedUsers = reactions[existingIndex].users.filter((u: string) => u !== userId);
      if (updatedUsers.length === 0) {
        reactions.splice(existingIndex, 1);
      } else {
        reactions[existingIndex].users = updatedUsers;
        reactions[existingIndex].count = updatedUsers.length;
      }
    } else {
      const existingEmoji = reactions.find((r: any) => r.emoji === emoji);
      if (existingEmoji) {
        existingEmoji.users.push(userId);
        existingEmoji.count = existingEmoji.users.length;
      } else {
        reactions.push({ emoji, count: 1, users: [userId] });
      }
    }
    
    transaction.update(msgRef, { reactions });
  });
};

// ============================================================
// RECHERCHER DES UTILISATEURS
// ============================================================
export const searchUsers = async (queryText: string): Promise<UserData[]> => {
  try {
    if (!queryText.trim()) return [];
    
    console.log('🔍 Recherche users:', queryText);
    const searchTerm = queryText.toLowerCase().trim();
    
    const q1 = query(
      collection(firestore, USERS_COLLECTION),
      where('displayName', '>=', searchTerm),
      where('displayName', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    
    const q2 = query(
      collection(firestore, USERS_COLLECTION),
      where('username', '>=', searchTerm),
      where('username', '<=', searchTerm + '\uf8ff'),
      limit(10)
    );
    
    const [snapshot1, snapshot2] = await Promise.all([
      getDocs(q1),
      getDocs(q2)
    ]);
    
    const usersMap = new Map<string, UserData>();
    const currentUserId = getCurrentUserId();
    
    snapshot1.docs.forEach((doc) => {
      const data = doc.data();
      if (doc.id !== currentUserId) {
        const avatar = data.photoURL || data.avatar || '';
        usersMap.set(doc.id, {
          id: doc.id,
          name: data.displayName || data.name || 'Utilisateur',
          username: data.username || '',
          avatar: isValidAvatar(avatar) ? avatar : '',
          isVerified: data.isVerified || false,
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen?.toMillis?.() || Date.now(),
          bio: data.bio || '',
          country: data.country || '',
          joinedAt: data.createdAt?.toMillis?.() || Date.now(),
          followers: data.followers?.length || 0,
          following: data.following?.length || 0,
        });
      }
    });
    
    snapshot2.docs.forEach((doc) => {
      const data = doc.data();
      if (doc.id !== currentUserId && !usersMap.has(doc.id)) {
        const avatar = data.photoURL || data.avatar || '';
        usersMap.set(doc.id, {
          id: doc.id,
          name: data.displayName || data.name || 'Utilisateur',
          username: data.username || '',
          avatar: isValidAvatar(avatar) ? avatar : '',
          isVerified: data.isVerified || false,
          isOnline: data.isOnline || false,
          lastSeen: data.lastSeen?.toMillis?.() || Date.now(),
          bio: data.bio || '',
          country: data.country || '',
          joinedAt: data.createdAt?.toMillis?.() || Date.now(),
          followers: data.followers?.length || 0,
          following: data.following?.length || 0,
        });
      }
    });
    
    const results = Array.from(usersMap.values());
    console.log('✅ Recherche terminée:', results.length, 'utilisateurs trouvés');
    return results;
  } catch (error) {
    console.error('❌ Erreur recherche:', error);
    return [];
  }
};

// ============================================================
// ONLINE STATUS - FIRESTORE
// ============================================================

// Mettre à jour le statut en ligne
export const updateOnlineStatus = async (isOnline: boolean) => {
  const userId = getCurrentUserId();
  if (!userId) return;
  
  try {
    const userRef = doc(firestore, USERS_COLLECTION, userId);
    await updateDoc(userRef, {
      isOnline: isOnline,
      lastSeen: serverTimestamp(),
    });
    console.log('✅ Online status updated in Firestore');
  } catch (error) {
    console.error('❌ Error updating online status:', error);
  }
};

// Écouter le statut d'un utilisateur
export const listenUserStatus = (userId: string, callback: (isOnline: boolean, lastSeen: number) => void) => {
  const userRef = doc(firestore, USERS_COLLECTION, userId);
  
  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      callback(data.isOnline || false, data.lastSeen?.toMillis?.() || Date.now());
    } else {
      callback(false, Date.now());
    }
  }, (error) => {
    console.error('❌ Error listening to user status:', error);
    callback(false, Date.now());
  });
};

// ============================================================
// GROUPES
// ============================================================

// Créer un groupe
export const createGroup = async (
  groupName: string,
  participants: string[],
  groupAvatar?: string
): Promise<string> => {
  const userId = getCurrentUserId();
  if (!userId) throw new Error('User not authenticated');
  
  const allParticipants = [...new Set([userId, ...participants])];
  const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  
  const convRef = doc(firestore, CONVERSATIONS_COLLECTION, groupId);
  await setDoc(convRef, {
    id: groupId,
    participants: allParticipants,
    lastMessageTime: 0,
    unreadCount: 0,
    isPinned: false,
    isFavorite: false,
    isArchived: false,
    isGroup: true,
    groupName: groupName,
    groupAvatar: isValidAvatar(groupAvatar) ? groupAvatar : '',
    createdAt: serverTimestamp(),
    createdBy: userId,
  });
  
  // ✅ Envoyer un message de bienvenue avec le vrai nom
  const userData = await getUserData(userId);
  const senderName = userData?.name || 'Utilisateur';
  
  await sendMessage(groupId, {
    text: `${senderName} a créé le groupe "${groupName}" 🎉`,
    type: 'text',
  });
  
  return groupId;
};

// Ajouter un participant à un groupe
export const addParticipantToGroup = async (groupId: string, userId: string) => {
  const convRef = doc(firestore, CONVERSATIONS_COLLECTION, groupId);
  await updateDoc(convRef, {
    participants: arrayUnion(userId),
  });
};

// Retirer un participant d'un groupe
export const removeParticipantFromGroup = async (groupId: string, userId: string) => {
  const convRef = doc(firestore, CONVERSATIONS_COLLECTION, groupId);
  await updateDoc(convRef, {
    participants: arrayRemove(userId),
  });
};

// ============================================================
// PIN / FAVORITE / ARCHIVE
// ============================================================

export const togglePin = async (conversationId: string) => {
  const convRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
  const docSnap = await getDoc(convRef);
  if (docSnap.exists()) {
    const current = docSnap.data().isPinned || false;
    await updateDoc(convRef, { isPinned: !current });
  }
};

export const toggleFavorite = async (conversationId: string) => {
  const convRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
  const docSnap = await getDoc(convRef);
  if (docSnap.exists()) {
    const current = docSnap.data().isFavorite || false;
    await updateDoc(convRef, { isFavorite: !current });
  }
};

export const toggleArchive = async (conversationId: string) => {
  const convRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
  const docSnap = await getDoc(convRef);
  if (docSnap.exists()) {
    const current = docSnap.data().isArchived || false;
    await updateDoc(convRef, { isArchived: !current });
  }
};

// ============================================================
// SUPPRIMER
// ============================================================

export const deleteMessage = async (conversationId: string, messageId: string) => {
  const msgRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION, messageId);
  await deleteDoc(msgRef);
};

export const deleteConversation = async (conversationId: string) => {
  const messagesRef = collection(firestore, CONVERSATIONS_COLLECTION, conversationId, MESSAGES_COLLECTION);
  const snapshot = await getDocs(messagesRef);
  const batch = [];
  snapshot.docs.forEach((doc) => {
    batch.push(deleteDoc(doc.ref));
  });
  await Promise.all(batch);
  
  const convRef = doc(firestore, CONVERSATIONS_COLLECTION, conversationId);
  await deleteDoc(convRef);
};

// ============================================================
// EXPORT DEFAULT
// ============================================================
export default {
  getOrCreateConversation,
  getUserConversations,
  getLastMessage,
  getMessages,
  sendMessage,
  addReaction,
  getUserData,
  getUserDisplayName,
  getUserAvatar,
  isValidAvatar,
  searchUsers,
  updateOnlineStatus,
  listenUserStatus,
  createGroup,
  addParticipantToGroup,
  removeParticipantFromGroup,
  togglePin,
  toggleFavorite,
  toggleArchive,
  deleteMessage,
  deleteConversation,
};