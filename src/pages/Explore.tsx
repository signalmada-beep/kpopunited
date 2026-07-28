// ========== src/pages/Explore.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Explore.css';

// ============================================================
// YOUTUBE EMBED BASE
// ============================================================
const YOUTUBE_EMBED_BASE = 'https://www.youtube.com/embed/';

// ============================================================
// NEWS API KEY
// ============================================================
const NEWS_API_KEY = 'pub_6498db87d44944e9bd231e5ff9ec6dd1';
const NEWS_API_BASE = 'https://newsdata.io/api/1/latest';

// ============================================================
// TYPES
// ============================================================
interface ExploreItem {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  category: 'artist' | 'group' | 'video' | 'event' | 'kdrama' | 'culture';
  likes: number;
  videoId?: string;
  eventDate?: string;
  eventLocation?: string;
  eventLink?: string;
  description?: string;
  source?: string;
  url?: string;
  publishedAt?: string;
  isNews?: boolean;
}

interface NewsArticle {
  title: string;
  description: string;
  source_id: string;
  source_name: string;
  link: string;
  pubDate: string;
  image_url: string;
  category: string[];
  content: string;
}

// ============================================================
// YOUTUBE VIDEOS (Hita ao amin'ny Videos category)
// ============================================================
const youtubeVideos: ExploreItem[] = [
  {
    id: 'yt_bts_dynamite',
    title: 'BTS - Dynamite (Official MV)',
    subtitle: '1.2B Views • BTS Official',
    image: 'https://img.youtube.com/vi/gdZLi9oWNZg/maxresdefault.jpg',
    category: 'video',
    likes: 45600,
    videoId: 'gdZLi9oWNZg',
  },
  {
    id: 'yt_blackpink_how_you_like_that',
    title: 'BLACKPINK - How You Like That (Official MV)',
    subtitle: '980M Views • BLACKPINK Official',
    image: 'https://img.youtube.com/vi/ioNng23DkIM/maxresdefault.jpg',
    category: 'video',
    likes: 38900,
    videoId: 'ioNng23DkIM',
  },
  {
    id: 'yt_jimin_like_crazy',
    title: 'Jimin - Like Crazy (Official MV)',
    subtitle: '340M Views • BTS Official',
    image: 'https://img.youtube.com/vi/okrKQY0_Ghc/maxresdefault.jpg',
    category: 'video',
    likes: 21500,
    videoId: 'okrKQY0_Ghc',
  },
  {
    id: 'yt_newjeans_ditto',
    title: 'NewJeans - Ditto (Official MV)',
    subtitle: '280M Views • NewJeans Official',
    image: 'https://img.youtube.com/vi/JBq4lHQYVdE/maxresdefault.jpg',
    category: 'video',
    likes: 17800,
    videoId: 'JBq4lHQYVdE',
  },
  {
    id: 'yt_twice_cheer_up',
    title: 'TWICE - Cheer Up (Official MV)',
    subtitle: '520M Views • JYP Entertainment',
    image: 'https://img.youtube.com/vi/cR2XilcGYOo/maxresdefault.jpg',
    category: 'video',
    likes: 22300,
    videoId: 'cR2XilcGYOo',
  },
  {
    id: 'yt_skz_maniac',
    title: 'Stray Kids - MANIAC (Official MV)',
    subtitle: '210M Views • JYP Entertainment',
    image: 'https://img.youtube.com/vi/oZSkRPWc9o0/maxresdefault.jpg',
    category: 'video',
    likes: 14500,
    videoId: 'oZSkRPWc9o0',
  },
  {
    id: 'yt_lisa_money',
    title: 'LISA - MONEY (Official MV)',
    subtitle: '850M Views • YG Entertainment',
    image: 'https://img.youtube.com/vi/dNCWe_6HAM8/maxresdefault.jpg',
    category: 'video',
    likes: 31200,
    videoId: 'dNCWe_6HAM8',
  },
  {
    id: 'yt_bts_butter',
    title: 'BTS - Butter (Official MV)',
    subtitle: '980M Views • BTS Official',
    image: 'https://img.youtube.com/vi/WMweEpGlu_U/maxresdefault.jpg',
    category: 'video',
    likes: 42500,
    videoId: 'WMweEpGlu_U',
  },
];

// ============================================================
// GOOGLE FALLBACK DATA (Rehefa tsy mandeha ny API)
// ============================================================
const googleFallbackData: { [key: string]: ExploreItem[] } = {
  artist: [
    {
      id: 'fallback_artist_1',
      title: 'BTS Jimin - "FACE" Album Success',
      subtitle: 'Billboard Hot 100 • BTS Official',
      image: 'https://picsum.photos/seed/jimin-news/400/300',
      category: 'artist',
      likes: 12500,
      description: 'Jimin\'s solo album "FACE" continues to dominate charts worldwide with record-breaking sales.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.billboard.com/music/jimin-face-album-success',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    },
    {
      id: 'fallback_artist_2',
      title: 'BLACKPINK Lisa - New Solo Project',
      subtitle: 'Coming Soon • YG Entertainment',
      image: 'https://picsum.photos/seed/lisa-news/400/300',
      category: 'artist',
      likes: 9800,
      description: 'Lisa announces her new solo project after the success of "MONEY" and "LALISA".',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.nme.com/news/blackpink-lisa-solo-project',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    },
    {
      id: 'fallback_artist_3',
      title: 'Jungkook Solo Album Teaser',
      subtitle: 'Coming Soon • BIGHIT MUSIC',
      image: 'https://picsum.photos/seed/jungkook-news/400/300',
      category: 'artist',
      likes: 8700,
      description: 'Jungkook teases his upcoming solo album with a surprise video announcement.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.rollingstone.com/music/jungkook-solo-album',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
  ],
  group: [
    {
      id: 'fallback_group_1',
      title: 'BTS Military Service Update',
      subtitle: 'All Members Serving • HYBE',
      image: 'https://picsum.photos/seed/bts-news/400/300',
      category: 'group',
      likes: 15600,
      description: 'Latest updates on BTS members\' military service and their return plans.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.koreaboo.com/news/bts-military-service',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    },
    {
      id: 'fallback_group_2',
      title: 'BLACKPINK World Tour 2026',
      subtitle: 'New Dates Added • YG Entertainment',
      image: 'https://picsum.photos/seed/blackpink-news/400/300',
      category: 'group',
      likes: 11200,
      description: 'BLACKPINK adds new dates to their world tour due to overwhelming demand.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.rollingstone.com/music/blackpink-world-tour',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
    {
      id: 'fallback_group_3',
      title: 'NewJeans Global Success',
      subtitle: 'K-POP Sensation • ADOR',
      image: 'https://picsum.photos/seed/newjeans-news/400/300',
      category: 'group',
      likes: 7800,
      description: 'NewJeans continues to break records globally with their unique sound and style.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.forbes.com/newjeans-global-success',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    },
  ],
  kdrama: [
    {
      id: 'fallback_kdrama_1',
      title: 'Squid Game Season 3 Update',
      subtitle: 'Netflix • Coming 2026',
      image: 'https://picsum.photos/seed/squid-news/400/300',
      category: 'kdrama',
      likes: 8900,
      description: 'Netflix confirms Squid Game Season 3 with new cast announcements.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://variety.com/tv/squid-game-season-3',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    },
    {
      id: 'fallback_kdrama_2',
      title: 'New K-Drama "The Whirlwind"',
      subtitle: 'Netflix • Political Thriller',
      image: 'https://picsum.photos/seed/whirlwind-news/400/300',
      category: 'kdrama',
      likes: 6700,
      description: 'New political thriller K-Drama "The Whirlwind" tops Netflix charts worldwide.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.forbes.com/whirlwind-kdrama',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    },
    {
      id: 'fallback_kdrama_3',
      title: 'K-Drama "Queen of Tears" Rating Success',
      subtitle: 'tvN • Romantic Comedy',
      image: 'https://picsum.photos/seed/queen-news/400/300',
      category: 'kdrama',
      likes: 5200,
      description: '"Queen of Tears" breaks rating records on tvN with its heartwarming story.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.koreatimes.co.kr/queen-of-tears',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    },
  ],
  culture: [
    {
      id: 'fallback_culture_1',
      title: 'Korean Culture Festival 2026',
      subtitle: 'Seoul • Global Event',
      image: 'https://picsum.photos/seed/culture-news/400/300',
      category: 'culture',
      likes: 5400,
      description: 'The annual Korean Culture Festival returns to Seoul with international participants.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.koreatimes.co.kr/korean-culture-festival',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    },
    {
      id: 'fallback_culture_2',
      title: 'Hanbok Modern Fashion Trend',
      subtitle: 'Traditional Meets Modern',
      image: 'https://picsum.photos/seed/hanbok-news/400/300',
      category: 'culture',
      likes: 4300,
      description: 'Hanbok experiences a renaissance as modern designers reinterpret traditional Korean attire.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.vogue.com/hanbok-modern-trend',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    },
    {
      id: 'fallback_culture_3',
      title: 'Korean Food Global Popularity',
      subtitle: 'K-Food Wave • Worldwide',
      image: 'https://picsum.photos/seed/kfood-news/400/300',
      category: 'culture',
      likes: 3800,
      description: 'Korean cuisine continues to gain global popularity with new restaurants opening worldwide.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.forbes.com/korean-food-global',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
    },
  ],
  event: [
    {
      id: 'fallback_event_1',
      title: 'K-POP Festival in Paris 2026',
      subtitle: 'Multiple Artists • Paris',
      image: 'https://picsum.photos/seed/paris-news/400/300',
      category: 'event',
      likes: 7600,
      description: 'Major K-POP festival coming to Paris with top artists and special performances.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.lefigaro.fr/kpop-festival-paris',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 7).toISOString(),
    },
    {
      id: 'fallback_event_2',
      title: 'Seoul Music Awards 2026',
      subtitle: 'Annual Awards • Seoul',
      image: 'https://picsum.photos/seed/seoul-news/400/300',
      category: 'event',
      likes: 6200,
      description: 'The Seoul Music Awards returns with a star-studded lineup of K-POP artists.',
      isNews: true,
      source: 'K-POP News Network',
      url: 'https://www.koreatimes.co.kr/seoul-music-awards',
      publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    },
  ],
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const Explore: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<ExploreItem | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const [showDataWarning, setShowDataWarning] = useState(false);
  const [pendingVideoId, setPendingVideoId] = useState<string | null>(null);

  // ============================================================
  // NEWS STATES
  // ============================================================
  const [newsCache, setNewsCache] = useState<{ [key: string]: ExploreItem[] }>({});
  const [loadingNews, setLoadingNews] = useState<{ [key: string]: boolean }>({});
  const [newsError, setNewsError] = useState<{ [key: string]: string | null }>({});
  const [usingFallback, setUsingFallback] = useState<{ [key: string]: boolean }>({});

  const categories = [
    { id: 'all', label: 'All', icon: 'fa-th-large' },
    { id: 'artist', label: 'Artists', icon: 'fa-microphone' },
    { id: 'group', label: 'Groups', icon: 'fa-users' },
    { id: 'video', label: 'Videos', icon: 'fa-video' },
    { id: 'event', label: 'Events', icon: 'fa-calendar-alt' },
    { id: 'kdrama', label: 'K-DRAMA', icon: 'fa-tv' },
    { id: 'culture', label: 'Culture', icon: 'fa-landmark' },
  ];

  // ============================================================
  // FETCH NEWS PAR CATEGORIE AVEC FALLBACK
  // ============================================================
  const fetchNewsForCategory = async (category: string) => {
    if (newsCache[category] && newsCache[category].length > 0 && !usingFallback[category]) return;

    setLoadingNews(prev => ({ ...prev, [category]: true }));
    setNewsError(prev => ({ ...prev, [category]: null }));
    setUsingFallback(prev => ({ ...prev, [category]: false }));

    let query = '';
    switch (category) {
      case 'artist':
        query = 'K-POP artist OR K-POP soloist OR K-POP idol';
        break;
      case 'group':
        query = 'K-POP group OR K-POP band OR K-POP girl group OR K-POP boy band';
        break;
      case 'kdrama':
        query = 'K-DRAMA OR Korean drama OR K-drama new OR Korean series';
        break;
      case 'culture':
        query = 'Korean culture OR K-culture OR Korean tradition OR K-food OR Korean lifestyle';
        break;
      case 'event':
        query = 'K-POP event OR K-POP concert OR K-POP tour OR Korean festival';
        break;
      default:
        query = 'K-POP OR K-DRAMA OR Korean culture';
    }

    try {
      const response = await fetch(
        `${NEWS_API_BASE}?apikey=${NEWS_API_KEY}&q=${encodeURIComponent(query)}&language=en&size=10`
      );
      const result = await response.json();

      if (result.status === 'success' && result.results && result.results.length > 0) {
        const articles: ExploreItem[] = result.results.map((article: NewsArticle, index: number) => ({
          id: `news_${category}_${index}_${Date.now()}`,
          title: article.title || 'No Title',
          subtitle: article.source_name || article.source_id || 'News Source',
          image: article.image_url || 'https://picsum.photos/seed/news_${category}/400/300',
          category: category as any,
          likes: Math.floor(Math.random() * 5000) + 100,
          description: article.description || article.content || 'Read the full article for more details.',
          source: article.source_name || article.source_id,
          url: article.link,
          publishedAt: article.pubDate,
          isNews: true,
        }));

        setNewsCache(prev => ({ ...prev, [category]: articles }));
        setUsingFallback(prev => ({ ...prev, [category]: false }));
      } else {
        console.log('No news found, using fallback for:', category);
        useFallback(category);
      }
    } catch (error) {
      console.error('Error fetching news:', error);
      useFallback(category);
    } finally {
      setLoadingNews(prev => ({ ...prev, [category]: false }));
    }
  };

  // ============================================================
  // FALLBACK FUNCTION
  // ============================================================
  const useFallback = (category: string) => {
    const fallbackItems = googleFallbackData[category] || [];
    
    if (fallbackItems.length > 0) {
      const items = fallbackItems.map((item, index) => ({
        ...item,
        id: `fallback_${category}_${index}_${Date.now()}`,
        category: category as any,
        isNews: true,
        source: item.source || 'K-POP News Network',
      }));
      
      setNewsCache(prev => ({ ...prev, [category]: items }));
      setUsingFallback(prev => ({ ...prev, [category]: true }));
      setNewsError(prev => ({ ...prev, [category]: null }));
    } else {
      setNewsError(prev => ({ ...prev, [category]: 'No results found.' }));
    }
  };

  // ============================================================
  // LOAD NEWS REHEFA MIOVA CATEGORY
  // ============================================================
  useEffect(() => {
    if (activeCategory !== 'all' && activeCategory !== 'video') {
      fetchNewsForCategory(activeCategory);
    }
  }, [activeCategory]);

  // ============================================================
  // GET ITEMS POUR CATEGORY
  // ============================================================
  const getItemsForCategory = (category: string): ExploreItem[] => {
    if (category === 'video') {
      return youtubeVideos;
    }
    return [];
  };

  // ============================================================
  // COMBINE ALL ITEMS AVEC NEWS
  // ============================================================
  const getAllItems = (): ExploreItem[] => {
    let items: ExploreItem[] = [];

    if (activeCategory === 'video') {
      return youtubeVideos;
    }

    if (activeCategory === 'all') {
      // All : mampiseho ny news rehetra
      const allNews = [
        ...(newsCache['artist'] || []),
        ...(newsCache['group'] || []),
        ...(newsCache['kdrama'] || []),
        ...(newsCache['culture'] || []),
        ...(newsCache['event'] || []),
      ];
      items = allNews;
    } else {
      // Categories hafa : news an'io category io fotsiny
      items = newsCache[activeCategory] || [];
    }

    const seen = new Set<string>();
    return items.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  };

  const filteredItems = getAllItems().filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Recently';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // ============================================================
  // HANDLER VIDEO AVEC WARNING
  // ============================================================
  const handleVideoClick = (videoId: string) => {
    setPendingVideoId(videoId);
    setShowDataWarning(true);
  };

  const confirmVideoPlay = () => {
    if (pendingVideoId) {
      setSelectedVideoId(pendingVideoId);
      setShowVideoModal(true);
    }
    setShowDataWarning(false);
    setPendingVideoId(null);
  };

  const cancelVideoPlay = () => {
    setShowDataWarning(false);
    setPendingVideoId(null);
  };

  // ============================================================
  // HANDLER ITEM CLICK
  // ============================================================
  const handleItemClick = (item: ExploreItem) => {
    if (item.category === 'video' && item.videoId) {
      handleVideoClick(item.videoId);
      return;
    }
    setSelectedItem(item);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedItem(null);
  };

  const closeVideoModal = () => {
    setShowVideoModal(false);
    setSelectedVideoId(null);
  };

  // ============================================================
  // RENDER MODAL
  // ============================================================
  const renderModal = () => {
    if (!selectedItem) return null;

    const isNews = selectedItem.isNews === true;
    const isVideo = selectedItem.category === 'video';

    const getCategoryColor = (category: string) => {
      switch(category) {
        case 'artist': return '#C084FC';
        case 'group': return '#4A90D9';
        case 'event': return '#FF6B6B';
        case 'kdrama': return '#FF6B9D';
        case 'culture': return '#00B894';
        case 'video': return '#EC4899';
        default: return '#7A7A9A';
      }
    };

    const getCategoryIcon = (category: string) => {
      switch(category) {
        case 'artist': return 'fa-microphone';
        case 'group': return 'fa-users';
        case 'event': return 'fa-calendar-alt';
        case 'kdrama': return 'fa-tv';
        case 'culture': return 'fa-landmark';
        case 'video': return 'fa-video';
        default: return 'fa-star';
      }
    };

    return (
      <div className="modal-overlay" onClick={closeModal}>
        <div className="modal-content premium" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close" onClick={closeModal}>
            <i className="fas fa-times" />
          </button>

          <div className="modal-image">
            <img src={selectedItem.image} alt={selectedItem.title} />
            <span className="modal-category-badge" style={{
              background: isNews ? '#FDCB6E' : getCategoryColor(selectedItem.category)
            }}>
              {isNews ? (
                <><i className="fas fa-newspaper" /> News</>
              ) : isVideo ? (
                <><i className="fas fa-play" /> Video</>
              ) : (
                <><i className={`fas ${getCategoryIcon(selectedItem.category)}`} />
                {selectedItem.category.charAt(0).toUpperCase() + selectedItem.category.slice(1)}</>
              )}
            </span>
          </div>

          <div className="modal-body">
            <h2 className="modal-title">{selectedItem.title}</h2>
            <p className="modal-subtitle">{selectedItem.subtitle}</p>

            {/* NEWS */}
            {isNews && (
              <div className="modal-details">
                <div className="modal-detail-grid">
                  {selectedItem.source && (
                    <div className="modal-detail-item">
                      <span className="detail-label">Source</span>
                      <span className="detail-value">
                        {selectedItem.source}
                        {usingFallback[selectedItem.category] && (
                          <span style={{ fontSize: '10px', color: '#FDCB6E', marginLeft: '6px' }}>
                            (External)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {selectedItem.publishedAt && (
                    <div className="modal-detail-item">
                      <span className="detail-label">Published</span>
                      <span className="detail-value">{formatTimeAgo(selectedItem.publishedAt)}</span>
                    </div>
                  )}
                </div>
                {selectedItem.description && (
                  <p className="modal-description">{selectedItem.description}</p>
                )}
                <div className="modal-actions-row">
                  {selectedItem.url && (
                    <button 
                      className="modal-action-btn primary"
                      onClick={() => window.open(selectedItem.url, '_blank')}
                    >
                      <i className="fas fa-external-link-alt" /> Read Full Article
                    </button>
                  )}
                  <button 
                    className="modal-action-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.title + ' - ' + (selectedItem.url || ''));
                      alert('✅ Link copied to clipboard!');
                    }}
                  >
                    <i className="fas fa-copy" /> Copy Link
                  </button>
                  <button 
                    className="modal-action-btn"
                    onClick={() => {
                      alert(`📤 Shared: ${selectedItem.title}`);
                    }}
                  >
                    <i className="fas fa-share" /> Share
                  </button>
                </div>
              </div>
            )}

            {/* VIDEO */}
            {isVideo && (
              <div className="modal-details">
                <div className="modal-actions-row">
                  <button 
                    className="modal-action-btn primary"
                    onClick={() => {
                      if (selectedItem.videoId) {
                        handleVideoClick(selectedItem.videoId);
                      }
                    }}
                  >
                    <i className="fas fa-play" /> Watch Video
                  </button>
                  <button 
                    className="modal-action-btn"
                    onClick={() => {
                      navigator.clipboard.writeText(selectedItem.title + ' - ' + (selectedItem.url || ''));
                      alert('✅ Link copied to clipboard!');
                    }}
                  >
                    <i className="fas fa-copy" /> Copy Link
                  </button>
                  <button 
                    className="modal-action-btn"
                    onClick={() => {
                      alert(`📤 Shared: ${selectedItem.title}`);
                    }}
                  >
                    <i className="fas fa-share" /> Share
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER DATA WARNING POPUP (ho an'ny video)
  // ============================================================
  const renderDataWarning = () => {
    if (!showDataWarning) return null;

    return (
      <div className="modal-overlay warning-overlay" onClick={cancelVideoPlay}>
        <div className="modal-content warning" onClick={(e) => e.stopPropagation()}>
          <div className="warning-icon">
            <i className="fas fa-exclamation-triangle" />
          </div>
          <h3 className="warning-title">⚠️ Data Usage Warning</h3>
          <p className="warning-text">
            Watching videos may consume a significant amount of your mobile data.
            <br /><br />
            <strong>Are you sure you want to continue?</strong>
          </p>
          <div className="warning-buttons">
            <button className="warning-btn cancel" onClick={cancelVideoPlay}>
              <i className="fas fa-times" /> Cancel
            </button>
            <button className="warning-btn confirm" onClick={confirmVideoPlay}>
              <i className="fas fa-play" /> Continue
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER VIDEO MODAL
  // ============================================================
  const renderVideoModal = () => {
    if (!selectedVideoId) return null;

    return (
      <div className="modal-overlay video-overlay" onClick={closeVideoModal}>
        <div className="modal-content video" onClick={(e) => e.stopPropagation()}>
          <button className="modal-close video-close" onClick={closeVideoModal}>
            <i className="fas fa-times" />
            <span>Close</span>
          </button>
          <div className="video-player-wrapper">
            <iframe
              src={`${YOUTUBE_EMBED_BASE}${selectedVideoId}?autoplay=1&rel=0&modestbranding=1`}
              title="YouTube Video"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="video-player"
            />
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER NEWS LOADING / FALLBACK BANNER
  // ============================================================
  const renderNewsLoading = () => {
    if (activeCategory === 'video') return null;
    
    const loading = loadingNews[activeCategory];
    const error = newsError[activeCategory];
    const news = newsCache[activeCategory] || [];
    const fallback = usingFallback[activeCategory];

    if (news.length > 0) {
      return null;
    }

    if (loading) {
      return (
        <div className="news-loading">
          <div className="loading-spinner" />
          <span>Loading latest {activeCategory} news...</span>
        </div>
      );
    }

    if (error) {
      return (
        <div className="news-error">
          <i className="fas fa-exclamation-circle" />
          <span>{error}</span>
          <button onClick={() => fetchNewsForCategory(activeCategory)}>
            <i className="fas fa-sync" /> Retry
          </button>
        </div>
      );
    }

    if (fallback && news.length === 0) {
      return (
        <div className="news-fallback-banner">
          <i className="fas fa-info-circle" />
          <span>Showing results from K-POP News Network</span>
        </div>
      );
    }

    return null;
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="explore-page">
      {/* HEADER */}
      <div className="explore-header">
        <h1 className="explore-title">
          <i className="fas fa-compass" style={{ color: '#C084FC' }} />
          Explore K-POP
        </h1>
        <div className="explore-search">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Search artists, groups, K-DRAMA, culture..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="explore-search-clear" onClick={() => setSearchQuery('')}>
              <i className="fas fa-times-circle" />
            </button>
          )}
        </div>
      </div>

      {/* CATEGORIES */}
      <div className="explore-categories">
        {categories.map((category) => (
          <button
            key={category.id}
            className={`category-btn ${activeCategory === category.id ? 'active' : ''}`}
            onClick={() => setActiveCategory(category.id)}
          >
            <i className={`fas ${category.icon}`} />
            <span>{category.label}</span>
            {activeCategory !== 'all' && activeCategory !== 'video' && 
             newsCache[category.id] && newsCache[category.id].length > 0 && (
              <span className="category-badge">
                +{newsCache[category.id].length}
                {usingFallback[category.id] && ' 🔍'}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* GRID */}
      <div className="explore-content">
        {renderNewsLoading()}
        
        <div className="explore-grid">
          {filteredItems.length > 0 ? (
            filteredItems.map((item) => {
              const isNews = item.isNews === true;
              const isFallback = isNews && usingFallback[item.category];
              return (
                <div
                  key={`${item.id}_${item.category}`}
                  className={`explore-item ${item.category} ${isNews ? 'news-item' : ''} ${isFallback ? 'fallback-item' : ''}`}
                  onClick={() => handleItemClick(item)}
                >
                  <div className="explore-item-image">
                    <img src={item.image} alt={item.title} loading="lazy" />
                    <span className="explore-item-category" style={{
                      background: isNews ? '#FDCB6E' :
                        item.category === 'video' ? '#EC4899' :
                        item.category === 'artist' ? '#C084FC' : 
                        item.category === 'group' ? '#4A90D9' : 
                        item.category === 'event' ? '#FF6B6B' :
                        item.category === 'kdrama' ? '#FF6B9D' : '#00B894'
                    }}>
                      {isNews ? (
                        <i className="fas fa-newspaper" />
                      ) : item.category === 'video' ? (
                        <i className="fas fa-play" />
                      ) : item.category === 'event' ? (
                        <i className="fas fa-calendar-alt" />
                      ) : item.category === 'artist' ? (
                        <i className="fas fa-microphone" />
                      ) : item.category === 'group' ? (
                        <i className="fas fa-users" />
                      ) : item.category === 'kdrama' ? (
                        <i className="fas fa-tv" />
                      ) : (
                        <i className="fas fa-landmark" />
                      )}
                    </span>
                    {item.category === 'video' && (
                      <span className="explore-item-play">
                        <i className="fas fa-play-circle" />
                      </span>
                    )}
                    {isNews && item.publishedAt && (
                      <span className="explore-item-time">
                        {formatTimeAgo(item.publishedAt)}
                      </span>
                    )}
                    {isFallback && (
                      <span className="explore-item-fallback-badge">
                        <i className="fas fa-globe" /> External
                      </span>
                    )}
                    <button
                      className="explore-item-like"
                      onClick={(e) => {
                        e.stopPropagation();
                        alert(`❤️ Liked ${item.title}!`);
                      }}
                    >
                      <i className="fas fa-heart" />
                      <span>{formatNumber(item.likes)}</span>
                    </button>
                  </div>
                  <div className="explore-item-content">
                    <h3 className="explore-item-title">{item.title}</h3>
                    <p className="explore-item-subtitle">
                      {isNews ? '📰 ' : ''}{item.subtitle}
                    </p>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="explore-empty">
              <i className="fas fa-compass" />
              <h3>No results found</h3>
              <p>Try adjusting your search or filters</p>
            </div>
          )}
        </div>
      </div>

      {/* MODALS */}
      {renderModal()}
      {renderDataWarning()}
      {renderVideoModal()}
    </div>
  );
};

export default Explore;