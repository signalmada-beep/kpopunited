// ========== src/pages/Settings/SettingsHelp.tsx ==========
import React from 'react';
import './SettingsHelp.css';

const SettingsHelp: React.FC = () => {
  const helpItems = [
    { icon: 'fa-question-circle', label: 'FAQ', desc: 'Frequently asked questions' },
    { icon: 'fa-envelope', label: 'Contact Support', desc: 'Get help from our support team' },
    { icon: 'fa-comment', label: 'Live Chat', desc: 'Chat with support in real-time' },
    { icon: 'fa-book', label: 'User Guide', desc: 'Read our comprehensive user guide' },
    { icon: 'fa-bug', label: 'Report a Bug', desc: 'Report technical issues' },
    { icon: 'fa-lightbulb', label: 'Feature Request', desc: 'Suggest new features' },
  ];

  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>Help & Support</h2>
        <p>Get help and support for K-POP UNITED</p>
      </div>

      <div className="settings-help-grid">
        {helpItems.map((item, index) => (
          <button key={index} className="settings-help-item">
            <div className="settings-help-icon">
              <i className={`fas ${item.icon}`} />
            </div>
            <div className="settings-help-info">
              <span className="settings-help-label">{item.label}</span>
              <span className="settings-help-desc">{item.desc}</span>
            </div>
            <i className="fas fa-chevron-right" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SettingsHelp;