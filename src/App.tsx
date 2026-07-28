import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import '@fortawesome/fontawesome-free/css/all.min.css';

// ============================================================
// IMPORTS DES PAGES
// ============================================================
import AppLayout from './layout/AppLayout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Events from './pages/Events';
import Groups from './pages/Groups';
import GroupDetails from './pages/GroupDetails';
import Messages from './pages/Messages';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import ProfilePage from './pages/ProfilePage';
import Search from './pages/Search';
import Auth from './pages/Auth';
import CreatePostPage from './pages/CreatePostPage';
import PostDetails from './pages/PostDetails';
import Splash from './pages/Splash';
import Settings from './pages/Settings/Settings';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import DownloadButton from './components/DownloadButton';
import Friends from './pages/Friends';

// ============================================================
// IMPORTS FIREBASE
// ============================================================
import { AuthProvider } from './context/AuthContext';
import { PrivateRoute } from './components/PrivateRoute';

// ============================================================
// IMPORTS STYLES
// ============================================================
import './styles/global.css';

// ============================================================
// THEME CONTEXT
// ============================================================
export const ThemeContext = React.createContext({
  isDark: true,
  toggleTheme: () => {},
});

// ============================================================
// COMPOSANT POUR NETTOYER L'URL APRES OAUTH
// ============================================================
const CleanUrl: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  
  useEffect(() => {
    if (location.hash && location.hash.includes('access_token')) {
      window.history.replaceState({}, document.title, location.pathname);
    }
    if (location.search && location.search.includes('code=')) {
      window.history.replaceState({}, document.title, location.pathname);
    }
  }, [location]);
  
  return <>{children}</>;
};

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const App: React.FC = () => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved ? saved === 'dark' : true;
  });

  // PWA - Détecter si l'app est installée
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsAppInstalled(true);
    }

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handler = (e: MediaQueryListEvent) => {
      setIsAppInstalled(e.matches);
    };
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // PWA - Écouter l'événement beforeinstallprompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Gestion du thème
  useEffect(() => {
    if (isDark) {
      document.body.classList.remove('light-mode');
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
      document.body.classList.add('light-mode');
    }
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      <AuthProvider>
        <Router>
          <CleanUrl>
            <Routes>
              {/* ROUTES PUBLIQUES (tsy mila login) */}
              <Route path="/" element={<Splash />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/auth/callback" element={<Auth />} />
              <Route path="/auth/reset-password" element={<Auth />} />
              <Route path="/auth/verify-email" element={<Auth />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />

              {/* ROUTES PRIVÉES (mila login) */}
              <Route 
                path="/" 
                element={
                  <PrivateRoute>
                    <AppLayout toggleTheme={toggleTheme} isDark={isDark} />
                  </PrivateRoute>
                }
              >
                <Route index element={<Home />} />
                <Route path="home" element={<Home />} />
                <Route path="explore" element={<Explore />} />
                <Route path="events" element={<Events />} />
                <Route path="groups" element={<Groups />} />
                <Route path="groups/:id" element={<GroupDetails />} />
                <Route path="messages" element={<Messages />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="profile" element={<Profile />} />
                <Route path="profile/:username" element={<Profile />} />
                <Route path="search" element={<Search />} />
                <Route path="create-post" element={<CreatePostPage />} />
                <Route path="post/:id" element={<PostDetails />} />
                <Route path="settings/*" element={<Settings />} />
                <Route path="friends" element={<Friends />} />
              </Route>

              {/* REDIRECTION PAR DÉFAUT */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </CleanUrl>
        </Router>
        
        {/* Bouton de téléchargement en bas à droite */}
        <DownloadButton isAppInstalled={isAppInstalled} />
        
      </AuthProvider>
    </ThemeContext.Provider>
  );
};

export default App;