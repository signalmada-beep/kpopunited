// ========== src/components/Stories.tsx ==========
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StoryViewer from './StoryViewer';
import StoryCreator from './StoryCreator';
import '../styles/Stories.css';

// ============================================================
// TYPES
// ============================================================
export interface Story {
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
  uniqueViewers: number;
  likes: number;
  reactions: { emoji: string; count: number }[];
  replies: { id: string; user: string; avatar: string; text: string; timestamp: string }[];
  shares: number;
  saves: number;
  isViewed?: boolean;
  isLive?: boolean;
  isOwner?: boolean;
  isArchived?: boolean;
  isPinned?: boolean;
  isHighlight?: boolean;
  allowReplies?: boolean;
  expiresAt?: string;
}

export interface Viewer {
  id: string;
  name: string;
  username: string;
  avatar: string;
  verified?: boolean;
  viewedAt: string;
  reaction?: string;
  isFollowing?: boolean;
}

export interface Highlight {
  id: string;
  name: string;
  coverImage: string;
  stories: string[];
  createdAt: number;
}

interface StoriesProps {
  stories: Story[];
  onOpenCreator: () => void;
  onStoryUpdate?: (storyId: string, updates: Partial<Story>) => void;
  onStoryDelete?: (storyId: string) => void;
  onHighlightCreate?: (highlight: Highlight) => void;
  onHighlightAdd?: (storyId: string, highlightId: string) => void;
  currentUser?: { id: string; name: string; username: string; avatar: string };
}

// ============================================================
// REACTIONS
// ============================================================
export const STORY_REACTIONS = [
  { emoji: '❤️', label: 'Love' },
  { emoji: '👍', label: 'Like' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '💜', label: 'Bias' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '🎤', label: 'Encore' },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const Stories: React.FC<StoriesProps> = ({
  stories: initialStories,
  onOpenCreator,
  onStoryUpdate,
  onStoryDelete,
  onHighlightCreate,
  onHighlightAdd,
  currentUser = { id: 'me', name: 'K-Pop Fan', username: 'kpopfan', avatar: 'https://i.pravatar.cc/150?img=16' },
}) => {
  const navigate = useNavigate();
  const [stories, setStories] = useState<Story[]>(initialStories);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showCreator, setShowCreator] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [viewers, setViewers] = useState<Viewer[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const currentStory = selectedIndex !== null ? stories[selectedIndex] : null;
  const totalStories = stories.length;

  // ============================================================
  // SCROLL
  // ============================================================
  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -200, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
    }
  };

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleOpenViewer = (index: number) => {
    setSelectedIndex(index);
    document.body.style.overflow = 'hidden';
  };

  const handleCloseViewer = () => {
    setSelectedIndex(null);
    setShowViewers(false);
    setShowInsights(false);
    document.body.style.overflow = '';
  };

  const handleStoryViewed = (storyId: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId ? { ...s, isViewed: true } : s
      )
    );
    if (onStoryUpdate) {
      onStoryUpdate(storyId, { isViewed: true });
    }
  };

  const handleReact = (storyId: string, emoji: string) => {
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
    if (onStoryUpdate) {
      const story = stories.find(s => s.id === storyId);
      if (story) {
        const existing = story.reactions.find(r => r.emoji === emoji);
        const newReactions = existing
          ? story.reactions.map(r => r.emoji === emoji ? { ...r, count: r.count + 1 } : r)
          : [...story.reactions, { emoji, count: 1 }];
        onStoryUpdate(storyId, { reactions: newReactions });
      }
    }
  };

  const handleReply = (storyId: string, text: string) => {
    const reply = {
      id: Date.now().toString(),
      user: currentUser.name,
      avatar: currentUser.avatar,
      text,
      timestamp: new Date().toISOString(),
    };
    setStories(prev =>
      prev.map(s =>
        s.id === storyId
          ? { ...s, replies: [...s.replies, reply] }
          : s
      )
    );
  };

  const handleShare = (storyId: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId ? { ...s, shares: s.shares + 1 } : s
      )
    );
    if (onStoryUpdate) {
      const story = stories.find(s => s.id === storyId);
      if (story) {
        onStoryUpdate(storyId, { shares: story.shares + 1 });
      }
    }
  };

  const handleSave = (storyId: string) => {
    setStories(prev =>
      prev.map(s =>
        s.id === storyId ? { ...s, saves: s.saves + 1 } : s
      )
    );
  };

  const handleCreateStory = (storyData: any) => {
    const newStory: Story = {
      id: `story_${Date.now()}`,
      ...storyData,
      author: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      group: 'K-POP UNITED',
      views: 0,
      uniqueViewers: 0,
      likes: 0,
      reactions: [],
      replies: [],
      shares: 0,
      saves: 0,
      isViewed: false,
      isOwner: true,
      allowReplies: true,
      timestamp: new Date().toISOString(),
    };
    setStories(prev => [newStory, ...prev]);
    setShowCreator(false);
  };

  // ============================================================
  // RENDER STORY ITEM
  // ============================================================
  const renderStoryItem = (story: Story, index: number) => {
    const isViewed = story.isViewed;
    const isOwner = story.isOwner;
    const isHighlight = story.isHighlight;

    return (
      <div
        key={story.id}
        className={`story-item ${isViewed ? 'viewed' : ''} ${isOwner ? 'owner' : ''} ${isHighlight ? 'highlight' : ''}`}
        onClick={() => handleOpenViewer(index)}
      >
        <div className="story-ring">
          <div className="story-avatar">
            <img src={story.avatar} alt={story.author} />
            {story.isLive && <span className="live-badge">LIVE</span>}
            {isHighlight && <span className="highlight-badge">⭐</span>}
          </div>
        </div>
        <span className="story-name">
          {story.author}
          {story.verified && <i className="fas fa-check-circle verified" />}
        </span>
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="stories-wrapper">
      <div className="stories-scroll-wrapper">
        <button className="stories-scroll-btn left" onClick={scrollLeft}>
          <i className="fas fa-chevron-left" />
        </button>
        
        <div className="stories-scroll" ref={scrollRef}>
          {/* Add Story */}
          <div className="story-item add-story" onClick={() => setShowCreator(true)}>
            <div className="story-ring add-ring">
              <div className="story-avatar add-avatar">
                <i className="fas fa-plus" />
              </div>
            </div>
            <span className="story-name">Add Story</span>
          </div>

          {/* Stories */}
          {stories.map(renderStoryItem)}
        </div>

        <button className="stories-scroll-btn right" onClick={scrollRight}>
          <i className="fas fa-chevron-right" />
        </button>
      </div>

      {/* Story Viewer */}
      {selectedIndex !== null && currentStory && (
        <StoryViewer
          stories={stories}
          initialIndex={selectedIndex}
          onClose={handleCloseViewer}
          onStoryViewed={handleStoryViewed}
          onReact={handleReact}
          onReply={handleReply}
          onShare={handleShare}
          onSave={handleSave}
          onStoryUpdate={onStoryUpdate}
          onStoryDelete={onStoryDelete}
          onHighlightAdd={onHighlightAdd}
          currentUser={currentUser}
        />
      )}

      {/* Story Creator */}
      <StoryCreator
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        onCreateStory={handleCreateStory}
        currentUser={currentUser}
      />
    </div>
  );
};

export default Stories;