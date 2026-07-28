// ========== src/services/notificationSettingsService.ts ==========
import { auth, firestore } from '../config/firebase';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';

// ============================================================
// 🔥 TYPES
// ============================================================
export interface NotificationSettings {
  likes: boolean;
  comments: boolean;
  mentions: boolean;
  follows: boolean;
  messages: boolean;
  events: boolean;
  newsletters: boolean;
  reactions: boolean;
  shares: boolean;
  storyReplies: boolean;
}

// ============================================================
// 🔥 DEFAUT
// ============================================================
const DEFAULT_SETTINGS: NotificationSettings = {
  likes: true,
  comments: true,
  mentions: true,
  follows: true,
  messages: true,
  events: true,
  newsletters: true,
  reactions: true,
  shares: true,
  storyReplies: true,
};

// ============================================================
// 🔥 SAUVEGARDER LES PRÉFÉRENCES
// ============================================================
export const saveNotificationSettings = async (settings: Partial<NotificationSettings>): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Non authentifié');

    const userRef = doc(firestore, 'users', user.uid);
    
    // ✅ Récupérer les settings actuels
    const docSnap = await getDoc(userRef);
    const currentSettings = docSnap.exists() ? docSnap.data()?.notificationSettings || DEFAULT_SETTINGS : DEFAULT_SETTINGS;
    
    // ✅ Fusionner avec les nouveaux
    const updatedSettings = { ...currentSettings, ...settings };
    
    // ✅ Sauvegarder
    await updateDoc(userRef, {
      notificationSettings: updatedSettings,
    });
    
    console.log('✅ Préférences de notification sauvegardées');
  } catch (error) {
    console.error('❌ Erreur sauvegarde préférences:', error);
    throw error;
  }
};

// ============================================================
// 🔥 RÉCUPÉRER LES PRÉFÉRENCES (REALTIME)
// ============================================================
export const getNotificationSettings = (callback: (settings: NotificationSettings) => void): (() => void) => {
  const user = auth.currentUser;
  if (!user) {
    callback(DEFAULT_SETTINGS);
    return () => {};
  }

  const userRef = doc(firestore, 'users', user.uid);

  return onSnapshot(userRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data();
      const settings = data.notificationSettings || DEFAULT_SETTINGS;
      callback(settings);
    } else {
      callback(DEFAULT_SETTINGS);
    }
  });
};

// ============================================================
// 🔥 VÉRIFIER SI UN TYPE DE NOTIFICATION EST ACTIVÉ
// ============================================================
export const isNotificationEnabled = async (type: keyof NotificationSettings): Promise<boolean> => {
  try {
    const user = auth.currentUser;
    if (!user) return false;

    const userRef = doc(firestore, 'users', user.uid);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      const settings = data.notificationSettings || DEFAULT_SETTINGS;
      return settings[type] !== false;
    }
    
    return DEFAULT_SETTINGS[type] !== false;
  } catch (error) {
    console.error('❌ Erreur vérification préférence:', error);
    return true;
  }
};

// ============================================================
// 🔥 RÉINITIALISER LES PRÉFÉRENCES
// ============================================================
export const resetNotificationSettings = async (): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Non authentifié');

    const userRef = doc(firestore, 'users', user.uid);
    await updateDoc(userRef, {
      notificationSettings: DEFAULT_SETTINGS,
    });
    
    console.log('✅ Préférences réinitialisées');
  } catch (error) {
    console.error('❌ Erreur réinitialisation:', error);
    throw error;
  }
};