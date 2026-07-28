// ========== src/utils/localStorage.ts ==========

const POSTS_KEY = 'kpop_posts';
const EVENTS_KEY = 'kpop_events';
const NOTIFICATIONS_KEY = 'kpop_notifications';
const USER_KEY = 'kpop_user_data';
const SETTINGS_KEY = 'kpop_settings';

// ============================================================
// POSTS (LOCAL)
// ============================================================
export const getLocalPosts = (): any[] => {
  const stored = localStorage.getItem(POSTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const saveLocalPosts = (posts: any[]) => {
  localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
};

export const addLocalPost = (post: any) => {
  const posts = getLocalPosts();
  const newPosts = [post, ...posts];
  saveLocalPosts(newPosts);
  return newPosts;
};

// ============================================================
// EVENTS (LOCAL)
// ============================================================
export const getLocalEvents = (): any[] => {
  const stored = localStorage.getItem(EVENTS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const saveLocalEvents = (events: any[]) => {
  localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
};

export const addLocalEvent = (event: any) => {
  const events = getLocalEvents();
  const newEvents = [event, ...events];
  saveLocalEvents(newEvents);
  return newEvents;
};

// ============================================================
// USER DATA (CACHE)
// ============================================================
export const getLocalUser = (): any | null => {
  const stored = localStorage.getItem(USER_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  }
  return null;
};

export const saveLocalUser = (user: any) => {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearLocalUser = () => {
  localStorage.removeItem(USER_KEY);
};

// ============================================================
// SETTINGS
// ============================================================
export const getLocalSettings = (): any => {
  const stored = localStorage.getItem(SETTINGS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {};
    }
  }
  return {};
};

export const saveLocalSettings = (settings: any) => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};