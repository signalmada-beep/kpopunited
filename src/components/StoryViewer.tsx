// ========== src/components/StoryViewer.tsx ==========
import React, { useState, useEffect, useRef, useCallback } from 'react';
import '../styles/StoryViewer.css';

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
  textPosition?: { x: number; y: number };
  textScale?: number;
  textColor?: string;
}

interface StoryViewerProps {
  stories: Story[];
  initialIndex: number;
  onClose: () => void;
  onShare?: (storyId: string) => void;
  onReact?: (storyId: string, emoji: string) => void;
  onReply?: (storyId: string, text: string) => void;
  onLike?: (storyId: string) => void;
  onSave?: (storyId: string) => void;
  onStoryViewed?: (storyId: string) => void;
  onStoryUpdate?: (storyId: string, updates: Partial<Story>) => void;
  onStoryDelete?: (storyId: string) => void;
  onHighlightAdd?: (storyId: string, highlightId: string) => void;
  currentUser?: { id: string; name: string; avatar: string };
}

// ============================================================
// RÉACTIONS DISPONIBLES
// ============================================================
const REACTIONS = ['❤️', '🔥', '😂', '😍', '👏', '👍', '😮', '😢', '😡', '⭐', '💜', '🎤'];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const StoryViewer: React.FC<StoryViewerProps> = ({
  stories,
  initialIndex,
  onClose,
  onShare,
  onReact,
  onReply,
  onLike,
  onSave,
  onStoryViewed,
  onStoryUpdate,
  onStoryDelete,
  onHighlightAdd,
  currentUser = { id: 'me', name: 'Moi', avatar: 'https://i.pravatar.cc/150?img=16' },
}) => {
  // ============================================================
  // ÉTATS
  // ============================================================
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [showReplies, setShowReplies] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [showInsights, setShowInsights] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  const currentStory = stories[currentIndex];
  const totalStories = stories.length;

  // Références
  const progressInterval = useRef<NodeJS.Timeout | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // GESTION DE LA PROGRESSION
  // ============================================================
  const goToNext = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    if (currentIndex < totalStories - 1) {
      if (onStoryViewed && currentStory) {
        onStoryViewed(currentStory.id);
      }
      setCurrentIndex(currentIndex + 1);
      setProgress(0);
    } else {
      if (onStoryViewed && currentStory) {
        onStoryViewed(currentStory.id);
      }
      onClose();
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [currentIndex, totalStories, onStoryViewed, currentStory, onClose, isAnimating]);

  const goToPrev = useCallback(() => {
    if (isAnimating) return;
    setIsAnimating(true);
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setProgress(0);
    }
    
    setTimeout(() => setIsAnimating(false), 300);
  }, [currentIndex, isAnimating]);

  const startProgress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setProgress(0);
    progressInterval.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval.current!);
          progressInterval.current = null;
          goToNext();
          return 100;
        }
        return prev + 0.5;
      });
    }, 50);
  }, [goToNext]);

  const pauseProgress = useCallback(() => {
    if (progressInterval.current) {
      clearInterval(progressInterval.current);
      progressInterval.current = null;
    }
    setIsPaused(true);
  }, []);

  const resumeProgress = useCallback(() => {
    if (isPaused && !progressInterval.current) {
      setIsPaused(false);
      progressInterval.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(progressInterval.current!);
            progressInterval.current = null;
            goToNext();
            return 100;
          }
          return prev + 0.5;
        });
      }, 50);
    }
  }, [isPaused, goToNext]);

  // ============================================================
  // EFFETS - GESTION DE LA PROGRESSION
  // ============================================================
  useEffect(() => {
    startProgress();
    return () => {
      if (progressInterval.current) {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
      }
    };
  }, [currentIndex, startProgress]);

  // ============================================================
  // EFFETS - CLICK OUTSIDE MENU
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================
  // EFFETS - CLAVIER
  // ============================================================
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        goToNext();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrev();
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
      if (e.key === ' ') {
        e.preventDefault();
        if (isPaused) {
          resumeProgress();
        } else {
          pauseProgress();
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose, isPaused, resumeProgress, pauseProgress]);

  // ============================================================
  // GESTION DES CLICS SUR LE CONTAINER
  // ============================================================
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Clic à gauche : précédent
    if (x < width / 3) {
      goToPrev();
    }
    // Clic à droite : suivant
    else if (x > (width * 2) / 3) {
      goToNext();
    }
    // Clic au milieu : pause/reprise
    else {
      if (isPaused) {
        resumeProgress();
      } else {
        pauseProgress();
      }
    }
  }, [goToPrev, goToNext, isPaused, resumeProgress, pauseProgress]);

  // ============================================================
  // HANDLERS D'INTERACTIONS
  // ============================================================
  const handleLike = useCallback(() => {
    if (onLike && currentStory) {
      onLike(currentStory.id);
    }
  }, [onLike, currentStory]);

  const handleReact = useCallback((emoji: string) => {
    if (onReact && currentStory) {
      onReact(currentStory.id, emoji);
    }
    setShowReactionPicker(false);
  }, [onReact, currentStory]);

  const handleReply = useCallback(() => {
    if (replyText.trim() && onReply && currentStory) {
      onReply(currentStory.id, replyText.trim());
      setReplyText('');
      setShowReplies(true);
    }
  }, [replyText, onReply, currentStory]);

  const handleShare = useCallback(() => {
    if (onShare && currentStory) {
      onShare(currentStory.id);
    }
  }, [onShare, currentStory]);

  const handleSave = useCallback(() => {
    if (onSave && currentStory) {
      onSave(currentStory.id);
    }
  }, [onSave, currentStory]);

  const handleReplyKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleReply();
    }
  }, [handleReply]);

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatTimeAgo = useCallback((timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return new Date(timestamp).toLocaleDateString();
  }, []);

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  }, []);

  // ============================================================
  // RENDU DES RÉACTIONS
  // ============================================================
  const renderReactions = useCallback(() => {
    if (!currentStory?.reactions || currentStory.reactions.length === 0) {
      return null;
    }

    return (
      <div className="story-viewer-reactions">
        {currentStory.reactions.slice(0, 5).map((r) => (
          <span key={r.emoji} className="story-viewer-reaction">
            <span className="reaction-emoji">{r.emoji}</span>
            <span className="reaction-count">{r.count}</span>
          </span>
        ))}
        {currentStory.reactions.length > 5 && (
          <span className="story-viewer-reaction-count">
            +{currentStory.reactions.length - 5}
          </span>
        )}
        <button
          className="story-viewer-add-reaction"
          onClick={() => setShowReactionPicker(!showReactionPicker)}
          title="Ajouter une réaction"
        >
          <i className="fas fa-plus" />
        </button>
      </div>
    );
  }, [currentStory, showReactionPicker]);

  // ============================================================
  // RENDU DES RÉPONSES
  // ============================================================
  const renderReplies = useCallback(() => {
    if (!currentStory?.replies || currentStory.replies.length === 0) {
      return null;
    }

    return (
      <>
        <button
          className="story-viewer-quick-reply"
          onClick={() => setShowReplies(!showReplies)}
        >
          {showReplies ? 'Cacher' : 'Voir'} les réponses ({currentStory.replies.length})
        </button>

        {showReplies && (
          <div className="viewers-slide-up open">
            {currentStory.replies.map((reply) => (
              <div key={reply.id} className="viewer-item">
                <div className="viewer-avatar">
                  <img src={reply.avatar} alt={reply.user} />
                </div>
                <div className="viewer-name">{reply.user}</div>
                <div className="viewer-time">{formatTimeAgo(reply.timestamp)}</div>
                <div className="viewer-reaction" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)' }}>
                  {reply.text}
                </div>
              </div>
            ))}
          </div>
        )}
      </>
    );
  }, [currentStory, showReplies, formatTimeAgo]);

  // ============================================================
  // RENDU DU MENU (3 POINTS)
  // ============================================================
  const renderMenu = useCallback(() => {
    if (!currentStory) return null;

    return (
      <div className="story-viewer-menu-wrapper" ref={menuRef}>
        <button
          className="story-viewer-btn menu"
          onClick={() => setShowMenu(!showMenu)}
          title="Options"
        >
          <i className="fas fa-ellipsis-v" />
        </button>
        
        {showMenu && (
          <div className="story-viewer-menu">
            {currentStory.isOwner ? (
              <>
                <button className="menu-item" onClick={() => {
                  if (onStoryDelete) onStoryDelete(currentStory.id);
                  setShowMenu(false);
                }}>
                  <i className="fas fa-trash" />
                  <span>Supprimer</span>
                </button>
                <button className="menu-item" onClick={() => {
                  if (onStoryUpdate) onStoryUpdate(currentStory.id, { isArchived: true });
                  setShowMenu(false);
                }}>
                  <i className="fas fa-archive" />
                  <span>Archiver</span>
                </button>
                <div className="menu-separator" />
              </>
            ) : (
              <>
                <button className="menu-item" onClick={() => {
                  alert('🔔 Notifications activées');
                  setShowMenu(false);
                }}>
                  <i className="fas fa-bell" />
                  <span>Activer les notifications</span>
                </button>
                <button className="menu-item danger" onClick={() => {
                  if (confirm('Signaler cette story ?')) {
                    alert('🚫 Story signalée');
                    setShowMenu(false);
                  }
                }}>
                  <i className="fas fa-flag" />
                  <span>Signaler</span>
                </button>
                <button className="menu-item danger" onClick={() => {
                  if (confirm('Bloquer cet utilisateur ?')) {
                    alert('🚫 Utilisateur bloqué');
                    setShowMenu(false);
                  }
                }}>
                  <i className="fas fa-ban" />
                  <span>Bloquer</span>
                </button>
                <div className="menu-separator" />
              </>
            )}
            <button className="menu-item" onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('✅ Lien copié !');
              setShowMenu(false);
            }}>
              <i className="fas fa-link" />
              <span>Copier le lien</span>
            </button>
          </div>
        )}
      </div>
    );
  }, [currentStory, showMenu, onStoryDelete, onStoryUpdate]);

  // ============================================================
  // RENDU DU REACTION PICKER
  // ============================================================
  const renderReactionPicker = useCallback(() => {
    if (!showReactionPicker) return null;

    return (
      <div className="story-viewer-reactions-picker">
        <button
          className="story-viewer-reactions-close"
          onClick={() => setShowReactionPicker(false)}
        >
          <i className="fas fa-times" />
        </button>
        <div className="story-viewer-reactions-grid">
          {REACTIONS.map((emoji) => (
            <button
              key={emoji}
              className="story-viewer-reaction-option"
              onClick={() => handleReact(emoji)}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>
    );
  }, [showReactionPicker, handleReact]);

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  if (!currentStory) return null;

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div
        className="story-viewer-content premium"
        onClick={(e) => e.stopPropagation()}
        ref={containerRef}
      >
        {/* ============================================================
            BARRES DE PROGRESSION
        ============================================================ */}
        <div className="story-progress-bars">
          {stories.map((story, idx) => (
            <div key={story.id} className="story-progress-track">
              <div
                className="story-progress-bar"
                style={{
                  width: idx < currentIndex ? '100%' : idx === currentIndex ? `${progress}%` : '0%',
                  transition: 'width 0.1s linear',
                }}
              />
            </div>
          ))}
        </div>

        {/* ============================================================
            HEADER
        ============================================================ */}
        <div className="story-viewer-header">
          <div className="story-viewer-author">
            <div className="story-viewer-avatar" onClick={() => {}}>
              <img src={currentStory.avatar} alt={currentStory.author} />
              {currentStory.isLive && <span className="live-dot" />}
            </div>
            <div className="story-viewer-info">
              <div className="story-viewer-name">
                {currentStory.author}
                {currentStory.verified && <span className="verified">✓</span>}
                <span className="story-viewer-group">· {currentStory.group}</span>
              </div>
              <div className="story-viewer-meta">
                <span>{formatTimeAgo(currentStory.timestamp)}</span>
                {currentStory.views > 0 && (
                  <>
                    <span>·</span>
                    <span 
                      className="story-viewer-stats-link"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowViewers(!showViewers);
                      }}
                    >
                      {currentStory.views} vues
                    </span>
                  </>
                )}
                {currentStory.isLive && <span className="live-badge">LIVE</span>}
              </div>
            </div>
          </div>

          <div className="story-viewer-actions">
            <button
              className={`story-viewer-btn like ${currentStory.likes > 0 ? 'has-likes' : ''}`}
              onClick={handleLike}
              title="Aimer"
            >
              <i className="fas fa-heart" />
              {currentStory.likes > 0 && (
                <span className="story-like-count">{formatNumber(currentStory.likes)}</span>
              )}
            </button>

            <button
              className="story-viewer-btn"
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              title="Réagir"
            >
              <i className="fas fa-smile" />
            </button>

            <button
              className="story-viewer-btn"
              onClick={handleShare}
              title="Partager"
            >
              <i className="fas fa-share" />
            </button>

            <button
              className="story-viewer-btn"
              onClick={handleSave}
              title="Sauvegarder"
            >
              <i className="fas fa-bookmark" />
            </button>

            {renderMenu()}

            <button
              className="story-viewer-btn close"
              onClick={onClose}
              title="Fermer"
            >
              <i className="fas fa-times" />
            </button>
          </div>
        </div>

        {/* ============================================================
            BODY - CONTENU DE LA STORY
        ============================================================ */}
        <div className="story-viewer-body" onClick={handleContainerClick}>
          {/* Image */}
          {currentStory.image && (
            <img
              src={currentStory.image}
              alt={currentStory.content || 'Story'}
              className="story-viewer-image"
              draggable={false}
            />
          )}

          {/* Texte superposé avec position personnalisée */}
          {currentStory.content && (
            <div
              className="story-viewer-text"
              style={{
                left: currentStory.textPosition ? `${currentStory.textPosition.x}%` : '50%',
                top: currentStory.textPosition ? `${currentStory.textPosition.y}%` : '50%',
                transform: `translate(-50%, -50%) scale(${currentStory.textScale || 1})`,
                color: currentStory.textColor || '#FFFFFF',
              }}
            >
              <p>{currentStory.content}</p>
              {currentStory.hashtags && currentStory.hashtags.length > 0 && (
                <div className="story-viewer-hashtags">
                  {currentStory.hashtags.map((tag) => (
                    <span key={tag} className="story-viewer-hashtag">#{tag}</span>
                  ))}
                </div>
              )}
              {currentStory.mentions && currentStory.mentions.length > 0 && (
                <div className="story-viewer-mentions">
                  {currentStory.mentions.map((mention) => (
                    <span key={mention} className="story-viewer-mention">@{mention}</span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Mood */}
          {currentStory.mood && (
            <div className="story-viewer-mood">{currentStory.mood}</div>
          )}

          {/* Indicateur de pause */}
          {isPaused && (
            <div className="story-viewer-pause">
              <i className="fas fa-pause-circle" />
            </div>
          )}
        </div>

        {/* ============================================================
            FOOTER
        ============================================================ */}
        <div className="story-viewer-footer">
          {/* Réactions */}
          {renderReactions()}

          {/* Position */}
          <div className="story-viewer-position">
            {currentIndex + 1} / {totalStories}
          </div>

          {/* Input de réponse */}
          {currentStory.allowReplies && (
            <div className="story-viewer-input">
              <input
                type="text"
                placeholder="Répondre..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyPress={handleReplyKeyPress}
              />
              <button
                className="story-viewer-send"
                onClick={handleReply}
                disabled={!replyText.trim()}
              >
                <i className="fas fa-paper-plane" />
              </button>
            </div>
          )}

          {/* Réponses */}
          {renderReplies()}
        </div>

        {/* ============================================================
            REACTION PICKER
        ============================================================ */}
        {renderReactionPicker()}

        {/* ============================================================
            VIEWERS PANEL (si ouvert)
        ============================================================ */}
        {showViewers && (
          <div className="viewers-slide-up open">
            <div className="viewers-slide-handle" onClick={() => setShowViewers(false)} />
            <div className="viewers-slide-header">
              <h3>
                <i className="fas fa-eye" />
                Vues ({currentStory.views})
              </h3>
              <button onClick={() => setShowViewers(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="viewers-list">
              {Array.from({ length: Math.min(currentStory.views, 20) }).map((_, i) => (
                <div key={i} className="viewer-item">
                  <div className="viewer-avatar">
                    <img src={`https://i.pravatar.cc/150?img=${i + 20}`} alt="Viewer" />
                  </div>
                  <div className="viewer-name">Fan_{i + 1}</div>
                  <div className="viewer-time">Il y a {i + 1}m</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoryViewer;