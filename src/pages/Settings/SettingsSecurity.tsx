// ========== src/pages/Settings/SettingsSecurity.tsx ==========
import React, { useState } from 'react';
import './SettingsSecurity.css';

const SettingsSecurity: React.FC = () => {
  const [twoFactor, setTwoFactor] = useState(false);
  const [sessionDevices] = useState([
    { name: 'Chrome - Windows', location: 'Seoul, South Korea', lastActive: '2 min ago', current: true },
    { name: 'Safari - iPhone', location: 'Busan, South Korea', lastActive: '2 hours ago', current: false },
    { name: 'Firefox - Mac', location: 'Tokyo, Japan', lastActive: '3 days ago', current: false },
  ]);

  const handleSave = () => {
    alert('✅ Security settings saved!');
  };

  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>Security</h2>
        <p>Manage your security settings</p>
      </div>

      <div className="settings-security-section">
        <h4>Two-Factor Authentication</h4>
        <div className="settings-security-item">
          <div className="settings-security-info">
            <span className="settings-security-label">2FA Protection</span>
            <span className="settings-security-desc">Add an extra layer of security to your account</span>
          </div>
          <label className="settings-toggle">
            <input
              type="checkbox"
              checked={twoFactor}
              onChange={() => setTwoFactor(!twoFactor)}
            />
            <span className="settings-toggle-slider" />
          </label>
        </div>

        <div className="settings-security-item">
          <div className="settings-security-info">
            <span className="settings-security-label">Change Password</span>
            <span className="settings-security-desc">Update your password regularly</span>
          </div>
          <button className="settings-security-action">Change</button>
        </div>
      </div>

      <div className="settings-security-section">
        <h4>Active Sessions</h4>
        {sessionDevices.map((device, index) => (
          <div key={index} className={`settings-session-item ${device.current ? 'current' : ''}`}>
            <div className="settings-session-info">
              <span className="settings-session-name">
                {device.name}
                {device.current && <span className="settings-session-badge">Current</span>}
              </span>
              <span className="settings-session-detail">
                <i className="fas fa-map-marker-alt" /> {device.location}
              </span>
              <span className="settings-session-detail">
                <i className="fas fa-clock" /> {device.lastActive}
              </span>
            </div>
            {!device.current && (
              <button className="settings-session-action">Revoke</button>
            )}
          </div>
        ))}
      </div>

      <button className="settings-save-btn" onClick={handleSave}>
        <i className="fas fa-check" /> Save Security Settings
      </button>
    </div>
  );
};

export default SettingsSecurity;