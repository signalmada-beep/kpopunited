// ========== src/pages/Home.tsx ==========
import React, { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  increment,
  arrayUnion,
  arrayRemove,
  where,
  limit,
  getDocs,
  writeBatch,
  serverTimestamp,
  deleteDoc,
} from 'firebase/firestore';
import { firestore } from '../config/firebase';
import type { PostData, CommentData } from '../types';
import CreatePost from '../components/CreatePost';
import Post from '../components/Post';
import StoryViewer from '../components/StoryViewer';
import StoryCreator from '../components/StoryCreator';
import Suggestions from '../components/Suggestions';
import '../styles/Home.css';

// ============================================================
// STORIES MOCK (Azo ovaina ho Firebase avy)
// ============================================================
interface Story {
  id: string;
  author: string;
  username: string;
  avatar: string;
  group: string;
  verified?: boolean;
  content?: string;
  image?: string;
  type: 'photo' | 'text' | 'poll' | 'question' | 'countdown' | 'event' | 'link' | 'mood';
  timestamp: string;
  audience: 'public' | 'followers' | 'friends' | 'close_friends' | 'private';
  views: number;
  likes: number;
  reactions: { emoji: string; count: number }[];
  replies: { id: string; user: string; avatar: string; text: string; timestamp: string }[];
  shares: number;
  saves: number;
  isViewed?: boolean;
  isLive?: boolean;
  isOwner?: boolean;
  allowReplies?: boolean;
  uniqueViewers?: number;
  hashtags?: string[];
  mentions?: string[];
  mood?: string;
}

const mockStories: Story[] = [
  {
    id: 'story_1',
    author: 'BTS Official',
    username: 'bts_official',
    avatar: 'https://i.pravatar.cc/150?img=17',
    group: 'BTS',
    verified: true,
    content: 'New album coming soon!',
    image: 'https://picsum.photos/seed/bts-story/600/800',
    type: 'photo',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    audience: 'public',
    views: 15234,
    likes: 234,
    reactions: [{ emoji: '❤️', count: 234 }, { emoji: '🔥', count: 89 }],
    replies: [],
    shares: 45,
    saves: 12,
    isViewed: false,
    isLive: false,
    isOwner: false,
    allowReplies: true,
    uniqueViewers: 234,
    hashtags: ['BTS', 'NewAlbum'],
    mentions: ['bighit'],
    mood: '💜',
  },
  {
    id: 'story_2',
    author: 'BLACKPINK',
    username: 'blackpink',
    avatar: 'https://i.pravatar.cc/150?img=12',
    group: 'BLACKPINK',
    verified: true,
    content: 'World tour dates announced!',
    image: 'https://picsum.photos/seed/blackpink-story/600/800',
    type: 'photo',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    audience: 'public',
    views: 8765,
    likes: 156,
    reactions: [{ emoji: '💖', count: 156 }, { emoji: '🔥', count: 67 }],
    replies: [],
    shares: 23,
    saves: 8,
    isViewed: false,
    isLive: false,
    isOwner: false,
    allowReplies: true,
    uniqueViewers: 156,
    hashtags: ['BLACKPINK', 'WorldTour'],
    mentions: ['yg'],
    mood: '🔥',
  },
];

// ============================================================
// FILTERS CONFIGURATION
// ============================================================
const FILTERS_CONFIG = [
  { id: 'For You', icon: 'fa-home', iconClass: '' },
  { id: 'Trending', icon: 'fa-fire', iconClass: 'trending' },
  { id: 'Artists', icon: 'fa-microphone', iconClass: 'artists' },
  { id: 'Groups', icon: 'fa-users', iconClass: 'groups' },
  { id: 'Events', icon: 'fa-calendar-alt', iconClass: 'events' },
  { id: 'Latest', icon: 'fa-clock', iconClass: 'latest' },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const Home: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  // ============================================================
  // ÉTATS LOCAUX
  // ============================================================
  const [filter, setFilter] = useState('For You');
  const [showStoryCreator, setShowStoryCreator] = useState(false);
  const [selectedStoryIndex, setSelectedStoryIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [stories, setStories] = useState<Story[]>(mockStories);
  const [userInterests, setUserInterests] = useState({
    artists: {} as { [key: string]: number },
    groups: {} as { [key: string]: number },
    tags: {} as { [key: string]: number },
    categories: {} as { [key: string]: number },
    totalInteractions: 0,
  });
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [isStoryOpen, setIsStoryOpen] = useState(false);

  const filtersRef = useRef<HTMLDivElement>(null);
  const POSTS_PER_PAGE = 10;

  // ============================================================
  // RÉCUPÉRER L'UTILISATEUR ACTUEL
  // ============================================================
  const currentUser = {
    id: user?.id || 'anonymous',
    name: user?.displayName || 'K-Pop Fan',
    username: user?.username || 'kpopfan',
    avatar: user?.photoURL || 'https://i.pravatar.cc/150?img=16',
    verified: user?.isVerified || false,
  };

  // ============================================================
  // CHARGER LES POSTS DEPUIS FIRESTORE (REALTIME)
  // ============================================================
  useEffect(() => {
    setLoading(true);
    
    const q = query(
      collection(firestore, 'posts'),
      orderBy('timestamp', 'desc'),
      limit(POSTS_PER_PAGE)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedPosts: PostData[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        loadedPosts.push({
          id: doc.id,
          author: data.author || { id: '', name: '', username: '', avatar: '', group: '' },
          content: data.content || '',
          images: data.images || [],
          video: data.video || '',
          timestamp: data.timestamp?.toMillis?.() || Date.now(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          shares: data.shares || 0,
          liked: data.liked || false,
          saved: data.saved || false,
          reaction: data.reaction || null,
          tags: data.tags || [],
          mentions: data.mentions || [],
          category: data.category || 'general',
          mood: data.mood || null,
          isEdited: data.isEdited || false,
          privacy: data.privacy || 'public',
          isPinned: data.isPinned || false,
          isArchived: data.isArchived || false,
          commentsDisabled: data.commentsDisabled || false,
        });
      });
      setPosts(loadedPosts);
      setLoading(false);
      
      // Maka ny lastVisible ho an'ny pagination
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= POSTS_PER_PAGE);
      }
    }, (error) => {
      console.error('❌ Erreur chargement posts:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================================================
  // LOAD MORE POSTS (PAGINATION)
  // ============================================================
  const loadMorePosts = useCallback(async () => {
    if (loadingMore || !hasMore || !lastVisible) return;

    setLoadingMore(true);
    try {
      const q = query(
        collection(firestore, 'posts'),
        orderBy('timestamp', 'desc'),
        startAfter(lastVisible),
        limit(POSTS_PER_PAGE)
      );

      const snapshot = await getDocs(q);
      const morePosts: PostData[] = [];
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        morePosts.push({
          id: doc.id,
          author: data.author || { id: '', name: '', username: '', avatar: '', group: '' },
          content: data.content || '',
          images: data.images || [],
          video: data.video || '',
          timestamp: data.timestamp?.toMillis?.() || Date.now(),
          likes: data.likes || 0,
          comments: data.comments || 0,
          shares: data.shares || 0,
          liked: data.liked || false,
          saved: data.saved || false,
          reaction: data.reaction || null,
          tags: data.tags || [],
          mentions: data.mentions || [],
          category: data.category || 'general',
          mood: data.mood || null,
          isEdited: data.isEdited || false,
          privacy: data.privacy || 'public',
          isPinned: data.isPinned || false,
          isArchived: data.isArchived || false,
          commentsDisabled: data.commentsDisabled || false,
        });
      });

      setPosts(prev => [...prev, ...morePosts]);
      if (snapshot.docs.length > 0) {
        setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
        setHasMore(snapshot.docs.length >= POSTS_PER_PAGE);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('❌ Erreur chargement plus de posts:', error);
    } finally {
      setLoadingMore(false);
    }
  }, [loadingMore, hasMore, lastVisible]);

  // ============================================================
  // INFINITE SCROLL
  // ============================================================
  useEffect(() => {
    const handleScroll = () => {
      const scrollContainer = document.querySelector('.home-container-premium');
      if (!scrollContainer) return;

      const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
      if (scrollHeight - scrollTop - clientHeight < 200) {
        loadMorePosts();
      }
    };

    const container = document.querySelector('.home-container-premium');
    container?.addEventListener('scroll', handleScroll);
    return () => container?.removeEventListener('scroll', handleScroll);
  }, [loadMorePosts]);

  // ============================================================
  // USER INTERESTS (Local Storage)
  // ============================================================
  useEffect(() => {
    const saved = localStorage.getItem('kpop_user_interests');
    if (saved) {
      try {
        setUserInterests(JSON.parse(saved));
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('kpop_user_interests', JSON.stringify(userInterests));
  }, [userInterests]);

  // ============================================================
  // TRACK USER INTERACTIONS
  // ============================================================
  const trackInteraction = useCallback((post: PostData, weight: number = 1) => {
    setUserInterests(prev => {
      const newInterests = { ...prev };
      const artistName = post.author.name;
      if (artistName) {
        newInterests.artists[artistName] = (newInterests.artists[artistName] || 0) + weight;
      }
      const groupName = post.author.group;
      if (groupName) {
        newInterests.groups[groupName] = (newInterests.groups[groupName] || 0) + weight;
      }
      post.tags.forEach(tag => {
        newInterests.tags[tag] = (newInterests.tags[tag] || 0) + weight * 0.5;
      });
      if (post.category) {
        newInterests.categories[post.category] = (newInterests.categories[post.category] || 0) + weight * 0.3;
      }
      newInterests.totalInteractions += weight;
      return newInterests;
    });
  }, []);

  // ============================================================
  // FOR YOU ALGORITHM
  // ============================================================
  const forYouPosts = useMemo(() => {
    if (userInterests.totalInteractions === 0) {
      return posts.map(post => ({ ...post, score: 0 }));
    }

    const scoredPosts = posts.map(post => {
      let score = 0;
      
      const artistScore = userInterests.artists[post.author.name] || 0;
      const maxArtistScore = Math.max(...Object.values(userInterests.artists), 1);
      score += (artistScore / maxArtistScore) * 40;

      const groupScore = userInterests.groups[post.author.group] || 0;
      const maxGroupScore = Math.max(...Object.values(userInterests.groups), 1);
      score += (groupScore / maxGroupScore) * 25;

      let tagScore = 0;
      post.tags.forEach(tag => {
        tagScore += userInterests.tags[tag] || 0;
      });
      const maxTagScore = Math.max(...Object.values(userInterests.tags), 1);
      score += (tagScore / maxTagScore) * 20;

      const categoryScore = userInterests.categories[post.category] || 0;
      const maxCategoryScore = Math.max(...Object.values(userInterests.categories), 1);
      score += (categoryScore / maxCategoryScore) * 15;

      const hoursSincePosted = (Date.now() - post.timestamp) / (1000 * 60 * 60);
      const freshnessBonus = Math.max(0, 10 - hoursSincePosted * 0.5);
      score += Math.min(freshnessBonus, 10);

      return { ...post, score: Math.round(score * 100) / 100 };
    });

    scoredPosts.sort((a, b) => b.score - a.score);
    return scoredPosts;
  }, [posts, userInterests]);

  // ============================================================
  // FILTRAGE DES POSTS
  // ============================================================
  const filteredPosts = useMemo(() => {
    if (filter === 'For You') {
      return forYouPosts;
    }

    let result: PostData[] = [...posts];

    switch (filter) {
      case 'Trending':
        result.sort((a, b) => b.likes - a.likes);
        break;
      case 'Artists':
        result = result.filter(post => post.category === 'artists');
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'Groups':
        result = result.filter(post => post.category === 'groups');
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'Events':
        result = result.filter(post => post.category === 'events');
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      case 'Latest':
        result.sort((a, b) => b.timestamp - a.timestamp);
        break;
      default:
        result.sort((a, b) => b.timestamp - a.timestamp);
    }
    
    return result;
  }, [posts, filter, forYouPosts]);

  // ============================================================
  // HANDLERS - POSTS (Miaraka amin'ny Firestore)
  // ============================================================
  
  // ✅ Créer un post
  const handlePostCreated = async (postData: any) => {
    try {
      // Mampiasa ny service mba hamorona post
      const { createPost } = await import('../services/postService');
      const postId = await createPost({
        ...postData,
        author: {
          id: user?.id || 'anonymous',
          name: user?.displayName || 'K-Pop Fan',
          username: user?.username || 'kpopfan',
          avatar: user?.photoURL || 'https://i.pravatar.cc/150?img=16',
          group: 'K-POP UNITED',
          verified: user?.isVerified || false,
        },
        timestamp: Date.now(),
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
        saved: false,
        reaction: null,
        mentions: [],
        isEdited: false,
        privacy: 'public',
        isPinned: false,
        isArchived: false,
        commentsDisabled: false,
      });
      
      console.log('✅ Post créé avec succès:', postId);
    } catch (error) {
      console.error('❌ Erreur création post:', error);
      alert('Erreur lors de la création du post');
    }
  };

  // ✅ Like / Unlike
  const handlePostLike = async (id: string) => {
    try {
      const postRef = doc(firestore, 'posts', id);
      const post = posts.find(p => p.id === id);
      if (!post) return;

      if (post.liked) {
        await updateDoc(postRef, {
          liked: false,
          likes: increment(-1),
        });
      } else {
        await updateDoc(postRef, {
          liked: true,
          likes: increment(1),
        });
        trackInteraction(post, 2);
      }
    } catch (error) {
      console.error('❌ Erreur like:', error);
    }
  };

  // ✅ Reaction
  const handlePostReact = async (id: string, reaction: string) => {
    try {
      const postRef = doc(firestore, 'posts', id);
      const post = posts.find(p => p.id === id);
      if (!post) return;

      const currentReaction = post.reaction;
      
      if (currentReaction === reaction) {
        await updateDoc(postRef, {
          reaction: null,
          likes: increment(-1),
        });
      } else {
        const likesDelta = currentReaction ? 0 : 1;
        await updateDoc(postRef, {
          reaction: reaction,
          likes: increment(likesDelta),
        });
        trackInteraction(post, 1.5);
      }
    } catch (error) {
      console.error('❌ Erreur reaction:', error);
    }
  };

  // ✅ Comment
  const handlePostComment = async (id: string) => {
    try {
      const postRef = doc(firestore, 'posts', id);
      await updateDoc(postRef, {
        comments: increment(1),
      });
    } catch (error) {
      console.error('❌ Erreur comment:', error);
    }
  };

  // ✅ Share
  const handlePostShare = async (id: string) => {
    try {
      const postRef = doc(firestore, 'posts', id);
      const post = posts.find(p => p.id === id);
      if (!post) return;

      await updateDoc(postRef, {
        shares: increment(1),
      });
      trackInteraction(post, 2.5);
    } catch (error) {
      console.error('❌ Erreur share:', error);
    }
  };

  // ✅ Save / Unsave
  const handlePostSave = async (id: string) => {
    try {
      const postRef = doc(firestore, 'posts', id);
      const userRef = doc(firestore, 'users', currentUser.id);
      const post = posts.find(p => p.id === id);
      if (!post) return;

      if (post.saved) {
        await updateDoc(postRef, { saved: false });
        await updateDoc(userRef, { savedPosts: arrayRemove(id) });
      } else {
        await updateDoc(postRef, { saved: true });
        await updateDoc(userRef, { savedPosts: arrayUnion(id) });
      }
    } catch (error) {
      console.error('❌ Erreur save:', error);
    }
  };

  // ✅ Edit
  const handlePostEdit = (id: string) => {
    navigate(`/edit-post/${id}`);
  };

  // ✅ Delete
  const handlePostDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    
    try {
      const postRef = doc(firestore, 'posts', id);
      await deleteDoc(postRef);
    } catch (error) {
      console.error('❌ Erreur suppression:', error);
      alert('Erreur lors de la suppression');
    }
  };

  // ✅ Pin / Unpin
  const handlePostPin = async (id: string) => {
    try {
      const postRef = doc(firestore, 'posts', id);
      const post = posts.find(p => p.id === id);
      if (!post) return;

      await updateDoc(postRef, {
        isPinned: !post.isPinned,
      });
    } catch (error) {
      console.error('❌ Erreur pin:', error);
    }
  };

  // ✅ Archive
  const handlePostArchive = async (id: string) => {
    if (!confirm('Archive this post?')) return;
    
    try {
      const postRef = doc(firestore, 'posts', id);
      await updateDoc(postRef, {
        isArchived: true,
      });
    } catch (error) {
      console.error('❌ Erreur archive:', error);
    }
  };

  // ✅ Report
  const handlePostReport = (id: string) => {
    if (confirm('Report this post?')) {
      alert('🚫 Post reported!');
    }
  };

  // ✅ Block
  const handlePostBlock = (id: string) => {
    if (confirm('Block this user?')) {
      alert('🚫 User blocked!');
    }
  };

  // ✅ Mute
  const handlePostMute = (id: string) => {
    if (confirm('Mute this user?')) {
      alert('🔇 User muted!');
    }
  };

  // ✅ Hide
  const handlePostHide = async (id: string) => {
    if (confirm('Hide this post?')) {
      // ✅ Ajouter ao amin'ny hiddenPosts ny mpampiasa
      try {
        const userRef = doc(firestore, 'users', currentUser.id);
        await updateDoc(userRef, {
          hiddenPosts: arrayUnion(id),
        });
      } catch (error) {
        console.error('❌ Erreur hide:', error);
      }
    }
  };

  // ✅ Ajouter un commentaire
  const handleAddCommentData = async (postId: string, comment: CommentData) => {
    try {
      const commentsRef = collection(firestore, 'posts', postId, 'comments');
      await addDoc(commentsRef, {
        author: comment.author,
        content: comment.content,
        timestamp: serverTimestamp(),
        likes: 0,
        liked: false,
        replies: [],
        isPinned: false,
        isEdited: false,
      });
    } catch (error) {
      console.error('❌ Erreur ajout commentaire:', error);
    }
  };

  // ============================================================
  // HANDLERS - STORIES
  // ============================================================
  const handleOpenStory = (index: number) => {
    setSelectedStoryIndex(index);
    setIsStoryOpen(true);
  };

  const handleCloseStory = () => {
    setSelectedStoryIndex(null);
    setIsStoryOpen(false);
  };

  const handleStoryViewed = (storyId: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId ? { ...s, isViewed: true } : s
      )
    );
  };

  const handleCreateStory = (storyData: any) => {
    const newStory: Story = {
      id: `story_${Date.now()}`,
      ...storyData,
      timestamp: new Date().toISOString(),
      views: 0,
      likes: 0,
      reactions: [],
      replies: [],
      shares: 0,
      saves: 0,
      isViewed: false,
      isLive: false,
      isOwner: true,
      allowReplies: true,
      uniqueViewers: 0,
    };
    setStories(prev => [newStory, ...prev]);
  };

  const handleStoryLike = (storyId: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId ? { ...s, likes: s.likes + 1 } : s
      )
    );
  };

  const handleStoryReact = (storyId: string, emoji: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId
          ? {
              ...s,
              reactions: s.reactions.find(r => r.emoji === emoji)
                ? s.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
                : [...s.reactions, { emoji, count: 1 }],
            }
          : s
      )
    );
  };

  const handleStoryReply = (storyId: string, text: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId
          ? {
              ...s,
              replies: [...s.replies, {
                id: `reply_${Date.now()}`,
                user: currentUser.name,
                avatar: currentUser.avatar,
                text,
                timestamp: new Date().toISOString(),
              }],
            }
          : s
      )
    );
  };

  const handleStoryShare = (storyId: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId ? { ...s, shares: s.shares + 1 } : s
      )
    );
  };

  const handleStorySave = (storyId: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId ? { ...s, saves: s.saves + 1 } : s
      )
    );
  };

  // ============================================================
  // SCROLL FILTERS
  // ============================================================
  const scrollFiltersLeft = () => {
    if (filtersRef.current) {
      filtersRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };
  const scrollFiltersRight = () => {
    if (filtersRef.current) {
      filtersRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // ============================================================
  // GET FILTER COUNT
  // ============================================================
  const getFilterCount = (filterName: string) => {
    switch (filterName) {
      case 'Artists': return posts.filter(p => p.category === 'artists').length;
      case 'Groups': return posts.filter(p => p.category === 'groups').length;
      case 'Events': return posts.filter(p => p.category === 'events').length;
      default: return posts.length;
    }
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="home-loading">
        <div className="home-loading-spinner" />
        <span>Chargement...</span>
      </div>
    );
  }

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <div className="home-premium">
      <div className="home-container-premium">
        <div className="home-content">
          
          {/* STORIES */}
          <div className="stories-premium">
            <div className="stories-scroll-premium">
              <div className="story-item-premium add-story-premium" onClick={() => setShowStoryCreator(true)}>
                <div className="story-ring-premium add-ring-premium">
                  <div className="story-avatar-premium add-avatar-premium">
                    <i className="fas fa-plus" />
                  </div>
                </div>
                <span className="story-name-premium">Add Story</span>
              </div>

              {stories.map((story, index) => (
                <div 
                  key={`story-${story.id}`}
                  className={`story-item-premium ${story.isViewed ? 'viewed' : ''}`}
                  onClick={() => handleOpenStory(index)}
                >
                  <div className="story-ring-premium">
                    <div className="story-avatar-premium">
                      <img src={story.avatar} alt={story.author} />
                      {story.isLive && <span className="live-badge-premium">LIVE</span>}
                    </div>
                  </div>
                  <span className="story-name-premium">{story.author}</span>
                </div>
              ))}
            </div>
          </div>

          {/* STORY VIEWER */}
          {selectedStoryIndex !== null && isStoryOpen && (
            <div className="story-viewer-feed-wrapper">
              <StoryViewer
                stories={stories}
                initialIndex={selectedStoryIndex}
                onClose={handleCloseStory}
                onShare={handleStoryShare}
                onReact={handleStoryReact}
                onReply={handleStoryReply}
                onLike={handleStoryLike}
                onSave={handleStorySave}
                onStoryViewed={handleStoryViewed}
                currentUser={currentUser}
              />
            </div>
          )}

          {/* STORY CREATOR */}
          <StoryCreator
            isOpen={showStoryCreator}
            onClose={() => setShowStoryCreator(false)}
            onCreateStory={handleCreateStory}
            currentUser={currentUser}
          />

          {/* CREATE POST TRIGGER */}
          <CreatePost onPostCreated={handlePostCreated} />

          {/* SUGGESTIONS */}
          <Suggestions limit={5} />

          {/* FEED FILTERS */}
          <div className="feed-filters-wrapper">
            <button 
              className="filter-scroll-btn left" 
              onClick={scrollFiltersLeft}
              aria-label="Scroll filters left"
            >
              <i className="fas fa-chevron-left" />
            </button>
            <div className="feed-filters-premium" ref={filtersRef}>
              {FILTERS_CONFIG.map((f) => {
                const count = getFilterCount(f.id);
                const isActive = filter === f.id;
                return (
                  <button
                    key={`filter-${f.id}`}
                    className={`filter-btn-premium ${isActive ? 'active' : ''}`}
                    onClick={() => setFilter(f.id)}
                  >
                    <i className={`fas ${f.icon} filter-icon ${f.iconClass}`} />
                    {f.id}
                    {count > 0 && f.id !== 'For You' && f.id !== 'Trending' && f.id !== 'Latest' && (
                      <span className="filter-count">{count}</span>
                    )}
                  </button>
                );
              })}
            </div>
            <button 
              className="filter-scroll-btn right" 
              onClick={scrollFiltersRight}
              aria-label="Scroll filters right"
            >
              <i className="fas fa-chevron-right" />
            </button>
          </div>

          {/* FEED */}
          <div className="feed-premium">
            {filteredPosts.length > 0 ? (
              <>
                {filteredPosts.map((post) => (
                  <div key={`post-${post.id}`} className="feed-item-wrapper">
                    <Post
                      post={post}
                      isOwner={post.author.id === user?.id}
                      onLike={handlePostLike}
                      onReact={handlePostReact}
                      onComment={handlePostComment}
                      onShare={handlePostShare}
                      onSave={handlePostSave}
                      onEdit={handlePostEdit}
                      onDelete={handlePostDelete}
                      onPin={handlePostPin}
                      onArchive={handlePostArchive}
                      onReport={handlePostReport}
                      onBlock={handlePostBlock}
                      onMute={handlePostMute}
                      onHide={handlePostHide}
                      onAddCommentData={handleAddCommentData}
                    />
                  </div>
                ))}
                {loadingMore && (
                  <div className="feed-loading-more">
                    <div className="loading-spinner" />
                    <span>Chargement...</span>
                  </div>
                )}
                {!hasMore && filteredPosts.length > 0 && (
                  <div className="feed-end-message">
                    <span>✨ Vous avez tout vu !</span>
                  </div>
                )}
              </>
            ) : (
              <div className="feed-empty-premium">
                <i className="fas fa-inbox" />
                <h3>No posts found</h3>
                <p>Try changing the filter or create a new post!</p>
                <button 
                  className="feed-empty-btn"
                  onClick={() => navigate('/create-post')}
                >
                  <i className="fas fa-plus" /> Create Post
                </button>
              </div>
            )}
          </div>
          
        </div>
      </div>

      {/* ============================================================
          STYLES
      ============================================================ */}
      <style>{`
        .home-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100vh;
          gap: 16px;
          color: rgba(255,255,255,0.3);
        }
        .home-loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255,255,255,0.04);
          border-top-color: #C084FC;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .feed-loading-more {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 20px;
          color: var(--text-tertiary);
          font-size: 13px;
        }
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.04);
          border-top-color: var(--kpop-violet);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .feed-end-message {
          text-align: center;
          padding: 30px 20px;
          color: var(--text-tertiary);
          font-size: 14px;
        }
        .feed-end-message span {
          background: var(--bg-input);
          padding: 8px 20px;
          border-radius: 30px;
          border: 1px solid var(--border-color);
        }
        .feed-empty-btn {
          margin-top: 12px;
          padding: 8px 24px;
          border-radius: 30px;
          background: var(--gradient-primary);
          border: none;
          color: #fff;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .feed-empty-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.2);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        /* Light mode */
        body.light-mode .feed-end-message span {
          background: var(--bg-input);
          border-color: var(--border-color);
        }
        body.light-mode .home-loading {
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
};

export default Home;