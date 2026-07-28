// ========== src/services/profileService.ts ==========
import { auth, firestore } from '../config/firebase';
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
  updateDoc,
  deleteDoc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  writeBatch,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { uploadProfilePhoto as uploadProfilePhotoService, uploadCoverPhoto as uploadCoverPhotoService } from './uploadService';
import { isValidAvatar, DEFAULT_AVATAR } from '../utils/avatarUtils';

// ============================================================
// TYPES
// ============================================================
export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  photoURL: string;
  coverPhoto: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  birthday: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  registrationNumber: number;
  badge: {
    name: string;
    color: string;
    icon: string;
    tier: number;
  };
  followers: string[];
  following: string[];
  posts: number;
  isVerified: boolean;
  createdAt: number;
  lastLogin: number;
}

// ============================================================
// BADGES
// ============================================================
export interface Badge {
  tier: number;
  name: string;
  color: string;
  icon: string;
  range: string;
}

export const BADGE_TIERS: Badge[] = [
  { tier: 1, name: 'Légende Bleue', color: '#4A90D9', icon: '💎', range: '1-10' },
  { tier: 2, name: 'Légende Verte', color: '#00B894', icon: '🌟', range: '11-20' },
  { tier: 3, name: 'Légende Violette', color: '#C084FC', icon: '💜', range: '21-40' },
  { tier: 4, name: 'Légende Orange', color: '#FF6B6B', icon: '🔥', range: '41-60' },
  { tier: 5, name: 'Légende Rose', color: '#EC4899', icon: '🌸', range: '61-70' },
  { tier: 6, name: 'Légende Dorée', color: '#FFD700', icon: '⭐', range: '71-100' },
  { tier: 7, name: 'Fan', color: '#7A7A9A', icon: '🎵', range: '100+' },
];

export const getBadgeByNumber = (number: number): Badge => {
  if (number <= 10) return BADGE_TIERS[0];
  if (number <= 20) return BADGE_TIERS[1];
  if (number <= 40) return BADGE_TIERS[2];
  if (number <= 60) return BADGE_TIERS[3];
  if (number <= 70) return BADGE_TIERS[4];
  if (number <= 100) return BADGE_TIERS[5];
  return BADGE_TIERS[6];
};

// ============================================================
// COMPTER LE NOMBRE D'UTILISATEURS
// ============================================================
export const getUserCount = async (): Promise<number> => {
  try {
    const snapshot = await getDocs(collection(firestore, 'users'));
    return snapshot.size;
  } catch (error) {
    console.error('❌ Erreur comptage utilisateurs:', error);
    return 0;
  }
};

// ============================================================
// UPLOAD PHOTO
// ============================================================
export const uploadProfilePhoto = async (file: File): Promise<string> => {
  try {
    return await uploadProfilePhotoService(file);
  } catch (error) {
    console.error('❌ Erreur upload profile photo:', error);
    throw error;
  }
};

export const uploadCoverPhoto = async (file: File): Promise<string> => {
  try {
    return await uploadCoverPhotoService(file);
  } catch (error) {
    console.error('❌ Erreur upload cover photo:', error);
    throw error;
  }
};

export const uploadAndUpdateProfilePhoto = async (uid: string, file: File): Promise<string> => {
  try {
    const photoURL = await uploadProfilePhoto(file);
    await updateUserProfile(uid, { photoURL });
    return photoURL;
  } catch (error) {
    console.error('❌ Erreur upload and update profile photo:', error);
    throw error;
  }
};

export const uploadAndUpdateCoverPhoto = async (uid: string, file: File): Promise<string> => {
  try {
    const coverPhoto = await uploadCoverPhoto(file);
    await updateUserProfile(uid, { coverPhoto });
    return coverPhoto;
  } catch (error) {
    console.error('❌ Erreur upload and update cover photo:', error);
    throw error;
  }
};

// ============================================================
// ✅ CRÉER UN PROFIL PAR DÉFAUT - TSY MAMPISY SARY IVELANY
// ============================================================
export const createDefaultProfile = async (userData: {
  uid: string;
  displayName: string;
  email: string;
  photoURL?: string;
}): Promise<UserProfile | null> => {
  try {
    const userCount = await getUserCount();
    const registrationNumber = userCount + 1;
    const badge = getBadgeByNumber(registrationNumber);
    
    const displayName = userData.displayName || 'K-Pop Fan';
    const username = displayName.toLowerCase().replace(/\s/g, '_') + '_' + Math.floor(Math.random() * 1000);
    
    const profile: UserProfile = {
      uid: userData.uid,
      displayName: displayName,
      username: username,
      email: userData.email || '',
      photoURL: '', // ✅ Tsy mampiasa sary ivelany
      coverPhoto: '',
      bio: '',
      location: '',
      website: '',
      phone: '',
      birthday: '',
      gender: 'prefer-not-to-say',
      registrationNumber: registrationNumber,
      badge: {
        name: badge.name,
        color: badge.color,
        icon: badge.icon,
        tier: badge.tier,
      },
      followers: [],
      following: [],
      posts: 0,
      isVerified: false,
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };
    
    await setDoc(doc(firestore, 'users', userData.uid), profile);
    console.log('✅ Profil par défaut créé pour:', displayName);
    return profile;
  } catch (error) {
    console.error('❌ Erreur création profil par défaut:', error);
    return null;
  }
};

// ============================================================
// CRÉER UN PROFIL UTILISATEUR
// ============================================================
export const createUserProfile = async (
  user: User,
  data: {
    displayName: string;
    username: string;
    bio?: string;
    location?: string;
    website?: string;
    phone?: string;
    birthday?: string;
    gender?: string;
    photoURL?: string;
    coverPhoto?: string;
  }
): Promise<void> => {
  try {
    const userCount = await getUserCount();
    const registrationNumber = userCount + 1;
    const badge = getBadgeByNumber(registrationNumber);
    
    const profile: UserProfile = {
      uid: user.uid,
      displayName: data.displayName,
      username: data.username || data.displayName.toLowerCase().replace(/\s/g, ''),
      email: user.email || '',
      photoURL: data.photoURL && isValidAvatar(data.photoURL) ? data.photoURL : '',
      coverPhoto: data.coverPhoto && isValidAvatar(data.coverPhoto) ? data.coverPhoto : '',
      bio: data.bio || '',
      location: data.location || '',
      website: data.website || '',
      phone: data.phone || '',
      birthday: data.birthday || '',
      gender: data.gender || 'prefer-not-to-say',
      registrationNumber: registrationNumber,
      badge: {
        name: badge.name,
        color: badge.color,
        icon: badge.icon,
        tier: badge.tier,
      },
      followers: [],
      following: [],
      posts: 0,
      isVerified: registrationNumber <= 10,
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };
    
    await setDoc(doc(firestore, 'users', user.uid), profile);
    console.log('✅ Profil créé avec badge:', badge.name);
  } catch (error) {
    console.error('❌ Erreur création profil:', error);
    throw error;
  }
};

// ============================================================
// RÉCUPÉRER UN PROFIL PAR UID
// ============================================================
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    if (!uid) {
      console.warn('⚠️ getUserProfile: UID vide');
      return null;
    }

    const docRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const photoURL = data.photoURL || '';
      
      return {
        uid: docSnap.id,
        displayName: data.displayName || 'K-Pop Fan',
        username: data.username || '',
        email: data.email || '',
        photoURL: isValidAvatar(photoURL) ? photoURL : '',
        coverPhoto: data.coverPhoto || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        phone: data.phone || '',
        birthday: data.birthday || '',
        gender: data.gender || 'prefer-not-to-say',
        registrationNumber: data.registrationNumber || 0,
        badge: data.badge || { name: 'Fan', color: '#7A7A9A', icon: '🎵', tier: 7 },
        followers: data.followers || [],
        following: data.following || [],
        posts: data.posts || 0,
        isVerified: data.isVerified || false,
        createdAt: data.createdAt || Date.now(),
        lastLogin: data.lastLogin || Date.now(),
      };
    }
    
    console.warn('⚠️ Aucun profil trouvé pour UID:', uid);
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération profil:', error);
    return null;
  }
};

// ============================================================
// RÉCUPÉRER UN PROFIL PAR USERNAME
// ============================================================
export const getUserProfileByUsername = async (username: string): Promise<UserProfile | null> => {
  try {
    if (!username) {
      console.warn('⚠️ getUserProfileByUsername: Username vide');
      return null;
    }

    console.log('🔍 Recherche par username:', username);
    const usernameLower = username.toLowerCase().trim();
    
    const q = query(
      collection(firestore, 'users'),
      where('username', '==', usernameLower)
    );
    
    const snapshot = await getDocs(q);
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      const photoURL = data.photoURL || '';
      
      console.log('✅ Profil trouvé:', data.displayName);
      return {
        uid: doc.id,
        displayName: data.displayName || 'K-Pop Fan',
        username: data.username || '',
        email: data.email || '',
        photoURL: isValidAvatar(photoURL) ? photoURL : '',
        coverPhoto: data.coverPhoto || '',
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        phone: data.phone || '',
        birthday: data.birthday || '',
        gender: data.gender || 'prefer-not-to-say',
        registrationNumber: data.registrationNumber || 0,
        badge: data.badge || { name: 'Fan', color: '#7A7A9A', icon: '🎵', tier: 7 },
        followers: data.followers || [],
        following: data.following || [],
        posts: data.posts || 0,
        isVerified: data.isVerified || false,
        createdAt: data.createdAt || Date.now(),
        lastLogin: data.lastLogin || Date.now(),
      };
    }
    
    console.warn('⚠️ Aucun profil trouvé pour username:', username);
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération profil par username:', error);
    return null;
  }
};

// ============================================================
// METTRE À JOUR LE PROFIL
// ============================================================
export const updateUserProfile = async (uid: string, data: Partial<UserProfile>): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    await updateDoc(userRef, data);
    console.log('✅ Profil mis à jour');
  } catch (error) {
    console.error('❌ Erreur mise à jour profil:', error);
    throw error;
  }
};

// ============================================================
// FOLLOW - MIARAKA AMIN'NY TRANSACTION
// ============================================================
export const followUser = async (targetUid: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    if (user.uid === targetUid) throw new Error('Vous ne pouvez pas vous suivre vous-même');

    const currentUserRef = doc(firestore, 'users', user.uid);
    const targetUserRef = doc(firestore, 'users', targetUid);

    await runTransaction(firestore, async (transaction) => {
      const currentDoc = await transaction.get(currentUserRef);
      const targetDoc = await transaction.get(targetUserRef);

      if (!currentDoc.exists()) {
        throw new Error('Votre profil n\'existe pas');
      }
      if (!targetDoc.exists()) {
        throw new Error('Le profil de l\'utilisateur n\'existe pas');
      }

      const currentData = currentDoc.data();
      const targetData = targetDoc.data();

      const currentFollowing = currentData.following || [];
      const targetFollowers = targetData.followers || [];

      if (currentFollowing.includes(targetUid)) {
        throw new Error('Vous suivez déjà cet utilisateur');
      }

      transaction.update(currentUserRef, {
        following: arrayUnion(targetUid),
      });

      transaction.update(targetUserRef, {
        followers: arrayUnion(user.uid),
      });
    });

    console.log('✅ Follow réussi');
  } catch (error) {
    console.error('❌ Erreur follow:', error);
    throw error;
  }
};

// ============================================================
// UNFOLLOW - MIARAKA AMIN'NY TRANSACTION
// ============================================================
export const unfollowUser = async (targetUid: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');
    if (user.uid === targetUid) throw new Error('Vous ne pouvez pas vous unfollow vous-même');

    const currentUserRef = doc(firestore, 'users', user.uid);
    const targetUserRef = doc(firestore, 'users', targetUid);

    await runTransaction(firestore, async (transaction) => {
      const currentDoc = await transaction.get(currentUserRef);
      const targetDoc = await transaction.get(targetUserRef);

      if (!currentDoc.exists()) {
        throw new Error('Votre profil n\'existe pas');
      }
      if (!targetDoc.exists()) {
        throw new Error('Le profil de l\'utilisateur n\'existe pas');
      }

      const currentData = currentDoc.data();
      const targetData = targetDoc.data();

      const currentFollowing = currentData.following || [];
      const targetFollowers = targetData.followers || [];

      if (!currentFollowing.includes(targetUid)) {
        throw new Error('Vous ne suivez pas cet utilisateur');
      }

      transaction.update(currentUserRef, {
        following: arrayRemove(targetUid),
      });

      transaction.update(targetUserRef, {
        followers: arrayRemove(user.uid),
      });
    });

    console.log('✅ Unfollow réussi');
  } catch (error) {
    console.error('❌ Erreur unfollow:', error);
    throw error;
  }
};

// ============================================================
// VÉRIFIER SI ON FOLLOW
// ============================================================
export const isFollowing = async (targetUid: string): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    if (user.uid === targetUid) return false;

    const currentUser = await getUserProfile(user.uid);
    return currentUser?.following?.includes(targetUid) || false;
  } catch (error) {
    console.error('❌ Erreur vérification follow:', error);
    return false;
  }
};

// ============================================================
// SUGGESTIONS - REALTIME AVEC FILTRAGE
// ============================================================
export const getSuggestions = (callback: (users: UserProfile[]) => void): (() => void) => {
  const user = auth.currentUser;
  if (!user) {
    callback([]);
    return () => {};
  }

  const currentUserUid = user.uid;
  console.log('🔍 getSuggestions - Utilisateur actuel UID:', currentUserUid);

  const q = query(
    collection(firestore, 'users'),
    orderBy('createdAt', 'desc'),
    limit(20)
  );

  return onSnapshot(q, 
    async (snapshot) => {
      const users: UserProfile[] = [];
      
      try {
        const currentUser = await getUserProfile(currentUserUid);
        const following = currentUser?.following || [];

        console.log('👤 Current user UID:', currentUserUid);
        console.log('👤 Current user displayName:', currentUser?.displayName);
        console.log('📋 Following list:', following);

        snapshot.docs.forEach((doc) => {
          const data = doc.data() as UserProfile;
          const dataUid = doc.id;
          
          if (dataUid !== currentUserUid && !following.includes(dataUid)) {
            const photoURL = data.photoURL || '';
            users.push({
              ...data,
              uid: dataUid,
              photoURL: isValidAvatar(photoURL) ? photoURL : '',
            });
          }
        });

        console.log('📋 Suggestions filtrées:', users.length);
        callback(users);
      } catch (error) {
        console.error('❌ Erreur getSuggestions:', error);
        callback([]);
      }
    },
    (error) => {
      console.error('❌ Firestore error dans getSuggestions:', error);
      callback([]);
    }
  );
};

// ============================================================
// RECHERCHER DES UTILISATEURS
// ============================================================
export const searchUsers = async (queryText: string): Promise<UserProfile[]> => {
  try {
    if (!queryText.trim()) return [];
    
    const q = query(
      collection(firestore, 'users'),
      where('displayName', '>=', queryText.trim()),
      where('displayName', '<=', queryText.trim() + '\uf8ff'),
      limit(20)
    );
    
    const snapshot = await getDocs(q);
    const users: UserProfile[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      const photoURL = data.photoURL || '';
      users.push({
        ...data,
        uid: doc.id,
        photoURL: isValidAvatar(photoURL) ? photoURL : '',
      } as UserProfile);
    });
    return users;
  } catch (error) {
    console.error('❌ Erreur recherche:', error);
    return [];
  }
};

// ============================================================
// SUPPRIMER UN PROFIL
// ============================================================
export const deleteUserProfile = async (uid: string): Promise<void> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    await deleteDoc(userRef);
    console.log('✅ Profil supprimé');
  } catch (error) {
    console.error('❌ Erreur suppression profil:', error);
    throw error;
  }
};

// ============================================================
// EXPORTER TOUTES LES FONCTIONS
// ============================================================
export default {
  createUserProfile,
  createDefaultProfile,
  getUserProfile,
  getUserProfileByUsername,
  updateUserProfile,
  uploadProfilePhoto,
  uploadCoverPhoto,
  uploadAndUpdateProfilePhoto,
  uploadAndUpdateCoverPhoto,
  getSuggestions,
  followUser,
  unfollowUser,
  isFollowing,
  deleteUserProfile,
  searchUsers,
  getUserCount,
  getBadgeByNumber,
  BADGE_TIERS,
};