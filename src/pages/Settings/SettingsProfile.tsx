// ========== src/pages/Settings/SettingsProfile.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getUserProfile, updateUserProfile, type UserProfile } from '../../services/profileService';
import './SettingsProfile.css';

const SettingsProfile: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // ============================================================
  // 🔥 ÉTATS
  // ============================================================
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // ✅ Données du formulaire
  const [formData, setFormData] = useState({
    displayName: '',
    username: '',
    bio: '',
    location: '',
    website: '',
    phone: '',
    birthday: '',
    gender: 'prefer-not-to-say',
  });

  // ============================================================
  // 🔥 CHARGER LE PROFIL DE L'UTILISATEUR
  // ============================================================
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      setError(null);
      
      try {
        if (!user) {
          setError('Utilisateur non connecté');
          setLoading(false);
          return;
        }
        
        const userProfile = await getUserProfile(user.id);
        
        if (userProfile) {
          setProfile(userProfile);
          setFormData({
            displayName: userProfile.displayName || user?.name || '',
            username: userProfile.username || '',
            bio: userProfile.bio || '',
            location: userProfile.location || '',
            website: userProfile.website || '',
            phone: userProfile.phone || '',
            birthday: userProfile.birthday || '',
            gender: userProfile.gender || 'prefer-not-to-say',
          });
        } else {
          // ✅ Si pas de profil, créer un avec les données du user
          const newProfile = {
            uid: user.id,
            displayName: user.name || '',
            username: user.name?.toLowerCase().replace(/\s/g, '') || '',
            email: user.email || '',
            photoURL: user.avatar || '',
            coverPhoto: '',
            bio: '',
            location: '',
            website: '',
            phone: '',
            birthday: '',
            gender: 'prefer-not-to-say' as any,
            registrationNumber: 0,
            badge: { name: 'Fan', color: '#7A7A9A', icon: '🎵', tier: 7 },
            followers: [],
            following: [],
            posts: 0,
            isVerified: false,
            createdAt: Date.now(),
            lastLogin: Date.now(),
          };
          setProfile(newProfile);
          setFormData({
            displayName: newProfile.displayName,
            username: newProfile.username,
            bio: '',
            location: '',
            website: '',
            phone: '',
            birthday: '',
            gender: 'prefer-not-to-say',
          });
        }
      } catch (err) {
        console.error('❌ Erreur chargement profil:', err);
        setError('Erreur lors du chargement du profil');
      } finally {
        setLoading(false);
      }
    };
    
    loadProfile();
  }, [user]);

  // ============================================================
  // 🔥 HANDLER - CHANGEMENT DE CHAMP
  // ============================================================
  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // ============================================================
  // 🔥 SAUVEGARDER LE PROFIL
  // ============================================================
  const handleSave = async () => {
    if (!profile) return;
    
    setIsSaving(true);
    setSaveSuccess(false);
    setError(null);
    
    try {
      await updateUserProfile(profile.uid, {
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender as any,
      });
      
      // ✅ Mettre à jour le profil local
      setProfile(prev => prev ? {
        ...prev,
        displayName: formData.displayName,
        bio: formData.bio,
        location: formData.location,
        website: formData.website,
        phone: formData.phone,
        birthday: formData.birthday,
        gender: formData.gender as any,
      } : null);
      
      setSaveSuccess(true);
      setIsEditing(false);
      
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('❌ Erreur sauvegarde:', err);
      setError('Erreur lors de la sauvegarde. Veuillez réessayer.');
    } finally {
      setIsSaving(false);
    }
  };

  // ============================================================
  // 🔥 ANNULER
  // ============================================================
  const handleCancel = () => {
    if (profile) {
      setFormData({
        displayName: profile.displayName || '',
        username: profile.username || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        phone: profile.phone || '',
        birthday: profile.birthday || '',
        gender: profile.gender || 'prefer-not-to-say',
      });
    }
    setIsEditing(false);
    setError(null);
  };

  // ============================================================
  // 🔥 RENDER LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="settings-subpage">
        <div className="settings-subpage-header">
          <h2>Profil</h2>
          <p>Chargement de votre profil...</p>
        </div>
        <div className="settings-profile-loading">
          <div className="loading-spinner" />
          <span>Chargement...</span>
        </div>
      </div>
    );
  }

  // ============================================================
  // 🔥 RENDER ERREUR
  // ============================================================
  if (error || !profile) {
    return (
      <div className="settings-subpage">
        <div className="settings-subpage-header">
          <h2>Profil</h2>
          <p>Erreur de chargement</p>
        </div>
        <div className="settings-profile-error">
          <i className="fas fa-exclamation-circle" />
          <span>{error || 'Profil non trouvé'}</span>
          <button onClick={() => window.location.reload()}>Réessayer</button>
        </div>
      </div>
    );
  }

  // ============================================================
  // 🔥 RENDER
  // ============================================================
  const currentData = isEditing ? formData : {
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    location: profile.location,
    website: profile.website,
    phone: profile.phone,
    birthday: profile.birthday,
    gender: profile.gender,
  };

  // ✅ Email efa tamin'ny login
  const userEmail = user?.email || profile.email || '';

  return (
    <div className="settings-subpage">
      <div className="settings-subpage-header">
        <h2>
          <i className="fas fa-user" style={{ color: '#C084FC' }} />
          Modifier le profil
        </h2>
        <p>Modifiez vos informations personnelles</p>
      </div>

      {/* ✅ SUCCESS */}
      {saveSuccess && (
        <div className="save-success-toast">
          <i className="fas fa-check-circle" />
          <span>Profil mis à jour avec succès !</span>
        </div>
      )}

      {/* ✅ ERROR */}
      {error && !saveSuccess && (
        <div className="save-error-toast">
          <i className="fas fa-exclamation-circle" />
          <span>{error}</span>
        </div>
      )}

      <div className="settings-form">
        {/* ✅ NOM COMPLET - Efa tamin'ny login */}
        <div className="settings-form-group">
          <label>Nom complet</label>
          <input
            type="text"
            value={currentData.displayName}
            onChange={(e) => handleChange('displayName', e.target.value)}
            disabled={!isEditing}
            placeholder="Votre nom complet"
          />
          <span className="settings-form-hint">ⓘ Modifiez votre nom</span>
        </div>

        {/* ✅ NOM D'UTILISATEUR - Efa tamin'ny login */}
        <div className="settings-form-group">
          <label>Nom d'utilisateur</label>
          <input
            type="text"
            value={currentData.username}
            onChange={(e) => handleChange('username', e.target.value)}
            disabled={!isEditing}
            placeholder="Nom d'utilisateur unique"
          />
          <span className="settings-form-hint">ⓘ Le nom d'utilisateur doit être unique</span>
        </div>

        {/* ✅ EMAIL - Efa tamin'ny login (TSY AZO OVAINA) */}
        <div className="settings-form-group">
          <label>Adresse email</label>
          <input
            type="email"
            value={userEmail}
            disabled={true}
            className="settings-form-disabled"
          />
          <span className="settings-form-hint">ⓘ L'email ne peut pas être modifié ici. Allez dans <button className="settings-form-link" onClick={() => navigate('/settings/account')}>Compte</button></span>
        </div>

        {/* ✅ DATE DE NAISSANCE - Efa tamin'ny login */}
        <div className="settings-form-group">
          <label>Date de naissance</label>
          <input
            type="date"
            value={currentData.birthday}
            onChange={(e) => handleChange('birthday', e.target.value)}
            disabled={!isEditing}
          />
          <span className="settings-form-hint">ⓘ Modifiez votre date de naissance</span>
        </div>

        {/* ✅ BIO - AZO OVAINA ETO */}
        <div className="settings-form-group">
          <label>Bio</label>
          <textarea
            value={currentData.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            disabled={!isEditing}
            placeholder="Parlez-nous de vous..."
            rows={3}
            maxLength={150}
          />
          <span className="settings-char-count">{currentData.bio?.length || 0}/150</span>
          <span className="settings-form-hint">ⓘ Cette bio apparaîtra sur votre profil</span>
        </div>

        {/* ✅ LOCALISATION - AZO OVAINA ETO */}
        <div className="settings-form-row">
          <div className="settings-form-group">
            <label>Localisation</label>
            <input
              type="text"
              value={currentData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              disabled={!isEditing}
              placeholder="Ville, pays"
            />
            <span className="settings-form-hint">ⓘ Votre ville ou pays</span>
          </div>
          <div className="settings-form-group">
            <label>Site web</label>
            <input
              type="url"
              value={currentData.website}
              onChange={(e) => handleChange('website', e.target.value)}
              disabled={!isEditing}
              placeholder="https://exemple.com"
            />
            <span className="settings-form-hint">ⓘ Votre site web ou blog</span>
          </div>
        </div>

        {/* ✅ TÉLÉPHONE - AZO OVAINA ETO */}
        <div className="settings-form-group">
          <label>Téléphone "FACULTATIF"</label>
          <input
            type="tel"
            value={currentData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            disabled={!isEditing}
            placeholder="+261 00 000 00"
          />
          <span className="settings-form-hint">ⓘ Votre numéro de téléphone</span>
        </div>

        {/* ✅ GENRE - AZO OVAINA ETO */}
        <div className="settings-form-group">
          <label>Genre</label>
          <select
            value={currentData.gender}
            onChange={(e) => handleChange('gender', e.target.value)}
            disabled={!isEditing}
          >
            <option value="male">Homme</option>
            <option value="female">Femme</option>
            <option value="non-binary">Non-binaire</option>
            <option value="prefer-not-to-say">Je préfère ne pas dire</option>
          </select>
          <span className="settings-form-hint">ⓘ Votre genre</span>
        </div>

        {/* ✅ ACTIONS */}
        {isEditing ? (
          <div className="settings-form-actions">
            <button 
              className="settings-cancel-btn" 
              onClick={handleCancel}
              disabled={isSaving}
            >
              Annuler
            </button>
            <button 
              className="settings-save-btn" 
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <span className="spinner-small" />
                  Sauvegarde...
                </>
              ) : (
                <>
                  <i className="fas fa-check" />
                  Enregistrer les modifications
                </>
              )}
            </button>
          </div>
        ) : (
          <button className="settings-edit-btn" onClick={() => setIsEditing(true)}>
            <i className="fas fa-pen" /> Modifier le profil
          </button>
        )}
      </div>
    </div>
  );
};

export default SettingsProfile;