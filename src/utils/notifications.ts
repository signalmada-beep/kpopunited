// ========== src/utils/notifications.ts ==========

export type Notification = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  type: 'like' | 'comment' | 'share' | 'reaction' | 'event_going' | 'event_interested' | 'vote' | 'follow' | 'mention';
  target: string;
  targetId: string;
  timestamp: number;
  read: boolean;
  link: string;
};

const NOTIFICATIONS_KEY = 'kpop_notifications';

export const getNotifications = (): Notification[] => {
  const stored = localStorage.getItem(NOTIFICATIONS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }
  return [];
};

export const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>): Notification => {
  const list = getNotifications();
  const newNotif: Notification = {
    ...notification,
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: Date.now(),
    read: false,
  };
  list.unshift(newNotif);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(list));
  window.dispatchEvent(new StorageEvent('storage', { key: NOTIFICATIONS_KEY }));
  return newNotif;
};

export const markAsRead = (id: string): void => {
  const list = getNotifications();
  const updated = list.map(n => n.id === id ? { ...n, read: true } : n);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
};

export const markAllAsRead = (): void => {
  const list = getNotifications();
  const updated = list.map(n => ({ ...n, read: true }));
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
};

export const deleteNotification = (id: string): void => {
  const list = getNotifications();
  const updated = list.filter(n => n.id !== id);
  localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));
};