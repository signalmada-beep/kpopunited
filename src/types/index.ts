// ========== src/types/index.ts ==========

export interface CommentData {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    verified?: boolean;
  };
  content: string;
  timestamp: number;
  likes: number;
  liked: boolean;
  replies: CommentData[];
  isPinned?: boolean;
  isEdited?: boolean;
}

export interface PostData {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    group: string;
    verified?: boolean;
  };
  content: string;
  image?: string;
  images?: string[];
  video?: string;
  timestamp: number;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  saved: boolean;
  reaction: string | null;
  tags: string[];
  mentions: string[];
  category: string;
  mood?: string | null;
  isEdited?: boolean;
  privacy: 'public' | 'friends' | 'followers' | 'private';
  isPinned?: boolean;
  isArchived?: boolean;
  commentsDisabled?: boolean;
  commentsData?: CommentData[];
}

export interface UserProfile {
  uid: string;
  displayName: string;
  username: string;
  email: string;
  photoURL: string;
  coverPhoto: string;
  bio: string;
  location: string;
  website: string;
  phone: string;
  birthday: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
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
  isVerified: boolean;
  createdAt: number;
  lastLogin: number;
}

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