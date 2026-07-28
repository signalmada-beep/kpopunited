// ========== src/services/blockService.ts ==========
import { auth, firestore } from '../config/firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';

// ============================================================
// 🔥 CONSTANTES
// ============================================================
const USERS_COLLECTION = 'users';

// ============================================================
// 🔥 TYPES
// ============================================================
export interface BlockedUser {
  uid: string;
  displayName: string;
  username: string;
  photoURL: string;
  blockedAt: number;
  reason?: string;
}

// ============================================================
// 🔥 BLOCKER UN UTILISATEUR
// ============================================================
export const blockUser = async (targetUid: string, reason?: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Non authentifié');

    const userRef = doc(firestore, USERS_COLLECTION, currentUser.uid);
    
    // ✅ Ajouter l'utilisateur à la liste des bloqués
    await updateDoc(userRef, {
      blockedUsers: arrayUnion(targetUid),
      blockedAt: {
        [targetUid]: {
          blockedAt: Date.now(),
          reason: reason || '',
        },
      },
    });

    // ✅ Retirer des followers/following si nécessaire
    await updateDoc(userRef, {
      followers: arrayRemove(targetUid),
      following: arrayRemove(targetUid),
    });

    console.log('✅ Utilisateur bloqué:', targetUid);
  } catch (error) {
    console.error('❌ Erreur blocage:', error);
    throw error;
  }
};

// ============================================================
// 🔥 DÉBLOQUER UN UTILISATEUR
// ============================================================
export const unblockUser = async (targetUid: string): Promise<void> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Non authentifié');

    const userRef = doc(firestore, USERS_COLLECTION, currentUser.uid);
    
    // ✅ Retirer l'utilisateur de la liste des bloqués
    await updateDoc(userRef, {
      blockedUsers: arrayRemove(targetUid),
    });

    // ✅ Supprimer la date de blocage
    const docSnap = await getDoc(userRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      if (data.blockedAt) {
        const newBlockedAt = { ...data.blockedAt };
        delete newBlockedAt[targetUid];
        await updateDoc(userRef, { blockedAt: newBlockedAt });
      }
    }

    console.log('✅ Utilisateur débloqué:', targetUid);
  } catch (error) {
    console.error('❌ Erreur déblocage:', error);
    throw error;
  }
};

// ============================================================
// 🔥 RÉCUPÉRER LES UTILISATEURS BLOQUÉS (REALTIME)
// ============================================================
export const getBlockedUsers = (callback: (users: BlockedUser[]) => void): (() => void) => {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    callback([]);
    return () => {};
  }

  const userRef = doc(firestore, USERS_COLLECTION, currentUser.uid);

  return onSnapshot(userRef, async (docSnap) => {
    if (!docSnap.exists()) {
      callback([]);
      return;
    }

    const data = docSnap.data();
    const blockedUids: string[] = data.blockedUsers || [];
    const blockedAt = data.blockedAt || {};

    if (blockedUids.length === 0) {
      callback([]);
      return;
    }

    try {
      // ✅ Récupérer les infos des utilisateurs bloqués
      const users: BlockedUser[] = [];
      
      for (const uid of blockedUids) {
        const userDocRef = doc(firestore, USERS_COLLECTION, uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          users.push({
            uid: uid,
            displayName: userData.displayName || 'Utilisateur',
            username: userData.username || '',
            photoURL: userData.photoURL || '',
            blockedAt: blockedAt[uid]?.blockedAt || Date.now(),
            reason: blockedAt[uid]?.reason || '',
          });
        }
      }

      callback(users);
    } catch (error) {
      console.error('❌ Erreur récupération utilisateurs bloqués:', error);
      callback([]);
    }
  });
};

// ============================================================
// 🔥 VÉRIFIER SI UN UTILISATEUR EST BLOQUÉ
// ============================================================
export const isUserBlocked = async (targetUid: string): Promise<boolean> => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return false;

    const userRef = doc(firestore, USERS_COLLECTION, currentUser.uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const blockedUsers = data.blockedUsers || [];
      return blockedUsers.includes(targetUid);
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erreur vérification blocage:', error);
    return false;
  }
};