// ========== src/pages/Settings/SettingsNotifications.tsx ==========
import React, { useState, useEffect } from 'react';
import { 
  getNotificationSettings, 
  saveNotificationSettings,
  resetNotificationSettings,
  type NotificationSettings 
} from '../../services/notificationSettingsService';
import './SettingsNotifications.css';

interface NotificationItem {
  key: keyof NotificationSettings;
  label: string;
  icon: string;
  desc: string;
}

const NOTIFICATION_ITEMS: NotificationItem[] = [
  { key: 'likes', label: 'Likes', icon: 'fa-heart', desc: 'Quand quelqu\'un aime vos publications' },
  { key: 'comments', label: 'Commentaires', icon: 'fa-comment', desc: 'Quand quelqu\'un commente vos publications' },
  { key: 'mentions', label: 'Mentions', icon: 'fa-at', desc: 'Quand quelqu\'un vous mentionne' },
  { key: 'reactions', label: 'Réactions', icon: 'fa-smile', desc: 'Quand quelqu\'un réagit à vos publications' },
  { key: 'shares', label: 'Partages', icon: 'fa-share', desc: 'Quand quelqu\'un partage vos publications' },
  { key: 'follows', label: 'Abonnements', icon: 'fa-user-plus', desc: 'Quand quelqu\'un vous suit' },
  { key: 'messages', label: 'Messages directs', icon: 'fa-envelope', desc: 'Quand vous recevez un message' },
  { key: 'storyReplies', label: 'Réponses aux stories', icon: 'fa-plus-circle', desc: 'Quand quelqu\'un répond à vos stories' },
  { key: 'events', label: 'Événements', icon: 'fa-calendar-alt', desc: 'Notifications des événements' },
  { key: 'newsletters', label: 'Newsletters', icon: 'fa-newspaper', desc: 'Actualités et newsletters K-POP' },
];

const SettingsNotifications: React.FC = () => {
  const [settings, setSettings] = useState<NotificationSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ============================================================
  // 🔥 CHARGER LES PRÉFÉRENCES
  // ============================================================
  useEffect(() => {
    setLoading(true);
    const unsubscribe = getNotificationSettings((data) => {
      setSettings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ============================================================
  // 🔥 TOGGLE UNE NOTIFICATION
  // ============================================================
  const toggleNotification = (key: keyof NotificationSettings) => {
    if (!settings) return;
    setSettings(prev => ({
      ...prev!,
      [key]: !prev![key],
    }));
  };

  // ============================================================
  // 🔥 SAUVEGARDER
  // ============================================================
  const handleSave = async () => {
    if (!settings) return;
    
    setSaving(true);
    setSaveSuccess(false);
    
    try {
      await saveNotificationSettings(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      alert('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setSaving(false);
    }
  };

  // ============================================================
  // 🔥 RÉINITIALISER
  // ============================================================
  const handleReset = async () => {
    if (!confirm('Voulez-vous vraiment réinitialiser toutes les préférences ?')) return;
    
    try {
      await resetNotificationSettings();
      const unsubscribe = getNotificationSettings((data) => {
        setSettings(data);
      });
      setTimeout(() => unsubscribe(), 100);
      alert('✅ Préférences réinitialisées');
    } catch (error) {
      console.error('❌ Erreur réinitialisation:', error);
      alert('Erreur lors de la réinitialisation.');
    }
  };

  // ============================================================
  // 🔥 RENDER LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="settings-subpage">
        <div className="settings-subpage-header">
          <h2>Notifications</h2>
          <p>Chargement des préférences...</p>
        </div>
        <div className="settings-notifications-loading">
          <div className="loading-spinner" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="settings-subpage">
        <div className="settings-subpage-header">
          <h2>Notifications</h2>
          <p>Erreur de chargement des préférences</p>
        </div>
        <div className="settings-notifications-error">
          <i className="fas fa-exclamation-circle" />
          <span>Impossible de charger vos préférences</span>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // 🔥 RENDER
  // ============================================================
  const enabledCount = Object.values(settings).filter(Boolean).length;
  const totalCount = NOTIFICATION_ITEMS.length;

  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>
          <i className="fas fa-bell" style={{ color: '#C084FC' }} />
          Notifications
        </h2>
        <p>Choisissez les notifications que vous souhaitez recevoir</p>
        <div className="notifications-stats">
          <span className="notifications-count">
            {enabledCount}/{totalCount} activées
          </span>
          <button className="notifications-reset-btn" onClick={handleReset}>
            <i className="fas fa-undo" /> Réinitialiser
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="save-success-toast">
          <i className="fas fa-check-circle" />
          <span>Préférences sauvegardées !</span>
        </div>
      )}

      <div className="settings-notifications-list">
        {NOTIFICATION_ITEMS.map((item) => (
          <div key={item.key} className="settings-notification-item">
            <div className="settings-notification-left">
              <div className="settings-notification-icon" style={{
                background: settings[item.key] ? 'rgba(192, 132, 252, 0.1)' : 'var(--bg-input)',
                color: settings[item.key] ? '#C084FC' : 'var(--text-tertiary)',
              }}>
                <i className={`fas ${item.icon}`} />
              </div>
              <div className="settings-notification-info">
                <span className="settings-notification-label">{item.label}</span>
                <span className="settings-notification-desc">{item.desc}</span>
              </div>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={settings[item.key]}
                onChange={() => toggleNotification(item.key)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
        ))}
      </div>

      <div className="settings-notifications-actions">
        <button 
          className="settings-save-btn" 
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <>
              <span className="spinner-small" />
              Sauvegarde...
            </>
          ) : (
            <>
              <i className="fas fa-check" />
              Sauvegarder les préférences
            </>
          )}
        </button>
      </div>

      {/* ============================================================
          STYLES
      ============================================================ */}
      <style>{`
        .settings-notifications-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 12px;
          color: var(--text-tertiary);
        }

        .settings-notifications-error {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 12px;
          color: var(--text-tertiary);
        }

        .settings-notifications-error i {
          font-size: 36px;
          color: var(--kpop-red);
        }

        .settings-notifications-error button {
          padding: 6px 20px;
          border-radius: 30px;
          background: var(--gradient-primary);
          border: none;
          color: #fff;
          cursor: pointer;
          font-family: inherit;
          font-size: 13px;
          font-weight: 600;
        }

        .loading-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(255,255,255,0.04);
          border-top-color: var(--kpop-violet);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        .spinner-small {
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

        .notifications-stats {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 6px;
        }

        .notifications-count {
          font-size: 12px;
          color: var(--text-tertiary);
          background: var(--bg-input);
          padding: 2px 12px;
          border-radius: 30px;
        }

        .notifications-reset-btn {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 2px 12px;
          border-radius: 30px;
          background: rgba(255, 215, 0, 0.06);
          border: 1px solid rgba(255, 215, 0, 0.08);
          color: var(--kpop-gold);
          font-size: 11px;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
        }

        .notifications-reset-btn:hover {
          background: rgba(255, 215, 0, 0.12);
        }

        .save-success-toast {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          background: rgba(16, 185, 129, 0.08);
          border: 1px solid rgba(16, 185, 129, 0.12);
          border-radius: 10px;
          color: #10B981;
          font-size: 13px;
          margin-bottom: 12px;
          animation: fadeIn 0.3s ease;
        }

        .save-success-toast i {
          font-size: 16px;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .settings-notifications-list {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .settings-notification-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-radius: 10px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          transition: all 0.2s;
        }

        .settings-notification-item:hover {
          background: var(--bg-hover);
          border-color: var(--border-light);
        }

        .settings-notification-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .settings-notification-icon {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
          flex-shrink: 0;
          transition: all 0.3s;
        }

        .settings-notification-info {
          flex: 1;
          min-width: 0;
        }

        .settings-notification-label {
          display: block;
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .settings-notification-desc {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .settings-notifications-actions {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
        }

        .settings-notifications-actions .settings-save-btn {
          width: 100%;
          padding: 10px;
          border-radius: 10px;
          background: var(--gradient-primary);
          border: none;
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .settings-notifications-actions .settings-save-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.2);
        }

        .settings-notifications-actions .settings-save-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .settings-toggle {
          position: relative;
          width: 44px;
          height: 24px;
          flex-shrink: 0;
          cursor: pointer;
        }

        .settings-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }

        .settings-toggle-slider {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          border-radius: 30px;
          transition: all 0.3s ease;
        }

        .settings-toggle-slider::before {
          content: '';
          position: absolute;
          width: 18px;
          height: 18px;
          left: 3px;
          bottom: 3px;
          background: var(--text-tertiary);
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .settings-toggle input:checked + .settings-toggle-slider {
          background: var(--gradient-primary);
          border-color: transparent;
        }

        .settings-toggle input:checked + .settings-toggle-slider::before {
          transform: translateX(20px);
          background: #fff;
        }

        /* RESPONSIVE */
        @media (max-width: 768px) {
          .settings-notification-item {
            padding: 8px 12px;
          }

          .settings-notification-icon {
            width: 28px;
            height: 28px;
            font-size: 11px;
          }

          .settings-notification-label {
            font-size: 12px;
          }

          .settings-notification-desc {
            font-size: 10px;
          }

          .settings-toggle {
            width: 38px;
            height: 20px;
          }

          .settings-toggle-slider::before {
            width: 14px;
            height: 14px;
            left: 2px;
            bottom: 2px;
          }

          .settings-toggle input:checked + .settings-toggle-slider::before {
            transform: translateX(18px);
          }
        }

        @media (max-width: 480px) {
          .settings-notification-item {
            flex-wrap: wrap;
            gap: 8px;
          }

          .settings-notification-left {
            flex: 1;
            min-width: 0;
          }

          .settings-notification-icon {
            width: 24px;
            height: 24px;
            font-size: 10px;
          }

          .settings-notification-label {
            font-size: 11px;
          }

          .settings-notification-desc {
            font-size: 9px;
          }

          .settings-toggle {
            width: 34px;
            height: 18px;
          }

          .settings-toggle-slider::before {
            width: 12px;
            height: 12px;
            left: 2px;
            bottom: 2px;
          }

          .settings-toggle input:checked + .settings-toggle-slider::before {
            transform: translateX(16px);
          }

          .notifications-stats {
            flex-wrap: wrap;
          }

          .settings-notifications-actions .settings-save-btn {
            font-size: 13px;
            padding: 8px;
          }
        }

        /* LIGHT MODE */
        body.light-mode .settings-notification-item {
          background: var(--bg-input);
          border-color: var(--border-color);
        }

        body.light-mode .settings-notification-item:hover {
          background: var(--bg-hover);
          border-color: var(--border-light);
        }

        body.light-mode .settings-notification-label {
          color: var(--text-primary);
        }

        body.light-mode .settings-notification-desc {
          color: var(--text-tertiary);
        }

        body.light-mode .settings-toggle-slider {
          background: var(--bg-input);
          border-color: var(--border-color);
        }

        body.light-mode .settings-toggle-slider::before {
          background: var(--text-tertiary);
        }

        body.light-mode .settings-toggle input:checked + .settings-toggle-slider {
          background: var(--gradient-primary);
        }
      `}</style>
    </div>
  );
};

export default SettingsNotifications;