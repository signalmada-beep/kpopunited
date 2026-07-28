// ========== src/services/syncService.ts ==========
import { auth, firestore } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';

// ============================================================
// 🔥 SYNC POSTS
// ============================================================
export const syncPosts = async (posts: any[]) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // Mamafa ny posts taloha
    const q = query(
      collection(firestore, 'posts'),
      where('author.id', '==', user.uid)
    );
    const snapshot = await getDocs(q);
    const batch = [];
    snapshot.docs.forEach((doc) => {
      batch.push(deleteDoc(doc.ref));
    });
    await Promise.all(batch);

    // Mamorona posts vaovao
    for (const post of posts) {
      await addDoc(collection(firestore, 'posts'), {
        ...post,
        author: {
          ...post.author,
          id: user.uid,
        },
        syncedAt: serverTimestamp(),
      });
    }
    console.log('✅ Posts synchronisés');
  } catch (error) {
    console.error('❌ Erreur sync posts:', error);
  }
};

// ============================================================
// 🔥 SYNC EVENTS
// ============================================================
export const syncEvents = async (events: any[]) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const q = query(
      collection(firestore, 'events'),
      where('organizer.id', '==', user.uid)
    );
    const snapshot = await getDocs(q);
    const batch = [];
    snapshot.docs.forEach((doc) => {
      batch.push(deleteDoc(doc.ref));
    });
    await Promise.all(batch);

    for (const event of events) {
      await addDoc(collection(firestore, 'events'), {
        ...event,
        organizer: {
          ...event.organizer,
          id: user.uid,
        },
        syncedAt: serverTimestamp(),
      });
    }
    console.log('✅ Events synchronisés');
  } catch (error) {
    console.error('❌ Erreur sync events:', error);
  }
};

// ============================================================
// 🔥 SYNC NOTIFICATIONS
// ============================================================
export const syncNotifications = async (notifications: any[]) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const q = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid)
    );
    const snapshot = await getDocs(q);
    const batch = [];
    snapshot.docs.forEach((doc) => {
      batch.push(deleteDoc(doc.ref));
    });
    await Promise.all(batch);

    for (const notif of notifications) {
      await addDoc(collection(firestore, 'notifications'), {
        ...notif,
        userId: user.uid,
        syncedAt: serverTimestamp(),
      });
    }
    console.log('✅ Notifications synchronisées');
  } catch (error) {
    console.error('❌ Erreur sync notifications:', error);
  }
};

// ============================================================
// 🔥 SYNC ALL
// ============================================================
export const syncAllToFirebase = async () => {
  const user = auth.currentUser;
  if (!user) {
    console.log('⚠️ Aucun utilisateur connecté');
    return;
  }

  console.log('🔄 Synchronisation des données...');

  // Maka ny données avy amin'ny localStorage
  const posts = JSON.parse(localStorage.getItem('kpop_posts') || '[]');
  const events = JSON.parse(localStorage.getItem('kpop_events') || '[]');
  const notifications = JSON.parse(localStorage.getItem('kpop_notifications') || '[]');

  // Sync
  await syncPosts(posts);
  await syncEvents(events);
  await syncNotifications(notifications);

  console.log('✅ Synchronisation terminée!');
};

// ============================================================
// 🔥 SYNC FIRESTORE TO LOCAL
// ============================================================
export const loadFromFirebase = async () => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    // 🔥 Posts
    const postsQuery = query(
      collection(firestore, 'posts'),
      where('author.id', '==', user.uid)
    );
    const postsSnapshot = await getDocs(postsQuery);
    const posts = postsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    localStorage.setItem('kpop_posts', JSON.stringify(posts));

    // 🔥 Events
    const eventsQuery = query(
      collection(firestore, 'events'),
      where('organizer.id', '==', user.uid)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    const events = eventsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    localStorage.setItem('kpop_events', JSON.stringify(events));

    // 🔥 Notifications
    const notifQuery = query(
      collection(firestore, 'notifications'),
      where('userId', '==', user.uid)
    );
    const notifSnapshot = await getDocs(notifQuery);
    const notifications = notifSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    localStorage.setItem('kpop_notifications', JSON.stringify(notifications));

    console.log('✅ Données chargées');
  } catch (error) {
    console.error('❌ Erreur chargement ...:', error);
  }
};

// ============================================================
// 🔥 SYNC USER PROFILE
// ============================================================
export const syncUserProfile = async (userData: any) => {
  const user = auth.currentUser;
  if (!user) return;

  try {
    const userRef = doc(firestore, 'users', user.uid);
    await setDoc(userRef, {
      ...userData,
      uid: user.uid,
      lastSync: serverTimestamp(),
    }, { merge: true });
    console.log('✅ Profil synchronisé');
  } catch (error) {
    console.error('❌ Erreur sync profil:', error);
  }
};