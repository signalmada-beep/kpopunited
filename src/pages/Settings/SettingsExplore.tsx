// ========== src/pages/Settings/SettingsExplore.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getExploreSettings, saveExploreSettings, resetExploreSettings } from '../../utils/exploreSettings';
import './SettingsExplore.css';

const SettingsExplore: React.FC = () => {
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    showDataWarning: true,
    useWiFiOnly: false,
    autoRefreshNews: true,
    maxNewsPerCategory: 10,
    useGoogleFallback: true,
  });
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    const saved = getExploreSettings();
    setSettings(saved);
  }, []);

  const handleChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    saveExploreSettings(settings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleReset = () => {
    if (confirm('Reset all Explore settings to default?')) {
      resetExploreSettings();
      setSettings(getExploreSettings());
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>
          <i className="fas fa-compass" style={{ color: '#C084FC' }} />
          Explore Settings
        </h2>
        <p>Customize your Explore experience</p>
      </div>

      {saveSuccess && (
        <div className="save-success-toast">
          <i className="fas fa-check-circle" />
          <span>Settings saved successfully!</span>
        </div>
      )}

      <div className="settings-form">

        {/* Data Usage Warning */}
        <div className="settings-form-group explore-toggle">
          <div className="toggle-info">
            <span className="settings-form-label">
              <i className="fas fa-wifi" style={{ color: '#FFD700' }} />
              Show Data Usage Warning
            </span>
            <span className="settings-form-desc">
              Display a warning when entering the Explore page
            </span>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.showDataWarning}
              onChange={(e) => handleChange('showDataWarning', e.target.checked)}
            />
            <span className="settings-toggle-slider" />
          </label>
        </div>

        {/* WiFi Only */}
        <div className="settings-form-group explore-toggle">
          <div className="toggle-info">
            <span className="settings-form-label">
              <i className="fas fa-wifi" style={{ color: '#4A90D9' }} />
              Wi-Fi Only Mode
            </span>
            <span className="settings-form-desc">
              Only load Explore content when connected to Wi-Fi
            </span>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.useWiFiOnly}
              onChange={(e) => handleChange('useWiFiOnly', e.target.checked)}
            />
            <span className="settings-toggle-slider" />
          </label>
        </div>

        {/* Auto Refresh News */}
        <div className="settings-form-group explore-toggle">
          <div className="toggle-info">
            <span className="settings-form-label">
              <i className="fas fa-sync-alt" style={{ color: '#00B894' }} />
              Auto-Refresh News
            </span>
            <span className="settings-form-desc">
              Automatically refresh news when switching categories
            </span>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.autoRefreshNews}
              onChange={(e) => handleChange('autoRefreshNews', e.target.checked)}
            />
            <span className="settings-toggle-slider" />
          </label>
        </div>

        {/* Google Fallback */}
        <div className="settings-form-group explore-toggle">
          <div className="toggle-info">
            <span className="settings-form-label">
              <i className="fas fa-globe" style={{ color: '#4285F4' }} />
              External Search Fallback
            </span>
            <span className="settings-form-desc">
              Use external search when News API is unavailable
            </span>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={settings.useGoogleFallback}
              onChange={(e) => handleChange('useGoogleFallback', e.target.checked)}
            />
            <span className="settings-toggle-slider" />
          </label>
        </div>

        {/* Max News Per Category */}
        <div className="settings-form-group">
          <div className="settings-form-label">
            <i className="fas fa-list" style={{ color: '#C084FC' }} />
            Max News Per Category
          </div>
          <div className="settings-range-wrapper">
            <input
              type="range"
              min="3"
              max="20"
              step="1"
              value={settings.maxNewsPerCategory}
              onChange={(e) => handleChange('maxNewsPerCategory', parseInt(e.target.value))}
              className="settings-range"
              style={{
                background: `linear-gradient(to right, #C084FC 0%, #C084FC ${((settings.maxNewsPerCategory - 3) / 17) * 100}%, var(--bg-input) ${((settings.maxNewsPerCategory - 3) / 17) * 100}%, var(--bg-input) 100%)`
              }}
            />
            <span className="settings-range-value">{settings.maxNewsPerCategory}</span>
          </div>
          <span className="settings-form-desc">Number of news articles shown per category (3-20)</span>
        </div>

        {/* Actions */}
        <div className="settings-form-actions">
          <button className="settings-reset-btn" onClick={handleReset}>
            <i className="fas fa-undo" /> Reset to Default
          </button>
          <button className="settings-save-btn" onClick={handleSave}>
            <i className="fas fa-check" /> Save Settings
          </button>
        </div>

        {/* Info */}
        <div className="settings-info-box">
          <i className="fas fa-info-circle" />
          <div>
            <strong>About Explore Settings</strong>
            <p>
              The Explore page fetches content from the K-POP News Network.
              Adjust these settings to control data usage and performance.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
};

export default SettingsExplore;