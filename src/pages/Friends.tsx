// ========== src/pages/Friends.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { searchUsers, getUserData, type UserData } from '../services/messageService';
import { getUserProfile, isFollowing, followUser, unfollowUser } from '../services/profileService';
import { getOrCreateConversation } from '../services/messageService';
import '../styles/Friends.css';

const Friends: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(false);
  const [friendRequests, setFriendRequests] = useState<UserData[]>([]);
  const [friends, setFriends] = useState<UserData[]>([]);
  const [followers, setFollowers] = useState<UserData[]>([]);
  const [following, setFollowing] = useState<UserData[]>([]);
  const [followingMap, setFollowingMap] = useState<{ [key: string]: boolean }>({});
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});
  const [activeTab, setActiveTab] = useState<'all' | 'friends' | 'followers' | 'following'>('all');

  // ============================================================
  // CHARGER LES AMIS, FOLLOWERS, FOLLOWING
  // ============================================================
  useEffect(() => {
    const loadRelations = async () => {
      if (!user) return;

      try {
        const userProfile = await getUserProfile(user.id);
        if (userProfile) {
          const followingIds = userProfile.following || [];
          const followerIds = userProfile.followers || [];

          // Maka ny data an'ny followers
          const followersData: UserData[] = [];
          for (const id of followerIds) {
            const data = await getUserData(id);
            if (data) followersData.push(data);
          }
          setFollowers(followersData);

          // Maka ny data an'ny following
          const followingData: UserData[] = [];
          for (const id of followingIds) {
            const data = await getUserData(id);
            if (data) followingData.push(data);
          }
          setFollowing(followingData);

          // Maka ny data an'ny friends (mpifanaraka)
          const friendsData: UserData[] = [];
          for (const id of followingIds) {
            if (followerIds.includes(id)) {
              const data = await getUserData(id);
              if (data) friendsData.push(data);
            }
          }
          setFriends(friendsData);
        }
      } catch (error) {
        console.error('❌ Erreur chargement relations:', error);
      }
    };

    loadRelations();
  }, [user]);

  // ============================================================
  // RECHERCHE UTILISATEURS
  // ============================================================
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchQuery.trim()) {
        setLoading(true);
        try {
          const results = await searchUsers(searchQuery);
          const filtered = results.filter(u => u.id !== user?.id);
          
          const map: { [key: string]: boolean } = {};
          for (const u of filtered) {
            map[u.id] = await isFollowing(u.id);
          }
          setFollowingMap(map);
          
          setSearchResults(filtered);
        } catch (error) {
          console.error('❌ Erreur recherche:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setSearchResults([]);
      }
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user]);

  // ============================================================
  // FOLLOW / UNFOLLOW
  // ============================================================
  const handleFollowToggle = async (targetUid: string) => {
    if (!user || actionLoading[targetUid]) return;

    setActionLoading(prev => ({ ...prev, [targetUid]: true }));

    try {
      const isFollow = followingMap[targetUid];
      
      if (isFollow) {
        await unfollowUser(targetUid);
        setFollowingMap(prev => ({ ...prev, [targetUid]: false }));
        setSearchResults(prev => prev.filter(u => u.id !== targetUid));
      } else {
        await followUser(targetUid);
        setFollowingMap(prev => ({ ...prev, [targetUid]: true }));
        setSearchResults(prev => prev.filter(u => u.id !== targetUid));
      }
      
      // Mamerina ny relations
      const userProfile = await getUserProfile(user.id);
      if (userProfile) {
        const followerIds = userProfile.followers || [];
        const followingIds = userProfile.following || [];

        const followersData: UserData[] = [];
        for (const id of followerIds) {
          const data = await getUserData(id);
          if (data) followersData.push(data);
        }
        setFollowers(followersData);

        const followingData: UserData[] = [];
        for (const id of followingIds) {
          const data = await getUserData(id);
          if (data) followingData.push(data);
        }
        setFollowing(followingData);

        const friendsData: UserData[] = [];
        for (const id of followingIds) {
          if (followerIds.includes(id)) {
            const data = await getUserData(id);
            if (data) friendsData.push(data);
          }
        }
        setFriends(friendsData);
      }
    } catch (error) {
      console.error('❌ Erreur follow:', error);
    } finally {
      setActionLoading(prev => ({ ...prev, [targetUid]: false }));
    }
  };

  // ============================================================
  // ✅ ENVOYER UN MESSAGE DIRECT - VAOVAO
  // ============================================================
  const sendDirectMessage = async (userId: string, userName: string) => {
    if (!user) return;
    
    try {
      console.log(`🔍 Envoi message à: ${userName} (${userId})`);
      
      // ✅ Mamorona na maka ny conversation
      const conversationId = await getOrCreateConversation(userId);
      console.log('✅ Conversation ID:', conversationId);
      
      // ✅ Mandeha any amin'ny Messages miaraka amin'ny state
      navigate('/messages', { 
        state: { 
          startChat: userId,
          conversationId: conversationId,
          userName: userName
        } 
      });
    } catch (error) {
      console.error('❌ Erreur création conversation:', error);
      alert('Erreur lors de l\'ouverture du chat');
    }
  };

  // ============================================================
  // VÉRIFIER SI L'AVATAR EST RÉEL
  // ============================================================
  const hasRealAvatar = (avatarUrl?: string) => {
    if (!avatarUrl) return false;
    return avatarUrl !== '' && 
           !avatarUrl.startsWith('https://i.pravatar.cc') && 
           !avatarUrl.startsWith('https://picsum.photos');
  };

  // ============================================================
  // GET RELATION STATUS
  // ============================================================
  const getRelationStatus = (userId: string) => {
    const isFollow = followingMap[userId] || false;
    const isFollower = followers.some(f => f.id === userId);
    const isFriend = friends.some(f => f.id === userId);
    
    if (isFriend) return { label: 'Amis', icon: 'fa-user-friends', color: '#10B981' };
    if (isFollow && isFollower) return { label: 'Amis', icon: 'fa-user-friends', color: '#10B981' };
    if (isFollow) return { label: 'Suivi', icon: 'fa-user-check', color: '#C084FC' };
    if (isFollower) return { label: 'Vous suit', icon: 'fa-user-plus', color: '#FFD700' };
    return { label: '', icon: '', color: '' };
  };

  // ============================================================
  // RENDER USER CARD
  // ============================================================
  const renderUserCard = (userData: UserData, showActions: boolean = true) => {
    const hasAvatar = hasRealAvatar(userData.avatar);
    const isFollow = followingMap[userData.id] || false;
    const isLoading = actionLoading[userData.id] || false;
    const relation = getRelationStatus(userData.id);

    return (
      <div key={userData.id} className="friend-item">
        <div className="friend-avatar" onClick={() => navigate(`/profile/${userData.username}`)}>
          {hasAvatar ? (
            <img 
              src={userData.avatar} 
              alt={userData.name}
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
          {userData.isOnline && <span className="online-dot" />}
        </div>

        <div className="friend-info" onClick={() => navigate(`/profile/${userData.username}`)}>
          <span className="friend-name">
            {userData.name}
            {userData.isVerified && <i className="fas fa-check-circle verified-badge-small" />}
          </span>
          <span className="friend-username">@{userData.username}</span>
          {userData.bio && <span className="friend-bio">{userData.bio.slice(0, 50)}...</span>}
          <div className="friend-relation">
            {relation.label && (
              <span className="relation-badge" style={{ color: relation.color }}>
                <i className={`fas ${relation.icon}`} /> {relation.label}
              </span>
            )}
            <span className="friend-followers">{userData.followers || 0} followers</span>
          </div>
        </div>

        {showActions && (
          <div className="friend-actions">
            <button 
              className="friend-action-btn message" 
              onClick={() => sendDirectMessage(userData.id, userData.name)}
            >
              <i className="fas fa-envelope" /> Message
            </button>
            {isFollow ? (
              <button 
                className="friend-action-btn unfollow" 
                onClick={() => handleFollowToggle(userData.id)}
                disabled={isLoading}
              >
                {isLoading ? <span className="btn-spinner" /> : <><i className="fas fa-user-minus" /> Se désabonner</>}
              </button>
            ) : (
              <button 
                className="friend-action-btn follow" 
                onClick={() => handleFollowToggle(userData.id)}
                disabled={isLoading}
              >
                {isLoading ? <span className="btn-spinner" /> : <><i className="fas fa-user-plus" /> Suivre</>}
              </button>
            )}
          </div>
        )}
      </div>
    );
  };

  // ============================================================
  // RENDER LISTE
  // ============================================================
  const getCurrentList = () => {
    if (searchQuery.trim()) return searchResults;
    
    switch (activeTab) {
      case 'friends': return friends;
      case 'followers': return followers;
      case 'following': return following;
      default: return [];
    }
  };

  const currentList = getCurrentList();
  const showSearchResults = searchQuery.trim().length > 0;

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="friends-page">
      {/* HEADER */}
      <div className="friends-header">
        <button className="friends-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left" />
        </button>
        <h1 className="friends-title">
          <i className="fas fa-user-friends" style={{ color: '#C084FC' }} />
          Amis
        </h1>
        <span className="friends-count">{friends.length} amis</span>
      </div>

      {/* SEARCH */}
      <div className="friends-search">
        <i className="fas fa-search" />
        <input
          type="text"
          placeholder="Rechercher tous les utilisateurs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          autoFocus
        />
        {searchQuery && (
          <button className="friends-search-clear" onClick={() => setSearchQuery('')}>
            <i className="fas fa-times-circle" />
          </button>
        )}
      </div>

      {/* TABS */}
      {!showSearchResults && (
        <div className="friends-tabs">
          <button 
            className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <i className="fas fa-users" /> Tous
          </button>
          <button 
            className={`tab-btn ${activeTab === 'friends' ? 'active' : ''}`}
            onClick={() => setActiveTab('friends')}
          >
            <i className="fas fa-user-friends" /> Amis ({friends.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
            onClick={() => setActiveTab('followers')}
          >
            <i className="fas fa-user-plus" /> Followers ({followers.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            <i className="fas fa-user-check" /> Following ({following.length})
          </button>
        </div>
      )}

      {/* RESULTATS */}
      <div className="friends-content">
        {loading ? (
          <div className="friends-loading">
            <div className="loading-spinner" />
            <span>Recherche...</span>
          </div>
        ) : showSearchResults ? (
          // RESULTATS DE RECHERCHE
          searchResults.length > 0 ? (
            <div className="friends-list">
              {searchResults.map((result) => renderUserCard(result, true))}
            </div>
          ) : (
            <div className="friends-empty">
              <i className="fas fa-user-slash" />
              <span>Aucun utilisateur trouvé</span>
              <p className="empty-hint">Essayez un autre nom ou email</p>
            </div>
          )
        ) : (
          // LISTE PAR TAB
          activeTab === 'all' ? (
            // Tous - mampiseho ny followers sy following
            <>
              {friends.length > 0 && (
                <div className="friends-section">
                  <h3 className="friends-section-title">
                    <i className="fas fa-user-friends" /> Amis ({friends.length})
                  </h3>
                  <div className="friends-list">
                    {friends.map((friend) => renderUserCard(friend, true))}
                  </div>
                </div>
              )}
              {followers.filter(f => !friends.some(fr => fr.id === f.id)).length > 0 && (
                <div className="friends-section">
                  <h3 className="friends-section-title">
                    <i className="fas fa-user-plus" /> Vous suivent ({followers.filter(f => !friends.some(fr => fr.id === f.id)).length})
                  </h3>
                  <div className="friends-list">
                    {followers.filter(f => !friends.some(fr => fr.id === f.id)).map((follower) => renderUserCard(follower, true))}
                  </div>
                </div>
              )}
              {following.filter(f => !friends.some(fr => fr.id === f.id)).length > 0 && (
                <div className="friends-section">
                  <h3 className="friends-section-title">
                    <i className="fas fa-user-check" /> Vous suivez ({following.filter(f => !friends.some(fr => fr.id === f.id)).length})
                  </h3>
                  <div className="friends-list">
                    {following.filter(f => !friends.some(fr => fr.id === f.id)).map((follow) => renderUserCard(follow, true))}
                  </div>
                </div>
              )}
              {friends.length === 0 && followers.length === 0 && following.length === 0 && (
                <div className="friends-empty">
                  <i className="fas fa-users" />
                  <span>Aucune relation pour le moment</span>
                  <p className="empty-hint">Commencez à suivre d'autres fans !</p>
                </div>
              )}
            </>
          ) : (
            // Tab spécifique
            currentList.length > 0 ? (
              <div className="friends-list">
                {currentList.map((item) => renderUserCard(item, true))}
              </div>
            ) : (
              <div className="friends-empty">
                <i className="fas fa-users" />
                <span>Aucun utilisateur dans cette liste</span>
                <p className="empty-hint">
                  {activeTab === 'friends' && "Suivez des utilisateurs pour devenir amis"}
                  {activeTab === 'followers' && "Personne ne vous suit encore"}
                  {activeTab === 'following' && "Vous ne suivez personne encore"}
                </p>
              </div>
            )
          )
        )}
      </div>

      {/* ============================================================
          STYLES
      ============================================================ */}
      <style>{`
        .friends-page {
          height: 100%;
          width: 100%;
          padding: 16px 20px;
          background: var(--bg-primary);
          color: var(--text-primary);
          overflow-y: auto;
        }
        .friends-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }
        .friends-back {
          background: none;
          border: none;
          color: var(--text-tertiary);
          font-size: 18px;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 8px;
          transition: all 0.2s;
        }
        .friends-back:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
        .friends-title {
          font-size: 20px;
          font-weight: 700;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .friends-count {
          font-size: 12px;
          color: var(--text-tertiary);
          background: var(--bg-input);
          padding: 2px 12px;
          border-radius: 30px;
          margin-left: auto;
        }
        .friends-search {
          display: flex;
          align-items: center;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 100px;
          padding: 0 16px;
          transition: all 0.3s ease;
          margin-bottom: 16px;
        }
        .friends-search:focus-within {
          border-color: var(--kpop-violet);
          box-shadow: 0 0 0 3px rgba(192, 132, 252, 0.05);
        }
        .friends-search i {
          color: var(--text-tertiary);
          font-size: 16px;
        }
        .friends-search input {
          flex: 1;
          padding: 10px 12px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
        }
        .friends-search input::placeholder {
          color: var(--text-tertiary);
        }
        .friends-search-clear {
          background: none;
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          padding: 4px;
          font-size: 16px;
        }
        .friends-search-clear:hover {
          color: var(--text-primary);
        }
        .friends-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          padding-bottom: 8px;
        }
        .tab-btn {
          padding: 6px 16px;
          border-radius: 30px;
          background: transparent;
          border: none;
          color: var(--text-tertiary);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .tab-btn:hover {
          color: var(--text-secondary);
          background: var(--bg-hover);
        }
        .tab-btn.active {
          background: rgba(192, 132, 252, 0.08);
          color: var(--text-primary);
        }
        .friends-content {
          flex: 1;
          overflow-y: auto;
        }
        .friends-section {
          margin-bottom: 16px;
        }
        .friends-section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-tertiary);
          margin: 0 0 8px 0;
          display: flex;
          align-items: center;
          gap: 6px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .friends-list {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .friend-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 10px 14px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          transition: all 0.2s ease;
          cursor: default;
        }
        .friend-item:hover {
          background: var(--bg-hover);
          border-color: var(--border-light);
        }
        .friend-avatar {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          cursor: pointer;
          border: 2px solid rgba(192, 132, 252, 0.06);
          transition: border-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--bg-input);
        }
        .friend-avatar:hover {
          border-color: rgba(192, 132, 252, 0.2);
        }
        .friend-avatar img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .friend-avatar .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(192, 132, 252, 0.15), rgba(236, 72, 153, 0.08));
          color: rgba(255, 255, 255, 0.3);
          font-size: 18px;
        }
        .online-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4CAF50;
          border: 2px solid var(--bg-card);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        .friend-info {
          flex: 1;
          min-width: 0;
          cursor: pointer;
        }
        .friend-name {
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .verified-badge-small {
          color: var(--kpop-violet);
          font-size: 12px;
        }
        .friend-username {
          font-size: 12px;
          color: var(--text-tertiary);
          display: block;
        }
        .friend-bio {
          font-size: 12px;
          color: var(--text-muted);
          margin-top: 2px;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .friend-relation {
          display: flex;
          gap: 8px;
          margin-top: 2px;
          align-items: center;
        }
        .relation-badge {
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .friend-followers {
          font-size: 11px;
          color: var(--text-tertiary);
        }
        .friend-actions {
          display: flex;
          gap: 6px;
          flex-shrink: 0;
        }
        .friend-action-btn {
          padding: 4px 14px;
          border-radius: 30px;
          border: none;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: inherit;
          white-space: nowrap;
        }
        .friend-action-btn:hover:not(:disabled) {
          transform: scale(1.04);
        }
        .friend-action-btn.message {
          background: rgba(192, 132, 252, 0.08);
          color: var(--kpop-violet);
        }
        .friend-action-btn.message:hover {
          background: rgba(192, 132, 252, 0.15);
        }
        .friend-action-btn.follow {
          background: var(--gradient-primary);
          color: #fff;
        }
        .friend-action-btn.follow:hover {
          box-shadow: 0 4px 16px rgba(192, 132, 252, 0.15);
        }
        .friend-action-btn.unfollow {
          background: var(--bg-input);
          color: var(--text-tertiary);
          border: 1px solid var(--border-color);
        }
        .friend-action-btn.unfollow:hover {
          background: rgba(239, 68, 68, 0.05);
          color: var(--kpop-red);
        }
        .friend-action-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-spinner {
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
        .friend-action-btn.unfollow .btn-spinner {
          border-top-color: var(--text-tertiary);
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .friends-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          padding: 30px 20px;
          color: var(--text-tertiary);
        }
        .loading-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid rgba(255,255,255,0.04);
          border-top-color: var(--kpop-violet);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .friends-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 40px 20px;
          color: var(--text-tertiary);
          gap: 6px;
          text-align: center;
        }
        .friends-empty i {
          font-size: 32px;
          color: var(--text-dim);
        }
        .friends-empty .empty-hint {
          font-size: 12px;
          color: var(--text-dim);
        }
        @media (max-width: 480px) {
          .friends-page { padding: 10px; }
          .friend-item { flex-wrap: wrap; }
          .friend-actions { width: 100%; justify-content: flex-end; }
          .friend-action-btn { font-size: 11px; padding: 3px 10px; }
          .friend-action-btn span { display: none; }
          .friend-action-btn i { font-size: 14px; }
          .friends-tabs { overflow-x: auto; flex-wrap: nowrap; }
          .tab-btn { font-size: 12px; padding: 4px 12px; white-space: nowrap; }
        }
        body.light-mode .friend-item {
          background: var(--bg-card);
          border-color: var(--border-color);
        }
        body.light-mode .friend-item:hover {
          background: var(--bg-hover);
          border-color: var(--border-light);
        }
        body.light-mode .friend-name {
          color: var(--text-primary);
        }
        body.light-mode .friend-username {
          color: var(--text-tertiary);
        }
        body.light-mode .friend-bio {
          color: var(--text-muted);
        }
        body.light-mode .friends-empty {
          color: var(--text-tertiary);
        }
        body.light-mode .friends-empty i {
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
};

export default Friends;