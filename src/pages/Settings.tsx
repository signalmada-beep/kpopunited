// ========== src/pages/Settings/Settings.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './Settings.css';

// Imports des sous-composants
import SettingsAbout from './SettingsAbout';
import SettingsAccount from './SettingsAccount';
import SettingsAppearance from './SettingsAppearance';
import SettingsBlocked from './SettingsBlocked';
import SettingsExplore from './SettingsExplore';
import SettingsHelp from './SettingsHelp';
import SettingsLanguage from './SettingsLanguage';
import SettingsNotifications from './SettingsNotifications';
import SettingsPrivacy from './SettingsPrivacy';
import SettingsProfile from './SettingsProfile';
import SettingsSecurity from './SettingsSecurity';

interface SettingsItem {
  id: string;
  icon: string;
  label: string;
  path: string;
  description?: string;
  badge?: string;
}

const Settings: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const [activeItem, setActiveItem] = useState<string>('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const settingsItems: SettingsItem[] = [
    { id: 'about', icon: 'fa-info-circle', label: 'About', path: '/settings/about', description: 'About K-POP UNITED' },
    { id: 'account', icon: 'fa-cog', label: 'Account', path: '/settings/account', description: 'Manage your account settings' },
    { id: 'appearance', icon: 'fa-palette', label: 'Appearance', path: '/settings/appearance', description: 'Customize the look and feel' },
    { id: 'blocked', icon: 'fa-user-slash', label: 'Blocked users', path: '/settings/blocked', description: 'View and manage blocked users' },
    { id: 'explore', icon: 'fa-compass', label: 'Explore Settings', path: '/settings/explore', description: 'Manage Explore page preferences' },
    { id: 'help', icon: 'fa-question-circle', label: 'Help & Support', path: '/settings/help', description: 'Get help and support' },
    { id: 'language', icon: 'fa-language', label: 'Language', path: '/settings/language', description: 'Change your language preference' },
    { id: 'notifications', icon: 'fa-bell', label: 'Notifications', path: '/settings/notifications', description: 'Configure notification preferences' },
    { id: 'privacy', icon: 'fa-lock', label: 'Privacy & Security', path: '/settings/privacy', description: 'Control your privacy settings' },
    { id: 'profile', icon: 'fa-user', label: 'Profile', path: '/settings/profile', description: 'Edit your profile information' },
    { id: 'security', icon: 'fa-shield-alt', label: 'Security', path: '/settings/security', description: 'Manage security settings' },
  ];

  // ============================================================
  // 🔥 MAMPIDINA NY ACTIVE ITEM
  // ============================================================
  useEffect(() => {
    const path = location.pathname;
    const active = settingsItems.find(item => path === item.path);
    if (active) {
      setActiveItem(active.path);
    } else if (path === '/settings' || path === '/settings/') {
      setActiveItem('/settings/profile');
    }
  }, [location.pathname, settingsItems]);

  const handleItemClick = (path: string) => {
    navigate(path);
    setActiveItem(path);
  };

  // ============================================================
  // 🔥 HANDLE LOGOUT
  // ============================================================
  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await logout();
      navigate('/auth');
    } catch (error) {
      console.error('❌ Erreur lors de la déconnexion:', error);
      alert('Erreur lors de la déconnexion. Veuillez réessayer.');
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  // ============================================================
  // 🔥 REDIRECTION VERS /settings/profile REHEFA MIDITRA /settings
  // ============================================================
  useEffect(() => {
    if (location.pathname === '/settings' || location.pathname === '/settings/') {
      navigate('/settings/profile', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="settings-page">
      {/* HEADER */}
      <div className="settings-header">
        <button className="settings-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left" />
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-container">
        {/* MENU GAUCHE */}
        <div className="settings-menu">
          <div className="settings-menu-list">
            {settingsItems.map((item) => (
              <button
                key={item.id}
                className={`settings-menu-item ${activeItem === item.path ? 'active' : ''}`}
                onClick={() => handleItemClick(item.path)}
              >
                <i className={`fas ${item.icon}`} />
                <div className="settings-menu-info">
                  <span className="settings-menu-label">{item.label}</span>
                  <span className="settings-menu-desc">{item.description}</span>
                </div>
                {item.badge && <span className="settings-menu-badge">{item.badge}</span>}
                <i className="fas fa-chevron-right" />
              </button>
            ))}
          </div>
          
          {/* ✅ BOUTON LOGOUT */}
          <button 
            className="settings-logout" 
            onClick={() => setShowLogoutModal(true)}
            disabled={isLoggingOut}
          >
            <i className="fas fa-sign-out-alt" />
            <span>{isLoggingOut ? 'Déconnexion...' : 'Logout'}</span>
          </button>
        </div>

        {/* CONTENT DROITE */}
        <div className="settings-content">
          <Routes>
            <Route path="/" element={<SettingsProfile />} />
            <Route path="about" element={<SettingsAbout />} />
            <Route path="account" element={<SettingsAccount />} />
            <Route path="appearance" element={<SettingsAppearance />} />
            <Route path="blocked" element={<SettingsBlocked />} />
            <Route path="explore" element={<SettingsExplore />} />
            <Route path="help" element={<SettingsHelp />} />
            <Route path="language" element={<SettingsLanguage />} />
            <Route path="notifications" element={<SettingsNotifications />} />
            <Route path="privacy" element={<SettingsPrivacy />} />
            <Route path="profile" element={<SettingsProfile />} />
            <Route path="security" element={<SettingsSecurity />} />
          </Routes>
        </div>
      </div>

      {/* FOOTER */}
      <div className="settings-footer">
        <p>© 2026 K-POP UNITED. All rights reserved.</p>
        <p className="settings-version">Version 2.0.1</p>
      </div>

      {/* ============================================================
          MODAL DE CONFIRMATION LOGOUT
      ============================================================ */}
      {showLogoutModal && (
        <div className="premium-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="modal-header-icon logout">
                <i className="fas fa-sign-out-alt" />
              </div>
              <h3>Déconnexion</h3>
              <button className="modal-close" onClick={() => setShowLogoutModal(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="premium-modal-body">
              <p>Êtes-vous sûr de vouloir vous déconnecter ?</p>
              <p className="modal-hint">Vous pourrez toujours vous reconnecter plus tard.</p>
            </div>
            <div className="premium-modal-footer">
              <button 
                className="modal-btn secondary" 
                onClick={() => setShowLogoutModal(false)}
                disabled={isLoggingOut}
              >
                Annuler
              </button>
              <button 
                className="modal-btn primary logout-btn" 
                onClick={handleLogout}
                disabled={isLoggingOut}
              >
                {isLoggingOut ? (
                  <>
                    <span className="spinner-small" />
                    Déconnexion...
                  </>
                ) : (
                  <>
                    <i className="fas fa-sign-out-alt" />
                    Se déconnecter
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          STYLES POUR LE MODAL
      ============================================================ */}
      <style>{`
        .premium-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
          z-index: 99999 !important;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: calc(var(--header-height, 72px) + 16px);
          padding-bottom: 16px;
          padding-left: 20px;
          padding-right: 20px;
          overflow-y: auto;
        }

        .premium-modal {
          background: var(--bg-secondary);
          border-radius: 20px;
          max-width: 440px;
          width: 100%;
          max-height: calc(100vh - var(--header-height, 72px) - 32px);
          overflow-y: auto;
          border: 1px solid var(--border-color);
          box-shadow: 0 24px 80px rgba(0, 0, 0, 0.5);
          position: relative;
          z-index: 99999;
          margin: 0 auto;
          animation: modalSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .premium-modal-header {
          display: flex;
          align-items: center;
          gap: 14px;
          padding: 18px 20px 14px;
          border-bottom: 1px solid var(--border-color);
          position: sticky;
          top: 0;
          background: var(--bg-secondary);
          z-index: 10;
          border-radius: 20px 20px 0 0;
        }

        .modal-header-icon.logout {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          color: #fff;
          flex-shrink: 0;
          background: rgba(239, 68, 68, 0.1);
          color: var(--kpop-red);
        }

        .premium-modal-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          margin: 0;
          flex: 1;
        }

        .modal-close {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: var(--bg-input);
          border: none;
          color: var(--text-tertiary);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 14px;
          flex-shrink: 0;
        }

        .modal-close:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .premium-modal-body {
          padding: 18px 20px;
          overflow-y: auto;
        }

        .premium-modal-body p {
          font-size: 14px;
          color: var(--text-secondary);
          margin: 0 0 6px 0;
          text-align: center;
        }

        .modal-hint {
          font-size: 12px !important;
          color: var(--text-tertiary) !important;
        }

        .premium-modal-footer {
          display: flex;
          gap: 10px;
          padding: 12px 20px 18px;
          border-top: 1px solid var(--border-color);
          position: sticky;
          bottom: 0;
          background: var(--bg-secondary);
          border-radius: 0 0 20px 20px;
        }

        .modal-btn {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          border: none;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .modal-btn.secondary {
          background: var(--bg-input);
          color: var(--text-tertiary);
          border: 1px solid var(--border-color);
        }

        .modal-btn.secondary:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }

        .modal-btn.primary {
          background: var(--gradient-primary);
          color: #fff;
          box-shadow: 0 4px 16px rgba(192, 132, 252, 0.15);
        }

        .modal-btn.primary:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 6px 24px rgba(192, 132, 252, 0.25);
        }

        .modal-btn.primary.logout-btn {
          background: rgba(239, 68, 68, 0.1);
          color: var(--kpop-red);
          border: 1px solid rgba(239, 68, 68, 0.06);
        }

        .modal-btn.primary.logout-btn:hover:not(:disabled) {
          background: rgba(239, 68, 68, 0.2);
        }

        .modal-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .spinner-small {
          display: inline-block;
          width: 14px;
          height: 14px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 768px) {
          .premium-modal-overlay {
            padding-top: calc(var(--header-height, 64px) + 12px);
            padding-bottom: 12px;
            padding-left: 10px;
            padding-right: 10px;
          }
          .premium-modal {
            max-height: calc(100vh - var(--header-height, 64px) - 24px);
            border-radius: 16px;
          }
          .premium-modal-header {
            padding: 14px 16px 10px;
            border-radius: 16px 16px 0 0;
          }
          .premium-modal-footer {
            padding: 10px 16px 14px;
            border-radius: 0 0 16px 16px;
            flex-direction: column;
          }
        }

        @media (max-width: 480px) {
          .premium-modal-overlay {
            padding-top: calc(var(--header-height, 56px) + 8px);
            padding-bottom: 8px;
            padding-left: 6px;
            padding-right: 6px;
          }
          .premium-modal {
            max-height: calc(100vh - var(--header-height, 56px) - 16px);
            border-radius: 12px;
            max-width: 100%;
          }
          .premium-modal-header {
            padding: 12px 14px 8px;
            border-radius: 12px 12px 0 0;
          }
          .premium-modal-footer {
            padding: 8px 14px 12px;
            border-radius: 0 0 12px 12px;
            flex-direction: column;
          }
          .premium-modal-header h3 {
            font-size: 16px;
          }
          .modal-btn {
            font-size: 13px;
            padding: 8px;
          }
        }

        /* LIGHT MODE */
        body.light-mode .premium-modal {
          background: var(--bg-secondary);
          border-color: var(--border-color);
        }
        body.light-mode .premium-modal-header {
          background: var(--bg-secondary);
          border-color: var(--border-color);
        }
        body.light-mode .premium-modal-footer {
          background: var(--bg-secondary);
          border-color: var(--border-color);
        }
        body.light-mode .modal-btn.secondary {
          background: var(--bg-input);
          border-color: var(--border-color);
          color: var(--text-tertiary);
        }
        body.light-mode .modal-btn.secondary:hover {
          background: var(--bg-hover);
          color: var(--text-primary);
        }
      `}</style>
    </div>
  );
};

export default Settings;