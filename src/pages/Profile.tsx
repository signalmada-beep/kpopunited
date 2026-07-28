// ========== src/pages/Profile.tsx ==========
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  getUserProfile, 
  getUserProfileByUsername, 
  createDefaultProfile,
  followUser, 
  unfollowUser, 
  isFollowing,
  updateUserProfile,
  type UserProfile 
} from '../services/profileService';
import { getPostsAsync, updatePost, deletePost, type PostData } from '../services/postService';
import { uploadProfilePhoto, uploadCoverPhoto } from '../services/uploadService';
import Suggestions from '../components/Suggestions';
import { getOrCreateConversation } from '../services/messageService';
import '../styles/Profile.css';

const Profile: React.FC = () => {
  const navigate = useNavigate();
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  
  // ============================================================
  // 🔥 ÉTATS
  // ============================================================
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [isFollowingUser, setIsFollowingUser] = useState(false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'posts' | 'likes' | 'media'>('posts');
  const [posts, setPosts] = useState<PostData[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingProfile, setCreatingProfile] = useState(false);
  
  // Refs ho an'ny upload
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ============================================================
  // 🔥 CHARGER LE PROFIL
  // ============================================================
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Chargement du profil...');
      console.log('📌 Username depuis URL:', username);
      console.log('👤 Utilisateur connecté:', user?.id, user?.displayName);
      console.log('👤 Username connecté:', user?.username);
      
      try {
        let profileData: UserProfile | null = null;
        
        if (username) {
          console.log('🔍 Recherche par username:', username);
          profileData = await getUserProfileByUsername(username);
          
          if (!profileData && user) {
            console.log('⚠️ Tsy hita amin\'ny username, andramina amin\'ny UID:', user.id);
            profileData = await getUserProfile(user.id);
          }
        } 
        else if (user) {
          console.log('🔍 Chargement du profil personnel:', user.id);
          profileData = await getUserProfile(user.id);
          
          if (!profileData) {
            console.log('⚠️ Tsy misy profil, mamorona vaovao...');
            setCreatingProfile(true);
            const newProfile = await createDefaultProfile({
              uid: user.id,
              displayName: user.displayName || user.name || 'K-Pop Fan',
              email: user.email || '',
              photoURL: user.photoURL || user.avatar || '',
            });
            setCreatingProfile(false);
            
            if (newProfile) {
              profileData = newProfile;
              console.log('✅ Profil créé avec succès');
            } else {
              setError('Tsy afaka namorona profil');
            }
          }
        }
        
        if (profileData) {
          console.log('✅ Profil trouvé:', profileData.displayName);
          console.log('✅ Username:', profileData.username);
          setProfile(profileData);
          setIsCurrentUser(profileData.uid === user?.id);
          
          if (profileData.uid !== user?.id && user) {
            const followStatus = await isFollowing(profileData.uid);
            setIsFollowingUser(followStatus);
          }
        } else {
          console.warn('⚠️ Aucun profil trouvé');
          setError('Utilisateur non trouvé');
        }
      } catch (error) {
        console.error('❌ Erreur chargement profil:', error);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [username, user]);

  // ============================================================
  // 🔥 CHARGER LES POSTS
  // ============================================================
  const loadUserPosts = async (uid: string) => {
    setPostsLoading(true);
    try {
      const allPosts = await getPostsAsync();
      if (Array.isArray(allPosts)) {
        const userPosts = allPosts.filter(p => p.author.id === uid);
        setPosts(userPosts);
      } else {
        console.warn('⚠️ getPostsAsync namerina tsy array:', allPosts);
        setPosts([]);
      }
    } catch (error) {
      console.error('❌ Erreur chargement posts:', error);
      setPosts([]);
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (profile?.uid) {
      loadUserPosts(profile.uid);
    }
  }, [profile?.uid]);

  // ============================================================
  // 🔥 HANDLER FOLLOW / UNFOLLOW
  // ============================================================
  const handleFollowToggle = async () => {
    if (!profile || !user || actionLoading) return;
    
    setActionLoading(true);
    try {
      if (isFollowingUser) {
        await unfollowUser(profile.uid);
        setIsFollowingUser(false);
        setProfile(prev => prev ? {
          ...prev,
          followers: prev.followers.filter(id => id !== user.id)
        } : null);
      } else {
        await followUser(profile.uid);
        setIsFollowingUser(true);
        setProfile(prev => prev ? {
          ...prev,
          followers: [...prev.followers, user.id]
        } : null);
      }
    } catch (error) {
      console.error('❌ Erreur follow:', error);
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================================
  // 🔥 HANDLER ENVOYER UN MESSAGE - VAOVAO
  // ============================================================
  const handleSendMessage = async () => {
    if (!profile || !user) return;
    
    try {
      console.log(`🔍 Envoi message à: ${profile.displayName} (${profile.uid})`);
      
      // ✅ Mamorona na maka ny conversation
      const conversationId = await getOrCreateConversation(profile.uid);
      console.log('✅ Conversation ID:', conversationId);
      
      // ✅ Mandeha any amin'ny Messages miaraka amin'ny state
      navigate('/messages', { 
        state: { 
          startChat: profile.uid,
          conversationId: conversationId,
          userName: profile.displayName
        } 
      });
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      alert('Erreur lors de l\'ouverture du chat');
    }
  };

  // ============================================================
  // 🔥 HANDLER POSTS
  // ============================================================
  const handlePostPrivacyChange = async (postId: string, privacy: string) => {
    try {
      await updatePost(postId, { privacy: privacy as any });
      setPosts(prev => prev.map(p => 
        p.id === postId ? { ...p, privacy: privacy as any } : p
      ));
    } catch (error) {
      console.error('❌ Erreur mise à jour visibilité:', error);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('Voulez-vous vraiment supprimer cette publication ?')) return;
    
    try {
      await deletePost(postId);
      setPosts(prev => prev.filter(p => p.id !== postId));
      if (profile) {
        setProfile(prev => prev ? { ...prev, posts: (prev.posts || 0) - 1 } : null);
      }
    } catch (error) {
      console.error('❌ Erreur suppression post:', error);
      alert('Erreur lors de la suppression du post');
    }
  };

  // ============================================================
  // 🔥 HANDLER PHOTOS
  // ============================================================
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhotoFile(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPhotoFile(file);
      setCoverPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSavePhotos = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      let photoURL = profile.photoURL || '';
      let coverPhotoURL = profile.coverPhoto || '';
      
      if (profilePhotoFile) {
        console.log('📤 Upload photo de profil...');
        photoURL = await uploadProfilePhoto(profilePhotoFile);
        console.log('✅ Photo de profil uploadée:', photoURL);
      }
      
      if (coverPhotoFile) {
        console.log('📤 Upload photo de couverture...');
        coverPhotoURL = await uploadCoverPhoto(coverPhotoFile);
        console.log('✅ Photo de couverture uploadée:', coverPhotoURL);
      }
      
      await updateUserProfile(profile.uid, {
        photoURL: photoURL,
        coverPhoto: coverPhotoURL,
      });
      
      setProfile(prev => prev ? {
        ...prev,
        photoURL: photoURL,
        coverPhoto: coverPhotoURL,
      } : null);
      
      setSaveSuccess(true);
      setIsEditing(false);
      setProfilePhotoFile(null);
      setProfilePhotoPreview(null);
      setCoverPhotoFile(null);
      setCoverPhotoPreview(null);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde des photos.');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // 🔥 VÉRIFIER SI L'AVATAR EST RÉEL
  // ============================================================
  const hasRealAvatar = (avatarUrl?: string) => {
    if (!avatarUrl) return false;
    return avatarUrl !== '' && 
           !avatarUrl.startsWith('https://i.pravatar.cc') && 
           !avatarUrl.startsWith('https://picsum.photos');
  };

  // ============================================================
  // 🔥 RENDER LOADING
  // ============================================================
  if (loading || creatingProfile) {
    return (
      <div className="profile-loading">
        <div className="loading-spinner" />
        <span>{creatingProfile ? 'Création du profil...' : 'Chargement du profil...'}</span>
      </div>
    );
  }

  // ============================================================
  // 🔥 RENDER ERREUR
  // ============================================================
  if (error || !profile) {
    return (
      <div className="profile-notfound">
        <i className="fas fa-user-slash" />
        <h3>Utilisateur non trouvé</h3>
        <p>
          {error || 'Le profil que vous recherchez n\'existe pas.'}
          <br />
          <small style={{ fontSize: '12px', color: 'rgba(255,255,255,0.2)' }}>
            Username: {username || 'non spécifié'}
          </small>
        </p>
        <button onClick={() => navigate('/')}>Retour à l'accueil</button>
      </div>
    );
  }

  // ============================================================
  // 🔥 RENDER PRINCIPAL
  // ============================================================
  const displayName = profile.displayName || 'K-Pop Fan';
  const avatarUrl = profile.photoURL || '';
  const hasAvatar = hasRealAvatar(avatarUrl);
  const hasCover = profile.coverPhoto && profile.coverPhoto !== '';

  return (
    <div className="profile-page">
      {/* ============================================================
          COVER
      ============================================================ */}
      <div className="profile-cover">
        {isEditing && coverPhotoPreview ? (
          <img src={coverPhotoPreview} alt="Cover" className="profile-cover-image" />
        ) : hasCover ? (
          <img src={profile.coverPhoto} alt="Cover" className="profile-cover-image" />
        ) : (
          <div className="profile-cover-placeholder">
            <i className="fas fa-image" />
            <span>Photo de couverture</span>
          </div>
        )}
        {isCurrentUser && (
          <button 
            className="profile-cover-edit-btn"
            onClick={() => coverInputRef.current?.click()}
            title="Changer la photo de couverture"
          >
            <i className="fas fa-camera" />
          </button>
        )}
        <input
          type="file"
          ref={coverInputRef}
          accept="image/*"
          style={{ display: 'none' }}
          onChange={handleCoverPhotoChange}
        />
      </div>

      {/* ============================================================
          PROFILE INFO
      ============================================================ */}
      <div className="profile-info">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            {isEditing && profilePhotoPreview ? (
              <img src={profilePhotoPreview} alt="Profile" />
            ) : hasAvatar ? (
              <img 
                src={avatarUrl} 
                alt={displayName}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement?.classList.add('no-avatar');
                }}
              />
            ) : (
              <div className="avatar-placeholder">
                <i className="fas fa-user" />
              </div>
            )}
            {isCurrentUser && (
              <button 
                className="profile-avatar-edit-btn"
                onClick={() => profileInputRef.current?.click()}
                title="Changer la photo de profil"
              >
                <i className="fas fa-camera" />
              </button>
            )}
          </div>
          <input
            type="file"
            ref={profileInputRef}
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleProfilePhotoChange}
          />
        </div>

        <div className="profile-details">
          <div className="profile-name-section">
            <h2 className="profile-name">{displayName}</h2>
          </div>

          <div className="profile-username">@{profile.username}</div>

          {profile.badge && (
            <div className="profile-badge-display">
              <span className="badge-icon">{profile.badge.icon}</span>
              <span className="badge-name">{profile.badge.name}</span>
            </div>
          )}

          {profile.bio && (
            <div className="profile-bio">{profile.bio}</div>
          )}

          <div className="profile-joined">
            <i className="fas fa-calendar-alt" />
            <span>Inscrit le {new Date(profile.createdAt).toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'long',
              year: 'numeric'
            })}</span>
          </div>

          <div className="profile-stats">
            <div className="stat-item">
              <span className="stat-value">{profile.posts || 0}</span>
              <span className="stat-label">Posts</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profile.followers?.length || 0}</span>
              <span className="stat-label">Followers</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{profile.following?.length || 0}</span>
              <span className="stat-label">Following</span>
            </div>
          </div>

          {/* ============================================================
              ACTIONS
          ============================================================ */}
          <div className="profile-actions">
            {isCurrentUser ? (
              <>
                {isEditing ? (
                  <>
                    <button 
                      className="profile-edit-btn cancel"
                      onClick={() => {
                        setIsEditing(false);
                        setProfilePhotoPreview(null);
                        setCoverPhotoPreview(null);
                        setProfilePhotoFile(null);
                        setCoverPhotoFile(null);
                      }}
                    >
                      Annuler
                    </button>
                    <button 
                      className="profile-edit-btn save"
                      onClick={handleSavePhotos}
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-small" />
                          Sauvegarde...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-check" />
                          Enregistrer
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <>
                    <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                      <i className="fas fa-camera" /> Changer les photos
                    </button>
                    <button className="profile-edit-btn settings" onClick={() => navigate('/settings/profile')}>
                      <i className="fas fa-cog" /> Modifier profil
                    </button>
                  </>
                )}
              </>
            ) : (
              <>
                <button 
                  className={`profile-follow-btn ${isFollowingUser ? 'following' : ''}`}
                  onClick={handleFollowToggle}
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <span className="profile-btn-spinner" />
                  ) : isFollowingUser ? (
                    'Suivi ✓'
                  ) : (
                    'Suivre'
                  )}
                </button>
                
                {/* ✅ BOUTON ENVOYER MESSAGE - VAOVAO */}
                <button 
                  className="profile-message-btn" 
                  onClick={handleSendMessage}
                  title={`Envoyer un message à ${displayName}`}
                >
                  <i className="fas fa-envelope" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================
          TABS
      ============================================================ */}
      <div className="profile-tabs">
        {['posts', 'likes', 'media'].map((tab) => (
          <button
            key={tab}
            className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab as any)}
          >
            <i className={`fas ${tab === 'posts' ? 'fa-newspaper' : tab === 'likes' ? 'fa-heart' : 'fa-image'}`} />
            {tab === 'posts' && 'Publications'}
            {tab === 'likes' && 'Aimés'}
            {tab === 'media' && 'Médias'}
          </button>
        ))}
      </div>

      {/* ============================================================
          POSTS
      ============================================================ */}
      <div className="profile-posts">
        {activeTab === 'posts' && (
          <>
            {postsLoading ? (
              <div className="profile-posts-loading">
                <div className="loading-spinner" />
                <span>Chargement des publications...</span>
              </div>
            ) : posts.length > 0 ? (
              <div className="profile-posts-grid">
                {posts.map((post) => (
                  <div key={post.id} className="profile-post-card">
                    {post.images && post.images.length > 0 ? (
                      <div className="profile-post-image" onClick={() => navigate(`/post/${post.id}`)}>
                        <img src={post.images[0]} alt="Post" loading="lazy" />
                        {post.images.length > 1 && (
                          <span className="post-image-count">{post.images.length}</span>
                        )}
                      </div>
                    ) : (
                      <div className="profile-post-text" onClick={() => navigate(`/post/${post.id}`)}>
                        <p>{post.content.slice(0, 80)}{post.content.length > 80 ? '...' : ''}</p>
                      </div>
                    )}
                    <div className="profile-post-stats">
                      <span><i className="fas fa-heart" /> {post.likes}</span>
                      <span><i className="fas fa-comment" /> {post.comments}</span>
                    </div>
                    {isCurrentUser && (
                      <div className="profile-post-actions">
                        <select 
                          value={post.privacy || 'public'}
                          onChange={(e) => handlePostPrivacyChange(post.id, e.target.value)}
                          className="post-privacy-select"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <option value="public">🌍 Public</option>
                          <option value="followers">👥 Abonnés</option>
                          <option value="private">🔒 Privé</option>
                        </select>
                        <button 
                          className="post-delete-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeletePost(post.id);
                          }}
                        >
                          <i className="fas fa-trash" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="profile-posts-empty">
                <i className="fas fa-inbox" />
                <h3>Aucune publication</h3>
                <p>{isCurrentUser ? 'Partagez votre premier post !' : 'Cet utilisateur n\'a pas encore de publication.'}</p>
              </div>
            )}
          </>
        )}
        {activeTab === 'likes' && (
          <div className="profile-posts-empty">
            <i className="fas fa-heart" />
            <h3>Publications aimées</h3>
            <p>Les publications que vous aimez apparaîtront ici.</p>
          </div>
        )}
        {activeTab === 'media' && (
          <div className="profile-posts-empty">
            <i className="fas fa-image" />
            <h3>Médias</h3>
            <p>Vos photos et vidéos apparaîtront ici.</p>
          </div>
        )}
      </div>

      {/* ============================================================
          SUGGESTIONS
      ============================================================ */}
      <div className="profile-suggestions">
        <Suggestions limit={5} />
      </div>

      {/* ============================================================
          SUCCESS TOAST
      ============================================================ */}
      {saveSuccess && (
        <div className="profile-save-success">
          <i className="fas fa-check-circle" />
          <span>Photos mises à jour avec succès !</span>
        </div>
      )}

      {/* ============================================================
          STYLES
      ============================================================ */}
      <style>{`
        .profile-bio {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 6px 0;
          line-height: 1.5;
        }
        .profile-posts-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 4px;
        }
        .profile-post-card {
          position: relative;
          aspect-ratio: 1;
          overflow: hidden;
          background: var(--bg-tertiary);
          border-radius: 4px;
        }
        .profile-post-image {
          width: 100%;
          height: 100%;
          cursor: pointer;
          position: relative;
        }
        .profile-post-image img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .post-image-count {
          position: absolute;
          top: 8px;
          right: 8px;
          padding: 2px 8px;
          border-radius: 30px;
          background: rgba(0, 0, 0, 0.6);
          color: #fff;
          font-size: 11px;
        }
        .profile-post-text {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 12px;
          cursor: pointer;
          background: var(--bg-tertiary);
        }
        .profile-post-text p {
          color: var(--text-secondary);
          font-size: 13px;
          line-height: 1.4;
          text-align: center;
          margin: 0;
          display: -webkit-box;
          -webkit-line-clamp: 4;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .profile-post-stats {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          display: flex;
          gap: 12px;
          padding: 6px 10px;
          background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
          color: #fff;
          font-size: 12px;
        }
        .profile-post-stats span {
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .profile-post-actions {
          position: absolute;
          top: 4px;
          right: 4px;
          display: flex;
          gap: 4px;
        }
        .post-privacy-select {
          padding: 2px 8px;
          border-radius: 30px;
          background: rgba(0, 0, 0, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #fff;
          font-size: 9px;
          cursor: pointer;
          font-family: inherit;
          outline: none;
        }
        .post-privacy-select option {
          background: #1A1A2E;
          color: #fff;
        }
        .post-delete-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.8);
          border: none;
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          transition: all 0.2s;
        }
        .post-delete-btn:hover {
          transform: scale(1.1);
        }
        .profile-posts-empty {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: rgba(255, 255, 255, 0.3);
          gap: 8px;
        }
        .profile-posts-empty i {
          font-size: 48px;
          color: rgba(255, 255, 255, 0.06);
        }
        .profile-posts-empty h3 {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }
        .profile-posts-empty p {
          font-size: 14px;
          margin: 0;
        }
        .profile-posts-loading {
          grid-column: 1 / -1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--text-tertiary);
          gap: 12px;
        }
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(255, 255, 255, 0.04);
          border-top-color: #C084FC;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .profile-loading {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          color: rgba(255, 255, 255, 0.3);
        }
        .profile-notfound {
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: rgba(255, 255, 255, 0.3);
          text-align: center;
        }
        .profile-notfound i {
          font-size: 48px;
          color: rgba(255, 255, 255, 0.06);
          margin-bottom: 16px;
        }
        .profile-notfound h3 {
          font-size: 18px;
          color: rgba(255, 255, 255, 0.5);
          margin: 0;
        }
        .profile-notfound p {
          font-size: 14px;
          margin: 4px 0 16px;
        }
        .profile-notfound button {
          padding: 8px 24px;
          border-radius: 30px;
          background: linear-gradient(135deg, #C084FC, #EC4899);
          border: none;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
        }
        .profile-notfound button:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.2);
        }
        .profile-save-success {
          position: fixed;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 24px;
          background: rgba(16, 185, 129, 0.95);
          border-radius: 12px;
          color: #fff;
          font-size: 14px;
          font-weight: 500;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.3);
          z-index: 9999;
          animation: slideUp 0.3s ease;
        }
        .profile-save-success i {
          font-size: 20px;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(20px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        .spinner-small {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .profile-btn-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .profile-cover-edit-btn {
          position: absolute;
          bottom: 12px;
          right: 12px;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 5;
        }
        .profile-cover-edit-btn:hover {
          background: rgba(0, 0, 0, 0.8);
          transform: scale(1.05);
        }
        .profile-avatar-edit-btn {
          position: absolute;
          bottom: 2px;
          right: 2px;
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.75);
          border: 2px solid var(--bg-primary, #0A0A0F);
          color: #fff;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
          z-index: 10;
          font-size: 13px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
        }
        .profile-avatar-edit-btn:hover {
          background: rgba(192, 132, 252, 0.8);
          transform: scale(1.05);
        }
        .profile-edit-btn {
          padding: 6px 20px;
          border-radius: 100px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.3);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .profile-edit-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
        }
        .profile-edit-btn.cancel {
          background: var(--bg-input);
          color: var(--text-tertiary);
          border: 1px solid var(--border-color);
        }
        .profile-edit-btn.cancel:hover {
          background: var(--bg-hover);
        }
        .profile-edit-btn.save {
          background: var(--gradient-primary);
          color: #fff;
          border: none;
        }
        .profile-edit-btn.save:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.2);
        }
        .profile-edit-btn.save:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .profile-edit-btn.settings {
          background: rgba(192, 132, 252, 0.06);
          border: 1px solid rgba(192, 132, 252, 0.06);
          color: var(--kpop-violet);
        }
        .profile-edit-btn.settings:hover {
          background: rgba(192, 132, 252, 0.12);
        }
        .profile-message-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.3);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }
        .profile-message-btn:hover {
          background: rgba(255, 255, 255, 0.08);
          color: #fff;
          transform: scale(1.05);
        }
        .profile-follow-btn {
          padding: 6px 24px;
          border-radius: 100px;
          background: linear-gradient(135deg, #C084FC, #EC4899);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          border: none;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .profile-follow-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 16px rgba(192, 132, 252, 0.2);
        }
        .profile-follow-btn.following {
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          color: rgba(255, 255, 255, 0.4);
        }
        .profile-follow-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (max-width: 768px) {
          .profile-cover { height: 120px; }
          .profile-info { flex-direction: column; align-items: center; text-align: center; gap: 12px; padding: 0 16px 12px; margin-top: -40px; }
          .profile-avatar { width: 80px; height: 80px; }
          .profile-avatar .avatar-placeholder { font-size: 28px; }
          .profile-avatar-edit-btn { width: 26px; height: 26px; font-size: 11px; bottom: 1px; right: 1px; }
          .profile-details { padding-top: 0; }
          .profile-name-section { justify-content: center; }
          .profile-name { font-size: 18px; }
          .profile-joined { justify-content: center; font-size: 12px; }
          .profile-stats { justify-content: center; gap: 16px; }
          .stat-value { font-size: 16px; }
          .profile-actions { justify-content: center; }
          .profile-tabs { padding: 0 12px; justify-content: center; }
          .tab-btn { padding: 8px 14px; font-size: 13px; }
          .profile-posts-grid { gap: 3px; }
        }
        @media (max-width: 480px) {
          .profile-cover { height: 90px; }
          .profile-avatar { width: 64px; height: 64px; }
          .profile-avatar .avatar-placeholder { font-size: 22px; }
          .profile-avatar-edit-btn { width: 22px; height: 22px; font-size: 9px; bottom: 0px; right: 0px; border-width: 1.5px; }
          .profile-name { font-size: 16px; }
          .profile-username { font-size: 12px; }
          .profile-joined { font-size: 11px; }
          .stat-value { font-size: 14px; }
          .stat-label { font-size: 10px; }
          .profile-follow-btn { padding: 4px 16px; font-size: 12px; }
          .profile-message-btn { width: 32px; height: 32px; font-size: 13px; }
          .profile-edit-btn { font-size: 11px; padding: 3px 10px; }
          .profile-edit-btn span { display: none; }
          .profile-edit-btn i { font-size: 13px; }
          .tab-btn { padding: 6px 10px; font-size: 12px; }
          .tab-btn i { margin-right: 4px; font-size: 11px; }
          .tab-btn.active::after { left: 10px; right: 10px; }
          .profile-posts-grid { gap: 2px; }
          .profile-posts-empty { padding: 40px 20px; }
          .profile-posts-empty i { font-size: 36px; }
          .profile-posts-empty h3 { font-size: 16px; }
          .profile-posts-empty p { font-size: 12px; }
          .profile-cover-placeholder i { font-size: 20px; }
          .profile-cover-placeholder span { font-size: 10px; }
          .profile-cover-edit-btn { width: 26px; height: 26px; font-size: 11px; bottom: 6px; right: 6px; }
          .profile-post-stats { font-size: 10px; padding: 4px 6px; }
          .post-privacy-select { font-size: 8px; padding: 1px 6px; }
          .post-delete-btn { width: 20px; height: 20px; font-size: 8px; }
          .profile-save-success { font-size: 12px; padding: 10px 18px; bottom: 16px; }
          .profile-save-success i { font-size: 16px; }
        }
        body.light-mode .profile-page { background: var(--bg-primary); }
        body.light-mode .profile-cover { background: linear-gradient(135deg, #E8E8F0, #D8D8E5); }
        body.light-mode .profile-avatar { border-color: #FFFFFF; background: linear-gradient(135deg, #E8E8F0, #D8D8E5); }
        body.light-mode .profile-name { color: var(--text-primary); }
        body.light-mode .profile-username { color: var(--text-tertiary); }
        body.light-mode .profile-joined { color: var(--text-tertiary); }
        body.light-mode .stat-value { color: var(--text-primary); }
        body.light-mode .stat-label { color: var(--text-tertiary); }
        body.light-mode .profile-follow-btn.following { background: var(--bg-input); color: var(--text-tertiary); border: 1px solid var(--border-color); }
        body.light-mode .profile-message-btn { background: var(--bg-input); border-color: var(--border-color); color: var(--text-tertiary); }
        body.light-mode .profile-message-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        body.light-mode .profile-edit-btn { background: var(--bg-input); border-color: var(--border-color); color: var(--text-tertiary); }
        body.light-mode .profile-edit-btn:hover { background: var(--bg-hover); color: var(--text-primary); }
        body.light-mode .tab-btn { color: var(--text-tertiary); }
        body.light-mode .tab-btn:hover { color: var(--text-secondary); }
        body.light-mode .tab-btn.active { color: var(--text-primary); }
        body.light-mode .profile-posts-empty { color: var(--text-tertiary); }
        body.light-mode .profile-posts-empty i { color: var(--text-dim); }
        body.light-mode .profile-posts-empty h3 { color: var(--text-secondary); }
        body.light-mode .profile-posts-empty p { color: var(--text-tertiary); }
        body.light-mode .profile-notfound { color: var(--text-tertiary); }
        body.light-mode .profile-notfound i { color: var(--text-dim); }
        body.light-mode .profile-notfound h3 { color: var(--text-secondary); }
        body.light-mode .profile-loading { color: var(--text-tertiary); }
        body.light-mode .profile-cover-edit-btn { background: rgba(255, 255, 255, 0.85); color: #1A1A2E; border-color: rgba(0, 0, 0, 0.06); }
        body.light-mode .profile-cover-edit-btn:hover { background: #8B5CF6; color: #fff; }
        body.light-mode .profile-avatar-edit-btn { background: rgba(255, 255, 255, 0.9); border-color: #FFFFFF; color: #1A1A2E; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1); }
        body.light-mode .profile-avatar-edit-btn:hover { background: #8B5CF6; color: #fff; }
        body.light-mode .profile-save-success { background: rgba(5, 150, 105, 0.95); }
      `}</style>
    </div>
  );
};

export default Profile;