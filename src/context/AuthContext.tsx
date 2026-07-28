// ========== src/context/AuthContext.tsx ==========
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  onAuthStateChanged, 
  signOut,
} from 'firebase/auth';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc,
  serverTimestamp,
  collection,
  getDocs,
  onSnapshot, // ✅ Ampiana ity
} from 'firebase/firestore';
import { auth, firestore } from '../config/firebase';
import { isValidAvatar, DEFAULT_AVATAR } from '../utils/avatarUtils';

// ============================================================
// TYPE D'UTILISATEUR UNIFIÉ
// ============================================================
export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  username: string;
  photoURL: string;
  coverPhoto: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  birthday: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  provider: 'firebase' | 'oauth';
  isVerified: boolean;
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
  createdAt: number;
  lastLogin: number;
}

// ============================================================
// TYPE HO AN'NY CONTEXT
// ============================================================
interface AuthContextType {
  user: AppUser | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  provider: 'firebase' | 'oauth' | null;
  refreshUser: () => Promise<void>;
  updateUserData: (data: Partial<AppUser>) => Promise<void>;
}

// ============================================================
// CRÉATION DU CONTEXT
// ============================================================
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================
// BADGES
// ============================================================
const BADGE_TIERS = [
  { tier: 1, name: 'Légende Bleue', color: '#4A90D9', icon: '💎', range: '1-10' },
  { tier: 2, name: 'Légende Verte', color: '#00B894', icon: '🌟', range: '11-20' },
  { tier: 3, name: 'Légende Violette', color: '#C084FC', icon: '💜', range: '21-40' },
  { tier: 4, name: 'Légende Orange', color: '#FF6B6B', icon: '🔥', range: '41-60' },
  { tier: 5, name: 'Légende Rose', color: '#EC4899', icon: '🌸', range: '61-70' },
  { tier: 6, name: 'Légende Dorée', color: '#FFD700', icon: '⭐', range: '71-100' },
  { tier: 7, name: 'Fan', color: '#7A7A9A', icon: '🎵', range: '100+' },
];

const getBadgeByNumber = (number: number) => {
  if (number <= 10) return BADGE_TIERS[0];
  if (number <= 20) return BADGE_TIERS[1];
  if (number <= 40) return BADGE_TIERS[2];
  if (number <= 60) return BADGE_TIERS[3];
  if (number <= 70) return BADGE_TIERS[4];
  if (number <= 100) return BADGE_TIERS[5];
  return BADGE_TIERS[6];
};

// ============================================================
// USER DATA DEFAUT - TSY MAMPIDINA SARY IVELANY
// ============================================================
const getDefaultUserData = (firebaseUser: any): Partial<AppUser> => {
  const displayName = firebaseUser.displayName || 'K-Pop Fan';
  const username = displayName.toLowerCase().replace(/\s/g, '_') + '_' + Math.floor(Math.random() * 1000);
  
  return {
    id: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: displayName,
    username: username,
    photoURL: '',
    coverPhoto: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    birthday: '',
    gender: 'prefer-not-to-say',
    provider: 'firebase',
    isVerified: false,
    registrationNumber: 0,
    badge: { name: 'Fan', color: '#7A7A9A', icon: '🎵', tier: 7 },
    followers: [],
    following: [],
    posts: 0,
    createdAt: Date.now(),
    lastLogin: Date.now(),
  };
};

// ============================================================
// COMPTER LES UTILISATEURS
// ============================================================
const getUserCount = async (): Promise<number> => {
  try {
    const snapshot = await getDocs(collection(firestore, 'users'));
    return snapshot.size;
  } catch (error) {
    console.error('❌ Erreur comptage:', error);
    return 0;
  }
};

// ============================================================
// AUTH PROVIDER
// ============================================================
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [provider, setProvider] = useState<'firebase' | 'oauth' | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // CRÉER UN PROFIL POUR L'UTILISATEUR - TSY MAMPISY SARY IVELANY
  // ============================================================
  const createUserProfile = async (firebaseUser: any): Promise<AppUser | null> => {
    try {
      console.log('📝 Création du profil pour:', firebaseUser.uid);
      
      const userCount = await getUserCount();
      const registrationNumber = userCount + 1;
      const badge = getBadgeByNumber(registrationNumber);
      
      const displayName = firebaseUser.displayName || 'K-Pop Fan';
      const username = displayName.toLowerCase().replace(/\s/g, '_') + '_' + Math.floor(Math.random() * 1000);
      
      const userData: AppUser = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: displayName,
        username: username,
        photoURL: '',
        coverPhoto: '',
        bio: '',
        location: '',
        website: '',
        phone: '',
        birthday: '',
        gender: 'prefer-not-to-say',
        provider: 'firebase',
        isVerified: registrationNumber <= 10,
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
        createdAt: Date.now(),
        lastLogin: Date.now(),
      };
      
      await setDoc(doc(firestore, 'users', firebaseUser.uid), userData);
      console.log('✅ Profil créé avec succès');
      
      return userData;
    } catch (error) {
      console.error('❌ Erreur création profil:', error);
      return null;
    }
  };

  // ============================================================
  // REFRESH USER
  // ============================================================
  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      setUser(null);
      setProvider(null);
      return;
    }

    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const data = userSnap.data();
        const photoURL = data.photoURL || '';
        
        setUser({
          id: currentUser.uid,
          email: currentUser.email || '',
          displayName: data.displayName || currentUser.displayName || 'K-Pop Fan',
          username: data.username || data.displayName?.toLowerCase().replace(/\s/g, '_') || 'user',
          photoURL: isValidAvatar(photoURL) ? photoURL : '',
          coverPhoto: data.coverPhoto || '',
          bio: data.bio || '',
          location: data.location || '',
          website: data.website || '',
          phone: data.phone || '',
          birthday: data.birthday || '',
          gender: data.gender || 'prefer-not-to-say',
          provider: 'firebase',
          isVerified: data.isVerified || false,
          registrationNumber: data.registrationNumber || 0,
          badge: data.badge || { name: 'Fan', color: '#7A7A9A', icon: '🎵', tier: 7 },
          followers: data.followers || [],
          following: data.following || [],
          posts: data.posts || 0,
          createdAt: data.createdAt || Date.now(),
          lastLogin: data.lastLogin || Date.now(),
        });
        setProvider('firebase');
      } else {
        console.log('⚠️ Tsy misy profil, mamorona vaovao...');
        const newProfile = await createUserProfile(currentUser);
        if (newProfile) {
          setUser(newProfile);
          setProvider('firebase');
        } else {
          const defaultData = getDefaultUserData(currentUser);
          setUser({
            ...defaultData,
            id: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'K-Pop Fan',
            username: currentUser.displayName?.toLowerCase().replace(/\s/g, '_') || 'user',
            photoURL: '',
          } as AppUser);
          setProvider('firebase');
        }
      }
    } catch (error) {
      console.error('❌ Erreur chargement profil:', error);
      
      const defaultData = getDefaultUserData(currentUser);
      setUser({
        ...defaultData,
        id: currentUser.uid,
        email: currentUser.email || '',
        displayName: currentUser.displayName || 'K-Pop Fan',
        username: currentUser.displayName?.toLowerCase().replace(/\s/g, '_') || 'user',
        photoURL: '',
      } as AppUser);
      setProvider('firebase');
    }
  };

  // ============================================================
  // UPDATE USER DATA
  // ============================================================
  const updateUserData = async (data: Partial<AppUser>) => {
    const currentUser = auth.currentUser;
    if (!currentUser) throw new Error('Tsy mbola tafiditra');

    try {
      const userRef = doc(firestore, 'users', currentUser.uid);
      const { id, provider, ...updateData } = data;
      
      await updateDoc(userRef, updateData);
      setUser(prev => prev ? { ...prev, ...data } : null);
      
      console.log('✅ User data navaozina');
    } catch (error) {
      console.error('❌ Erreur fanavaozana:', error);
      throw error;
    }
  };

  // ============================================================
  // DÉCONNEXION
  // ============================================================
  const logout = async () => {
    try {
      const currentUser = auth.currentUser;
      if (currentUser) {
        try {
          await updateDoc(doc(firestore, 'users', currentUser.uid), {
            isOnline: false,
            lastSeen: Date.now(),
          });
        } catch (e) {
          console.log('⚠️ Tsy nisy profil hatao offline');
        }
      }
      
      await signOut(auth);
      setUser(null);
      setProvider(null);
      console.log('✅ Déconnexion réussie');
    } catch (error) {
      console.error('❌ Erreur déconnexion:', error);
      throw error;
    }
  };

  // ============================================================
  // ÉCOUTEUR D'AUTHENTIFICATION
  // ============================================================
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔍 Auth state changed:', firebaseUser?.uid || 'null');
      
      if (firebaseUser) {
        await refreshUser();
      } else {
        setUser(null);
        setProvider(null);
      }
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================================================
  // ✅ ÉCOUTEUR DES CHANGEMENTS DU PROFIL (Realtime)
  // ============================================================
  useEffect(() => {
    if (!user?.id) return;

    const userRef = doc(firestore, 'users', user.id);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const photoURL = data.photoURL || '';
        
        setUser(prev => prev ? {
          ...prev,
          displayName: data.displayName || prev.displayName,
          username: data.username || prev.username,
          photoURL: isValidAvatar(photoURL) ? photoURL : '',
          coverPhoto: data.coverPhoto || prev.coverPhoto,
          bio: data.bio || prev.bio,
          location: data.location || prev.location,
          website: data.website || prev.website,
          phone: data.phone || prev.phone,
          birthday: data.birthday || prev.birthday,
          gender: data.gender || prev.gender,
          isVerified: data.isVerified || false,
          registrationNumber: data.registrationNumber || 0,
          badge: data.badge || prev.badge,
          followers: data.followers || [],
          following: data.following || [],
          posts: data.posts || 0,
          lastLogin: data.lastLogin || Date.now(),
        } : null);
      }
    }, (error) => {
      console.error('❌ Erreur écouteur profil:', error);
    });

    return () => unsubscribe();
  }, [user?.id]);

  const isAuthenticated = !!user && user.id !== '' && user.id !== undefined;

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      logout,
      isAuthenticated,
      provider,
      refreshUser,
      updateUserData,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ============================================================
// HOOK USE AUTH
// ============================================================
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth dia tsy maintsy ampiasaina ao anaty AuthProvider');
  }
  return context;
};

export default AuthProvider;