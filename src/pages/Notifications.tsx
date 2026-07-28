// ========== src/pages/Notifications.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getUserNotifications, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  type Notification 
} from '../services/notificationService';
import '../styles/Notifications.css';

const Notifications: React.FC = () => {
  const navigate = useNavigate();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'mentions'>('all');
  const [loading, setLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // ============================================================
  // CHARGER LES NOTIFICATIONS AVEC TIMEOUT
  // ============================================================
  useEffect(() => {
    setLoading(true);
    setLoadingError(null);
    
    // ⏱️ Timeout 8 segondra raha tsy misy valiny
    const timeout = setTimeout(() => {
      setLoading(false);
      setLoadingError('Connection timeout. Please refresh.');
    }, 8000);
    setTimeoutId(timeout);
    
    try {
      const unsubscribe = getUserNotifications((data) => {
        if (timeout) clearTimeout(timeout);
        setNotifications(data);
        setLoading(false);
        setLoadingError(null);
      });

      return () => {
        if (timeout) clearTimeout(timeout);
        unsubscribe();
      };
    } catch (error) {
      setLoading(false);
      setLoadingError('Failed to load notifications');
      return () => {};
    }
  }, []);

  // ============================================================
  // HANDLERS
  // ============================================================
  const handleMarkRead = async (id: string) => {
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsAsRead();
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer cette notification ?')) {
      await deleteNotification(id);
    }
  };

  // ============================================================
  // FILTRES
  // ============================================================
  const filtered = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    if (filter === 'mentions') return n.type === 'mention';
    return true;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  // ============================================================
  // FORMATAGE
  // ============================================================
  const getIcon = (type: Notification['type']) => {
    switch (type) {
      case 'like': return 'fa-heart';
      case 'comment': return 'fa-comment';
      case 'share': return 'fa-share';
      case 'reaction': return 'fa-smile';
      case 'event_going': return 'fa-calendar-check';
      case 'event_interested': return 'fa-calendar-plus';
      case 'vote': return 'fa-vote-yea';
      case 'follow': return 'fa-user-plus';
      case 'mention': return 'fa-at';
      default: return 'fa-bell';
    }
  };

  const getColor = (type: Notification['type']) => {
    switch (type) {
      case 'like': return '#EC4899';
      case 'comment': return '#4A90D9';
      case 'share': return '#00B894';
      case 'reaction': return '#FFD700';
      case 'event_going': return '#C084FC';
      case 'event_interested': return '#EC4899';
      case 'vote': return '#FDCB6E';
      case 'follow': return '#00B894';
      case 'mention': return '#FDCB6E';
      default: return '#7A7A9A';
    }
  };

  const formatTimeAgo = (ts: number) => {
    const diff = Date.now() - ts;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}j`;
    return new Date(ts).toLocaleDateString();
  };

  // ============================================================
  // RENDER LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="notifications-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '12px', height: '100%' }}>
        <div className="loading-spinner" />
        <span style={{ color: 'var(--text-tertiary)' }}>Chargement des notifications...</span>
        {loadingError && (
          <span style={{ color: 'var(--kpop-red)', fontSize: '13px' }}>{loadingError}</span>
        )}
      </div>
    );
  }

  // ============================================================
  // RENDER (MIPOITRA NA DIA TSY MISY NOTIFICATIONS)
  // ============================================================
  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="notifications-header-left">
          <h1 className="notifications-title">
            <i className="fas fa-bell" style={{ color: '#C084FC' }} />
            Notifications
          </h1>
          <span className="notifications-count">
            {unreadCount} non lus
          </span>
        </div>
        {unreadCount > 0 && (
          <button className="mark-all-read-btn" onClick={handleMarkAllRead}>
            <i className="fas fa-check-double" /> Tout marquer comme lu
          </button>
        )}
      </div>

      <div className="notifications-filters">
        {['all', 'unread', 'mentions'].map((f) => (
          <button
            key={f}
            className={`filter-btn ${filter === f ? 'active' : ''}`}
            onClick={() => setFilter(f as any)}
          >
            {f === 'all' && 'Toutes'}
            {f === 'unread' && 'Non lues'}
            {f === 'mentions' && 'Mentions'}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {filtered.length > 0 ? (
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${notif.read ? 'read' : 'unread'}`}
              onClick={() => {
                if (!notif.read) handleMarkRead(notif.id);
                if (notif.link) navigate(notif.link);
              }}
            >
              <div className="notification-icon" style={{ background: getColor(notif.type) }}>
                <i className={`fas ${getIcon(notif.type)}`} />
              </div>
              <div className="notification-content">
                <div className="notification-user">
                  <span className="notification-username">{notif.userName}</span>
                  <span className="notification-action">
                    {notif.type === 'like' && 'a aimé votre publication'}
                    {notif.type === 'comment' && 'a commenté votre publication'}
                    {notif.type === 'share' && 'a partagé votre publication'}
                    {notif.type === 'reaction' && 'a réagi à votre publication'}
                    {notif.type === 'event_going' && 'participe à votre événement'}
                    {notif.type === 'event_interested' && 'est intéressé par votre événement'}
                    {notif.type === 'vote' && 'a voté pour votre proposition'}
                    {notif.type === 'follow' && 'vous suit maintenant'}
                    {notif.type === 'mention' && 'vous a mentionné'}
                  </span>
                </div>
                {notif.target && <span className="notification-target">{notif.target}</span>}
                <span className="notification-time">{formatTimeAgo(notif.timestamp)}</span>
              </div>
              {!notif.read && <div className="notification-dot" />}
              <button 
                className="notification-delete"
                onClick={(e) => handleDelete(notif.id, e)}
                title="Supprimer"
              >
                <i className="fas fa-times" />
              </button>
            </div>
          ))
        ) : (
          <div className="notifications-empty">
            <i className="fas fa-bell-slash" />
            <h3>Aucune notification</h3>
            <p>Vous êtes à jour !</p>
          </div>
        )}
      </div>

      <style>{`
        .notification-delete {
          background: none;
          border: none;
          color: rgba(255,255,255,0.1);
          cursor: pointer;
          padding: 4px 8px;
          font-size: 12px;
          transition: color 0.2s;
          flex-shrink: 0;
        }
        .notification-delete:hover {
          color: #EF4444;
        }
        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.04);
          border-top-color: #C084FC;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Notifications;