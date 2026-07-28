// ========== src/services/oauthService.ts ==========
import { OAUTH_CONFIG, getUserInfo } from '../config/oauth';

interface OAuthUser {
  id: string;
  email: string;
  name: string;
  avatar: string;
  accessToken: string;
  refreshToken?: string;
}

// 🔥 LANCER LE LOGIN GOOGLE (Redirection)
export const signInWithGoogleOAuth = () => {
  const { clientId, redirectUri, scope, authUri } = OAUTH_CONFIG;
  
  // ✅ Ampidiro ny state mba hisorohana ny CSRF
  const state = Math.random().toString(36).substring(2, 15);
  localStorage.setItem('oauth_state', state);
  
  const loginUrl = `${authUri}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}&state=${state}`;
  
  console.log('🔗 Redirect URI:', redirectUri);
  console.log('🔗 Login URL:', loginUrl);
  
  window.location.href = loginUrl;
};

// 🔥 RÉCUPÉRER LE TOKEN DEPUIS L'URL (Callback)
export const getTokenFromUrl = (): string | null => {
  const hash = window.location.hash;
  if (hash) {
    const params = new URLSearchParams(hash.substring(1));
    const token = params.get('access_token');
    const state = params.get('state');
    const savedState = localStorage.getItem('oauth_state');
    
    // ✅ Vérifier le state
    if (state && savedState && state !== savedState) {
      console.error('❌ State mismatch! Possible CSRF attack');
      return null;
    }
    
    localStorage.removeItem('oauth_state');
    return token;
  }
  return null;
};

// 🔥 RÉCUPÉRER LES INFOS DE L'UTILISATEUR
export const getOAuthUserInfo = async (accessToken: string): Promise<OAuthUser | null> => {
  try {
    const userInfo = await getUserInfo(accessToken);
    
    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name || userInfo.displayName || 'Utilisateur',
      avatar: userInfo.picture || 'https://i.pravatar.cc/150?img=16',
      accessToken: accessToken,
    };
  } catch (error) {
    console.error('❌ Error getting OAuth user info:', error);
    return null;
  }
};

// 🔥 SAUVEGARDER L'UTILISATEUR OAuth
export const saveOAuthUser = (user: OAuthUser) => {
  localStorage.setItem('oauth_user', JSON.stringify(user));
};

// 🔥 RÉCUPÉRER L'UTILISATEUR OAuth
export const getOAuthUser = (): OAuthUser | null => {
  const stored = localStorage.getItem('oauth_user');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// 🔥 DÉCONNEXION OAuth
export const logoutOAuthUser = () => {
  localStorage.removeItem('oauth_user');
  localStorage.removeItem('oauth_state');
};

// 🔥 RAFTRA: Sign in with Google Popup (raha tsy mandeha ny redirect)
export const signInWithGooglePopup = (): Promise<OAuthUser | null> => {
  return new Promise((resolve, reject) => {
    const { clientId, redirectUri, scope, authUri } = OAUTH_CONFIG;
    
    const width = 500;
    const height = 600;
    const left = window.screenX + (window.outerWidth - width) / 2;
    const top = window.screenY + (window.outerHeight - height) / 2;
    
    const popup = window.open(
      `${authUri}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent(scope)}`,
      'Google OAuth',
      `width=${width},height=${height},left=${left},top=${top}`
    );
    
    if (!popup) {
      reject(new Error('Popup blocked'));
      return;
    }
    
    const checkPopup = setInterval(() => {
      try {
        const popupUrl = popup.location.href;
        if (popupUrl.includes('access_token=')) {
          clearInterval(checkPopup);
          const hash = popupUrl.split('#')[1];
          const params = new URLSearchParams(hash);
          const token = params.get('access_token');
          if (token) {
            popup.close();
            // Maka ny user info
            getUserInfo(token).then(userInfo => {
              resolve({
                id: userInfo.id,
                email: userInfo.email,
                name: userInfo.name || 'Utilisateur',
                avatar: userInfo.picture || 'https://i.pravatar.cc/150',
                accessToken: token,
              });
            }).catch(() => {
              reject(new Error('Failed to get user info'));
            });
          }
        }
      } catch (e) {
        // Cross-origin error - tsy misy olana
      }
    }, 500);
    
    const checkClosed = setInterval(() => {
      if (popup.closed) {
        clearInterval(checkPopup);
        clearInterval(checkClosed);
        reject(new Error('Popup closed'));
      }
    }, 1000);
  });
};