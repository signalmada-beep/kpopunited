// ========== src/components/StoryCreator.tsx ==========
import React, { useState, useRef, useEffect, useCallback } from 'react';
import '../styles/StoryCreator.css';

// ============================================================
// TYPES
// ============================================================
interface StoryCreatorProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateStory: (story: any) => void;
  currentUser?: { id: string; name: string; username: string; avatar: string };
}

interface UserSuggestion {
  id: string;
  name: string;
  username: string;
  avatar: string;
  relation: 'friends' | 'followers' | 'following';
}

// ============================================================
// 🎨 CONSTANTES - COULEURS, POLICES, ETC.
// ============================================================

// Couleurs du texte
const TEXT_COLORS = [
  { name: 'Blanc', value: '#FFFFFF' },
  { name: 'Noir', value: '#000000' },
  { name: 'Violet K-POP', value: '#C084FC' },
  { name: 'Rose', value: '#EC4899' },
  { name: 'Rouge', value: '#FF6B6B' },
  { name: 'Or', value: '#FFD700' },
  { name: 'Bleu', value: '#4A90D9' },
  { name: 'Vert', value: '#00B894' },
  { name: 'Orange', value: '#FF9F43' },
  { name: 'Cyan', value: '#00D2D3' },
  { name: 'Gris', value: '#7A7A9A' },
  { name: 'Rose Bonbon', value: '#FF69B4' },
];

// Couleurs de fond pour les text stories
const BACKGROUND_COLORS = [
  { name: 'Noir', value: '#0A0A0F' },
  { name: 'Violet', value: '#2D1B69' },
  { name: 'Rose', value: '#4A1942' },
  { name: 'Bleu Nuit', value: '#0C1445' },
  { name: 'Vert Forêt', value: '#0D3B2E' },
  { name: 'Rouge', value: '#4A0E0E' },
  { name: 'Orange', value: '#3D1F00' },
  { name: 'Gris', value: '#1A1A2E' },
  { name: 'Bleu Ciel', value: '#0A2E4A' },
  { name: 'Blanc', value: '#F0F0F5' },
];

// Polices disponibles
const FONTS = [
  { name: 'Par défaut', value: "'Inter', sans-serif" },
  { name: 'Serif', value: "'Georgia', serif" },
  { name: 'Monospace', value: "'Courier New', monospace" },
  { name: 'Cursive', value: "'Brush Script MT', cursive" },
  { name: 'Gras', value: "'Arial Black', sans-serif" },
  { name: 'Élégant', value: "'Playfair Display', serif" },
  { name: 'Moderne', value: "'Poppins', sans-serif" },
  { name: 'Manuscrit', value: "'Dancing Script', cursive" },
];

// Alignements
const ALIGNMENTS = [
  { name: 'Gauche', value: 'left', icon: 'fa-align-left' },
  { name: 'Centre', value: 'center', icon: 'fa-align-center' },
  { name: 'Droite', value: 'right', icon: 'fa-align-right' },
];

// MOODS
const MOODS = [
  { emoji: '😊', label: 'Happy' },
  { emoji: '❤️', label: 'Love' },
  { emoji: '🔥', label: 'Fire' },
  { emoji: '💜', label: 'K-Pop' },
  { emoji: '✨', label: 'Magic' },
  { emoji: '🎵', label: 'Music' },
  { emoji: '😂', label: 'Funny' },
  { emoji: '🥰', label: 'Adore' },
  { emoji: '🤗', label: 'Hug' },
  { emoji: '😎', label: 'Cool' },
  { emoji: '🤩', label: 'Starstruck' },
  { emoji: '🎉', label: 'Celebrate' },
];

const AUDIENCE_OPTIONS = [
  { id: 'public', label: 'Public', icon: 'fa-globe' },
  { id: 'followers', label: 'Followers', icon: 'fa-users' },
  { id: 'friends', label: 'Friends', icon: 'fa-user-friends' },
  { id: 'close_friends', label: 'Close Friends', icon: 'fa-star' },
  { id: 'private', label: 'Only Me', icon: 'fa-lock' },
];

const POPULAR_HASHTAGS = [
  '#BTS', '#BLACKPINK', '#TWICE', '#NewJeans', '#StrayKids',
  '#TXT', '#ENHYPEN', '#SEVENTEEN', '#NCT', '#aespa',
  '#ITZY', '#IVE', '#LE_SSERAFIM', '#KPop', '#KPOPUNITED',
];

const MOCK_USERS: UserSuggestion[] = [
  { id: '1', name: 'ARMY_Leader', username: 'army_leader', avatar: 'https://i.pravatar.cc/150?img=21', relation: 'friends' },
  { id: '2', name: 'BLINK_Captain', username: 'blink_captain', avatar: 'https://i.pravatar.cc/150?img=22', relation: 'followers' },
  { id: '3', name: 'TWICE_Artist', username: 'twice_artist', avatar: 'https://i.pravatar.cc/150?img=23', relation: 'friends' },
  { id: '4', name: 'MOA_Helper', username: 'moa_helper', avatar: 'https://i.pravatar.cc/150?img=24', relation: 'following' },
  { id: '5', name: 'STAY_Forever', username: 'stay_forever', avatar: 'https://i.pravatar.cc/150?img=27', relation: 'followers' },
  { id: '6', name: 'NewJeans Fan', username: 'newjeans_fan', avatar: 'https://i.pravatar.cc/150?img=13', relation: 'friends' },
  { id: '7', name: 'BTS ARMY', username: 'bts_army', avatar: 'https://i.pravatar.cc/150?img=25', relation: 'following' },
  { id: '8', name: 'Seventeen_Carat', username: 'seventeen_carat', avatar: 'https://i.pravatar.cc/150?img=26', relation: 'followers' },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const StoryCreator: React.FC<StoryCreatorProps> = ({
  isOpen,
  onClose,
  onCreateStory,
  currentUser = { id: 'me', name: 'K-Pop Fan', username: 'kpopfan', avatar: 'https://i.pravatar.cc/150?img=16' },
}) => {
  // ============================================================
  // ÉTATS PRINCIPAUX
  // ============================================================
  const [storyType, setStoryType] = useState<'photo' | 'text'>('photo');
  const [image, setImage] = useState<string | null>(null);
  const [content, setContent] = useState('');
  const [audience, setAudience] = useState<'public' | 'followers' | 'friends' | 'close_friends' | 'private'>('public');
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // ============================================================
  // HASHTAGS
  // ============================================================
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [hashtagInput, setHashtagInput] = useState('');
  const [hashtagSuggestions, setHashtagSuggestions] = useState<string[]>([]);
  const [showHashtagSuggestions, setShowHashtagSuggestions] = useState(false);

  // ============================================================
  // MENTIONS
  // ============================================================
  const [mentions, setMentions] = useState<string[]>([]);
  const [mentionInput, setMentionInput] = useState('');
  const [mentionSuggestions, setMentionSuggestions] = useState<UserSuggestion[]>([]);
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);

  // ============================================================
  // 🎨 ÉDITION DU TEXTE - DRAG & DROP + STYLES
  // ============================================================
  const [textPosition, setTextPosition] = useState({ x: 50, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isTextSelected, setIsTextSelected] = useState(false);
  const [showTextControls, setShowTextControls] = useState(true);

  // Styles du texte
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [textScale, setTextScale] = useState(1);
  const [textAlignment, setTextAlignment] = useState<'left' | 'center' | 'right'>('center');
  const [textBackground, setTextBackground] = useState('transparent');
  const [textRotation, setTextRotation] = useState(0);
  const [textFont, setTextFont] = useState("'Inter', sans-serif");
  const [storyBackgroundColor, setStoryBackgroundColor] = useState('#0A0A0F');

  // ============================================================
  // RÉFÉRENCES
  // ============================================================
  const fileInputRef = useRef<HTMLInputElement>(null);
  const moodPickerRef = useRef<HTMLDivElement>(null);
  const hashtagContainerRef = useRef<HTMLDivElement>(null);
  const mentionContainerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const textControlsRef = useRef<HTMLDivElement>(null);
  const hashtagInputRef = useRef<HTMLInputElement>(null);
  const mentionInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // EFFETS
  // ============================================================
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTextPosition({ x: 50, y: 50 });
      setTextScale(1);
      setTextColor('#FFFFFF');
      setTextAlignment('center');
      setTextBackground('transparent');
      setTextRotation(0);
      setTextFont("'Inter', sans-serif");
      setStoryBackgroundColor('#0A0A0F');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      
      if (moodPickerRef.current && !moodPickerRef.current.contains(target)) {
        setShowMoodPicker(false);
      }
      if (hashtagContainerRef.current && !hashtagContainerRef.current.contains(target)) {
        setShowHashtagSuggestions(false);
      }
      if (mentionContainerRef.current && !mentionContainerRef.current.contains(target)) {
        setShowMentionSuggestions(false);
      }
      if (textRef.current && !textRef.current.contains(target) && 
          textControlsRef.current && !textControlsRef.current.contains(target)) {
        setIsTextSelected(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (hashtagInput.trim()) {
      const query = hashtagInput.trim().toLowerCase();
      const filtered = POPULAR_HASHTAGS
        .filter(tag => tag.toLowerCase().includes(query))
        .filter(tag => !hashtags.includes(tag))
        .slice(0, 10);
      setHashtagSuggestions(filtered);
      setShowHashtagSuggestions(filtered.length > 0);
    } else {
      setHashtagSuggestions([]);
      setShowHashtagSuggestions(false);
    }
  }, [hashtagInput, hashtags]);

  useEffect(() => {
    if (mentionInput.trim()) {
      const query = mentionInput.trim().toLowerCase();
      const filtered = MOCK_USERS
        .filter(user => 
          user.name.toLowerCase().includes(query) || 
          user.username.toLowerCase().includes(query)
        )
        .filter(user => !mentions.includes(user.username))
        .slice(0, 10);
      setMentionSuggestions(filtered);
      setShowMentionSuggestions(filtered.length > 0);
    } else {
      setMentionSuggestions([]);
      setShowMentionSuggestions(false);
    }
  }, [mentionInput, mentions]);

  // ============================================================
  // 🎨 DRAG & DROP
  // ============================================================
  const handleDragStart = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!content || storyType === 'photo') return;
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragging(true);
    setIsTextSelected(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    
    setDragOffset({
      x: clientX - rect.left,
      y: clientY - rect.top,
    });
  }, [content, storyType]);

  const handleDragMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !containerRef.current || storyType === 'photo') return;
    e.preventDefault();
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const containerRect = containerRef.current.getBoundingClientRect();
    
    let x = ((clientX - dragOffset.x - containerRect.left) / containerRect.width) * 100;
    let y = ((clientY - dragOffset.y - containerRect.top) / containerRect.height) * 100;
    
    x = Math.max(5, Math.min(95, x));
    y = Math.max(5, Math.min(95, y));
    
    setTextPosition({ x, y });
  }, [isDragging, dragOffset, storyType]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // ============================================================
  // 🎨 CONTROLES DU TEXTE
  // ============================================================
  const handleTextColorChange = (color: string) => setTextColor(color);
  const handleTextScaleChange = (delta: number) => {
    setTextScale(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };
  const handleTextAlignmentChange = (alignment: 'left' | 'center' | 'right') => {
    setTextAlignment(alignment);
  };
  const handleTextRotationChange = (rotation: number) => {
    setTextRotation(rotation);
  };
  const handleTextFontChange = (font: string) => setTextFont(font);
  const handleTextBackgroundChange = (color: string) => setTextBackground(color);
  const handleStoryBackgroundChange = (color: string) => setStoryBackgroundColor(color);
  const handleTextReset = () => {
    setTextPosition({ x: 50, y: 50 });
    setTextScale(1);
    setTextColor('#FFFFFF');
    setTextAlignment('center');
    setTextBackground('transparent');
    setTextRotation(0);
    setTextFont("'Inter', sans-serif");
    setStoryBackgroundColor('#0A0A0F');
  };

  // ============================================================
  // HANDLERS - IMAGE
  // ============================================================
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      setImageError('Image trop lourde (max 10MB)');
      return;
    }
    if (!file.type.startsWith('image/')) {
      setImageError('Format non supporté');
      return;
    }
    
    setImageError(null);
    const reader = new FileReader();
    reader.onload = (event) => {
      setImage(event.target?.result as string);
      setStoryType('photo');
      setTextPosition({ x: 50, y: 50 });
    };
    reader.readAsDataURL(file);
  }, []);

  const handleStoryTypeChange = (type: 'photo' | 'text') => {
    setStoryType(type);
    if (type === 'text') {
      setImage(null);
      setImageError(null);
    }
  };

  // ============================================================
  // HANDLERS - HASHTAGS
  // ============================================================
  const handleAddHashtag = useCallback((tag: string) => {
    if (hashtags.length >= 10) {
      alert('⚠️ Maximum 10 hashtags allowed');
      return;
    }
    if (!hashtags.includes(tag)) {
      setHashtags([...hashtags, tag]);
      setHashtagInput('');
      setShowHashtagSuggestions(false);
      setTimeout(() => hashtagInputRef.current?.focus(), 100);
    }
  }, [hashtags]);

  const handleRemoveHashtag = useCallback((tag: string) => {
    setHashtags(hashtags.filter(t => t !== tag));
  }, [hashtags]);

  const handleHashtagKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (hashtagSuggestions.length > 0) {
        handleAddHashtag(hashtagSuggestions[0]);
      } else if (hashtagInput.trim()) {
        const newTag = hashtagInput.trim().startsWith('#') ? hashtagInput.trim() : `#${hashtagInput.trim()}`;
        handleAddHashtag(newTag);
      }
    }
  }, [hashtagSuggestions, hashtagInput, handleAddHashtag]);

  // ============================================================
  // HANDLERS - MENTIONS
  // ============================================================
  const handleAddMention = useCallback((user: UserSuggestion) => {
    if (mentions.length >= 10) {
      alert('⚠️ Maximum 10 mentions allowed');
      return;
    }
    if (!mentions.includes(user.username)) {
      setMentions([...mentions, user.username]);
      setMentionInput('');
      setShowMentionSuggestions(false);
      setTimeout(() => mentionInputRef.current?.focus(), 100);
    }
  }, [mentions]);

  const handleRemoveMention = useCallback((username: string) => {
    setMentions(mentions.filter(m => m !== username));
  }, [mentions]);

  const handleMentionKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (mentionSuggestions.length > 0) {
        handleAddMention(mentionSuggestions[0]);
      }
    }
  }, [mentionSuggestions, handleAddMention]);

  // ============================================================
  // HANDLERS - SUBMIT
  // ============================================================
  const handleSubmit = useCallback(() => {
    if (storyType === 'photo' && !image) {
      alert('⚠️ Please upload an image for your story');
      return;
    }
    if (!content.trim()) {
      alert('⚠️ Please add text to your story');
      return;
    }

    setIsLoading(true);
    const storyData = {
      type: storyType,
      image: storyType === 'photo' ? image : undefined,
      content: content.trim(),
      mood: selectedMood || undefined,
      hashtags: hashtags.length > 0 ? hashtags : undefined,
      mentions: mentions.length > 0 ? mentions : undefined,
      audience,
      author: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      group: 'K-POP UNITED',
      // 🎨 Styles du texte
      textPosition,
      textScale,
      textColor,
      textAlignment,
      textBackground,
      textRotation,
      textFont,
      backgroundColor: storyType === 'text' ? storyBackgroundColor : undefined,
      isTextStory: storyType === 'text',
    };

    setTimeout(() => {
      onCreateStory(storyData);
      setIsLoading(false);
      resetForm();
      onClose();
    }, 800);
  }, [
    storyType, image, content, selectedMood, hashtags, mentions, audience,
    currentUser, textPosition, textScale, textColor, textAlignment,
    textBackground, textRotation, textFont, storyBackgroundColor,
    onCreateStory, onClose
  ]);

  const resetForm = useCallback(() => {
    setImage(null);
    setContent('');
    setStoryType('photo');
    setAudience('public');
    setSelectedMood(null);
    setHashtags([]);
    setHashtagInput('');
    setMentions([]);
    setMentionInput('');
    setImageError(null);
    setShowHashtagSuggestions(false);
    setShowMentionSuggestions(false);
    setTextPosition({ x: 50, y: 50 });
    setTextScale(1);
    setTextColor('#FFFFFF');
    setTextAlignment('center');
    setTextBackground('transparent');
    setTextRotation(0);
    setTextFont("'Inter', sans-serif");
    setStoryBackgroundColor('#0A0A0F');
    setIsTextSelected(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const handleClose = useCallback(() => {
    if (image || content || hashtags.length > 0 || mentions.length > 0) {
      if (!confirm('Êtes-vous sûr de vouloir supprimer cette story ?')) return;
    }
    resetForm();
    onClose();
  }, [image, content, hashtags, mentions, resetForm, onClose]);

  // ============================================================
  // UTILITAIRES
  // ============================================================
  const getAudienceIcon = (id: string) => {
    const option = AUDIENCE_OPTIONS.find(a => a.id === id);
    return option ? option.icon : 'fa-globe';
  };

  const getAudienceLabel = (id: string) => {
    const option = AUDIENCE_OPTIONS.find(a => a.id === id);
    return option ? option.label : 'Public';
  };

  const getRelationColor = (relation: string) => {
    switch (relation) {
      case 'friends': return '#4CAF50';
      case 'followers': return '#4A90D9';
      case 'following': return '#FF6B6B';
      default: return '#7A7A9A';
    }
  };

  const getRelationLabel = (relation: string) => {
    switch (relation) {
      case 'friends': return 'Amis';
      case 'followers': return 'Followers';
      case 'following': return 'Following';
      default: return '';
    }
  };

  // ============================================================
  // 🎨 RENDU DE L'APERÇU AVEC TOUS LES STYLES
  // ============================================================
  const renderPreview = () => {
    if (storyType === 'photo' && !image) return null;
    if (storyType === 'text' && !content) return null;
    
    const isTextStory = storyType === 'text';

    return (
      <div className="story-preview-premium">
        <div className="story-preview-header">
          <span><i className="fas fa-eye" /> Aperçu</span>
          <div className="story-preview-controls">
            <button 
              className="preview-btn"
              onClick={handleTextReset}
              title="Réinitialiser"
            >
              <i className="fas fa-undo" />
            </button>
          </div>
        </div>

        <div 
          className="story-preview-container" 
          ref={containerRef}
          style={isTextStory ? { background: storyBackgroundColor } : {}}
        >
          {isTextStory ? (
            // 📝 STORY TEXTE
            <div 
              className="story-preview-text-content"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '100%',
                height: '100%',
                padding: '20px',
                boxSizing: 'border-box',
              }}
            >
              <div
                ref={textRef}
                className={`story-text-draggable ${isTextSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
                style={{
                  position: 'relative',
                  fontSize: `${20 * textScale}px`,
                  color: textColor,
                  textAlign: textAlignment,
                  transform: `rotate(${textRotation}deg)`,
                  fontFamily: textFont,
                  background: textBackground !== 'transparent' ? textBackground : 'transparent',
                  padding: textBackground !== 'transparent' ? '16px 24px' : '0',
                  borderRadius: '12px',
                  maxWidth: '90%',
                  wordBreak: 'break-word',
                  backdropFilter: textBackground !== 'transparent' ? 'blur(4px)' : 'none',
                  boxShadow: textBackground !== 'transparent' ? '0 8px 32px rgba(0,0,0,0.3)' : 'none',
                  cursor: isDragging ? 'grabbing' : 'grab',
                  border: isTextSelected ? '2px solid rgba(192, 132, 252, 0.5)' : '2px solid transparent',
                  transition: isDragging ? 'none' : 'all 0.2s ease',
                }}
                onMouseDown={handleDragStart}
                onMouseMove={handleDragMove}
                onMouseUp={handleDragEnd}
                onMouseLeave={handleDragEnd}
                onTouchStart={handleDragStart}
                onTouchMove={handleDragMove}
                onTouchEnd={handleDragEnd}
                onClick={(e) => {
                  e.stopPropagation();
                  setIsTextSelected(true);
                }}
              >
                {content || '👆 Tapez votre texte'}
                {isTextSelected && (
                  <div className="text-selection-handle">
                    <i className="fas fa-arrows-alt" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            // 📸 STORY PHOTO
            <>
              <img src={image!} alt="Aperçu" />
              {content && (
                <div
                  className="story-text-overlay"
                  style={{
                    position: 'absolute',
                    left: `${textPosition.x}%`,
                    top: `${textPosition.y}%`,
                    transform: `translate(-50%, -50%) scale(${textScale}) rotate(${textRotation}deg)`,
                    color: textColor,
                    textAlign: textAlignment,
                    fontFamily: textFont,
                    background: textBackground !== 'transparent' ? textBackground : 'rgba(0,0,0,0.15)',
                    padding: textBackground !== 'transparent' ? '16px 24px' : '8px 16px',
                    borderRadius: '12px',
                    backdropFilter: 'blur(4px)',
                    maxWidth: '90%',
                    maxHeight: '80%',
                    overflow: 'hidden',
                    cursor: 'pointer',
                    wordBreak: 'break-word',
                  }}
                >
                  {content}
                </div>
              )}
            </>
          )}

          {/* Badges */}
          <div className="story-preview-badges">
            {selectedMood && (
              <span className="preview-badge mood">{selectedMood}</span>
            )}
            <span className="preview-badge audience">
              <i className={`fas ${getAudienceIcon(audience)}`} />
              {getAudienceLabel(audience)}
            </span>
            {storyType === 'text' && (
              <span className="preview-badge text-story-badge">
                <i className="fas fa-font" /> Texte
              </span>
            )}
          </div>

          {/* Hashtags & Mentions */}
          {hashtags.length > 0 && (
            <div className="story-preview-hashtags">
              {hashtags.map(tag => <span key={tag}>{tag}</span>)}
            </div>
          )}
          {mentions.length > 0 && (
            <div className="story-preview-mentions">
              {mentions.map(mention => <span key={mention}>@{mention}</span>)}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ============================================================
  // 🎨 RENDU DES CONTROLES DE TEXTE
  // ============================================================
  const renderTextControls = () => {
    if (!content) return null;

    return (
      <div className="story-text-controls" ref={textControlsRef}>
        <div className="text-controls-grid">
          {/* Alignement */}
          <div className="text-control-group">
            <label>Alignement</label>
            <div className="text-control-buttons">
              {ALIGNMENTS.map(align => (
                <button
                  key={align.value}
                  className={textAlignment === align.value ? 'active' : ''}
                  onClick={() => handleTextAlignmentChange(align.value as any)}
                  title={align.name}
                >
                  <i className={`fas ${align.icon}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Taille */}
          <div className="text-control-group">
            <label>Taille</label>
            <div className="text-control-buttons">
              <button onClick={() => handleTextScaleChange(-0.2)}>
                <i className="fas fa-minus" />
              </button>
              <span className="text-scale-value">{Math.round(textScale * 100)}%</span>
              <button onClick={() => handleTextScaleChange(0.2)}>
                <i className="fas fa-plus" />
              </button>
            </div>
          </div>

          {/* Rotation */}
          <div className="text-control-group">
            <label>Rotation</label>
            <div className="text-control-buttons">
              <button onClick={() => handleTextRotationChange(textRotation - 15)}>
                <i className="fas fa-undo" />
              </button>
              <span className="text-rotation-value">{textRotation}°</span>
              <button onClick={() => handleTextRotationChange(textRotation + 15)}>
                <i className="fas fa-redo" />
              </button>
            </div>
          </div>
        </div>

        {/* Couleurs */}
        <div className="text-controls-colors">
          <div className="text-control-group">
            <label>Couleur du texte</label>
            <div className="color-picker-grid">
              {TEXT_COLORS.map(color => (
                <button
                  key={color.value}
                  className={`color-option ${textColor === color.value ? 'active' : ''}`}
                  style={{ background: color.value }}
                  onClick={() => handleTextColorChange(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          <div className="text-control-group">
            <label>Fond du texte</label>
            <div className="color-picker-grid">
              {[
                { name: 'Transparent', value: 'transparent' },
                ...BACKGROUND_COLORS
              ].map(color => (
                <button
                  key={color.value}
                  className={`color-option ${textBackground === color.value ? 'active' : ''}`}
                  style={{ 
                    background: color.value === 'transparent' 
                      ? 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'4\' height=\'4\'%3E%3Crect width=\'2\' height=\'2\' fill=\'%23ccc\'/%3E%3Crect x=\'2\' y=\'2\' width=\'2\' height=\'2\' fill=\'%23ccc\'/%3E%3C/svg%3E")' 
                      : color.value,
                    border: color.value === 'transparent' ? '1px solid #444' : 'none'
                  }}
                  onClick={() => handleTextBackgroundChange(color.value)}
                  title={color.name}
                />
              ))}
            </div>
          </div>

          {storyType === 'text' && (
            <div className="text-control-group">
              <label>Fond de la story</label>
              <div className="color-picker-grid">
                {BACKGROUND_COLORS.map(color => (
                  <button
                    key={color.value}
                    className={`color-option ${storyBackgroundColor === color.value ? 'active' : ''}`}
                    style={{ background: color.value }}
                    onClick={() => handleStoryBackgroundChange(color.value)}
                    title={color.name}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Police */}
        <div className="text-control-group">
          <label>Police</label>
          <select 
            value={textFont} 
            onChange={(e) => handleTextFontChange(e.target.value)}
          >
            {FONTS.map(font => (
              <option key={font.value} value={font.value}>
                {font.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  if (!isOpen) return null;

  return (
    <div className="story-creator-overlay" onClick={handleClose}>
      <div className="story-creator-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* HEADER */}
        <div className="story-creator-header">
          <div className="story-creator-title">
            <i className="fas fa-plus-circle" />
            <span>Créer une Story</span>
          </div>
          <button className="story-creator-close" onClick={handleClose}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* BODY */}
        <div className="story-creator-body">
          
          {/* UTILISATEUR */}
          <div className="story-creator-user">
            <div className="user-avatar">
              <img src={currentUser.avatar} alt={currentUser.name} />
            </div>
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <button
                className="audience-btn"
                onClick={() => setShowAudienceDropdown(!showAudienceDropdown)}
              >
                <i className={`fas ${getAudienceIcon(audience)}`} />
                <span>{getAudienceLabel(audience)}</span>
                <i className="fas fa-chevron-down" />
              </button>
              {showAudienceDropdown && (
                <div className="audience-dropdown">
                  {AUDIENCE_OPTIONS.map(option => (
                    <button
                      key={option.id}
                      className={`audience-option ${audience === option.id ? 'active' : ''}`}
                      onClick={() => {
                        setAudience(option.id as any);
                        setShowAudienceDropdown(false);
                      }}
                    >
                      <i className={`fas ${option.icon}`} />
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TYPE DE STORY */}
          <div className="story-type-selector">
            <button
              className={`type-btn ${storyType === 'photo' ? 'active' : ''}`}
              onClick={() => handleStoryTypeChange('photo')}
            >
              <i className="fas fa-image" /> Photo
            </button>
            <button
              className={`type-btn ${storyType === 'text' ? 'active' : ''}`}
              onClick={() => handleStoryTypeChange('text')}
            >
              <i className="fas fa-font" /> Texte
            </button>
          </div>

          {/* IMAGE (pour photo) */}
          {storyType === 'photo' && (
            <div className="story-creator-image">
              {image ? (
                <div className="image-preview">
                  <img src={image} alt="Aperçu" />
                  <button className="image-remove" onClick={() => setImage(null)}>
                    <i className="fas fa-times" />
                  </button>
                  <button className="image-change" onClick={() => fileInputRef.current?.click()}>
                    <i className="fas fa-camera" />
                  </button>
                </div>
              ) : (
                <button className="image-upload" onClick={() => fileInputRef.current?.click()}>
                  <i className="fas fa-cloud-upload-alt" />
                  <span>Ajouter une image</span>
                  <small>Cliquez ou glissez-déposez</small>
                </button>
              )}
              {imageError && <span className="image-error">{imageError}</span>}
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: 'none' }}
                onChange={handleImageUpload}
              />
            </div>
          )}

          {/* TEXTE */}
          <div className="story-creator-text">
            <textarea
              placeholder={storyType === 'text' ? "Écrivez votre story..." : "Ajoutez du texte..."}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={storyType === 'text' ? 3 : 2}
              maxLength={storyType === 'text' ? 500 : 100}
            />
            <span className="text-count">{content.length}/{storyType === 'text' ? 500 : 100}</span>
          </div>

          {/* 🎨 CONTROLES DU TEXTE */}
          {content && renderTextControls()}

          {/* MOOD */}
          <div className="story-creator-mood">
            <button
              className={`mood-btn ${selectedMood ? 'active' : ''}`}
              onClick={() => setShowMoodPicker(!showMoodPicker)}
            >
              <i className="fas fa-smile" />
              {selectedMood ? `${selectedMood} Mood` : 'Ajouter un mood'}
            </button>
            {showMoodPicker && (
              <div className="mood-picker" ref={moodPickerRef}>
                <div className="mood-picker-header">
                  <span>Choisissez votre mood</span>
                  <button onClick={() => setShowMoodPicker(false)}>
                    <i className="fas fa-times" />
                  </button>
                </div>
                <div className="mood-picker-grid">
                  {MOODS.map(mood => (
                    <button
                      key={mood.label}
                      className={`mood-option ${selectedMood === mood.emoji ? 'active' : ''}`}
                      onClick={() => {
                        setSelectedMood(selectedMood === mood.emoji ? null : mood.emoji);
                        setShowMoodPicker(false);
                      }}
                    >
                      <span className="mood-emoji">{mood.emoji}</span>
                      <span className="mood-label">{mood.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* HASHTAGS */}
          <div className="story-creator-hashtags" ref={hashtagContainerRef}>
            <div className="hashtag-input">
              <i className="fas fa-hashtag" />
              <input
                ref={hashtagInputRef}
                type="text"
                placeholder={`Hashtags... (${hashtags.length}/10)`}
                value={hashtagInput}
                onChange={(e) => setHashtagInput(e.target.value)}
                onKeyPress={handleHashtagKeyPress}
              />
              <button onClick={() => {
                if (hashtagInput.trim()) {
                  const newTag = hashtagInput.trim().startsWith('#') ? hashtagInput.trim() : `#${hashtagInput.trim()}`;
                  handleAddHashtag(newTag);
                }
              }}>
                <i className="fas fa-plus" />
              </button>
            </div>

            {showHashtagSuggestions && hashtagSuggestions.length > 0 && (
              <div className="hashtag-suggestions">
                {hashtagSuggestions.map(tag => (
                  <div key={tag} className="hashtag-suggestion" onClick={() => handleAddHashtag(tag)}>
                    <i className="fas fa-hashtag" />
                    <span>{tag}</span>
                    <span className="suggestion-badge">Populaire</span>
                  </div>
                ))}
              </div>
            )}

            {hashtags.length > 0 && (
              <div className="hashtag-list">
                {hashtags.map(tag => (
                  <span key={tag} className="hashtag-tag">
                    {tag}
                    <button onClick={() => handleRemoveHashtag(tag)}>
                      <i className="fas fa-times" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* MENTIONS */}
          <div className="story-creator-mentions" ref={mentionContainerRef}>
            <div className="mention-input">
              <i className="fas fa-at" />
              <input
                ref={mentionInputRef}
                type="text"
                placeholder={`Mentions... (${mentions.length}/10)`}
                value={mentionInput}
                onChange={(e) => setMentionInput(e.target.value)}
                onKeyPress={handleMentionKeyPress}
              />
              <button onClick={() => {
                if (mentionInput.trim() && mentionSuggestions.length > 0) {
                  handleAddMention(mentionSuggestions[0]);
                }
              }}>
                <i className="fas fa-plus" />
              </button>
            </div>

            {showMentionSuggestions && mentionSuggestions.length > 0 && (
              <div className="mention-suggestions">
                {mentionSuggestions.map(user => (
                  <div key={user.id} className="mention-suggestion" onClick={() => handleAddMention(user)}>
                    <img src={user.avatar} alt={user.name} />
                    <div>
                      <span className="mention-name">{user.name}</span>
                      <span className="mention-username">@{user.username}</span>
                    </div>
                    <span className="mention-relation" style={{ background: getRelationColor(user.relation) }}>
                      {getRelationLabel(user.relation)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {mentions.length > 0 && (
              <div className="mention-list">
                {mentions.map(username => {
                  const user = MOCK_USERS.find(u => u.username === username);
                  return (
                    <span key={username} className="mention-tag">
                      <img src={user?.avatar || 'https://i.pravatar.cc/150'} alt={username} />
                      @{username}
                      <button onClick={() => handleRemoveMention(username)}>
                        <i className="fas fa-times" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {/* COMPTEURS */}
          <div className="story-creator-counters">
            <span><i className="fas fa-hashtag" /> {hashtags.length}/10</span>
            <span><i className="fas fa-at" /> {mentions.length}/10</span>
          </div>

          {/* 🎨 PREVIEW */}
          {renderPreview()}

        </div>

        {/* FOOTER */}
        <div className="story-creator-footer">
          <button
            className={`story-submit ${(storyType === 'photo' ? image : true) && content ? 'active' : ''}`}
            onClick={handleSubmit}
            disabled={!(content && (storyType === 'photo' ? image : true)) || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Publication...
              </>
            ) : (
              <>
                <i className="fas fa-paper-plane" /> Publier
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default StoryCreator;