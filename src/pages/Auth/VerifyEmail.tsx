// ========== src/pages/Auth/VerifyEmail.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  sendVerificationLink, 
  isVerificationLink, 
  verifyEmailLink,
  sendPasswordReset,
} from '../../services/authService';
import '../../styles/VerifyEmail.css';

const VerifyEmail: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'email' | 'sent' | 'verified'>('email');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  // ✅ Vérifier si c'est un lien de vérification
  useEffect(() => {
    const currentUrl = window.location.href;
    if (isVerificationLink(currentUrl)) {
      const savedEmail = window.localStorage.getItem('emailForSignIn');
      if (savedEmail) {
        handleVerifyLink(savedEmail, currentUrl);
      }
    }
  }, []);

  // ✅ Traiter le lien de vérification
  const handleVerifyLink = async (email: string, url: string) => {
    setIsLoading(true);
    setError(null);
    try {
      await verifyEmailLink(email, url);
      setStep('verified');
      // ✅ Rehefa voavérifia dia mandefa email reset password
      await sendPasswordReset(email);
      alert('✅ Email vérifié! Un lien de réinitialisation a été envoyé.');
      setTimeout(() => navigate('/auth'), 3000);
    } catch (err: any) {
      setError(err.message || 'Lien invalide ou expiré');
    } finally {
      setIsLoading(false);
    }
  };

  // 📧 Envoyer le lien de vérification
  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Veuillez entrer votre adresse email');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await sendVerificationLink(email);
      setEmailSent(true);
      setStep('sent');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de l\'envoi du lien');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="verify-email-page">
      <div className="verify-email-container">
        
        {/* HEADER */}
        <div className="verify-email-header">
          <div className="verify-email-logo">
            <img src="/logo1.png" alt="K-POP UNITED" />
          </div>
          <h1>Vérification par Email</h1>
          <p>
            {step === 'email' && 'Entrez votre email pour recevoir un lien de vérification'}
            {step === 'sent' && '✅ Un lien a été envoyé à votre email'}
            {step === 'verified' && '✅ Email vérifié avec succès!'}
          </p>
        </div>

        {/* ERROR */}
        {error && (
          <div className="verify-error">
            <i className="fas fa-exclamation-circle" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: EMAIL */}
        {step === 'email' && (
          <form className="verify-form" onSubmit={handleSendLink}>
            <div className="verify-input-group">
              <i className="fas fa-envelope" />
              <input
                type="email"
                placeholder="Votre adresse email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
            <button 
              type="submit" 
              className="verify-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="spinner" />
                  Envoi en cours...
                </>
              ) : (
                <>
                  <i className="fas fa-paper-plane" />
                  Envoyer le lien de vérification
                </>
              )}
            </button>
          </form>
        )}

        {/* STEP 2: EMAIL SENT */}
        {step === 'sent' && (
          <div className="verify-sent">
            <i className="fas fa-envelope-open-text" />
            <h3>📧 Lien envoyé !</h3>
            <p>Un lien de vérification a été envoyé à :</p>
            <p className="verify-email-display">{email}</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)' }}>
              Cliquez sur le lien dans l'email pour vérifier votre compte.
            </p>
            <button 
              className="verify-resend"
              onClick={() => {
                setStep('email');
                setEmailSent(false);
              }}
            >
              <i className="fas fa-redo" />
              Renvoyer le lien
            </button>
          </div>
        )}

        {/* STEP 3: VERIFIED */}
        {step === 'verified' && (
          <div className="verify-success-big">
            <i className="fas fa-check-circle" />
            <h2>✅ Vérification réussie !</h2>
            <p>Un email de réinitialisation a été envoyé.</p>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.2)', marginTop: '8px' }}>
              Vous allez être redirigé vers la page de connexion...
            </p>
          </div>
        )}

        {/* BACK TO LOGIN */}
        {step !== 'verified' && (
          <div className="verify-back">
            <button onClick={() => navigate('/auth')}>
              <i className="fas fa-arrow-left" />
              Retour à la connexion
            </button>
          </div>
        )}

        {/* FOOTER */}
        <div className="verify-footer">
          <p>K-POP UNITED • The Ultimate K-Pop Community</p>
        </div>

      </div>
    </div>
  );
};

export default VerifyEmail;