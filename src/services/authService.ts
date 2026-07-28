// ========== src/services/authService.ts ==========
import { auth, firestore } from '../config/firebase';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  deleteUser,
  onAuthStateChanged,
  confirmPasswordReset,
  verifyPasswordResetCode,
  sendSignInLinkToEmail,
  isSignInWithEmailLink,
  signInWithEmailLink,
  type User,
  sendEmailVerification,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ============================================================
// 🔥 CONSTANTES
// ============================================================
const USERS_COLLECTION = 'users';

// ============================================================
// 🔥 FONCTIONS DE TRADUCTION DES ERREURS
// ============================================================
const translateAuthError = (error: any): string => {
  const code = error.code || '';
  
  // ✅ Erreurs d'inscription
  if (code === 'auth/email-already-in-use') {
    return 'Cet email est déjà utilisé par un autre compte.';
  }
  if (code === 'auth/invalid-email') {
    return 'L\'adresse email que vous avez saisie n\'est pas valide.';
  }
  if (code === 'auth/weak-password') {
    return 'Le mot de passe est trop faible. Utilisez au moins 6 caractères.';
  }
  if (code === 'auth/operation-not-allowed') {
    return 'L\'inscription par email/mot de passe est temporairement désactivée.';
  }
  
  // ✅ Erreurs de connexion
  if (code === 'auth/user-not-found') {
    return 'Aucun compte ne correspond à cet email.';
  }
  if (code === 'auth/wrong-password') {
    return 'Le mot de passe est incorrect. Veuillez réessayer.';
  }
  if (code === 'auth/too-many-requests') {
    return 'Trop de tentatives. Veuillez réessayer dans quelques minutes.';
  }
  if (code === 'auth/user-disabled') {
    return 'Ce compte a été désactivé. Contactez le support.';
  }
  
  // ✅ Erreurs de réseau
  if (code === 'auth/network-request-failed') {
    return 'Problème de connexion. Vérifiez votre réseau.';
  }
  
  // ✅ Erreurs de réinitialisation
  if (code === 'auth/expired-action-code') {
    return 'Le lien de réinitialisation a expiré. Veuillez en demander un nouveau.';
  }
  if (code === 'auth/invalid-action-code') {
    return 'Le lien de réinitialisation est invalide. Veuillez en demander un nouveau.';
  }
  
  // ✅ Erreurs de vérification email
  if (code === 'auth/requires-recent-login') {
    return 'Cette action nécessite une nouvelle connexion. Veuillez vous reconnecter.';
  }
  
  // ✅ Erreurs générales
  if (code === 'auth/internal-error') {
    return 'Le mot de passe est incorrect. Veuillez réessayer.';
  }
  
  // ✅ Message par défaut (personnalisé)
  console.warn('Erreur non traduite:', code, error.message);
  return 'Une erreur est survenue. Veuillez réessayer.';
};

// ============================================================
// 🔥 INSCRIPTION AVEC EMAIL ET MOT DE PASSE
// ============================================================
export const registerUser = async (
  email: string,
  password: string,
  displayName: string,
  username?: string,
  bio?: string,
  photoURL?: string,
  coverPhoto?: string,
  birthday?: string
) => {
  try {
    // ✅ Vérifier que l'email est valide
    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new Error('L\'adresse email n\'est pas valide.');
    }

    // ✅ Vérifier que le mot de passe est assez fort
    if (!password || password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    }

    console.log('📝 Création du compte...');

    // ✅ Créer le compte
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Compte créé avec succès');

    // ✅ Mettre à jour le displayName
    await updateProfile(user, { displayName });

    // ✅ Envoyer un email de vérification
    try {
      await sendEmailVerification(user);
      console.log('📧 Email de vérification envoyé');
    } catch (verifError) {
      console.warn('⚠️ Erreur envoi vérification:', verifError);
    }

    // ✅ Maka ny isan'ny utilisateur
    const userCount = await getUserCount();
    const registrationNumber = userCount + 1;
    const badge = getBadgeByNumber(registrationNumber);

    // ✅ Mamorona le profil
    const finalUsername = username || displayName.toLowerCase().replace(/\s/g, '');
    const finalPhotoURL = photoURL || '';
    const finalCoverPhoto = coverPhoto || '';

    const userData = {
      uid: user.uid,
      email: email,
      displayName: displayName,
      username: finalUsername,
      photoURL: finalPhotoURL,
      coverPhoto: finalCoverPhoto,
      bio: bio || '',
      location: '',
      website: '',
      phone: '',
      birthday: birthday || '',
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
      isVerified: registrationNumber <= 10,
      createdAt: Date.now(),
      lastLogin: Date.now(),
    };

    await setDoc(doc(firestore, USERS_COLLECTION, user.uid), userData);

    console.log('✅ Profil créé avec succès');
    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Erreur inscription:', error);
    // ✅ Traduire l'erreur avant de la renvoyer
    throw new Error(translateAuthError(error));
  }
};

// ============================================================
// 🔥 CONNEXION AVEC EMAIL ET MOT DE PASSE
// ============================================================
export const loginUser = async (email: string, password: string) => {
  try {
    // ✅ Vérifier que l'email est valide
    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new Error('L\'adresse email n\'est pas valide.');
    }

    if (!password || password.length < 6) {
      throw new Error('Le mot de passe doit contenir au moins 6 caractères.');
    }

    console.log('🔑 Tentative de connexion...');

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    console.log('✅ Connexion réussie');

    // ✅ Mettre à jour le lastLogin
    if (user) {
      try {
        await updateDoc(doc(firestore, USERS_COLLECTION, user.uid), {
          lastLogin: Date.now(),
        });
      } catch (updateError) {
        console.warn('⚠️ Erreur mise à jour lastLogin:', updateError);
      }
    }

    return userCredential.user;
  } catch (error: any) {
    console.error('❌ Erreur connexion:', error);
    // ✅ Traduire l'erreur avant de la renvoyer
    throw new Error(translateAuthError(error));
  }
};

// ============================================================
// 🔥 ENVOYER UN LIEN DE RÉINITIALISATION
// ============================================================
export const sendPasswordReset = async (email: string): Promise<void> => {
  try {
    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new Error('L\'adresse email n\'est pas valide.');
    }

    const actionCodeSettings = {
      url: `${window.location.origin}/auth/reset-password`,
      handleCodeInApp: false,
    };

    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    console.log('📧 Email de réinitialisation envoyé');
  } catch (error: any) {
    console.error('❌ Erreur envoi réinitialisation:', error);
    throw new Error(translateAuthError(error));
  }
};

// ============================================================
// 🔥 ENVOYER UN LIEN DE VÉRIFICATION
// ============================================================
export const sendVerificationLink = async (email: string): Promise<void> => {
  try {
    if (!email || !email.includes('@') || !email.includes('.')) {
      throw new Error('L\'adresse email n\'est pas valide.');
    }

    const actionCodeSettings = {
      url: `${window.location.origin}/auth/verify-email`,
      handleCodeInApp: true,
    };

    await sendSignInLinkToEmail(auth, email, actionCodeSettings);
    window.localStorage.setItem('emailForSignIn', email);
    console.log('📧 Lien de vérification envoyé');
  } catch (error: any) {
    console.error('❌ Erreur envoi lien:', error);
    throw new Error(translateAuthError(error));
  }
};

// ============================================================
// 🔥 VÉRIFIER LE LIEN
// ============================================================
export const isVerificationLink = (url: string): boolean => {
  return isSignInWithEmailLink(auth, url);
};

export const verifyEmailLink = async (email: string, url: string): Promise<User> => {
  try {
    const result = await signInWithEmailLink(auth, email, url);
    window.localStorage.removeItem('emailForSignIn');
    console.log('✅ Email vérifié avec succès');
    return result.user;
  } catch (error: any) {
    console.error('❌ Erreur vérification:', error);
    throw new Error('Le lien de vérification est invalide ou a expiré.');
  }
};

// ============================================================
// 🔥 VÉRIFIER LE CODE DE RÉINITIALISATION
// ============================================================
export const verifyResetCode = async (oobCode: string) => {
  try {
    const email = await verifyPasswordResetCode(auth, oobCode);
    return { valid: true, email };
  } catch (error: any) {
    console.error('❌ Code invalide:', error);
    return { valid: false, email: null };
  }
};

export const confirmResetPassword = async (oobCode: string, newPassword: string) => {
  try {
    await confirmPasswordReset(auth, oobCode, newPassword);
    console.log('✅ Mot de passe réinitialisé avec succès');
    return true;
  } catch (error: any) {
    console.error('❌ Erreur confirmation:', error);
    throw new Error('Le lien de réinitialisation est invalide ou a expiré.');
  }
};

// ============================================================
// 🔥 DÉCONNEXION
// ============================================================
export const logoutUser = async () => {
  try {
    await signOut(auth);
    console.log('✅ Déconnexion réussie');
  } catch (error: any) {
    console.error('❌ Erreur déconnexion:', error);
    throw new Error('Erreur lors de la déconnexion. Veuillez réessayer.');
  }
};

// ============================================================
// 🔥 GESTION DU COMPTE
// ============================================================
export const onAuthStateChangedListener = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};

export const getCurrentUserId = (): string | null => {
  return auth.currentUser?.uid || null;
};

export const updateUserProfile = async (displayName: string, photoURL?: string) => {
  const user = auth.currentUser;
  if (user) {
    try {
      await updateProfile(user, { displayName, photoURL });
      await updateDoc(doc(firestore, USERS_COLLECTION, user.uid), {
        displayName: displayName,
        photoURL: photoURL || '',
      });
      console.log('✅ Profil mis à jour');
    } catch (error: any) {
      console.error('❌ Erreur mise à jour profil:', error);
      throw new Error('Erreur lors de la mise à jour du profil.');
    }
  }
};

export const updateUserEmail = async (newEmail: string) => {
  const user = auth.currentUser;
  if (user) {
    try {
      await updateEmail(user, newEmail);
      await updateDoc(doc(firestore, USERS_COLLECTION, user.uid), {
        email: newEmail,
      });
      console.log('✅ Email mis à jour');
    } catch (error: any) {
      console.error('❌ Erreur mise à jour email:', error);
      throw new Error('Erreur lors de la mise à jour de l\'email.');
    }
  }
};

export const updateUserPassword = async (currentPassword: string, newPassword: string) => {
  const user = auth.currentUser;
  if (user && user.email) {
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      console.log('✅ Mot de passe mis à jour');
    } catch (error: any) {
      console.error('❌ Erreur mise à jour mot de passe:', error);
      throw new Error('Mot de passe actuel incorrect ou erreur lors de la mise à jour.');
    }
  }
};

export const updateUserInfo = async (data: {
  displayName?: string;
  bio?: string;
  location?: string;
  website?: string;
  phone?: string;
  birthday?: string;
  gender?: string;
  photoURL?: string;
  coverPhoto?: string;
}) => {
  const user = auth.currentUser;
  if (user) {
    try {
      const userRef = doc(firestore, USERS_COLLECTION, user.uid);
      await updateDoc(userRef, data);
      if (data.displayName) {
        await updateProfile(user, { displayName: data.displayName });
      }
      console.log('✅ Informations mises à jour');
    } catch (error: any) {
      console.error('❌ Erreur mise à jour infos:', error);
      throw new Error('Erreur lors de la mise à jour des informations.');
    }
  }
};

// ============================================================
// 🔥 RÉCUPÉRER LES INFORMATIONS D'UN UTILISATEUR
// ============================================================
export const getUserInfo = async (uid?: string) => {
  const userId = uid || auth.currentUser?.uid;
  if (!userId) return null;

  try {
    const docRef = doc(firestore, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data();
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération info:', error);
    return null;
  }
};

// ============================================================
// 🔥 RÉCUPÉRER UN UTILISATEUR PAR USERNAME
// ============================================================
export const getUserByUsername = async (username: string) => {
  try {
    const q = query(
      collection(firestore, USERS_COLLECTION),
      where('username', '==', username.toLowerCase().trim())
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      return snapshot.docs[0].data();
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération par username:', error);
    return null;
  }
};

// ============================================================
// 🔥 SUPPRIMER UN COMPTE
// ============================================================
export const deleteUserAccount = async (password: string) => {
  const user = auth.currentUser;
  if (user && user.email) {
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteDoc(doc(firestore, USERS_COLLECTION, user.uid));
      await deleteUser(user);
      console.log('✅ Compte supprimé');
    } catch (error: any) {
      console.error('❌ Erreur suppression compte:', error);
      throw new Error('Mot de passe incorrect ou erreur lors de la suppression.');
    }
  }
};

export const verifyPassword = async (password: string): Promise<boolean> => {
  const user = auth.currentUser;
  if (user && user.email) {
    try {
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      return true;
    } catch {
      return false;
    }
  }
  return false;
};

// ============================================================
// 🔥 COMPTER LES UTILISATEURS
// ============================================================
export const getUserCount = async (): Promise<number> => {
  try {
    const snapshot = await getDocs(collection(firestore, USERS_COLLECTION));
    return snapshot.size;
  } catch (error) {
    console.error('❌ Erreur comptage:', error);
    return 0;
  }
};

// ============================================================
// 🔥 BADGES
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
// 🔥 UPLOAD PHOTO
// ============================================================
export const uploadProfilePhoto = async (file: File, uid: string, type: 'profile' | 'cover'): Promise<string> => {
  try {
    const storage = getStorage();
    const path = `users/${uid}/${type}_${Date.now()}.jpg`;
    const storageRef = ref(storage, path);
    
    console.log(`📤 Upload ${type}...`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    
    console.log(`✅ ${type} uploadé avec succès`);
    return url;
  } catch (error) {
    console.error(`❌ Erreur upload ${type}:`, error);
    return '';
  }
};