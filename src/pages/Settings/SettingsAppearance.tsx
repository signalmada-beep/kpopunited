// ========== src/pages/Settings/SettingsAppearance.tsx ==========
import React, { useState, useContext, useEffect } from 'react';
import { ThemeContext } from '../../App';
import './SettingsAppearance.css';

const SettingsAppearance: React.FC = () => {
  const { isDark, toggleTheme } = useContext(ThemeContext);
  const [language, setLanguage] = useState('fr');
  const [selectedTheme, setSelectedTheme] = useState<'dark' | 'light' | 'system'>(isDark ? 'dark' : 'light');

  useEffect(() => {
    setSelectedTheme(isDark ? 'dark' : 'light');
  }, [isDark]);

  const handleThemeChange = (theme: 'dark' | 'light' | 'system') => {
    setSelectedTheme(theme);
    
    if (theme === 'dark') {
      if (!isDark) toggleTheme();
    } else if (theme === 'light') {
      if (isDark) toggleTheme();
    } else if (theme === 'system') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if ((prefersDark && !isDark) || (!prefersDark && isDark)) {
        toggleTheme();
      }
    }
  };

  const handleSave = () => {
    alert('✅ Appearance settings saved!');
  };

  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>Appearance</h2>
        <p>Customize how K-POP UNITED looks for you</p>
      </div>

      <div className="settings-appearance-section">
        <h4>Theme</h4>
        <div className="settings-theme-options">
          {['dark', 'light', 'system'].map((t) => (
            <button
              key={t}
              className={`settings-theme-option ${selectedTheme === t ? 'active' : ''}`}
              onClick={() => handleThemeChange(t as any)}
            >
              <div className={`settings-theme-preview ${t}`}>
                {t === 'dark' && <i className="fas fa-moon" />}
                {t === 'light' && <i className="fas fa-sun" />}
                {t === 'system' && <i className="fas fa-desktop" />}
              </div>
              <span>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
              {selectedTheme === t && (
                <span className="settings-theme-check">
                  <i className="fas fa-check-circle" />
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="settings-appearance-section">
        <h4>Language</h4>
        <select value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="fr">Français</option>
          <option value="en">English</option>
          <option value="ko">한국어</option>
          <option value="ja">日本語</option>
          <option value="zh">中文</option>
        </select>
      </div>

      <button className="settings-save-btn" onClick={handleSave}>
        <i className="fas fa-check" /> Save Appearance Settings
      </button>
    </div>
  );
};

export default SettingsAppearance;