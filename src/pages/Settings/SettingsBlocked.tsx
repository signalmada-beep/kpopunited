// ========== src/pages/Settings/SettingsBlocked.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getBlockedUsers, unblockUser, type BlockedUser } from '../../services/blockService';
import './SettingsBlocked.css';

const SettingsBlocked: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<{ [key: string]: boolean }>({});

  // ============================================================
  // 🔥 CHARGER LES UTILISATEURS BLOQUÉS
  // ============================================================
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = getBlockedUsers((users) => {
      setBlockedUsers(users);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================================================
  // 🔥 DÉBLOQUER UN UTILISATEUR
  // ============================================================
  const handleUnblock = async (uid: string) => {
    if (!confirm('Voulez-vous vraiment débloquer cet utilisateur ?')) return;
    
    setActionLoading(prev => ({ ...prev, [uid]: true }));
    
    try {
      await unblockUser(uid);
      setBlockedUsers(prev => prev.filter(user => user.uid !== uid));
    } catch (error) {
      console.error('❌ Erreur déblocage:', error);
      alert('Erreur lors du déblocage. Veuillez réessayer.');
    } finally {
      setActionLoading(prev => ({ ...prev, [uid]: false }));
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
  // 🔥 FORMATER LA DATE
  // ============================================================
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  // ============================================================
  // 🔥 RENDER LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="settings-subpage">
        <div className="settings-subpage-header">
          <h2>Utilisateurs bloqués</h2>
          <p>Liste des utilisateurs que vous avez bloqués</p>
        </div>
        <div className="settings-blocked-loading">
          <div className="loading-spinner" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // 🔥 RENDER
  // ============================================================
  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>
          <i className="fas fa-user-slash" style={{ color: '#EF4444' }} />
          Utilisateurs bloqués
        </h2>
        <p>Gérez les utilisateurs que vous avez bloqués</p>
        <span className="blocked-count">{blockedUsers.length} utilisateur{blockedUsers.length > 1 ? 's' : ''} bloqué{blockedUsers.length > 1 ? 's' : ''}</span>
      </div>

      {blockedUsers.length > 0 ? (
        <div className="settings-blocked-list-full">
          {blockedUsers.map((blockedUser) => {
            const hasAvatar = hasRealAvatar(blockedUser.photoURL);
            const displayName = blockedUser.displayName || 'Utilisateur';
            
            return (
              <div key={blockedUser.uid} className="settings-blocked-item">
                <div className="settings-blocked-avatar">
                  {hasAvatar ? (
                    <img 
                      src={blockedUser.photoURL} 
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
                </div>
                
                <div className="settings-blocked-info">
                  <div className="settings-blocked-name">
                    {displayName}
                    <span className="settings-blocked-username">@{blockedUser.username || 'utilisateur'}</span>
                  </div>
                  <div className="settings-blocked-time">
                    <i className="fas fa-clock" />
                    Bloqué le {formatDate(blockedUser.blockedAt)}
                  </div>
                  {blockedUser.reason && (
                    <div className="settings-blocked-reason">
                      <i className="fas fa-comment" />
                      {blockedUser.reason}
                    </div>
                  )}
                </div>
                
                <button 
                  className="settings-blocked-unblock"
                  onClick={() => handleUnblock(blockedUser.uid)}
                  disabled={actionLoading[blockedUser.uid]}
                >
                  {actionLoading[blockedUser.uid] ? (
                    <span className="btn-spinner" />
                  ) : (
                    <>
                      <i className="fas fa-user-plus" />
                      Débloquer
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="settings-blocked-empty-full">
          <i className="fas fa-user-slash" />
          <h3>Aucun utilisateur bloqué</h3>
          <p>Vous n'avez bloqué aucun utilisateur pour le moment.</p>
        </div>
      )}

      {/* ============================================================
          STYLES
      ============================================================ */}
      <style>{`
        .settings-blocked-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 12px;
          color: var(--text-tertiary);
        }

        .loading-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(255,255,255,0.04);
          border-top-color: var(--kpop-violet);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .btn-spinner {
          display: inline-block;
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .blocked-count {
          display: inline-block;
          font-size: 12px;
          color: var(--text-tertiary);
          background: var(--bg-input);
          padding: 2px 12px;
          border-radius: 30px;
          margin-top: 4px;
        }

        .settings-blocked-list-full {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .settings-blocked-item {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 12px 14px;
          border-radius: 12px;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          transition: all 0.2s ease;
        }

        .settings-blocked-item:hover {
          background: var(--bg-hover);
          border-color: var(--border-light);
        }

        .settings-blocked-avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(192, 132, 252, 0.06);
          background: var(--bg-input);
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .settings-blocked-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }

        .settings-blocked-avatar .avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          color: var(--text-tertiary);
          background: linear-gradient(135deg, rgba(192, 132, 252, 0.08), rgba(236, 72, 153, 0.04));
        }

        .settings-blocked-avatar.no-avatar img {
          display: none !important;
        }

        .settings-blocked-avatar.no-avatar .avatar-placeholder {
          display: flex !important;
        }

        .settings-blocked-info {
          flex: 1;
          min-width: 0;
        }

        .settings-blocked-name {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-wrap: wrap;
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
        }

        .settings-blocked-username {
          font-size: 12px;
          font-weight: 400;
          color: var(--text-tertiary);
        }

        .settings-blocked-time {
          font-size: 11px;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          gap: 4px;
          margin-top: 2px;
        }

        .settings-blocked-time i {
          font-size: 10px;
        }

        .settings-blocked-reason {
          font-size: 12px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 2px;
          padding: 2px 10px;
          background: var(--bg-input);
          border-radius: 6px;
          border: 1px solid var(--border-color);
        }

        .settings-blocked-reason i {
          font-size: 10px;
          color: var(--text-tertiary);
        }

        .settings-blocked-unblock {
          padding: 6px 18px;
          border-radius: 30px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.06);
          color: var(--kpop-green);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          display: flex;
          align-items: center;
          gap: 6px;
          flex-shrink: 0;
        }

        .settings-blocked-unblock:hover:not(:disabled) {
          background: rgba(16, 185, 129, 0.15);
          transform: scale(1.03);
        }

        .settings-blocked-unblock:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .settings-blocked-empty-full {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
          color: var(--text-tertiary);
          gap: 8px;
        }

        .settings-blocked-empty-full i {
          font-size: 48px;
          color: var(--text-dim);
        }

        .settings-blocked-empty-full h3 {
          font-size: 18px;
          color: var(--text-secondary);
          margin: 0;
        }

        .settings-blocked-empty-full p {
          font-size: 14px;
          margin: 0;
        }

        /* LIGHT MODE */
        body.light-mode .settings-blocked-item {
          background: var(--bg-card);
          border-color: var(--border-color);
        }

        body.light-mode .settings-blocked-item:hover {
          background: var(--bg-hover);
          border-color: var(--border-light);
        }

        body.light-mode .settings-blocked-name {
          color: var(--text-primary);
        }

        body.light-mode .settings-blocked-username {
          color: var(--text-tertiary);
        }

        body.light-mode .settings-blocked-time {
          color: var(--text-tertiary);
        }

        body.light-mode .settings-blocked-avatar {
          background: var(--bg-input);
          border-color: rgba(0, 0, 0, 0.06);
        }

        body.light-mode .settings-blocked-avatar .avatar-placeholder {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.06), rgba(236, 72, 153, 0.03));
          color: var(--text-tertiary);
        }

        body.light-mode .settings-blocked-reason {
          background: var(--bg-input);
          border-color: var(--border-color);
          color: var(--text-muted);
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .settings-blocked-item {
            flex-wrap: wrap;
            gap: 10px;
            padding: 10px 12px;
          }

          .settings-blocked-avatar {
            width: 38px;
            height: 38px;
          }

          .settings-blocked-name {
            font-size: 13px;
          }

          .settings-blocked-unblock {
            width: 100%;
            justify-content: center;
            padding: 8px;
          }
        }

        @media (max-width: 480px) {
          .settings-blocked-item {
            padding: 8px 10px;
          }

          .settings-blocked-avatar {
            width: 34px;
            height: 34px;
          }

          .settings-blocked-avatar .avatar-placeholder {
            font-size: 14px;
          }

          .settings-blocked-name {
            font-size: 12px;
          }

          .settings-blocked-username {
            font-size: 10px;
          }

          .settings-blocked-time {
            font-size: 10px;
          }

          .settings-blocked-reason {
            font-size: 11px;
            padding: 2px 8px;
          }

          .settings-blocked-unblock {
            font-size: 11px;
            padding: 6px 12px;
          }

          .settings-blocked-empty-full i {
            font-size: 36px;
          }

          .settings-blocked-empty-full h3 {
            font-size: 16px;
          }

          .settings-blocked-empty-full p {
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsBlocked;