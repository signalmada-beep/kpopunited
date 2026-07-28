// ========== src/pages/Settings/SettingsAbout.tsx ==========
import React from 'react';
import './SettingsAbout.css';

const SettingsAbout: React.FC = () => {
  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>About</h2>
        <p>Information about K-POP UNITED</p>
      </div>

      <div className="settings-about-content">
        <div className="settings-about-logo">
          <i className="fas fa-microphone" />
          <h1>K-POP UNITED</h1>
        </div>

        <div className="settings-about-info">
          <div className="settings-about-item">
            <span className="settings-about-label">Version</span>
            <span className="settings-about-value">2.0.1</span>
          </div>
          <div className="settings-about-item">
            <span className="settings-about-label">Release Date</span>
            <span className="settings-about-value">June 2026</span>
          </div>
          <div className="settings-about-item">
            <span className="settings-about-label">Platform</span>
            <span className="settings-about-value">Web • Mobile • Desktop</span>
          </div>
        </div>

        <div className="settings-about-description">
          <p>
            K-POP UNITED is the ultimate social platform for K-Pop fans worldwide.
            Connect with fellow fans, share your passion, and stay up-to-date with
            the latest news and events from the K-Pop world.
          </p>
        </div>

        <div className="settings-about-links">
          <a href="#" className="settings-about-link">
            <i className="fas fa-file-contract" /> Terms of Service
          </a>
          <a href="#" className="settings-about-link">
            <i className="fas fa-lock" /> Privacy Policy
          </a>
          <a href="#" className="settings-about-link">
            <i className="fas fa-shield-alt" /> Cookie Policy
          </a>
          <a href="#" className="settings-about-link">
            <i className="fas fa-code-branch" /> Open Source Licenses
          </a>
        </div>

        <div className="settings-about-footer">
          <p>© 2026 K-POP UNITED. All rights reserved.</p>
          <p className="settings-about-made">Made with ❤️ for K-Pop fans worldwide</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsAbout;