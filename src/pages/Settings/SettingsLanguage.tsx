// ========== src/pages/Settings/SettingsLanguage.tsx ==========
import React, { useState } from 'react';
import './SettingsLanguage.css';

const languages = [
  { code: 'fr', name: 'Français'},
  { code: 'en', name: 'English'},
  { code: 'ko', name: '한국어'},
  { code: 'ja', name: '日本語'},
  { code: 'zh', name: '中文'},
  { code: 'es', name: 'Español'},
  { code: 'de', name: 'Deutsch'},
  { code: 'pt', name: 'Português'},
];

const SettingsLanguage: React.FC = () => {
  const [selectedLang, setSelectedLang] = useState('fr');

  const handleSave = () => {
    alert(`✅ Language changed to ${languages.find(l => l.code === selectedLang)?.name}`);
  };

  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>Language</h2>
        <p>Choose your preferred language</p>
      </div>

      <div className="settings-language-list">
        {languages.map((lang) => (
          <button
            key={lang.code}
            className={`settings-language-item ${selectedLang === lang.code ? 'active' : ''}`}
            onClick={() => setSelectedLang(lang.code)}
          >
            <span className="settings-language-flag">{lang.flag}</span>
            <span className="settings-language-name">{lang.name}</span>
            <span className="settings-language-code">{lang.code.toUpperCase()}</span>
            {selectedLang === lang.code && (
              <span className="settings-language-check">
                <i className="fas fa-check-circle" />
              </span>
            )}
          </button>
        ))}
      </div>

      <button className="settings-save-btn" onClick={handleSave}>
        <i className="fas fa-check" /> Save Language
      </button>
    </div>
  );
};

export default SettingsLanguage;