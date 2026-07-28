// ========== src/pages/Splash.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Splash.css';

const Splash: React.FC = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [progress, setProgress] = useState(0);
  const [showLogo1, setShowLogo1] = useState(false);

  // ✅ Vérifier si l'utilisateur est déjà connecté
  useEffect(() => {
    if (!loading && user) {
      navigate('/home');
    }
  }, [user, loading, navigate]);

  // ✅ Barre de progression
  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setShowLogo1(true);
          
          // ✅ Redirection après le chargement
          setTimeout(() => {
            if (user) {
              navigate('/home');
            } else {
              navigate('/auth');
            }
          }, 800);
          
          return 100;
        }
        return prev + 1.5;
      });
    }, 25);

    return () => clearInterval(interval);
  }, [navigate, user]);

  // ✅ Si l'utilisateur est connecté, rediriger immédiatement
  if (!loading && user) {
    return null;
  }

  return (
    <div className="splash-screen">
      <div className="splash-content">
        <div className="splash-logo-container">
          <img 
            src={showLogo1 ? '/logo1.png' : '/logo.png'} 
            alt="K-POP UNITED" 
            className={`splash-logo ${showLogo1 ? 'fade-in' : ''}`}
          />
        </div>

        <h1 className="splash-title">K-POP UNITED</h1>
        <p className="splash-subtitle">The Ultimate K-Pop Community</p>

        <div className="splash-progress-container">
          <div className="splash-progress-bar">
            <div 
              className="splash-progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="splash-progress-text">
            {progress < 100 ? `Chargement... ${Math.round(progress)}%` : '✨ Prêt !'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default Splash;