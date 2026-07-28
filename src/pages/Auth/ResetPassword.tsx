// ========== src/pages/Auth/ResetPassword.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  verifyResetCode, 
  confirmResetPassword,
  sendPasswordReset,
} from '../../services/authService';
import '../../styles/ResetPassword.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [oobCode, setOobCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState<'loading' | 'password' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ Vérifier le code dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const mode = params.get('mode');
    const code = params.get('oobCode');
    
    if (code && mode === 'resetPassword') {
      setOobCode(code);
      verifyCode(code);
    } else {
      setStep('password');
    }
  }, [location]);

  // ✅ Vérifier le code
  const verifyCode = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await verifyResetCode(code);
      if (result.valid && result.email) {
        setEmail(result.email);
        setStep('password');
      } else {
        setError('Lien invalide ou expiré. Veuillez en demander un nouveau.');
        setStep('password');
      }
    } catch (err) {
      setError('Lien invalide ou expiré. Veuillez en demander un nouveau.');
      setStep('password');
    } finally {
      setIsLoading(false);
    }
  };

  // ✅ Réinitialiser le mot de passe
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await confirmResetPassword(oobCode, newPassword);
      setStep('success');
      setTimeout(() => navigate('/auth'), 3000);
    } catch (err) {
      setError('Erreur lors de la réinitialisation. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="reset-password-page">
      <div className="reset-password-container">
        
        {/* HEADER */}
        <div className="reset-password-header">
          <div className="reset-password-logo">
            <img src="/logo1.png" alt="K-POP UNITED" />
          </div>
          <h1>Réinitialisation du mot de passe</h1>
          <p>
            {step === 'password' && 'Créez un nouveau mot de passe'}
            {step === 'success' && '✅ Mot de passe réinitialisé avec succès !'}
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="reset-error">
            <i className="fas fa-exclamation-circle" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP: NEW PASSWORD */}
        {step === 'password' && (
          <form className="reset-form" onSubmit={handleResetPassword}>
            {email && (
              <div className="reset-info">
                <i className="fas fa-info-circle" />
                <span>Réinitialisation pour: <strong>{email}</strong></span>
              </div>
            )}

            <div className="reset-input-group">
              <i className="fas fa-lock" />
              <input
                type="password"
                placeholder="Nouveau mot de passe (min 6 caractères)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <div className="reset-input-group">
              <i className="fas fa-check-circle" />
              <input
                type="password"
                placeholder="Confirmer le mot de passe"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            <button 
              type="submit" 
              className="reset-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <i className="fas fa-check" />
                  Réinitialiser
                </>
              )}
            </button>
          </form>
        )}

        {/* SUCCESS */}
        {step === 'success' && (
          <div className="reset-success-big">
            <i className="fas fa-check-circle" />
            <h2>✅ Mot de passe réinitialisé !</h2>
            <p>Votre mot de passe a été changé avec succès.</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        )}

        {/* BACK TO LOGIN */}
        {step !== 'success' && (
          <div className="reset-back">
            <button onClick={() => navigate('/auth')}>
              <i className="fas fa-arrow-left" />
              Retour à la connexion
            </button>
          </div>
        )}

        {/* FOOTER */}
        <div className="reset-footer">
          <p>K-POP UNITED • The Ultimate K-Pop Community</p>
        </div>

      </div>
    </div>
  );
};

export default ResetPassword;