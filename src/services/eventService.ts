// ========== src/services/eventService.ts ==========
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
  arrayUnion,
  arrayRemove,
  increment,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';

// ============================================================
// TYPES
// ============================================================
export interface Event {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  date: string;
  time: string;
  endTime?: string;
  timezone: string;
  country: string;
  city: string;
  address: string;
  venue: string;
  organizer: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  artists?: string[];
  groups?: string[];
  maxParticipants?: number;
  externalLink?: string;
  hashtags?: string[];
  participants: number;
  interested: number;
  views: number;
  comments: number;
  createdAt: number;
  going: string[];
  interestedUsers: string[];
  favorites: string[];
  status: 'upcoming' | 'ongoing' | 'past' | 'cancelled';
}

// ============================================================
// CONSTANTES
// ============================================================
const EVENTS_COLLECTION = 'events';

// ============================================================
// CRÉER UN ÉVÉNEMENT
// ============================================================
export const createEvent = async (eventData: Omit<Event, 'id' | 'createdAt' | 'participants' | 'interested' | 'views' | 'comments' | 'going' | 'interestedUsers' | 'favorites' | 'status'>): Promise<string> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const newEvent: Omit<Event, 'id'> = {
      ...eventData,
      organizer: {
        id: user.uid,
        name: user.displayName || 'K-Pop Fan',
        username: user.displayName?.toLowerCase().replace(/\s/g, '') || 'kpopfan',
        avatar: user.photoURL || 'https://i.pravatar.cc/150?img=16',
      },
      participants: 0,
      interested: 0,
      views: 0,
      comments: 0,
      createdAt: Date.now(),
      going: [],
      interestedUsers: [],
      favorites: [],
      status: 'upcoming',
    };

    const docRef = await addDoc(collection(firestore, EVENTS_COLLECTION), newEvent);
    console.log('✅ Événement créé:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error('❌ Erreur création événement:', error);
    throw error;
  }
};

// ============================================================
// RÉCUPÉRER TOUS LES ÉVÉNEMENTS (REALTIME)
// ============================================================
export const getEvents = (callback: (events: Event[]) => void): (() => void) => {
  const q = query(
    collection(firestore, EVENTS_COLLECTION),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const events: Event[] = [];
    const userId = auth.currentUser?.uid || '';

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        image: data.image || 'https://picsum.photos/seed/event/800/400',
        category: data.category || 'Concert',
        date: data.date || '',
        time: data.time || '19:00',
        endTime: data.endTime || '',
        timezone: data.timezone || 'KST',
        country: data.country || 'South Korea',
        city: data.city || 'Seoul',
        address: data.address || '',
        venue: data.venue || '',
        organizer: data.organizer || { id: '', name: '', username: '', avatar: '' },
        artists: data.artists || [],
        groups: data.groups || [],
        maxParticipants: data.maxParticipants || 0,
        externalLink: data.externalLink || '',
        hashtags: data.hashtags || [],
        participants: data.participants || 0,
        interested: data.interested || 0,
        views: data.views || 0,
        comments: data.comments || 0,
        createdAt: data.createdAt || Date.now(),
        going: data.going || [],
        interestedUsers: data.interestedUsers || [],
        favorites: data.favorites || [],
        status: data.status || 'upcoming',
      });
    });
    callback(events);
  });
};

// ============================================================
// RÉCUPÉRER UN ÉVÉNEMENT PAR ID
// ============================================================
export const getEventById = async (eventId: string): Promise<Event | null> => {
  try {
    const docRef = doc(firestore, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        title: data.title || '',
        description: data.description || '',
        image: data.image || 'https://picsum.photos/seed/event/800/400',
        category: data.category || 'Concert',
        date: data.date || '',
        time: data.time || '19:00',
        endTime: data.endTime || '',
        timezone: data.timezone || 'KST',
        country: data.country || 'South Korea',
        city: data.city || 'Seoul',
        address: data.address || '',
        venue: data.venue || '',
        organizer: data.organizer || { id: '', name: '', username: '', avatar: '' },
        artists: data.artists || [],
        groups: data.groups || [],
        maxParticipants: data.maxParticipants || 0,
        externalLink: data.externalLink || '',
        hashtags: data.hashtags || [],
        participants: data.participants || 0,
        interested: data.interested || 0,
        views: data.views || 0,
        comments: data.comments || 0,
        createdAt: data.createdAt || Date.now(),
        going: data.going || [],
        interestedUsers: data.interestedUsers || [],
        favorites: data.favorites || [],
        status: data.status || 'upcoming',
      };
    }
    return null;
  } catch (error) {
    console.error('❌ Erreur récupération événement:', error);
    return null;
  }
};

// ============================================================
// METTRE À JOUR UN ÉVÉNEMENT
// ============================================================
export const updateEvent = async (eventId: string, data: Partial<Event>): Promise<void> => {
  try {
    const docRef = doc(firestore, EVENTS_COLLECTION, eventId);
    await updateDoc(docRef, data);
    console.log('✅ Événement mis à jour:', eventId);
  } catch (error) {
    console.error('❌ Erreur mise à jour événement:', error);
    throw error;
  }
};

// ============================================================
// ✅ SUPPRIMER UN ÉVÉNEMENT - FANAMPINA
// ============================================================
export const deleteEvent = async (eventId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    // ✅ Vérifier que l'utilisateur est l'organisateur
    const docRef = doc(firestore, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Événement non trouvé');
    }

    const eventData = docSnap.data();
    if (eventData.organizer?.id !== user.uid) {
      throw new Error('Vous n\'êtes pas autorisé à supprimer cet événement');
    }

    // ✅ Supprimer l'événement
    await deleteDoc(docRef);
    console.log('✅ Événement supprimé:', eventId);
  } catch (error) {
    console.error('❌ Erreur suppression événement:', error);
    throw error;
  }
};

// ============================================================
// PARTICIPER À UN ÉVÉNEMENT (GOING)
// ============================================================
export const toggleGoing = async (eventId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(firestore, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const isGoing = (data.going || []).includes(user.uid);

      if (isGoing) {
        await updateDoc(docRef, {
          going: arrayRemove(user.uid),
          participants: increment(-1),
        });
      } else {
        await updateDoc(docRef, {
          going: arrayUnion(user.uid),
          participants: increment(1),
          interestedUsers: arrayRemove(user.uid),
          interested: increment(-1),
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur toggle going:', error);
    throw error;
  }
};

// ============================================================
// INTÉRESSÉ PAR UN ÉVÉNEMENT
// ============================================================
export const toggleInterested = async (eventId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(firestore, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const isInterested = (data.interestedUsers || []).includes(user.uid);

      if (isInterested) {
        await updateDoc(docRef, {
          interestedUsers: arrayRemove(user.uid),
          interested: increment(-1),
        });
      } else {
        await updateDoc(docRef, {
          interestedUsers: arrayUnion(user.uid),
          interested: increment(1),
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur toggle interested:', error);
    throw error;
  }
};

// ============================================================
// FAVORI
// ============================================================
export const toggleFavorite = async (eventId: string): Promise<void> => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('User not authenticated');

    const docRef = doc(firestore, EVENTS_COLLECTION, eventId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const isFavorite = (data.favorites || []).includes(user.uid);

      if (isFavorite) {
        await updateDoc(docRef, {
          favorites: arrayRemove(user.uid),
        });
      } else {
        await updateDoc(docRef, {
          favorites: arrayUnion(user.uid),
        });
      }
    }
  } catch (error) {
    console.error('❌ Erreur toggle favorite:', error);
    throw error;
  }
};

// ============================================================
// INCRÉMENTER LES VUES
// ============================================================
export const incrementViews = async (eventId: string): Promise<void> => {
  try {
    const docRef = doc(firestore, EVENTS_COLLECTION, eventId);
    await updateDoc(docRef, {
      views: increment(1),
    });
  } catch (error) {
    console.error('❌ Erreur increment views:', error);
    throw error;
  }
};

// ============================================================
// RÉCUPÉRER LES ÉVÉNEMENTS D'UN UTILISATEUR
// ============================================================
export const getUserEvents = (userId: string, callback: (events: Event[]) => void): (() => void) => {
  const q = query(
    collection(firestore, EVENTS_COLLECTION),
    where('organizer.id', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const events: Event[] = [];
    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        title: data.title || '',
        description: data.description || '',
        image: data.image || 'https://picsum.photos/seed/event/800/400',
        category: data.category || 'Concert',
        date: data.date || '',
        time: data.time || '19:00',
        endTime: data.endTime || '',
        timezone: data.timezone || 'KST',
        country: data.country || 'South Korea',
        city: data.city || 'Seoul',
        address: data.address || '',
        venue: data.venue || '',
        organizer: data.organizer || { id: '', name: '', username: '', avatar: '' },
        artists: data.artists || [],
        groups: data.groups || [],
        maxParticipants: data.maxParticipants || 0,
        externalLink: data.externalLink || '',
        hashtags: data.hashtags || [],
        participants: data.participants || 0,
        interested: data.interested || 0,
        views: data.views || 0,
        comments: data.comments || 0,
        createdAt: data.createdAt || Date.now(),
        going: data.going || [],
        interestedUsers: data.interestedUsers || [],
        favorites: data.favorites || [],
        status: data.status || 'upcoming',
      });
    });
    callback(events);
  });
};

// ============================================================
// EXPORTER TOUTES LES FONCTIONS
// ============================================================
export default {
  createEvent,
  getEvents,
  getEventById,
  updateEvent,
  deleteEvent,      // ✅ Fanampina
  toggleGoing,
  toggleInterested,
  toggleFavorite,
  incrementViews,
  getUserEvents,
};