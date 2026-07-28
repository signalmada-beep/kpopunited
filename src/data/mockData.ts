export interface PostData {
  id: string;
  author: {
    name: string;
    username: string;
    avatar: string;
    group: string;
  };
  content: string;
  image?: string;
  timestamp: number;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  tags: string[];
}

const avatarUrls = {
  jimin: 'https://i.pravatar.cc/150?img=11',
  blackpink: 'https://i.pravatar.cc/150?img=12',
  newjeans: 'https://i.pravatar.cc/150?img=13',
  straykids: 'https://i.pravatar.cc/150?img=14',
  twice: 'https://i.pravatar.cc/150?img=15',
  kpopfan: 'https://i.pravatar.cc/150?img=16',
  bts: 'https://i.pravatar.cc/150?img=17',
};

export const mockPosts: PostData[] = [
  {
    id: '1',
    author: {
      name: 'Jimin',
      username: 'jimin',
      avatar: avatarUrls.jimin,
      group: 'BTS'
    },
    content: 'Excited to announce my new solo album "FACE" - coming soon! 🎵',
    image: 'https://picsum.photos/seed/face/600/400',
    timestamp: Date.now() - 15 * 60 * 60 * 1000,
    likes: 24800,
    comments: 3200,
    shares: 1600,
    liked: false,
    tags: ['Jimin', 'BTS', 'FACE']
  },
  {
    id: '2',
    author: {
      name: 'BLACKPINK',
      username: 'blackpink',
      avatar: avatarUrls.blackpink,
      group: 'BLACKPINK'
    },
    content: 'BLINKs! Are you ready for our WORLD TOUR? ❤️',
    image: 'https://picsum.photos/seed/tour/600/400',
    timestamp: Date.now() - 4 * 60 * 60 * 1000,
    likes: 8700,
    comments: 2100,
    shares: 975,
    liked: false,
    tags: ['BLACKPINK', 'WorldTour', 'BLINK']
  },
  {
    id: '3',
    author: {
      name: 'NewJeans',
      username: 'newjeans',
      avatar: avatarUrls.newjeans,
      group: 'NewJeans'
    },
    content: 'Debut anniversary! Thank you Bunnies 🐰💕',
    image: 'https://picsum.photos/seed/newjeans/600/400',
    timestamp: Date.now() - 6 * 60 * 60 * 1000,
    likes: 12500,
    comments: 890,
    shares: 430,
    liked: false,
    tags: ['NewJeans', '1Year', 'Bunnies']
  },
  {
    id: '4',
    author: {
      name: 'Stray Kids',
      username: 'straykids',
      avatar: avatarUrls.straykids,
      group: 'Stray Kids'
    },
    content: 'We won the award! Thank you STAY! 🏆',
    image: 'https://picsum.photos/seed/award/600/400',
    timestamp: Date.now() - 8 * 60 * 60 * 1000,
    likes: 9800,
    comments: 1200,
    shares: 560,
    liked: false,
    tags: ['StrayKids', 'Award', 'STAY']
  },
  {
    id: '5',
    author: {
      name: 'TWICE',
      username: 'twice',
      avatar: avatarUrls.twice,
      group: 'TWICE'
    },
    content: 'Happy 10th anniversary to us! Thank you ONCEs! 🍭💕',
    image: 'https://picsum.photos/seed/twice10/600/400',
    timestamp: Date.now() - 12 * 60 * 60 * 1000,
    likes: 15600,
    comments: 1800,
    shares: 720,
    liked: false,
    tags: ['TWICE', '10Years', 'ONCE']
  },
  {
    id: '6',
    author: {
      name: 'K-Pop Fan',
      username: 'kpopfan',
      avatar: avatarUrls.kpopfan,
      group: 'K-POP UNITED'
    },
    content: 'Just joined K-POP UNITED! Excited to meet other fans 🎉',
    image: 'https://picsum.photos/seed/kpopfan/600/400',
    timestamp: Date.now() - 2 * 60 * 60 * 1000,
    likes: 45,
    comments: 12,
    shares: 8,
    liked: false,
    tags: ['KPop', 'United']
  }
];