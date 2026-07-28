// ========== src/types/notification.ts ==========

export interface Notification {
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
}