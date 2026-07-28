// ========== src/pages/CreatePostPage.tsx ==========
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { uploadPostImages } from '../services/uploadService';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import '../styles/CreatePostPage.css';

// ============================================================
// CATEGORIES
// ============================================================
export const POST_CATEGORIES = [
  { id: 'general', label: 'General', icon: 'fa-home', color: '#7A7A9A' },
  { id: 'artists', label: 'Artists', icon: 'fa-microphone', color: '#C084FC' },
  { id: 'groups', label: 'Groups', icon: 'fa-users', color: '#4A90D9' },
  { id: 'events', label: 'Events', icon: 'fa-calendar-alt', color: '#FF6B6B' },
];

// ============================================================
// MOODS
// ============================================================
const MOODS = [
  { emoji: '😊', label: 'Happy', group: 'Popular' },
  { emoji: '❤️', label: 'Love', group: 'Popular' },
  { emoji: '🔥', label: 'Fire', group: 'Popular' },
  { emoji: '💜', label: 'K-Pop', group: 'Popular' },
  { emoji: '✨', label: 'Magic', group: 'Popular' },
  { emoji: '🎵', label: 'Music', group: 'Popular' },
  { emoji: '😂', label: 'Funny', group: 'Recent' },
  { emoji: '🥰', label: 'Adore', group: 'Recent' },
  { emoji: '🤗', label: 'Hug', group: 'Recent' },
  { emoji: '😎', label: 'Cool', group: 'Recent' },
  { emoji: '🤩', label: 'Starstruck', group: 'Recent' },
  { emoji: '🎉', label: 'Celebrate', group: 'Favorites' },
  { emoji: '💪', label: 'Strong', group: 'Favorites' },
  { emoji: '🥺', label: 'Touched', group: 'Favorites' },
  { emoji: '😍', label: 'Ravi', group: 'Favorites' },
];

const MOOD_GROUPS = ['Popular', 'Recent', 'Favorites', 'All'];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth(); // ✅ Mampiasa ny user tena izy
  
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [images, setImages] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [audience, setAudience] = useState<'public' | 'friends' | 'followers' | 'private'>('public');
  const [isLoading, setIsLoading] = useState(false);
  const [showAudienceDropdown, setShowAudienceDropdown] = useState(false);
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('general');
  const [showMoodPicker, setShowMoodPicker] = useState(false);
  const [moodSearch, setMoodSearch] = useState('');
  const [selectedMoodGroup, setSelectedMoodGroup] = useState('Popular');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const moodPickerRef = useRef<HTMLDivElement>(null);
  const moodToggleRef = useRef<HTMLButtonElement>(null);

  const audienceOptions = [
    { id: 'public', label: 'Public', icon: 'fa-globe' },
    { id: 'friends', label: 'Friends', icon: 'fa-user-friends' },
    { id: 'followers', label: 'Followers', icon: 'fa-users' },
    { id: 'private', label: 'Only Me', icon: 'fa-lock' },
  ];

  const filteredMoods = useMemo(() => {
    let result = MOODS;
    if (moodSearch.trim()) {
      const search = moodSearch.toLowerCase().trim();
      result = result.filter(m => 
        m.label.toLowerCase().includes(search) || 
        m.emoji.includes(search)
      );
    } else if (selectedMoodGroup !== 'All') {
      result = result.filter(m => m.group === selectedMoodGroup);
    }
    return result;
  }, [moodSearch, selectedMoodGroup]);

  // ============================================================
  // CLICK OUTSIDE TO CLOSE MOOD PICKER
  // ============================================================
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        moodPickerRef.current && 
        !moodPickerRef.current.contains(e.target as Node) &&
        moodToggleRef.current &&
        !moodToggleRef.current.contains(e.target as Node)
      ) {
        setShowMoodPicker(false);
        setMoodSearch('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const fileArray = Array.from(files);
      setImageFiles(prev => [...prev, ...fileArray]);
      
      fileArray.forEach(file => {
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target?.result) {
            setImages(prev => [...prev, event.target?.result as string]);
          }
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const closeMoodPicker = () => {
    setShowMoodPicker(false);
    setMoodSearch('');
  };

  const toggleMoodPicker = () => {
    setShowMoodPicker(!showMoodPicker);
    if (!showMoodPicker) {
      setMoodSearch('');
    }
  };

  const handleMoodSelect = (mood: { emoji: string; label: string }) => {
    setSelectedMood(selectedMood === mood.emoji ? null : mood.emoji);
    setShowMoodPicker(false);
    setMoodSearch('');
  };

  // ============================================================
  // SUBMIT - MIARAKA AMIN'NY USER TENA IZY
  // ============================================================
  const handleSubmit = async () => {
    if (!content.trim() && images.length === 0) {
      alert('⚠️ Veuillez ajouter du contenu ou une image');
      return;
    }

    setIsLoading(true);

    try {
      // ✅ Upload des images vers le serveur
      let uploadedImages: string[] = [];
      if (imageFiles.length > 0) {
        console.log('📤 Upload de ' + imageFiles.length + ' images...');
        uploadedImages = await uploadPostImages(imageFiles);
        console.log('✅ Images uploadées:', uploadedImages);
      }

      // ✅ Mampiasa ny user tena izy avy amin'ny Firebase
      const displayName = user?.displayName || user?.name || 'K-Pop Fan';
      const avatarUrl = user?.photoURL || user?.avatar || 'https://i.pravatar.cc/150?img=16';
      const username = user?.username || displayName.toLowerCase().replace(/\s/g, '_');
      const userId = user?.id || 'anonymous';

      // ✅ Mamorona ny post data
      const postData = {
        author: {
          id: userId,
          name: displayName,
          username: username,
          avatar: avatarUrl,
          group: 'K-POP UNITED',
          verified: user?.isVerified || false,
        },
        content: content.trim(),
        title: title.trim() || undefined,
        images: uploadedImages.length > 0 ? uploadedImages : undefined,
        tags: [],
        mentions: [],
        category: selectedCategory,
        mood: selectedMood,
        privacy: audience,
        timestamp: serverTimestamp(),
        likes: 0,
        comments: 0,
        shares: 0,
        liked: false,
        saved: false,
        reaction: null,
        isEdited: false,
        isPinned: false,
        isArchived: false,
        commentsDisabled: false,
      };

      // ✅ Sauvegarder dans Firestore
      const docRef = await addDoc(collection(firestore, 'posts'), postData);
      console.log('✅ Post créé avec succès:', docRef.id);
      
      navigate('/', { state: { newPost: { id: docRef.id, ...postData }, scrollToTop: true } });
    } catch (error) {
      console.error('❌ Erreur création post:', error);
      alert('Erreur lors de la création du post. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const getAudienceIcon = (id: string) => {
    const option = audienceOptions.find(a => a.id === id);
    return option ? option.icon : 'fa-globe';
  };

  const getAudienceLabel = (id: string) => {
    const option = audienceOptions.find(a => a.id === id);
    return option ? option.label : 'Public';
  };

  // ============================================================
  // RENDU - Mampiasa ny user tena izy
  // ============================================================
  const displayName = user?.displayName || user?.name || 'K-Pop Fan';
  const avatarUrl = user?.photoURL || user?.avatar || 'https://i.pravatar.cc/150?img=16';
  const hasAvatar = avatarUrl && !avatarUrl.startsWith('https://i.pravatar.cc');

  return (
    <div className="create-post-page">
      <div className="create-post-page-container">
        
        {/* HEADER */}
        <div className="create-post-page-header">
          <div className="create-post-page-title">
            <i className="fas fa-pen-fancy" style={{ color: '#C084FC' }} />
            <span>Create Post</span>
          </div>
          <button className="create-post-page-back" onClick={() => navigate(-1)}>
            <i className="fas fa-times" />
          </button>
        </div>

        {/* BODY */}
        <div className="create-post-page-body">
          
          {/* ✅ User Info - Mampiasa ny user tena izy */}
          <div className="create-post-user">
            <div className="create-post-user-avatar">
              {hasAvatar ? (
                <img 
                  src={avatarUrl} 
                  alt={displayName}
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'https://i.pravatar.cc/150?img=16';
                  }}
                />
              ) : (
                <div className="avatar-placeholder-small">
                  <i className="fas fa-user" />
                </div>
              )}
            </div>
            <div className="create-post-user-info">
              <div className="create-post-username">
                {displayName}
                {user?.isVerified && (
                  <span className="create-post-verified">
                    <i className="fas fa-check-circle" />
                  </span>
                )}
              </div>
              <div className="create-post-audience-wrapper">
                <button
                  className="create-post-audience-btn"
                  onClick={() => setShowAudienceDropdown(!showAudienceDropdown)}
                >
                  <i className={`fas ${getAudienceIcon(audience)}`} />
                  <span>{getAudienceLabel(audience)}</span>
                  <i className="fas fa-chevron-down" />
                </button>
                {showAudienceDropdown && (
                  <div className="create-post-audience-dropdown">
                    {audienceOptions.map(option => (
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
          </div>

          {/* Title */}
          <div className="create-post-title-input">
            <input
              type="text"
              placeholder="Post title (optional)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="create-post-title-field"
            />
          </div>

          {/* Content */}
          <div className="create-post-content-wrapper">
            <textarea
              ref={textareaRef}
              className="create-post-content-textarea"
              placeholder="What's happening in K-Pop? Share your thoughts..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              autoFocus
            />
          </div>

          {/* Selected Mood Display */}
          {selectedMood && (
            <div className="create-post-mood-display">
              <span className="mood-emoji-display">{selectedMood}</span>
              <span className="mood-label-display">
                {MOODS.find(m => m.emoji === selectedMood)?.label || 'Mood'}
              </span>
              <button onClick={() => setSelectedMood(null)}>
                <i className="fas fa-times" />
              </button>
            </div>
          )}

          {/* Mood Picker Section */}
          <div className="mood-picker-section">
            <button 
              ref={moodToggleRef}
              className="mood-picker-toggle" 
              onClick={toggleMoodPicker}
            >
              <i className={`fas ${showMoodPicker ? 'fa-chevron-up' : 'fa-chevron-down'}`} />
              {selectedMood ? 'Change Mood' : 'Add Mood'}
              {selectedMood && <span className="mood-picker-selected">{selectedMood}</span>}
            </button>

            {showMoodPicker && (
              <div className="mood-picker-container" ref={moodPickerRef}>
                <div className="mood-picker-header">
                  <span>Choose your mood</span>
                  <button 
                    className="mood-picker-close-btn" 
                    onClick={closeMoodPicker}
                    aria-label="Close mood picker"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>

                <div className="mood-picker-search">
                  <i className="fas fa-search" />
                  <input
                    type="text"
                    placeholder="Search moods..."
                    value={moodSearch}
                    onChange={(e) => setMoodSearch(e.target.value)}
                  />
                  {moodSearch && (
                    <button onClick={() => setMoodSearch('')}>
                      <i className="fas fa-times-circle" />
                    </button>
                  )}
                </div>

                <div className="mood-picker-groups">
                  {MOOD_GROUPS.map(group => (
                    <button
                      key={group}
                      className={`mood-group-btn ${selectedMoodGroup === group ? 'active' : ''}`}
                      onClick={() => setSelectedMoodGroup(group)}
                    >
                      {group}
                    </button>
                  ))}
                </div>

                <div className="mood-picker-grid">
                  {filteredMoods.length > 0 ? (
                    filteredMoods.map(mood => (
                      <button
                        key={mood.label}
                        className={`mood-option-premium ${selectedMood === mood.emoji ? 'active' : ''}`}
                        onClick={() => handleMoodSelect(mood)}
                      >
                        <span className="mood-emoji-premium">{mood.emoji}</span>
                        <span className="mood-label-premium">{mood.label}</span>
                        {selectedMood === mood.emoji && (
                          <span className="mood-check-premium">
                            <i className="fas fa-check-circle" />
                          </span>
                        )}
                      </button>
                    ))
                  ) : (
                    <div className="mood-picker-empty">
                      <i className="fas fa-search" />
                      <span>No moods found</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Category Selector */}
          <div className="create-post-category-section">
            <label className="create-post-category-label">
              <i className="fas fa-tag" /> Category
            </label>
            <div className="create-post-category-grid">
              {POST_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  className={`category-option-premium ${selectedCategory === cat.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  <span className="category-icon-premium" style={{ background: cat.color }}>
                    <i className={`fas ${cat.icon}`} />
                  </span>
                  <span className="category-label-premium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Images */}
          {images.length > 0 && (
            <div className="create-post-images">
              {images.map((img, index) => (
                <div key={index} className="create-post-image-preview">
                  <img src={img} alt={`Preview ${index}`} />
                  <button onClick={() => removeImage(index)}>
                    <i className="fas fa-times" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Quick Actions */}
          <div className="create-post-quick-actions">
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              multiple
              style={{ display: 'none' }}
              onChange={handleImageUpload}
            />
            <button className="quick-action-premium" onClick={() => fileInputRef.current?.click()}>
              <i className="fas fa-image" style={{ color: '#EC4899' }} />
              <span>Photo</span>
            </button>
            <button 
              className="quick-action-premium" 
              onClick={toggleMoodPicker}
            >
              <i className="fas fa-smile" style={{ color: '#FFD700' }} />
              <span>Mood</span>
            </button>
          </div>

          {/* Post Preview */}
          {content.trim() && (
            <div className="create-post-preview">
              <div className="create-post-preview-header">
                <span><i className="fas fa-eye" /> Preview</span>
              </div>
              <div className="create-post-preview-content">
                {selectedMood && <span className="preview-mood">{selectedMood}</span>}
                <p>{content}</p>
                {images.length > 0 && (
                  <div className="preview-images">
                    {images.map((img, i) => (
                      <img key={i} src={img} alt={`preview-${i}`} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>

        {/* FOOTER */}
        <div className="create-post-page-footer">
          <div className="create-post-footer-info">
            <span className="footer-char-count">{content.length} characters</span>
            {selectedCategory && (
              <span className="footer-category">
                <i className="fas fa-tag" /> {POST_CATEGORIES.find(c => c.id === selectedCategory)?.label}
              </span>
            )}
          </div>
          <div className="create-post-footer-actions">
            <button className="create-post-discard-btn" onClick={() => navigate(-1)}>
              <i className="fas fa-trash" /> Discard
            </button>
            <button
              className={`create-post-submit-btn ${(content.trim() || images.length > 0) ? 'active' : ''}`}
              onClick={handleSubmit}
              disabled={!content.trim() && images.length === 0 || isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Uploading...
                </>
              ) : (
                <>
                  <span>Post</span>
                  <i className="fas fa-arrow-right" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .avatar-placeholder-small {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(192, 132, 252, 0.15), rgba(236, 72, 153, 0.08));
          color: rgba(255, 255, 255, 0.3);
          font-size: 16px;
        }
        .create-post-user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(192, 132, 252, 0.08);
          background: rgba(255, 255, 255, 0.02);
        }
        .create-post-user-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .create-post-username {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .create-post-verified {
          color: var(--kpop-violet);
          font-size: 12px;
        }
        body.light-mode .create-post-username {
          color: var(--text-primary);
        }
        body.light-mode .avatar-placeholder-small {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.05));
          color: rgba(0, 0, 0, 0.15);
        }
        body.light-mode .create-post-user-avatar {
          border-color: rgba(0, 0, 0, 0.06);
          background: rgba(0, 0, 0, 0.02);
        }
      `}</style>
    </div>
  );
};

export default CreatePostPage;