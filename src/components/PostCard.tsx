import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Post.css';

// ============================================================
// TYPES
// ============================================================
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
  images?: string[];
  video?: string;
  timestamp: number;
  likes: number;
  comments: number;
  shares: number;
  saved: boolean;
  liked: boolean;
  reaction?: string | null;
  tags: string[];
  mentions: string[];
  category: string;
  mood?: string | null;
  isEdited?: boolean;
  privacy: 'public' | 'friends' | 'followers' | 'private';
  isPinned?: boolean;
  isArchived?: boolean;
  commentsDisabled?: boolean;
}

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

// ============================================================
// REACTIONS CONFIG
// ============================================================
const STANDARD_REACTIONS = [
  { emoji: '❤️', label: 'Like' },
  { emoji: '😍', label: 'Love' },
  { emoji: '😂', label: 'Haha' },
  { emoji: '😮', label: 'Wow' },
  { emoji: '😢', label: 'Sad' },
  { emoji: '😡', label: 'Angry' },
];

const KPOP_REACTIONS = [
  { emoji: '⭐', label: 'Stan' },
  { emoji: '💜', label: 'Bias' },
  { emoji: '🪄', label: 'Lightstick' },
  { emoji: '🔥', label: 'Fire Stage' },
  { emoji: '🎤', label: 'Encore' },
  { emoji: '💖', label: 'Heart' },
];

const ALL_REACTIONS = [...STANDARD_REACTIONS, ...KPOP_REACTIONS];

// ============================================================
// POST COMPONENT
// ============================================================
interface PostProps {
  post: PostData;
  isOwner?: boolean;
  onLike: (id: string) => void;
  onReact: (id: string, reaction: string) => void;
  onComment: (id: string) => void;
  onShare: (id: string) => void;
  onSave: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onPin?: (id: string) => void;
  onArchive?: (id: string) => void;
  onReport?: (id: string) => void;
  onBlock?: (id: string) => void;
  onMute?: (id: string) => void;
  onHide?: (id: string) => void;
  currentUser?: { id: string; name: string; avatar: string };
}

const Post: React.FC<PostProps> = ({
  post,
  isOwner = false,
  onLike,
  onReact,
  onComment,
  onShare,
  onSave,
  onEdit,
  onDelete,
  onPin,
  onArchive,
  onReport,
  onBlock,
  onMute,
  onHide,
  currentUser = { id: 'me', name: 'K-Pop Fan', avatar: 'https://i.pravatar.cc/150?img=16' },
}) => {
  const navigate = useNavigate();
  
  // ============================================================
  // STATES
  // ============================================================
  const [showMenu, setShowMenu] = useState(false);
  const [showReactions, setShowReactions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<CommentData | null>(null);
  const [comments, setComments] = useState<CommentData[]>([]);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'most_liked'>('newest');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [imageDragStart, setImageDragStart] = useState<{ x: number; y: number } | null>(null);
  const [imageOffset, setImageOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const menuRef = useRef<HTMLDivElement>(null);
  const reactionRef = useRef<HTMLDivElement>(null);
  const imageViewerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // CLICK OUTSIDE
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
      if (reactionRef.current && !reactionRef.current.contains(e.target as Node)) {
        setShowReactions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================
  // KEYBOARD NAVIGATION (IMAGE VIEWER)
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showImageViewer) return;
      if (e.key === 'Escape') setShowImageViewer(false);
      if (e.key === 'ArrowLeft') handlePrevImage();
      if (e.key === 'ArrowRight') handleNextImage();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showImageViewer, selectedImageIndex, post.images]);

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getPrivacyIcon = (privacy: string) => {
    switch (privacy) {
      case 'public': return 'fa-globe';
      case 'friends': return 'fa-user-friends';
      case 'followers': return 'fa-users';
      case 'private': return 'fa-lock';
      default: return 'fa-globe';
    }
  };

  const getPrivacyLabel = (privacy: string) => {
    switch (privacy) {
      case 'public': return 'Public';
      case 'friends': return 'Friends';
      case 'followers': return 'Followers';
      case 'private': return 'Only Me';
      default: return 'Public';
    }
  };

  // ============================================================
  // REACTION HANDLERS
  // ============================================================
  const handleReaction = (emoji: string) => {
    onReact(post.id, emoji);
    setShowReactions(false);
  };

  const getReactionEmoji = () => {
    if (post.reaction) {
      const found = ALL_REACTIONS.find(r => r.emoji === post.reaction);
      return found ? found.emoji : '❤️';
    }
    return '❤️';
  };

  const getReactionLabel = () => {
    if (post.reaction) {
      const found = ALL_REACTIONS.find(r => r.emoji === post.reaction);
      return found ? found.label : 'Like';
    }
    return 'Like';
  };

  // ============================================================
  // IMAGE VIEWER
  // ============================================================
  const handleImageClick = (index: number) => {
    setSelectedImageIndex(index);
    setShowImageViewer(true);
    setZoomLevel(1);
    setImageOffset({ x: 0, y: 0 });
  };

  const handlePrevImage = () => {
    if (post.images && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
      setZoomLevel(1);
      setImageOffset({ x: 0, y: 0 });
    }
  };

  const handleNextImage = () => {
    if (post.images && selectedImageIndex < post.images.length - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
      setZoomLevel(1);
      setImageOffset({ x: 0, y: 0 });
    }
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => { setZoomLevel(1); setImageOffset({ x: 0, y: 0 }); };

  const handleImageDragStart = (e: React.MouseEvent) => {
    if (zoomLevel > 1) {
      setImageDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleImageDragMove = (e: React.MouseEvent) => {
    if (imageDragStart && zoomLevel > 1) {
      const dx = e.clientX - imageDragStart.x;
      const dy = e.clientY - imageDragStart.y;
      setImageOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
      setImageDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleImageDragEnd = () => setImageDragStart(null);

  const handleImageWheel = (e: React.WheelEvent) => {
    if (e.deltaY < 0) handleZoomIn();
    else handleZoomOut();
  };

  // ============================================================
  // VIDEO CONTROLS
  // ============================================================
  const toggleVideoPlay = () => {
    if (videoRef.current) {
      if (isVideoPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsVideoPlaying(!isVideoPlaying);
    }
  };

  const handleVideoTimeUpdate = () => {
    if (videoRef.current) {
      const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
      setVideoProgress(progress);
    }
  };

  const handleVideoProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (videoRef.current) {
      const time = (parseFloat(e.target.value) / 100) * videoRef.current.duration;
      videoRef.current.currentTime = time;
      setVideoProgress(parseFloat(e.target.value));
    }
  };

  // ============================================================
  // COMMENTS
  // ============================================================
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const newComment: CommentData = {
      id: Date.now().toString(),
      author: {
        id: currentUser.id,
        name: currentUser.name,
        username: currentUser.name.toLowerCase().replace(/\s/g, ''),
        avatar: currentUser.avatar,
      },
      content: commentText.trim(),
      timestamp: Date.now(),
      likes: 0,
      liked: false,
      replies: [],
    };
    if (replyTo) {
      setComments(prev => prev.map(c => 
        c.id === replyTo.id 
          ? { ...c, replies: [...c.replies, newComment] }
          : c
      ));
    } else {
      setComments(prev => [newComment, ...prev]);
    }
    setCommentText('');
    setReplyTo(null);
    if (commentInputRef.current) commentInputRef.current.focus();
  };

  const handleCommentLike = (commentId: string) => {
    setComments(prev => prev.map(c => {
      if (c.id === commentId) {
        return { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 };
      }
      if (c.replies) {
        return { ...c, replies: c.replies.map(r => 
          r.id === commentId ? { ...r, liked: !r.liked, likes: r.liked ? r.likes - 1 : r.likes + 1 } : r
        )};
      }
      return c;
    }));
  };

  const handleCommentDelete = (commentId: string) => {
    if (confirm('Delete this comment?')) {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
  };

  const sortedComments = () => {
    switch (sortBy) {
      case 'oldest':
        return [...comments].sort((a, b) => a.timestamp - b.timestamp);
      case 'most_liked':
        return [...comments].sort((a, b) => b.likes - a.likes);
      default:
        return [...comments].sort((a, b) => b.timestamp - a.timestamp);
    }
  };

  // ============================================================
  // MENU ITEMS
  // ============================================================
  const getMenuItems = () => {
    const commonItems = [
      { label: 'Save Post', icon: 'fa-bookmark', action: () => onSave(post.id) },
      { label: 'Copy Link', icon: 'fa-link', action: () => { navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`); alert('✅ Link copied!'); } },
      { label: 'Share to...', icon: 'fa-share', action: () => onShare(post.id) },
      { label: 'View Profile', icon: 'fa-user', action: () => navigate(`/profile/${post.author.username}`) },
    ];

    if (isOwner) {
      return [
        { label: 'Edit Post', icon: 'fa-pen', action: () => onEdit && onEdit(post.id) },
        { label: 'Pin Post', icon: 'fa-thumbtack', action: () => onPin && onPin(post.id) },
        { label: 'Archive Post', icon: 'fa-archive', action: () => onArchive && onArchive(post.id) },
        { label: 'Change Audience', icon: 'fa-users', action: () => alert('🔒 Change audience') },
        { label: 'Disable Comments', icon: 'fa-comment-slash', action: () => alert('💬 Comments disabled') },
        { label: 'Delete Post', icon: 'fa-trash', action: () => onDelete && onDelete(post.id), danger: true },
        ...commonItems,
      ];
    }

    return [
      { label: 'Turn On Notifications', icon: 'fa-bell', action: () => alert('🔔 Notifications enabled') },
      { label: 'Hide Post', icon: 'fa-eye-slash', action: () => onHide && onHide(post.id) },
      { label: 'Report Post', icon: 'fa-flag', action: () => onReport && onReport(post.id) },
      { label: 'Mute User', icon: 'fa-volume-mute', action: () => onMute && onMute(post.id) },
      { label: 'Block User', icon: 'fa-ban', action: () => onBlock && onBlock(post.id) },
      ...commonItems,
    ];
  };

  // ============================================================
  // RENDER IMAGE GRID
  // ============================================================
  const renderImageGrid = () => {
    if (!post.images || post.images.length === 0) return null;

    const imageCount = post.images.length;
    const gridClasses = `post-image-grid grid-${Math.min(imageCount, 4)}`;

    return (
      <div className={gridClasses} style={{ marginTop: '8px' }}>
        {post.images.slice(0, 5).map((img, index) => {
          const isLast = index === 4 && imageCount > 5;
          return (
            <div 
              key={index} 
              className="post-image-item"
              onClick={() => handleImageClick(index)}
              style={{ 
                gridColumn: imageCount === 3 && index === 0 ? '1 / -1' : 'auto',
                gridRow: imageCount === 3 && index === 0 ? '1 / 3' : 'auto',
              }}
            >
              <img src={img} alt={`Post ${index + 1}`} loading="lazy" />
              {isLast && (
                <div className="post-image-overlay">
                  <span>+{imageCount - 5}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <>
      <div className="post-premium">
        {/* ============================================================
            HEADER
        ============================================================ */}
        <div className="post-header-premium">
          <div className="post-header-left">
            <div className="post-avatar-premium" onClick={() => navigate(`/profile/${post.author.username}`)}>
              <img src={post.author.avatar} alt={post.author.name} />
            </div>
            <div className="post-author-info">
              <div className="post-author-name">
                <span className="post-author-name-text" onClick={() => navigate(`/profile/${post.author.username}`)}>
                  {post.author.name}
                </span>
                {post.author.verified && <i className="fas fa-check-circle verified-badge" />}
                <span className="post-author-group">· {post.author.group}</span>
              </div>
              <div className="post-meta-info">
                <span className="post-timestamp">{formatTimeAgo(post.timestamp)}</span>
                <span className="post-meta-dot">·</span>
                <span className="post-privacy">
                  <i className={`fas ${getPrivacyIcon(post.privacy)}`} />
                  <span>{getPrivacyLabel(post.privacy)}</span>
                </span>
                {post.isEdited && <span className="post-edited">· Edited</span>}
                {post.isPinned && <span className="post-pinned"><i className="fas fa-thumbtack" /> Pinned</span>}
              </div>
            </div>
          </div>

          <div className="post-header-right" ref={menuRef}>
            <button className="post-menu-btn" onClick={() => setShowMenu(!showMenu)}>
              <i className="fas fa-ellipsis-h" />
            </button>
            {showMenu && (
              <div className="post-menu-dropdown">
                {getMenuItems().map((item, index) => (
                  <button
                    key={index}
                    className={`post-menu-item ${item.danger ? 'danger' : ''}`}
                    onClick={() => { item.action(); setShowMenu(false); }}
                  >
                    <i className={`fas ${item.icon}`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ============================================================
            CONTENT
        ============================================================ */}
        <div className="post-content-premium">
          {post.mood && (
            <span className="post-mood-premium">{post.mood}</span>
          )}
          
          <div className="post-text-premium">
            {isExpanded ? post.content : post.content.slice(0, 300)}
            {post.content.length > 300 && (
              <button className="post-expand-btn" onClick={() => setIsExpanded(!isExpanded)}>
                {isExpanded ? ' See less' : ' See more'}
              </button>
            )}
          </div>

          {post.tags.length > 0 && (
            <div className="post-tags-premium">
              {post.tags.map(tag => (
                <span key={tag} className="post-tag-premium" onClick={() => navigate(`/search?q=%23${tag}`)}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {post.mentions.length > 0 && (
            <div className="post-mentions-premium">
              {post.mentions.map(mention => (
                <span key={mention} className="post-mention-premium" onClick={() => navigate(`/profile/${mention}`)}>
                  @{mention}
                </span>
              ))}
            </div>
          )}

          {/* Image Grid */}
          {renderImageGrid()}

          {/* Video */}
          {post.video && (
            <div className="post-video-premium">
              <video
                ref={videoRef}
                src={post.video}
                poster={post.images?.[0]}
                onTimeUpdate={handleVideoTimeUpdate}
                onClick={toggleVideoPlay}
              />
              <div className="post-video-controls">
                <button onClick={toggleVideoPlay}>
                  <i className={`fas ${isVideoPlaying ? 'fa-pause' : 'fa-play'}`} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={videoProgress}
                  onChange={handleVideoProgressChange}
                  className="post-video-progress"
                />
                <button onClick={() => { if (videoRef.current) { videoRef.current.requestFullscreen(); } }}>
                  <i className="fas fa-expand" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ============================================================
            STATS
        ============================================================ */}
        <div className="post-stats-premium">
          <div className="post-stats-left">
            <span className="post-reactions-display">
              {post.reaction && (
                <span className="post-reaction-emoji">{post.reaction}</span>
              )}
              <span className="post-like-count">
                {formatNumber(post.likes)}
              </span>
            </span>
            <span className="post-comment-count">
              {formatNumber(post.comments)} Comments
            </span>
            <span className="post-share-count">
              {formatNumber(post.shares)} Shares
            </span>
          </div>
          <div className="post-stats-right">
            {post.saved && <i className="fas fa-bookmark post-saved-icon" />}
          </div>
        </div>

        {/* ============================================================
            ACTIONS
        ============================================================ */}
        <div className="post-actions-premium">
          {/* Reaction Button */}
          <div className="post-action-wrapper" ref={reactionRef}>
            <button 
              className={`post-action-btn ${post.reaction ? 'active' : ''}`}
              onClick={() => onReact(post.id, getReactionEmoji())}
              onMouseEnter={() => setShowReactions(true)}
            >
              <span className="post-action-icon">
                {post.reaction ? post.reaction : '❤️'}
              </span>
              <span>{post.reaction ? getReactionLabel() : 'Like'}</span>
            </button>
            {showReactions && (
              <div className="post-reaction-picker">
                {ALL_REACTIONS.map((reaction, idx) => (
                  <button
                    key={idx}
                    className="post-reaction-option"
                    onClick={() => handleReaction(reaction.emoji)}
                    title={reaction.label}
                  >
                    <span className="reaction-emoji">{reaction.emoji}</span>
                    <span className="reaction-label">{reaction.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <button className="post-action-btn" onClick={() => { onComment(post.id); setShowComments(!showComments); }}>
            <i className="fas fa-comment" />
            <span>Comment</span>
          </button>

          <button className="post-action-btn" onClick={() => onShare(post.id)}>
            <i className="fas fa-share" />
            <span>Share</span>
          </button>

          <button className={`post-action-btn ${post.saved ? 'saved' : ''}`} onClick={() => onSave(post.id)}>
            <i className={`fas ${post.saved ? 'fa-bookmark' : 'fa-bookmark'}`} />
            <span>{post.saved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* ============================================================
            COMMENTS SECTION
        ============================================================ */}
        {showComments && !post.commentsDisabled && (
          <div className="post-comments-premium">
            <div className="post-comments-header">
              <span className="post-comments-title">Comments</span>
              <div className="post-comments-sort">
                <button 
                  className={`sort-btn ${sortBy === 'newest' ? 'active' : ''}`}
                  onClick={() => setSortBy('newest')}
                >
                  Newest
                </button>
                <button 
                  className={`sort-btn ${sortBy === 'oldest' ? 'active' : ''}`}
                  onClick={() => setSortBy('oldest')}
                >
                  Oldest
                </button>
                <button 
                  className={`sort-btn ${sortBy === 'most_liked' ? 'active' : ''}`}
                  onClick={() => setSortBy('most_liked')}
                >
                  Most Liked
                </button>
              </div>
            </div>

            {/* Comment Input */}
            <div className="post-comment-input">
              <div className="comment-input-avatar">
                <img src={currentUser.avatar} alt={currentUser.name} />
              </div>
              <div className="comment-input-wrapper">
                {replyTo && (
                  <div className="comment-reply-indicator">
                    <span>Replying to <strong>{replyTo.author.name}</strong></span>
                    <button onClick={() => setReplyTo(null)}>
                      <i className="fas fa-times" />
                    </button>
                  </div>
                )}
                <div className="comment-input-row">
                  <input
                    ref={commentInputRef}
                    type="text"
                    placeholder={replyTo ? `Reply to ${replyTo.author.name}...` : "Write a comment..."}
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                  />
                  <button className="comment-emoji-btn">
                    <i className="fas fa-smile" />
                  </button>
                  <button className="comment-gif-btn">
                    <i className="fas fa-gif" />
                  </button>
                  <button className="comment-send-btn" onClick={handleAddComment} disabled={!commentText.trim()}>
                    <i className="fas fa-paper-plane" />
                  </button>
                </div>
              </div>
            </div>

            {/* Comments List */}
            <div className="post-comments-list">
              {sortedComments().map((comment) => (
                <div key={comment.id} className={`post-comment-item ${comment.isPinned ? 'pinned' : ''}`}>
                  {comment.isPinned && <span className="comment-pinned-badge"><i className="fas fa-thumbtack" /> Pinned</span>}
                  <div className="comment-avatar">
                    <img src={comment.author.avatar} alt={comment.author.name} />
                  </div>
                  <div className="comment-content">
                    <div className="comment-header">
                      <span className="comment-author">{comment.author.name}</span>
                      {comment.author.verified && <i className="fas fa-check-circle verified-badge small" />}
                      <span className="comment-time">{formatTimeAgo(comment.timestamp)}</span>
                      {comment.isEdited && <span className="comment-edited">· Edited</span>}
                    </div>
                    <div className="comment-text">{comment.content}</div>
                    <div className="comment-actions">
                      <button className="comment-like-btn" onClick={() => handleCommentLike(comment.id)}>
                        <i className={`fas fa-heart ${comment.liked ? 'liked' : ''}`} />
                        <span>{comment.likes > 0 && formatNumber(comment.likes)}</span>
                      </button>
                      <button className="comment-reply-btn" onClick={() => { setReplyTo(comment); commentInputRef.current?.focus(); }}>
                        Reply
                      </button>
                      {comment.author.id === currentUser.id && (
                        <button className="comment-delete-btn" onClick={() => handleCommentDelete(comment.id)}>
                          Delete
                        </button>
                      )}
                    </div>

                    {/* Nested Replies */}
                    {comment.replies.length > 0 && (
                      <div className="comment-replies">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="comment-reply-item">
                            <div className="comment-avatar small">
                              <img src={reply.author.avatar} alt={reply.author.name} />
                            </div>
                            <div className="comment-content">
                              <div className="comment-header">
                                <span className="comment-author">{reply.author.name}</span>
                                {reply.author.verified && <i className="fas fa-check-circle verified-badge small" />}
                                <span className="comment-time">{formatTimeAgo(reply.timestamp)}</span>
                                {reply.isEdited && <span className="comment-edited">· Edited</span>}
                              </div>
                              <div className="comment-text">{reply.content}</div>
                              <div className="comment-actions">
                                <button className="comment-like-btn" onClick={() => handleCommentLike(reply.id)}>
                                  <i className={`fas fa-heart ${reply.liked ? 'liked' : ''}`} />
                                  <span>{reply.likes > 0 && formatNumber(reply.likes)}</span>
                                </button>
                                <button className="comment-reply-btn" onClick={() => { setReplyTo(reply); commentInputRef.current?.focus(); }}>
                                  Reply
                                </button>
                                {reply.author.id === currentUser.id && (
                                  <button className="comment-delete-btn" onClick={() => handleCommentDelete(reply.id)}>
                                    Delete
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {comments.length === 0 && (
                <div className="post-comments-empty">
                  <i className="fas fa-comment-slash" />
                  <span>No comments yet. Be the first to comment!</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ============================================================
          IMAGE VIEWER
      ============================================================ */}
      {showImageViewer && post.images && (
        <div 
          className="image-viewer-overlay" 
          onClick={() => setShowImageViewer(false)}
          ref={imageViewerRef}
        >
          <div className="image-viewer-content" onClick={(e) => e.stopPropagation()}>
            {/* Close Button */}
            <button className="image-viewer-close" onClick={() => setShowImageViewer(false)}>
              <i className="fas fa-times" />
            </button>

            {/* Controls */}
            <div className="image-viewer-controls">
              <button className="image-viewer-control" onClick={handleZoomIn}>
                <i className="fas fa-plus" />
              </button>
              <button className="image-viewer-control" onClick={handleZoomOut}>
                <i className="fas fa-minus" />
              </button>
              <button className="image-viewer-control" onClick={handleResetZoom}>
                <i className="fas fa-expand" />
              </button>
              <button className="image-viewer-control" onClick={() => { window.open(post.images![selectedImageIndex], '_blank'); }}>
                <i className="fas fa-external-link-alt" />
              </button>
              <button className="image-viewer-control" onClick={() => { navigator.clipboard.writeText(post.images![selectedImageIndex]); alert('✅ Image link copied!'); }}>
                <i className="fas fa-link" />
              </button>
            </div>

            {/* Counter */}
            <div className="image-viewer-counter">
              {selectedImageIndex + 1} / {post.images.length}
            </div>

            {/* Image */}
            <div 
              className="image-viewer-image-wrapper"
              onMouseDown={handleImageDragStart}
              onMouseMove={handleImageDragMove}
              onMouseUp={handleImageDragEnd}
              onMouseLeave={handleImageDragEnd}
              onWheel={handleImageWheel}
              style={{ cursor: zoomLevel > 1 ? 'grab' : 'default' }}
            >
              <img 
                src={post.images[selectedImageIndex]} 
                alt={`Image ${selectedImageIndex + 1}`}
                style={{
                  transform: `scale(${zoomLevel}) translate(${imageOffset.x / zoomLevel}px, ${imageOffset.y / zoomLevel}px)`,
                  transition: imageDragStart ? 'none' : 'transform 0.2s ease',
                }}
                draggable={false}
              />
            </div>

            {/* Navigation */}
            {post.images.length > 1 && (
              <>
                <button 
                  className="image-viewer-nav prev" 
                  onClick={handlePrevImage}
                  disabled={selectedImageIndex === 0}
                >
                  <i className="fas fa-chevron-left" />
                </button>
                <button 
                  className="image-viewer-nav next" 
                  onClick={handleNextImage}
                  disabled={selectedImageIndex === post.images.length - 1}
                >
                  <i className="fas fa-chevron-right" />
                </button>
              </>
            )}

            {/* Thumbnails */}
            {post.images.length > 1 && (
              <div className="image-viewer-thumbnails">
                {post.images.map((img, idx) => (
                  <div 
                    key={idx} 
                    className={`thumbnail-item ${idx === selectedImageIndex ? 'active' : ''}`}
                    onClick={() => { setSelectedImageIndex(idx); setZoomLevel(1); setImageOffset({ x: 0, y: 0 }); }}
                  >
                    <img src={img} alt={`Thumb ${idx + 1}`} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Post;