// ========== src/components/Suggestions.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getSuggestions, 
  followUser, 
  unfollowUser, 
  getUserProfile,
  type UserProfile 
} from '../services/profileService';
import { useAuth } from '../context/AuthContext';
import '../styles/Suggestions.css';

interface SuggestionsProps {
  limit?: number;
  onFollow?: () => void;
}

const Suggestions: React.FC<SuggestionsProps> = ({ limit = 10, onFollow }) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [followingMap, setFollowingMap] = useState<{ [key: string]: boolean }>({});
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  // ============================================================
  // 🔥 CHARGER LES SUGGESTIONS
  // ============================================================
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    console.log('👤 Suggestions - Utilisateur actuel:', user.displayName || user.name, '(ID:', user.id, ')');
    setLoading(true);
    
    const unsubscribe = getSuggestions(async (users) => {
      console.log('🔍 Suggestions reçues (brutes):', users.map(u => u.displayName));
      
      // ✅ Maka ny following list mba hanaovana filtration fanampiny
      const currentUser = await getUserProfile(user.id);
      const following = currentUser?.following || [];
      
      // ✅ Esorina ny tena mpampiasa sy ny efa manaraka
      const filteredUsers = users.filter(u => {
        const isSelf = u.uid === user.id;
        const isFollowed = following.includes(u.uid);
        return !isSelf && !isFollowed;
      });
      
      console.log('🔍 Après filtration (sans moi et sans suivis):', filteredUsers.map(u => u.displayName));
      
      setSuggestions(filteredUsers.slice(0, limit));
      
      // ✅ Vérifier le statut de follow pour chaque utilisateur
      const map: { [key: string]: boolean } = {};
      for (const u of filteredUsers.slice(0, limit)) {
        map[u.uid] = following.includes(u.uid);
      }
      setFollowingMap(map);
      
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, limit]);

  // ============================================================
  // 🔥 HANDLER FOLLOW / UNFOLLOW
  // ============================================================
  const handleFollowToggle = async (targetUid: string) => {
    if (!user) return;
    if (actionLoading[targetUid]) return;

    setActionLoading(prev => ({ ...prev, [targetUid]: true }));

    try {
      const isFollow = followingMap[targetUid];
      
      if (isFollow) {
        await unfollowUser(targetUid);
        setFollowingMap(prev => ({ ...prev, [targetUid]: false }));
        // ✅ Esorina avy amin'ny suggestions ilay mpampiasa
        setSuggestions(prev => prev.filter(u => u.uid !== targetUid));
      } else {
        await followUser(targetUid);
        setFollowingMap(prev => ({ ...prev, [targetUid]: true }));
        // ✅ Esorina avy amin'ny suggestions ilay mpampiasa
        setSuggestions(prev => prev.filter(u => u.uid !== targetUid));
      }
      
      if (onFollow) onFollow();
    } catch (error) {
      console.error('❌ Erreur follow:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUid]: false }));
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
  if (loading) {
    return (
      <div className="suggestions-loading">
        <div className="suggestions-spinner" />
        <span>Chargement des suggestions...</span>
      </div>
    );
  }

  // ============================================================
  // 🔥 RENDER EMPTY
  // ============================================================
  if (suggestions.length === 0) {
    return (
      <div className="suggestions-empty">
        <i className="fas fa-users" />
        <span>Aucune suggestion pour le moment</span>
        <p>Revenez plus tard pour découvrir d'autres fans !</p>
      </div>
    );
  }

  // ============================================================
  // 🔥 RENDER PRINCIPAL
  // ============================================================
  return (
    <div className="suggestions-container">
      <div className="suggestions-header">
        <h3>
          <i className="fas fa-user-plus" style={{ color: '#C084FC' }} />
          Suggestions pour vous
        </h3>
        <span className="suggestions-count">{suggestions.length} fans</span>
      </div>

      <div className="suggestions-list">
        {suggestions.map((profile) => {
          const hasAvatar = hasRealAvatar(profile.photoURL);
          const displayName = profile.displayName || 'Utilisateur';
          const isFollow = followingMap[profile.uid] || false;
          const isLoading = actionLoading[profile.uid] || false;

          return (
            <div key={profile.uid} className="suggestion-item">
              <div 
                className="suggestion-avatar"
                onClick={() => navigate(`/profile/${profile.username}`)}
              >
                {hasAvatar ? (
                  <img 
                    src={profile.photoURL} 
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
                {profile.isVerified && (
                  <span className="suggestion-verified">
                    <i className="fas fa-check-circle" />
                  </span>
                )}
              </div>

              <div 
                className="suggestion-info"
                onClick={() => navigate(`/profile/${profile.username}`)}
              >
                <div className="suggestion-name">
                  {displayName}
                  {profile.isVerified && (
                    <i className="fas fa-check-circle verified-badge" />
                  )}
                </div>
                <div className="suggestion-username">@{profile.username}</div>
                {profile.bio && (
                  <div className="suggestion-bio">{profile.bio.slice(0, 60)}...</div>
                )}
                <div className="suggestion-meta">
                  {profile.badge && (
                    <span 
                      className="suggestion-badge"
                      style={{ 
                        backgroundColor: profile.badge.color,
                        color: '#fff',
                      }}
                    >
                      {profile.badge.icon} {profile.badge.name}
                    </span>
                  )}
                  <span className="suggestion-followers">
                    {profile.followers?.length || 0} followers
                  </span>
                  <span className="suggestion-posts">
                    {profile.posts || 0} posts
                  </span>
                </div>
              </div>

              <button
                className={`suggestion-follow-btn ${isFollow ? 'following' : ''}`}
                onClick={() => handleFollowToggle(profile.uid)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="suggestion-btn-spinner" />
                ) : isFollow ? (
                  <>
                    <i className="fas fa-check" />
                    Suivi
                  </>
                ) : (
                  <>
                    <i className="fas fa-user-plus" />
                    Suivre
                  </>
                )}
              </button>
            </div>
          );
        })}
      </div>

      {suggestions.length >= limit && (
        <div className="suggestions-more">
          <button onClick={() => navigate('/explore')}>
            Voir plus de suggestions <i className="fas fa-arrow-right" />
          </button>
        </div>
      )}
    </div>
  );
};

export default Suggestions;