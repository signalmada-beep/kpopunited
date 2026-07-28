// ========== src/pages/Settings/SettingsPrivacy.tsx ==========
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  getPrivacySettings,
  savePrivacySettings,
  resetPrivacySettings,
  type PrivacySettings,
} from '../../services/privacySettingsService';
import './SettingsPrivacy.css';

interface PrivacyItem {
  key: keyof PrivacySettings;
  label: string;
  desc: string;
  value: string;
  options: { value: string; label: string }[];
}

interface ToggleItem {
  key: keyof PrivacySettings;
  label: string;
  desc: string;
  enabled: boolean;
}

const SettingsPrivacy: React.FC = () => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PrivacySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // ============================================================
  // 🔥 CHARGER LES PRÉFÉRENCES
  // ============================================================
  useEffect(() => {
    setLoading(true);
    const unsubscribe = getPrivacySettings((data) => {
      setSettings(data);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // ============================================================
  // 🔥 HANDLER - CHANGEMENT
  // ============================================================
  const handlePrivacyChange = (key: keyof PrivacySettings, value: string) => {
    if (!settings) return;
    setSettings(prev => ({
      ...prev!,
      [key]: value,
    }));
  };

  const handleToggle = (key: keyof PrivacySettings) => {
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
      await savePrivacySettings(settings);
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
    if (!confirm('Voulez-vous vraiment réinitialiser toutes les préférences de confidentialité ?')) return;
    
    try {
      await resetPrivacySettings();
      const unsubscribe = getPrivacySettings((data) => {
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
          <h2>Confidentialité & Sécurité</h2>
          <p>Chargement des préférences...</p>
        </div>
        <div className="settings-privacy-loading">
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
          <h2>Confidentialité & Sécurité</h2>
          <p>Erreur de chargement des préférences</p>
        </div>
      </div>
    );
  }

  // ============================================================
  // 🔥 DONNÉES
  // ============================================================
  const privacyItems: PrivacyItem[] = [
    {
      key: 'profileVisibility',
      label: 'Visibilité du profil',
      desc: 'Qui peut voir votre profil',
      value: settings.profileVisibility,
      options: [
        { value: 'public', label: 'Public' },
        { value: 'followers', label: 'Abonnés uniquement' },
        { value: 'private', label: 'Privé' },
      ],
    },
    {
      key: 'allowMessages',
      label: 'Qui peut vous envoyer des messages',
      desc: 'Contrôler qui peut vous envoyer des messages directs',
      value: settings.allowMessages,
      options: [
        { value: 'everyone', label: 'Tout le monde' },
        { value: 'followers', label: 'Abonnés uniquement' },
        { value: 'mutuals', label: 'Abonnés mutuels' },
        { value: 'none', label: 'Personne' },
      ],
    },
    {
      key: 'allowComments',
      label: 'Qui peut commenter vos publications',
      desc: 'Contrôler qui peut commenter vos publications',
      value: settings.allowComments,
      options: [
        { value: 'everyone', label: 'Tout le monde' },
        { value: 'followers', label: 'Abonnés uniquement' },
        { value: 'mutuals', label: 'Abonnés mutuels' },
        { value: 'none', label: 'Personne' },
      ],
    },
    {
      key: 'postVisibility',
      label: 'Visibilité des publications',
      desc: 'Visibilité par défaut de vos publications',
      value: settings.postVisibility,
      options: [
        { value: 'public', label: 'Public' },
        { value: 'followers', label: 'Abonnés uniquement' },
        { value: 'private', label: 'Privé' },
      ],
    },
    {
      key: 'storyVisibility',
      label: 'Visibilité des stories',
      desc: 'Visibilité par défaut de vos stories',
      value: settings.storyVisibility,
      options: [
        { value: 'public', label: 'Public' },
        { value: 'followers', label: 'Abonnés uniquement' },
        { value: 'friends', label: 'Amis uniquement' },
        { value: 'close_friends', label: 'Amis proches' },
        { value: 'private', label: 'Privé' },
      ],
    },
  ];

  const toggleItems: ToggleItem[] = [
    { key: 'showOnlineStatus', label: 'Afficher le statut en ligne', desc: 'Permettre aux autres de voir quand vous êtes en ligne', enabled: settings.showOnlineStatus },
    { key: 'showLastSeen', label: 'Afficher la dernière connexion', desc: 'Permettre aux autres de voir votre dernière connexion', enabled: settings.showLastSeen },
    { key: 'allowTags', label: 'Autoriser les tags', desc: 'Permettre aux autres de vous taguer dans les publications', enabled: settings.allowTags },
    { key: 'allowShares', label: 'Autoriser les partages', desc: 'Permettre aux autres de partager vos publications', enabled: settings.allowShares },
  ];

  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>
          <i className="fas fa-lock" style={{ color: '#C084FC' }} />
          Confidentialité & Sécurité
        </h2>
        <p>Contrôlez vos paramètres de confidentialité</p>
        <div className="privacy-stats">
          <button className="privacy-reset-btn" onClick={handleReset}>
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

      <div className="settings-privacy-section">
        <h4>Confidentialité du profil</h4>
        {privacyItems.map((item) => (
          <div key={item.key} className="settings-privacy-item">
            <div className="settings-privacy-info">
              <span className="settings-privacy-label">{item.label}</span>
              <span className="settings-privacy-desc">{item.desc}</span>
            </div>
            <select
              value={item.value}
              onChange={(e) => handlePrivacyChange(item.key, e.target.value)}
            >
              {item.options.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        ))}
      </div>

      <div className="settings-privacy-section">
        <h4>Confidentialité de l'activité</h4>
        {toggleItems.map((item) => (
          <div key={item.key} className="settings-privacy-item toggle">
            <div className="settings-privacy-info">
              <span className="settings-privacy-label">{item.label}</span>
              <span className="settings-privacy-desc">{item.desc}</span>
            </div>
            <label className="settings-toggle">
              <input
                type="checkbox"
                checked={item.enabled}
                onChange={() => handleToggle(item.key)}
              />
              <span className="settings-toggle-slider" />
            </label>
          </div>
        ))}
      </div>

      <div className="settings-privacy-actions">
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
              Sauvegarder les paramètres
            </>
          )}
        </button>
      </div>

      {/* ============================================================
          STYLES
      ============================================================ */}
      <style>{`
        .settings-privacy-loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          gap: 12px;
          color: var(--text-tertiary);
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

        .privacy-stats {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-top: 6px;
        }

        .privacy-reset-btn {
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

        .privacy-reset-btn:hover {
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

        .settings-privacy-section {
          margin-bottom: 16px;
        }

        .settings-privacy-section h4 {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-tertiary);
          margin: 0 0 8px 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .settings-privacy-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 14px;
          border-radius: 10px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          margin-bottom: 2px;
          transition: all 0.2s;
        }

        .settings-privacy-item:hover {
          background: var(--bg-hover);
          border-color: var(--border-light);
        }

        .settings-privacy-item.toggle {
          padding: 8px 14px;
        }

        .settings-privacy-info {
          flex: 1;
          min-width: 0;
        }

        .settings-privacy-label {
          display: block;
          font-size: 13px;
          color: var(--text-primary);
          font-weight: 500;
        }

        .settings-privacy-desc {
          font-size: 11px;
          color: var(--text-tertiary);
        }

        .settings-privacy-item select {
          padding: 4px 12px;
          border-radius: 8px;
          background: var(--bg-input);
          border: 1px solid var(--border-color);
          color: var(--text-primary);
          font-size: 12px;
          outline: none;
          font-family: inherit;
          cursor: pointer;
        }

        .settings-privacy-item select:focus {
          border-color: var(--kpop-violet);
        }

        .settings-privacy-actions {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid var(--border-color);
        }

        .settings-privacy-actions .settings-save-btn {
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

        .settings-privacy-actions .settings-save-btn:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.2);
        }

        .settings-privacy-actions .settings-save-btn:disabled {
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
          .settings-privacy-item {
            flex-direction: column;
            align-items: flex-start;
            gap: 8px;
          }

          .settings-privacy-item select {
            width: 100%;
          }

          .settings-privacy-item.toggle {
            flex-direction: row;
          }
        }

        @media (max-width: 480px) {
          .settings-privacy-item {
            padding: 8px 12px;
          }

          .settings-privacy-label {
            font-size: 12px;
          }

          .settings-privacy-desc {
            font-size: 10px;
          }

          .settings-privacy-item select {
            font-size: 11px;
            padding: 3px 10px;
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

          .settings-privacy-actions .settings-save-btn {
            font-size: 13px;
            padding: 8px;
          }
        }

        /* LIGHT MODE */
        body.light-mode .settings-privacy-item {
          background: var(--bg-input);
          border-color: var(--border-color);
        }

        body.light-mode .settings-privacy-item:hover {
          background: var(--bg-hover);
          border-color: var(--border-light);
        }

        body.light-mode .settings-privacy-label {
          color: var(--text-primary);
        }

        body.light-mode .settings-privacy-desc {
          color: var(--text-tertiary);
        }

        body.light-mode .settings-privacy-item select {
          background: var(--bg-input);
          border-color: var(--border-color);
          color: var(--text-primary);
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

export default SettingsPrivacy;