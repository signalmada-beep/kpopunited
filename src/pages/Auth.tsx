// ========== src/pages/Auth.tsx ==========
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { loginUser, registerUser, sendPasswordReset } from '../services/authService';
import { signInWithGoogleOAuth, getTokenFromUrl, getOAuthUserInfo, saveOAuthUser } from '../services/oauthService';
import { uploadProfilePhoto } from '../services/profileService';
import { syncAllToFirebase, loadFromFirebase } from '../services/syncService';
import '../styles/Auth.css';

const Auth: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading, isAuthenticated } = useAuth();
  
  // ============================================================
  // 🔥 Raha efa misy user tena izy dia alefa any home
  // ============================================================
  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      console.log('👤 User already authenticated, redirecting to /home');
      navigate('/home');
    }
  }, [user, loading, isAuthenticated, navigate]);

  // ============================================================
  // 🔥 GESTION DU RETOUR OAuth
  // ============================================================
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const token = getTokenFromUrl();
      if (token) {
        setIsGoogleLoading(true);
        try {
          const userInfo = await getOAuthUserInfo(token);
          if (userInfo) {
            saveOAuthUser(userInfo);
            await loadFromFirebase();
            setIsSuccess(true);
            setTimeout(() => navigate('/home'), 500);
          } else {
            setError('Erreur lors de la récupération des informations');
          }
        } catch (err) {
          console.error('OAuth callback error:', err);
          setError('Erreur de connexion avec Google');
        } finally {
          setIsGoogleLoading(false);
          window.history.replaceState({}, document.title, window.location.pathname);
        }
      }
    };
    handleOAuthCallback();
  }, [navigate]);

  // ============================================================
  // 🔥 ÉTATS - FORMULAIRE
  // ============================================================
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetSent, setResetSent] = useState(false);
  
  // ✅ Données utilisateur
  const [nom, setNom] = useState('');
  const [prenom, setPrenom] = useState('');
  const [dateNaissance, setDateNaissance] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [bio, setBio] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  
  // ✅ Photos
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null);
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(null);
  const [coverPhoto, setCoverPhoto] = useState<File | null>(null);
  const [coverPhotoPreview, setCoverPhotoPreview] = useState<string | null>(null);
  
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  
  // Refs
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // 🔥 HANDLERS PHOTOS
  // ============================================================
  const handleProfilePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setProfilePhoto(file);
      setProfilePhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverPhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverPhoto(file);
      setCoverPhotoPreview(URL.createObjectURL(file));
    }
  };

  // ============================================================
  // 🔥 VALIDATION
  // ============================================================
  const validateForm = () => {
    // ✅ Vérification email
    if (!email.trim()) {
      setError('Veuillez entrer votre email');
      return false;
    }
    if (!email.includes('@') || !email.includes('.')) {
      setError('Email invalide (ex: nom@domaine.com)');
      return false;
    }

    // ✅ Vérification mot de passe
    if (!password || password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return false;
    }

    // ✅ Vérification inscription
    if (!isLogin) {
      if (!nom.trim()) {
        setError('Veuillez entrer votre nom');
        return false;
      }
      if (!prenom.trim()) {
        setError('Veuillez entrer votre prénom');
        return false;
      }
      if (!dateNaissance) {
        setError('Veuillez entrer votre date de naissance');
        return false;
      }
      const birthDate = new Date(dateNaissance);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        setError('Vous devez avoir au moins 13 ans');
        return false;
      }
      if (password !== confirmPassword) {
        setError('Les mots de passe ne correspondent pas');
        return false;
      }
      if (!username.trim()) {
        setError('Veuillez choisir un nom d\'utilisateur');
        return false;
      }
      // ✅ Vérifier que le username est valide (pas de caractères spéciaux)
      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setError('Le nom d\'utilisateur ne peut contenir que des lettres, chiffres et underscores');
        return false;
      }
    }

    return true;
  };

// ============================================================
// 🔥 HANDLER - INSCRIPTION / CONNEXION
// ============================================================
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setError(null);
  
  if (!validateForm()) {
    return;
  }

  setIsSubmitting(true);

  try {
    if (isLogin) {
      // ✅ CONNEXION
      console.log('🔑 Tentative de connexion...');
      await loginUser(email, password);
      await loadFromFirebase();
      setIsSuccess(true);
      setTimeout(() => navigate('/home'), 500);
    } else {
      // ✅ INSCRIPTION
      console.log('📝 Tentative d\'inscription...');
      
      let photoURL = '';
      let coverPhotoURL = '';

      if (profilePhoto) {
        try {
          photoURL = await uploadProfilePhoto(profilePhoto, 'temp', 'profile');
        } catch (uploadError) {
          console.warn('⚠️ Erreur upload photo profil:', uploadError);
        }
      }

      if (coverPhoto) {
        try {
          coverPhotoURL = await uploadProfilePhoto(coverPhoto, 'temp', 'cover');
        } catch (uploadError) {
          console.warn('⚠️ Erreur upload photo couverture:', uploadError);
        }
      }

      const displayName = `${prenom} ${nom}`;
      await registerUser(
        email,
        password,
        displayName,
        username,
        bio || '',
        photoURL,
        coverPhotoURL,
        dateNaissance
      );

      console.log('✅ Compte créé avec succès');

      await syncAllToFirebase();

      setIsSuccess(true);
      setTimeout(() => navigate('/home'), 500);
    }
  } catch (err: any) {
    console.error('❌ Erreur:', err);
    // ✅ Afficher le message d'erreur personnalisé
    setError(err.message || 'Une erreur est survenue. Veuillez réessayer.');
  } finally {
    setIsSubmitting(false);
  }
};

  // ============================================================
  // 🔥 HANDLER - MOT DE PASSE OUBLIÉ
  // ============================================================
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetEmail.trim()) {
      setError('Veuillez entrer votre email');
      return;
    }
    if (!resetEmail.includes('@') || !resetEmail.includes('.')) {
      setError('Email invalide');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await sendPasswordReset(resetEmail);
      setResetSent(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetSent(false);
        setResetEmail('');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ============================================================
  // 🔥 HANDLER - GOOGLE
  // ============================================================
  const handleGoogleSignIn = () => {
    setError(null);
    setIsGoogleLoading(true);
    signInWithGoogleOAuth();
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError(null);
    setPassword('');
    setConfirmPassword('');
    setShowForgotPassword(false);
  };

  // ============================================================
  // 🔥 RENDU - LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="auth-loading">
        <div className="auth-loading-spinner" />
        <span>Chargement...</span>
      </div>
    );
  }

  // ============================================================
  // 🔥 RENDU - PAGE DE CONNEXION / INSCRIPTION
  // ============================================================
  return (
    <div className="auth-page">
      {/* BACKGROUND */}
      <div className="auth-background">
        <div className="auth-bg-circle circle-1" />
        <div className="auth-bg-circle circle-2" />
        <div className="auth-bg-circle circle-3" />
        <div className="auth-bg-circle circle-4" />
        <div className="auth-bg-circle circle-5" />
        <div className="auth-sparkles">
          <span className="sparkle">✦</span>
          <span className="sparkle">✦</span>
          <span className="sparkle">✦</span>
          <span className="sparkle">✦</span>
          <span className="sparkle">✦</span>
          <span className="sparkle">✦</span>
          <span className="sparkle">✦</span>
        </div>
      </div>

      {/* CONTAINER */}
      <div className="auth-container">
        
        {/* HEADER */}
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">
              <img src="/logo1.png" alt="K-POP UNITED" />
            </div>
          </div>
          <div className="auth-subtitle-wrapper">
            <div className="auth-subtitle-line">
              <i className="fas fa-microphone" />
              <span>
                {isLogin 
                  ? '🎤 Bienvenue dans la communauté K-Pop !' 
                  : '🌟 Rejoignez la communauté K-Pop ultime !'}
              </span>
              <i className="fas fa-microphone" />
            </div>
            <p className="auth-subtitle-desc">
              {isLogin 
                ? 'Connectez-vous pour retrouver vos fans et artistes préférés' 
                : 'Créez votre compte et rejoignez des millions de fans'}
            </p>
          </div>
        </div>

        {/* CONTENU */}
        <div className="auth-scroll-content">
          
          {/* SUCCESS */}
          {isSuccess && (
            <div className="auth-success">
              <i className="fas fa-check-circle" />
              <span>{isLogin ? 'Connexion réussie !' : 'Compte créé avec succès !'}</span>
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="auth-error">
              <i className="fas fa-exclamation-circle" />
              <span>{error}</span>
            </div>
          )}

          {/* ============================================================
              MOT DE PASSE OUBLIÉ
          ============================================================ */}
          {showForgotPassword ? (
            <form className="auth-form" onSubmit={handleForgotPassword}>
              <div className="auth-forgot-title">
                <i className="fas fa-key" />
                <span>Réinitialisation du mot de passe</span>
              </div>
              <p className="auth-forgot-desc">
                Entrez votre email pour recevoir un lien de réinitialisation
              </p>
              <div className="auth-input-group">
                <i className="fas fa-envelope" />
                <input
                  type="email"
                  placeholder="Votre adresse email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              {resetSent && (
                <div className="auth-success">
                  <i className="fas fa-check-circle" />
                  <span>✅ Email envoyé ! Vérifiez votre boîte de réception</span>
                </div>
              )}
              <button 
                type="submit" 
                className="auth-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="auth-spinner" />
                    Envoi en cours...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane" />
                    Envoyer le lien
                  </>
                )}
              </button>
              <button 
                type="button" 
                className="auth-forgot-back"
                onClick={() => { setShowForgotPassword(false); setError(null); }}
              >
                <i className="fas fa-arrow-left" /> Retour à la connexion
              </button>
            </form>
          ) : (
            /* ============================================================
               FORMULAIRE DE CONNEXION / INSCRIPTION
            ============================================================ */
            <form className="auth-form" onSubmit={handleSubmit}>
              
              {/* INSCRIPTION - PHOTOS */}
              {!isLogin && (
                <>
                  <div className="auth-photo-section">
                    <div className="auth-photo-upload" onClick={() => profileInputRef.current?.click()}>
                      {profilePhotoPreview ? (
                        <img src={profilePhotoPreview} alt="Profile" />
                      ) : (
                        <div className="auth-photo-placeholder">
                          <i className="fas fa-camera" />
                          <span>Photo</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={profileInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleProfilePhotoChange}
                      />
                    </div>
                    <div className="auth-cover-upload" onClick={() => coverInputRef.current?.click()}>
                      {coverPhotoPreview ? (
                        <img src={coverPhotoPreview} alt="Cover" />
                      ) : (
                        <div className="auth-cover-placeholder">
                          <i className="fas fa-image" />
                          <span>Cover</span>
                        </div>
                      )}
                      <input
                        type="file"
                        ref={coverInputRef}
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={handleCoverPhotoChange}
                      />
                    </div>
                  </div>

                  <div className="auth-input-group">
                    <i className="fas fa-user" />
                    <input
                      type="text"
                      placeholder="Nom"
                      value={nom}
                      onChange={(e) => setNom(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-input-group">
                    <i className="fas fa-user-tag" />
                    <input
                      type="text"
                      placeholder="Prénom"
                      value={prenom}
                      onChange={(e) => setPrenom(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-input-group">
                    <i className="fas fa-at" />
                    <input
                      type="text"
                      placeholder="Nom d'utilisateur (unique)"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>

                  <div className="auth-input-group">
                    <i className="fas fa-calendar-alt" />
                    <input
                      type="date"
                      placeholder="Date de naissance"
                      value={dateNaissance}
                      onChange={(e) => setDateNaissance(e.target.value)}
                      required
                      max={new Date().toISOString().split('T')[0]}
                    />
                  </div>

                  <div className="auth-input-group">
                    <i className="fas fa-pen" />
                    <input
                      type="text"
                      placeholder="Bio (optionnel)"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      maxLength={150}
                    />
                  </div>
                </>
              )}

              {/* EMAIL */}
              <div className="auth-input-group">
                <i className="fas fa-envelope" />
                <input
                  type="email"
                  placeholder="Adresse email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus={isLogin}
                />
              </div>

              {/* MOT DE PASSE */}
              <div className="auth-input-group">
                <i className="fas fa-lock" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mot de passe (min 6 caractères)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                </button>
              </div>

              {/* CONFIRMATION MOT DE PASSE (inscription) */}
              {!isLogin && (
                <div className="auth-input-group">
                  <i className="fas fa-check-circle" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirmer le mot de passe"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`} />
                  </button>
                </div>
              )}

              {/* OPTIONS (connexion) */}
              {isLogin && (
                <div className="auth-options">
                  <label className="auth-remember">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Se souvenir de moi</span>
                  </label>
                  <button 
                    type="button" 
                    className="auth-forgot"
                    onClick={() => setShowForgotPassword(true)}
                  >
                    <i className="fas fa-key" /> Mot de passe oublié ?
                  </button>
                </div>
              )}

              {/* BOUTON SUBMIT */}
              <button 
                type="submit" 
                className={`auth-submit ${isSubmitting ? 'loading' : ''}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <span className="auth-spinner" />
                    {isLogin ? 'Connexion...' : 'Création du compte...'}
                  </>
                ) : (
                  <>
                    <i className={`fas ${isLogin ? 'fa-sign-in-alt' : 'fa-user-plus'}`} />
                    {isLogin ? 'Se connecter' : 'Créer un compte'}
                  </>
                )}
              </button>
            </form>
          )}

          {/* ============================================================
              DIVIDER - "ou continuer avec"
          ============================================================ */}
          {!showForgotPassword && (
            <>
              <div className="auth-divider">
                <span>ou continuer avec</span>
              </div>

              <div className="auth-social">
                <button 
                  className={`auth-social-btn google ${isGoogleLoading ? 'loading' : ''}`}
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  aria-label="Google"
                >
                  {isGoogleLoading ? (
                    <span className="auth-social-spinner" />
                  ) : (
                    <div className="google-icon-wrapper">
                      <svg width="20" height="20" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
                      </svg>
                    </div>
                  )}
                </button>
              </div>

              {/* TOGGLE */}
              <div className="auth-toggle">
                {isLogin ? (
                  <p>
                    Pas encore de compte ?{' '}
                    <button onClick={switchMode}>S'inscrire</button>
                  </p>
                ) : (
                  <p>
                    Déjà un compte ?{' '}
                    <button onClick={switchMode}>Se connecter</button>
                  </p>
                )}
              </div>
            </>
          )}

        </div>

        {/* FOOTER */}
        <div className="auth-footer">
          <p>
            <i className="fas fa-shield-alt" /> En continuant, vous acceptez nos{' '}
            <a href="/terms">Conditions d'utilisation</a> et notre{' '}
            <a href="/privacy">Politique de confidentialité</a>
          </p>
          <p className="footer-made">
            <i className="fas fa-music" /> K-POP UNITED • The Ultimate K-Pop Community <i className="fas fa-music" />
          </p>
        </div>

      </div>
    </div>
  );
};

export default Auth;