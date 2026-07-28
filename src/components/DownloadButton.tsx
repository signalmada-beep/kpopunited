// ========== src/components/DownloadButton.tsx ==========
import React, { useState, useEffect } from 'react';
import '../styles/DownloadButton.css';

interface DownloadButtonProps {
  isAppInstalled?: boolean;
}

const DownloadButton: React.FC<DownloadButtonProps> = ({ isAppInstalled = false }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);

  // 🔥 Mijery raha efa nisy téléchargement tamin'ity session ity
  useEffect(() => {
    const hasDownloaded = sessionStorage.getItem('kpop_downloaded');
    if (hasDownloaded) {
      const timer = setTimeout(() => {
        sessionStorage.removeItem('kpop_downloaded');
        setIsVisible(true);
      }, 5 * 60 * 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  // 🔥 Raha efa tafiditra anaty app (PWA installed) dia tsy mampiseho
  useEffect(() => {
    if (isAppInstalled) {
      setIsVisible(false);
    }
  }, [isAppInstalled]);

  // 🔥 Mijery raha misy beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // 🔥 Hide / View
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // 🔥 Téléchargement / Installation PWA
  const handleDownload = () => {
    // 🔥 Raha misy beforeinstallprompt (PWA)
    if ((window as any).deferredPrompt) {
      setShowConfirm(true);
      return;
    }
    
    // 🔥 Raha tsy misy PWA, téléchargement classique
    setShowConfirm(true);
  };

  const confirmDownload = async () => {
    setShowConfirm(false);
    
    // 🔥 Vérifier si PWA
    const deferredPrompt = (window as any).deferredPrompt;
    
    if (deferredPrompt) {
      // ✅ PWA Installation
      setIsDownloading(true);
      setDownloadProgress(0);
      
      // Simuler la progression
      const interval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            return 100;
          }
          return prev + 2;
        });
      }, 50);
      
      try {
        const result = await deferredPrompt.prompt();
        const outcome = result.outcome;
        
        if (outcome === 'accepted') {
          console.log('✅ PWA installée avec succès');
          setIsDownloading(false);
          setIsVisible(false);
          sessionStorage.setItem('kpop_downloaded', 'true');
        } else {
          console.log('❌ Installation annulée');
          setIsDownloading(false);
          setDownloadProgress(0);
        }
        
        (window as any).deferredPrompt = null;
        setShowInstallPrompt(false);
      } catch (error) {
        console.error('❌ Erreur installation PWA:', error);
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    } else {
      // ✅ Téléchargement classique (APK ou Web)
      await startActualDownload();
    }
  };

  const cancelDownload = () => {
    setShowConfirm(false);
    setIsDownloading(false);
    setDownloadProgress(0);
  };

  const startActualDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0);

    // Simulation de téléchargement
    const interval = setInterval(() => {
      setDownloadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsDownloading(false);
          
          // Téléchargement réel
          performDownload();
          
          sessionStorage.setItem('kpop_downloaded', 'true');
          setTimeout(() => setIsVisible(false), 2000);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const performDownload = () => {
    // 🔥 URL de téléchargement (APK ou lien)
    // Rehefa deploy dia ovaina ho URL tena izy
    const downloadUrl = window.location.origin + '/K-POP_UNITED.apk';
    
    // Créer un lien de téléchargement
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'K-POP_UNITED.apk';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    console.log('📱 Téléchargement lancé');
  };

  // 🔥 Raha tsy hita dia tsy mampiseho
  if (!isVisible || isAppInstalled) {
    return (
      <button 
        className="download-toggle-btn"
        onClick={toggleVisibility}
        title="Afficher le téléchargement"
      >
        <i className="fas fa-download" />
      </button>
    );
  }

  return (
    <>
      {/* Bouton principal */}
      <div className="download-button-container">
        <button 
          className={`download-button ${isDownloading ? 'downloading' : ''} ${showInstallPrompt ? 'pwa-ready' : ''}`}
          onClick={handleDownload}
          disabled={isDownloading}
        >
          <div className="download-icon-wrapper">
            <i className={`fas ${isDownloading ? 'fa-spinner fa-spin' : showInstallPrompt ? 'fa-mobile-alt' : 'fa-download'}`} />
          </div>
          <div className="download-content">
            <span className="download-title">K-POP UNITED</span>
            <span className="download-subtitle">
              {isDownloading 
                ? 'Téléchargement en cours...' 
                : showInstallPrompt 
                  ? 'Installer l\'application' 
                  : 'Télécharger l\'application'}
            </span>
          </div>
          <div className="download-chevron">
            <i className="fas fa-chevron-right" />
          </div>
          {isDownloading && (
            <div className="download-progress-bar">
              <div 
                className="download-progress-fill" 
                style={{ width: `${downloadProgress}%` }}
              />
            </div>
          )}
        </button>

        {/* Bouton Hide */}
        <button 
          className="download-hide-btn"
          onClick={toggleVisibility}
          title="Masquer"
        >
          <i className="fas fa-times" />
        </button>
      </div>

      {/* Modal de confirmation */}
      {showConfirm && (
        <div className="download-modal-overlay" onClick={cancelDownload}>
          <div className="download-modal" onClick={(e) => e.stopPropagation()}>
            <div className="download-modal-header">
              <div className="modal-icon">
                <i className={`fas ${showInstallPrompt ? 'fa-mobile-alt' : 'fa-download'}`} />
              </div>
              <h3>
                {showInstallPrompt 
                  ? 'Installer K-POP UNITED' 
                  : 'Télécharger K-POP UNITED'}
              </h3>
              <button className="modal-close" onClick={cancelDownload}>
                <i className="fas fa-times" />
              </button>
            </div>

            <div className="download-modal-body">
              <div className="modal-app-icon">
                <img src="/logo1.png" alt="K-POP UNITED" />
              </div>
              <h4>K-POP UNITED</h4>
              <p>The Ultimate K-Pop Community</p>
              
              <div className="modal-features">
                <div className="feature-item">
                  <i className="fas fa-microphone" />
                  <span>Suivez vos artistes préférés</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-users" />
                  <span>Rejoignez la communauté</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-calendar-alt" />
                  <span>Ne ratez aucun événement</span>
                </div>
                <div className="feature-item">
                  <i className="fas fa-video" />
                  <span>Partagez vos moments K-Pop</span>
                </div>
              </div>

              <div className="modal-info">
                <i className="fas fa-shield-alt" />
                <span>
                  {showInstallPrompt 
                    ? 'Installation sécurisée • Gratuit' 
                    : 'Téléchargement sécurisé • 100% gratuit'}
                </span>
              </div>
            </div>

            <div className="download-modal-footer">
              <button className="modal-btn cancel" onClick={cancelDownload}>
                Annuler
              </button>
              <button className="modal-btn confirm" onClick={confirmDownload}>
                <i className={`fas ${showInstallPrompt ? 'fa-download' : 'fa-download'}`} />
                {showInstallPrompt ? 'Installer maintenant' : 'Télécharger maintenant'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DownloadButton;