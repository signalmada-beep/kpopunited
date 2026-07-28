// ========== src/pages/Settings/Settings.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, useLocation } from 'react-router-dom';
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
  const [activeItem, setActiveItem] = useState<string>('');

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

  useEffect(() => {
    const path = location.pathname;
    const active = settingsItems.find(item => path.includes(item.path));
    if (active) {
      setActiveItem(active.path);
    } else if (path === '/settings' || path === '/settings/') {
      setActiveItem('/settings/profile');
    }
  }, [location, settingsItems]);

  const handleItemClick = (path: string) => {
    navigate(path);
    setActiveItem(path);
  };

  useEffect(() => {
    if (location.pathname === '/settings' || location.pathname === '/settings/') {
      navigate('/settings/profile', { replace: true });
    }
  }, [location.pathname, navigate]);

  return (
    <div className="settings-page">
      <div className="settings-header">
        <button className="settings-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left" />
        </button>
        <h1 className="settings-title">Settings</h1>
      </div>

      <div className="settings-container">
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
          <button className="settings-logout" onClick={() => navigate('/auth')}>
            <i className="fas fa-sign-out-alt" />
            <span>Logout</span>
          </button>
        </div>

        <div className="settings-content">
          <Routes>
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

      <div className="settings-footer">
        <p>© 2026 K-POP UNITED. All rights reserved.</p>
        <p className="settings-version">Version 2.0.1</p>
      </div>
    </div>
  );
};

export default Settings;