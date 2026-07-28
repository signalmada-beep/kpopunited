// ========== src/components/Header.tsx ==========
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../services/notificationService';
import '../styles/Header.css';

interface HeaderProps {
  toggleTheme: () => void;
  isDark: boolean;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
}

const Header: React.FC<HeaderProps> = ({
  toggleTheme,
  isDark,
  onToggleMobileMenu,
  isMobileMenuOpen,
}) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // ============================================================
  // Détecter si c'est un mobile
  // ============================================================
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================
  // NOTIFICATIONS UNREAD COUNT
  // ============================================================
  useEffect(() => {
    const unsubscribe = getUnreadCount((count) => {
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, []);

  // ============================================================
  // HANDLE SEARCH
  // ============================================================
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  // ============================================================
  // TENY USER DATA - TSY MAMPISY SARY IVELANY
  // ============================================================
  const displayName = user?.name || 'K-Pop Fan';
  const hasAvatar = user?.avatar && user.avatar !== '' && !user.avatar.startsWith('https://i.pravatar.cc');
  const hasCover = user?.coverPhoto && user.coverPhoto !== '' && !user.coverPhoto.startsWith('https://picsum.photos');

  return (
    <header className="header">
      <div className="header-container">
        {/* ============================================================
            GAUCHE - Menu Mobile + Logo
        ============================================================ */}
        <div className="header-left">
          <button
            className="mobile-menu-btn"
            onClick={onToggleMobileMenu}
            aria-label="Menu"
          >
            <i className={`fas ${isMobileMenuOpen ? 'fa-times' : 'fa-bars'}`} />
          </button>

          <Link to="/" className="header-logo">
            <div className="logo-container">
              <i className="fas fa-microphone header-logo-icon" />
              <span className="logo-text">K-POP UNITED</span>
            </div>
          </Link>
        </div>

        {/* ============================================================
            CENTRE - Recherche (Desktop uniquement avec placeholder)
        ============================================================ */}
        {!isMobile && (
          <div className="header-center">
            <form className="search-bar" onSubmit={handleSearch}>
              <i className="fas fa-search search-icon" />
              <input
                type="text"
                placeholder="Search K-Pop..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button 
                  type="button" 
                  className="search-clear-btn"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <i className="fas fa-times-circle" />
                </button>
              )}
            </form>
          </div>
        )}

        {/* ============================================================
            DROITE - Actions
        ============================================================ */}
        <div className="header-right">
          {/* Theme Toggle */}
          <button className="header-btn" onClick={toggleTheme} aria-label="Theme">
            <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} />
          </button>

          {/* Notifications */}
          <Link to="/notifications" className="header-btn" aria-label="Notifications">
            <i className="fas fa-bell" />
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </Link>

          {/* Messages */}
          <Link to="/messages" className="header-btn" aria-label="Messages">
            <i className="fas fa-envelope" />
          </Link>

          {/* ⚡ RECHERCHE MOBILE - Icone fa-search eo amin'ny droite (akaikin'ny avatar) */}
          {isMobile && (
            <button 
              className="header-btn mobile-search-btn" 
              onClick={() => navigate('/search')}
              aria-label="Search"
            >
              <i className="fas fa-search" />
            </button>
          )}

          {/* Profile - Tsy mampiasa sary ivelany, fa FontAwesome raha tsy misy */}
          <Link to="/profile" className="header-avatar" title={displayName}>
            {hasAvatar ? (
              <img 
                src={user.avatar} 
                alt={displayName}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none';
                  (e.target as HTMLImageElement).parentElement?.classList.add('no-avatar');
                }}
              />
            ) : (
              <div className="avatar-placeholder">
                <i className="fas fa-user" />
              </div>
            )}
          </Link>
        </div>
      </div>
    </header>
  );
};

export default Header;