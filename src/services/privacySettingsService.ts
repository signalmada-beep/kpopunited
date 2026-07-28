// ========== src/services/privacySettingsService.ts ==========
import { auth, firestore } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// ============================================================
// 🔥 TYPES
// ============================================================
export interface PrivacySettings {
  profileVisibility: 'public' | 'followers' | 'private';
  allowMessages: 'everyone' | 'followers' | 'mutuals' | 'none';
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  allowTags: boolean;
  allowShares: boolean;
  allowComments: 'everyone' | 'followers' | 'mutuals' | 'none';
  postVisibility: 'public' | 'followers' | 'private';
  storyVisibility: 'public' | 'followers' | 'friends' | 'close_friends' | 'private';
}

// ============================================================
// 🔥 DEFAUT
// ============================================================
const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profileVisibility: 'public',
  allowMessages: 'everyone',
  showOnlineStatus: true,
  showLastSeen: true,
  allowTags: true,
  allowShares: true,
  allowComments: 'everyone',
  postVisibility: 'public',
  storyVisibility: 'public',
};

// ============================================================
// 🔥 SAUVEGARDER LES PRÉFÉRENCES DE CONFIDENTIALITÉ
// ============================================================
export const savePrivacySettings = async (settings: Partial<PrivacySettings>): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Non authentifié');

    const userRef = doc(firestore, 'users', user.uid);
    
    // ✅ Récupérer les settings actuels
    const docSnap = await getDoc(userRef);
    const currentSettings = docSnap.exists() ? docSnap.data()?.privacySettings || DEFAULT_PRIVACY_SETTINGS : DEFAULT_PRIVACY_SETTINGS;
    
    // ✅ Fusionner avec les nouveaux
    const updatedSettings = { ...currentSettings, ...settings };
    
    // ✅ Sauvegarder
    await updateDoc(userRef, {
      privacySettings: updatedSettings,
    });
    
    console.log('✅ Préférences de confidentialité sauvegardées');
  } catch (error) {
    console.error('❌ Erreur sauvegarde préférences:', error);
    throw error;
  }
};

// ============================================================
// 🔥 RÉCUPÉRER LES PRÉFÉRENCES DE CONFIDENTIALITÉ (REALTIME)
// ============================================================
export const getPrivacySettings = (callback: (settings: PrivacySettings) => void): (() => void) => {
  const user = auth.currentUser;
  if (!user) {
    callback(DEFAULT_PRIVACY_SETTINGS);
    return () => {};
  }

  const userRef = doc(firestore, 'users', user.uid);

  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const settings = data.privacySettings || DEFAULT_PRIVACY_SETTINGS;
      callback(settings);
    } else {
      callback(DEFAULT_PRIVACY_SETTINGS);
    }
  });
};

// ============================================================
// 🔥 RÉCUPÉRER LES PRÉFÉRENCES D'UN UTILISATEUR (POUR AFFICHAGE)
// ============================================================
export const getUserPrivacySettings = async (uid: string): Promise<PrivacySettings> => {
  try {
    const userRef = doc(firestore, 'users', uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.privacySettings || DEFAULT_PRIVACY_SETTINGS;
    }
    
    return DEFAULT_PRIVACY_SETTINGS;
  } catch (error) {
    console.error('❌ Erreur récupération préférences:', error);
    return DEFAULT_PRIVACY_SETTINGS;
  }
};

// ============================================================
// 🔥 VÉRIFIER SI UN UTILISATEUR PEUT VOIR LE PROFIL
// ============================================================
export const canViewProfile = async (targetUid: string, currentUserUid?: string): Promise<boolean> => {
  try {
    const settings = await getUserPrivacySettings(targetUid);
    
    if (settings.profileVisibility === 'public') return true;
    
    if (!currentUserUid) return false;
    
    if (settings.profileVisibility === 'followers') {
      // Vérifier si l'utilisateur actuel suit la personne
      const userRef = doc(firestore, 'users', targetUid);
      const docSnap = await getDoc(userRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const followers = data.followers || [];
        return followers.includes(currentUserUid);
      }
    }
    
    if (settings.profileVisibility === 'private') {
      // Seul l'utilisateur lui-même peut voir
      return currentUserUid === targetUid;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erreur vérification visibilité:', error);
    return true;
  }
};

// ============================================================
// 🔥 VÉRIFIER SI UN UTILISATEUR PEUT COMMENTER
// ============================================================
export const canComment = async (targetUid: string, currentUserUid?: string): Promise<boolean> => {
  try {
    const settings = await getUserPrivacySettings(targetUid);
    
    if (settings.allowComments === 'everyone') return true;
    if (!currentUserUid) return false;
    if (currentUserUid === targetUid) return true;
    
    // Vérifier si l'utilisateur suit ou est suivi
    const userRef = doc(firestore, 'users', targetUid);
    const docSnap = await getDoc(userRef);
    if (!docSnap.exists()) return false;
    
    const data = docSnap.data();
    const followers = data.followers || [];
    const following = data.following || [];
    
    if (settings.allowComments === 'followers') {
      return followers.includes(currentUserUid);
    }
    
    if (settings.allowComments === 'mutuals') {
      return followers.includes(currentUserUid) && following.includes(currentUserUid);
    }
    
    return false;
  } catch (error) {
    console.error('❌ Erreur vérification commentaire:', error);
    return true;
  }
};

// ============================================================
// 🔥 RÉINITIALISER LES PRÉFÉRENCES
// ============================================================
export const resetPrivacySettings = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Non authentifié');

    const userRef = doc(firestore, 'users', user.uid);
    await updateDoc(userRef, {
      privacySettings: DEFAULT_PRIVACY_SETTINGS,
    });
    
    console.log('✅ Préférences de confidentialité réinitialisées');
  } catch (error) {
    console.error('❌ Erreur réinitialisation:', error);
    throw error;
  }
};