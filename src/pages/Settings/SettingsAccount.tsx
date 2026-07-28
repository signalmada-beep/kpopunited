// ========== src/pages/Settings/SettingsAccount.tsx ==========
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  getUserInfo,
  updateUserInfo,
  updateUserEmail,
  updateUserPassword,
  verifyPassword,
  deleteUserAccount,
  logoutUser,
} from '../../services/authService';
import './SettingsAccount.css';

// ============================================================
// TYPES
// ============================================================
interface AccountInfo {
  email: string;
  phone: string;
  joinedAt: number;
  posts: number;
  followers: number;
  following: number;
  isVerified: boolean;
  username: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  birthday: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';
  lastActive: number;
  comments: number;
  shares: number;
  reactions: number;
}

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const SettingsAccount: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  
  // ============================================================
  // ÉTATS
  // ============================================================
  const [accountInfo, setAccountInfo] = useState<AccountInfo>({
    email: '',
    phone: '',
    joinedAt: Date.now(),
    posts: 0,
    followers: 0,
    following: 0,
    isVerified: false,
    username: '',
    displayName: '',
    bio: '',
    location: '',
    website: '',
    birthday: '',
    gender: 'prefer-not-to-say',
    lastActive: Date.now(),
    comments: 0,
    shares: 0,
    reactions: 0,
  });
  
  const [editData, setEditData] = useState<AccountInfo>(accountInfo);
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // ----- MODALS -----
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [phoneError, setPhoneError] = useState('');
  
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  // ============================================================
  // CHARGER LES DONNÉES UTILISATEUR
  // ============================================================
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      try {
        const userData = await getUserInfo();
        if (userData) {
          setAccountInfo({
            email: userData.email || '',
            phone: userData.phone || '',
            joinedAt: userData.createdAt || Date.now(),
            posts: userData.posts || 0,
            followers: userData.followers || 0,
            following: userData.following || 0,
            isVerified: userData.isVerified || false,
            username: userData.username || userData.displayName?.toLowerCase().replace(/\s/g, '') || '',
            displayName: userData.displayName || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || '',
            birthday: userData.birthday || '',
            gender: userData.gender || 'prefer-not-to-say',
            lastActive: userData.lastLogin || Date.now(),
            comments: userData.comments || 0,
            shares: userData.shares || 0,
            reactions: userData.reactions || 0,
          });
          setEditData({
            email: userData.email || '',
            phone: userData.phone || '',
            joinedAt: userData.createdAt || Date.now(),
            posts: userData.posts || 0,
            followers: userData.followers || 0,
            following: userData.following || 0,
            isVerified: userData.isVerified || false,
            username: userData.username || userData.displayName?.toLowerCase().replace(/\s/g, '') || '',
            displayName: userData.displayName || '',
            bio: userData.bio || '',
            location: userData.location || '',
            website: userData.website || '',
            birthday: userData.birthday || '',
            gender: userData.gender || 'prefer-not-to-say',
            lastActive: userData.lastLogin || Date.now(),
            comments: userData.comments || 0,
            shares: userData.shares || 0,
            reactions: userData.reactions || 0,
          });
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getDaysActive = () => {
    return Math.floor((Date.now() - accountInfo.joinedAt) / (1000 * 60 * 60 * 24));
  };

  // ============================================================
  // LEVEL CALCULATION
  // ============================================================
  const levelData = useMemo(() => {
    const daysActive = getDaysActive();
    const score = 
      daysActive * 3 + 
      accountInfo.posts * 2 + 
      accountInfo.followers * 0.05 +
      accountInfo.comments * 0.5 +
      accountInfo.reactions * 0.2;

    let level: number, name: string, icon: string, color: string, nextLevelScore: number;

    if (score < 10) {
      level = 1; name = 'Bronze'; icon = '🥉'; color = '#CD7F32'; nextLevelScore = 10;
    } else if (score < 30) {
      level = 2; name = 'Silver'; icon = '🥈'; color = '#C0C0C0'; nextLevelScore = 30;
    } else if (score < 60) {
      level = 3; name = 'Gold'; icon = '🥇'; color = '#FFD700'; nextLevelScore = 60;
    } else if (score < 100) {
      level = 4; name = 'Platinum'; icon = '💎'; color = '#E5E4E2'; nextLevelScore = 100;
    } else if (score < 150) {
      level = 5; name = 'Diamond'; icon = '💠'; color = '#4A90D9'; nextLevelScore = 150;
    } else if (score < 220) {
      level = 6; name = 'Fire'; icon = '🔥'; color = '#FF6B6B'; nextLevelScore = 220;
    } else if (score < 300) {
      level = 7; name = 'Legend'; icon = '⭐'; color = '#C084FC'; nextLevelScore = 300;
    } else if (score < 400) {
      level = 8; name = 'Mythic'; icon = '🌈'; color = '#EC4899'; nextLevelScore = 400;
    } else if (score < 550) {
      level = 9; name = 'Eternal'; icon = '👑'; color = '#FFD700'; nextLevelScore = 550;
    } else {
      level = 10; name = 'Ultimate'; icon = '💫'; color = '#C084FC'; nextLevelScore = 9999;
    }

    const currentScore = Math.min(score, nextLevelScore);
    const progress = Math.min((currentScore / nextLevelScore) * 100, 100);

    return { level, name, icon, color, nextLevelScore, currentScore, progress };
  }, [accountInfo]);

  // ============================================================
  // HANDLERS - EDIT PROFILE
  // ============================================================
  const handleEditChange = (field: keyof AccountInfo, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    
    try {
      await updateUserInfo({
        displayName: editData.displayName,
        bio: editData.bio,
        location: editData.location,
        website: editData.website,
        phone: editData.phone,
        birthday: editData.birthday,
        gender: editData.gender as any,
      });
      
      setAccountInfo(prev => ({ ...prev, ...editData }));
      setSaveSuccess(true);
      setIsEditing(false);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = () => {
    setEditData(accountInfo);
    setIsEditing(false);
  };

  // ============================================================
  // HANDLERS - EMAIL
  // ============================================================
  const handleEmailSubmit = async () => {
    if (!newEmail.includes('@')) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    try {
      await updateUserEmail(newEmail);
      setAccountInfo(prev => ({ ...prev, email: newEmail }));
      setNewEmail('');
      setEmailError('');
      setShowEmailModal(false);
      alert('✅ Email updated successfully!');
    } catch (error) {
      setEmailError('Failed to update email. Please try again.');
    }
  };

  // ============================================================
  // HANDLERS - PHONE
  // ============================================================
  const handlePhoneSubmit = async () => {
    if (!newPhone.trim()) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    
    try {
      await updateUserInfo({ phone: newPhone.trim() });
      setAccountInfo(prev => ({ ...prev, phone: newPhone.trim() }));
      setNewPhone('');
      setPhoneError('');
      setShowPhoneModal(false);
      alert('✅ Phone number updated successfully!');
    } catch (error) {
      setPhoneError('Failed to update phone number. Please try again.');
    }
  };

  // ============================================================
  // HANDLERS - PASSWORD
  // ============================================================
  const handlePasswordSubmit = async () => {
  setPasswordError('');

  if (newPassword.length < 6) {
    setPasswordError('Password must be at least 6 characters');
    return;
  }
  if (newPassword !== confirmPassword) {
    setPasswordError('Passwords do not match');
    return;
  }

  try {
    await updateUserPassword(currentPassword, newPassword);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPasswordModal(false);
    alert('✅ Password changed successfully!');
  } catch (error: any) {
    if (error.code === 'auth/wrong-password') {
      setPasswordError('Current password is incorrect');
    } else {
      setPasswordError('Failed to change password. Please try again.');
    }
  }
};

  // ============================================================
  // HANDLERS - LOGOUT
  // ============================================================
  const handleLogout = async () => {
    try {
      await logoutUser();
      // La navigation se fait via le contexte
      navigate('/auth');
    } catch (error) {
      alert('Failed to logout. Please try again.');
    }
  };

  // ============================================================
  // HANDLERS - DELETE ACCOUNT
  // ============================================================
  const handleDeleteAccount = async () => {
    if (deleteConfirm.toUpperCase() !== 'DELETE') {
      alert('⚠️ Please type "DELETE" to confirm');
      return;
    }
    
    if (!deletePassword) {
      setDeleteError('Please enter your password');
      return;
    }
    
    setDeleteError('');
    
    try {
      // Vérifier le mot de passe avant de supprimer
      const isPasswordValid = await verifyPassword(deletePassword);
      if (!isPasswordValid) {
        setDeleteError('Incorrect password');
        return;
      }
      
      await deleteUserAccount(deletePassword);
      navigate('/auth');
    } catch (error) {
      setDeleteError('Failed to delete account. Please try again.');
    }
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (isLoading) {
    return (
      <div className="settings-subpage" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <div className="loading-spinner" />
        <span style={{ marginLeft: '12px', color: 'var(--text-tertiary)' }}>Loading...</span>
      </div>
    );
  }

  return (
    <div className="settings-subpage">
      {/* HEADER */}
      <div className="settings-subpage-header premium-header">
        <div className="premium-header-content">
          <div>
            <h2>Account Settings</h2>
            <p>Manage your account information and preferences</p>
          </div>
          <div className="premium-badge-container">
            {accountInfo.isVerified && (
              <span className="premium-badge verified">
                <i className="fas fa-check-circle" /> Verified
              </span>
            )}
            <span className="premium-badge statuts" style={{ 
              background: `linear-gradient(135deg, ${levelData.color}20, ${levelData.color}10)`,
              borderColor: `${levelData.color}30`,
              color: levelData.color
            }}>
              <span style={{ fontSize: '14px' }}>{levelData.icon}</span>
              STATUTS • {levelData.name}
            </span>
          </div>
        </div>
        <div className="premium-header-glow" />
      </div>

      {/* SUCCESS MESSAGE */}
      {saveSuccess && (
        <div className="save-success-toast">
          <i className="fas fa-check-circle" />
          <span>Profile updated successfully!</span>
        </div>
      )}

      {/* STATUTS CARD */}
      <div className="premium-account-type-card">
        <div className="account-type-content">
          <div className="account-type-icon-wrapper">
            <div className="account-type-icon" style={{ background: levelData.color }}>
              <span style={{ fontSize: '24px' }}>{levelData.icon}</span>
            </div>
          </div>
          <div className="account-type-info">
            <span className="account-type-label">STATUTS</span>
            <span className="account-type-name" style={{ color: levelData.color }}>
              {levelData.icon} {levelData.name}
            </span>
            <span className="account-type-desc">
              {levelData.level === 1 && 'Begin your journey as a K-Pop fan'}
              {levelData.level === 2 && "You're getting noticed in the community"}
              {levelData.level === 3 && 'A true K-Pop enthusiast'}
              {levelData.level === 4 && "You're becoming a legend"}
              {levelData.level === 5 && 'Diamond level fan'}
              {levelData.level === 6 && "You're on fire!"}
              {levelData.level === 7 && 'A true legend in the making'}
              {levelData.level === 8 && 'Mythic level achievement'}
              {levelData.level === 9 && '✨ Eternal status reached!'}
              {levelData.level === 10 && 'The ultimate K-Pop fan!'}
            </span>
          </div>
          <button className="account-type-btn" onClick={() => setIsEditing(true)}>
            <i className="fas fa-pen" /> Edit Profile
          </button>
        </div>

        {/* Progress Bar */}
        {levelData.level < 10 && (
          <div className="statuts-progress-container">
            <div className="statuts-progress-info">
              <span>Progress to {levelData.name} {levelData.level + 1}</span>
              <span>{Math.round(levelData.progress)}%</span>
            </div>
            <div className="statuts-progress-bar">
              <div 
                className="statuts-progress-fill" 
                style={{ 
                  width: `${levelData.progress}%`,
                  background: `linear-gradient(90deg, ${levelData.color}, ${levelData.color}80)`
                }}
              />
            </div>
            <div className="statuts-requirements">
              <span>🏆 {Math.round(levelData.currentScore)} / {levelData.nextLevelScore} points</span>
              <span>📅 {getDaysActive()} days active</span>
              <span>📝 {accountInfo.posts} posts</span>
            </div>
          </div>
        )}
        {levelData.level === 10 && (
          <div className="statuts-max-container">
            <span>🏆 Maximum Level Reached!</span>
            <span>You are the ultimate K-Pop fan!</span>
          </div>
        )}
        <div className="premium-shimmer" />
      </div>

      {/* ============================================================
          ACCOUNT INFO GRID
      ============================================================ */}
      <div className="premium-grid-container">
        <div className="premium-grid">
          {/* EMAIL */}
          <div className="premium-account-item glow-effect">
            <div className="premium-item-icon">
              <i className="fas fa-envelope" />
            </div>
            <div className="premium-item-content">
              <span className="premium-item-label">Email Address</span>
              <span className="premium-item-value">{accountInfo.email}</span>
              <span className="premium-item-status verified">
                <i className="fas fa-check-circle" /> Verified
              </span>
            </div>
            <button className="premium-item-action" onClick={() => setShowEmailModal(true)}>
              Change
            </button>
          </div>

          {/* PHONE */}
          <div className="premium-account-item glow-effect">
            <div className="premium-item-icon">
              <i className="fas fa-phone" />
            </div>
            <div className="premium-item-content">
              <span className="premium-item-label">Phone Number</span>
              <span className="premium-item-value">{accountInfo.phone || 'Not set'}</span>
              <span className="premium-item-status pending">
                <i className="fas fa-clock" /> {accountInfo.phone ? 'Pending verification' : 'Not set'}
              </span>
            </div>
            <button className="premium-item-action" onClick={() => setShowPhoneModal(true)}>
              {accountInfo.phone ? 'Update' : 'Add'}
            </button>
          </div>

          {/* PASSWORD */}
          <div className="premium-account-item glow-effect">
            <div className="premium-item-icon">
              <i className="fas fa-key" />
            </div>
            <div className="premium-item-content">
              <span className="premium-item-label">Password</span>
              <span className="premium-item-value">••••••••</span>
              <span className="premium-item-status secure">
                <i className="fas fa-shield-alt" /> Secure
              </span>
            </div>
            <button className="premium-item-action" onClick={() => setShowPasswordModal(true)}>
              Change
            </button>
          </div>

          {/* MEMBER SINCE */}
          <div className="premium-account-item glow-effect">
            <div className="premium-item-icon">
              <i className="fas fa-calendar-alt" />
            </div>
            <div className="premium-item-content">
              <span className="premium-item-label">Member Since</span>
              <span className="premium-item-value">{formatDate(accountInfo.joinedAt)}</span>
              <span className="premium-item-status">
                <i className="fas fa-star" /> {getDaysActive()} days
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================
          STATS
      ============================================================ */}
      <div className="premium-stats-grid">
        <div className="premium-stat-card stat-posts">
          <div className="stat-icon-wrapper"><i className="fas fa-newspaper" /></div>
          <span className="stat-number">{formatNumber(accountInfo.posts)}</span>
          <span className="stat-label">Posts</span>
          <div className="stat-progress-bar"><div className="stat-progress-fill" style={{ width: `${Math.min((accountInfo.posts / 100) * 100, 100)}%` }} /></div>
        </div>
        <div className="premium-stat-card stat-followers">
          <div className="stat-icon-wrapper"><i className="fas fa-users" /></div>
          <span className="stat-number">{formatNumber(accountInfo.followers)}</span>
          <span className="stat-label">Followers</span>
          <div className="stat-progress-bar"><div className="stat-progress-fill" style={{ width: `${Math.min((accountInfo.followers / 500) * 100, 100)}%` }} /></div>
        </div>
        <div className="premium-stat-card stat-following">
          <div className="stat-icon-wrapper"><i className="fas fa-user-plus" /></div>
          <span className="stat-number">{formatNumber(accountInfo.following)}</span>
          <span className="stat-label">Following</span>
          <div className="stat-progress-bar"><div className="stat-progress-fill" style={{ width: `${Math.min((accountInfo.following / 200) * 100, 100)}%` }} /></div>
        </div>
        <div className="premium-stat-card stat-engagement">
          <div className="stat-icon-wrapper"><i className="fas fa-chart-line" /></div>
          <span className="stat-number">{formatNumber(accountInfo.reactions)}</span>
          <span className="stat-label">Reactions</span>
          <div className="stat-progress-bar"><div className="stat-progress-fill premium-gradient" style={{ width: `${Math.min((accountInfo.reactions / 1000) * 100, 100)}%` }} /></div>
        </div>
      </div>

      {/* DANGER ZONE */}
      <div className="premium-danger-zone">
        <div className="danger-zone-header">
          <i className="fas fa-exclamation-triangle" />
          <h4>Danger Zone</h4>
          <span className="danger-zone-subtitle">Actions that cannot be undone</span>
        </div>
        <div className="danger-zone-items">
          <div className="danger-zone-item">
            <div className="danger-zone-info">
              <span className="danger-zone-label">Logout</span>
              <span className="danger-zone-desc">Sign out of your account on this device</span>
            </div>
            <button className="danger-zone-btn logout" onClick={() => setShowLogoutModal(true)}>
              <i className="fas fa-sign-out-alt" /> Logout
            </button>
          </div>
          <div className="danger-zone-item">
            <div className="danger-zone-info">
              <span className="danger-zone-label">Delete Account</span>
              <span className="danger-zone-desc">Permanently delete your account and all data</span>
            </div>
            <button className="danger-zone-btn delete" onClick={() => setShowDeleteModal(true)}>
              <i className="fas fa-trash" /> Delete
            </button>
          </div>
        </div>
      </div>

      {/* ============================================================
          MODALS
      ============================================================ */}

      {/* EMAIL MODAL */}
      {showEmailModal && (
        <div className="premium-modal-overlay" onClick={() => setShowEmailModal(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="modal-header-icon edit"><i className="fas fa-envelope" /></div>
              <h3>Change Email Address</h3>
              <button className="modal-close" onClick={() => setShowEmailModal(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="premium-modal-body">
              <div className="modal-input-group">
                <label>New Email Address</label>
                <input 
                  type="email" 
                  placeholder="Enter new email..." 
                  value={newEmail} 
                  onChange={(e) => setNewEmail(e.target.value)} 
                  autoFocus 
                />
                {emailError && <span className="modal-error">{emailError}</span>}
              </div>
            </div>
            <div className="premium-modal-footer">
              <button className="modal-btn secondary" onClick={() => { setShowEmailModal(false); setNewEmail(''); setEmailError(''); }}>Cancel</button>
              <button className="modal-btn primary" onClick={handleEmailSubmit}><i className="fas fa-check" /> Update Email</button>
            </div>
          </div>
        </div>
      )}

      {/* PHONE MODAL */}
      {showPhoneModal && (
        <div className="premium-modal-overlay" onClick={() => setShowPhoneModal(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="modal-header-icon edit"><i className="fas fa-phone" /></div>
              <h3>Update Phone Number</h3>
              <button className="modal-close" onClick={() => setShowPhoneModal(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="premium-modal-body">
              <div className="modal-input-group">
                <label>New Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="Enter new phone number..." 
                  value={newPhone} 
                  onChange={(e) => setNewPhone(e.target.value)} 
                  autoFocus 
                />
                {phoneError && <span className="modal-error">{phoneError}</span>}
              </div>
            </div>
            <div className="premium-modal-footer">
              <button className="modal-btn secondary" onClick={() => { setShowPhoneModal(false); setNewPhone(''); setPhoneError(''); }}>Cancel</button>
              <button className="modal-btn primary" onClick={handlePhoneSubmit}><i className="fas fa-check" /> Update Phone</button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="premium-modal-overlay" onClick={() => setShowPasswordModal(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="modal-header-icon edit"><i className="fas fa-key" /></div>
              <h3>Change Password</h3>
              <button className="modal-close" onClick={() => setShowPasswordModal(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="premium-modal-body">
              <div className="modal-input-group">
                <label>Current Password</label>
                <input 
                  type="password" 
                  placeholder="Enter current password..." 
                  value={currentPassword} 
                  onChange={(e) => setCurrentPassword(e.target.value)} 
                  autoFocus 
                />
              </div>
              <div className="modal-input-group">
                <label>New Password (min 6 characters)</label>
                <input 
                  type="password" 
                  placeholder="Enter new password..." 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                />
              </div>
              <div className="modal-input-group">
                <label>Confirm New Password</label>
                <input 
                  type="password" 
                  placeholder="Confirm new password..." 
                  value={confirmPassword} 
                  onChange={(e) => setConfirmPassword(e.target.value)} 
                />
                {passwordError && <span className="modal-error">{passwordError}</span>}
              </div>
            </div>
            <div className="premium-modal-footer">
              <button className="modal-btn secondary" onClick={() => { setShowPasswordModal(false); setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}>Cancel</button>
              <button className="modal-btn primary" onClick={handlePasswordSubmit}><i className="fas fa-check" /> Change Password</button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div className="premium-modal-overlay" onClick={() => {}}>
          <div className="premium-modal wide" onClick={(e) => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="modal-header-icon edit"><i className="fas fa-user-edit" /></div>
              <h3>Edit Profile</h3>
              <button className="modal-close" onClick={handleCancelEdit}><i className="fas fa-times" /></button>
            </div>
            <div className="premium-modal-body">
              <div className="edit-profile-grid">
                <div className="edit-profile-avatar">
                  <img src={user?.avatar || 'https://i.pravatar.cc/150?img=16'} alt="Avatar" />
                  <button className="edit-avatar-btn"><i className="fas fa-camera" /></button>
                </div>
                <div className="edit-profile-fields">
                  <div className="edit-field">
                    <label>Display Name</label>
                    <input type="text" value={editData.displayName} onChange={(e) => handleEditChange('displayName', e.target.value)} />
                  </div>
                  <div className="edit-field">
                    <label>Username</label>
                    <input type="text" value={editData.username} onChange={(e) => handleEditChange('username', e.target.value)} />
                  </div>
                  <div className="edit-field">
                    <label>Bio</label>
                    <textarea value={editData.bio} onChange={(e) => handleEditChange('bio', e.target.value)} rows={2} maxLength={150} />
                  </div>
                  <div className="edit-field-row">
                    <div className="edit-field">
                      <label>Location</label>
                      <input type="text" value={editData.location} onChange={(e) => handleEditChange('location', e.target.value)} />
                    </div>
                    <div className="edit-field">
                      <label>Website</label>
                      <input type="url" value={editData.website} onChange={(e) => handleEditChange('website', e.target.value)} />
                    </div>
                  </div>
                  <div className="edit-field-row">
                    <div className="edit-field">
                      <label>Birthday</label>
                      <input type="date" value={editData.birthday} onChange={(e) => handleEditChange('birthday', e.target.value)} />
                    </div>
                    <div className="edit-field">
                      <label>Gender</label>
                      <select value={editData.gender} onChange={(e) => handleEditChange('gender', e.target.value)}>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="non-binary">Non-binary</option>
                        <option value="prefer-not-to-say">Prefer not to say</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="premium-modal-footer">
              <button className="modal-btn secondary" onClick={handleCancelEdit}>Cancel</button>
              <button className="modal-btn primary" onClick={handleSaveProfile} disabled={isSaving}>
                {isSaving ? <><span className="spinner-small" /> Saving...</> : <><i className="fas fa-check" /> Save Changes</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOGOUT MODAL */}
      {showLogoutModal && (
        <div className="premium-modal-overlay" onClick={() => setShowLogoutModal(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="premium-modal-header">
              <div className="modal-header-icon logout"><i className="fas fa-sign-out-alt" /></div>
              <h3>Logout</h3>
              <button className="modal-close" onClick={() => setShowLogoutModal(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="premium-modal-body">
              <p>Are you sure you want to logout from your account?</p>
              <p className="modal-hint">You can always log back in anytime.</p>
            </div>
            <div className="premium-modal-footer">
              <button className="modal-btn secondary" onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="modal-btn primary logout-btn" onClick={handleLogout}><i className="fas fa-sign-out-alt" /> Logout</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div className="premium-modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="premium-modal" onClick={(e) => e.stopPropagation()}>
            <div className="premium-modal-header danger">
              <div className="modal-header-icon delete"><i className="fas fa-trash" /></div>
              <h3>Delete Account</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><i className="fas fa-times" /></button>
            </div>
            <div className="premium-modal-body">
              <p>Are you sure you want to permanently delete your account?</p>
              <p className="modal-hint danger"><i className="fas fa-exclamation-triangle" /> This action cannot be undone. All your data will be lost.</p>
              
              <div className="modal-input-group">
                <label>Confirm your password</label>
                <input 
                  type="password" 
                  placeholder="Enter your password..." 
                  value={deletePassword} 
                  onChange={(e) => setDeletePassword(e.target.value)} 
                />
              </div>
              
              <div className="modal-confirm-input">
                <label>Type <strong>DELETE</strong> to confirm</label>
                <input 
                  type="text" 
                  placeholder="Type DELETE..." 
                  value={deleteConfirm} 
                  onChange={(e) => setDeleteConfirm(e.target.value)} 
                  autoFocus 
                />
                {deleteError && <span className="modal-error">{deleteError}</span>}
              </div>
            </div>
            <div className="premium-modal-footer">
              <button className="modal-btn secondary" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button 
                className="modal-btn danger delete-btn" 
                onClick={handleDeleteAccount} 
                disabled={deleteConfirm.toUpperCase() !== 'DELETE' || !deletePassword} 
                style={{ opacity: deleteConfirm.toUpperCase() === 'DELETE' && deletePassword ? 1 : 0.5 }}
              >
                <i className="fas fa-trash" /> Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsAccount;