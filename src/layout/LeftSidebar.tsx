// ========== src/layout/LeftSidebar.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUnreadCount } from '../services/notificationService';
import '../styles/LeftSidebar.css';
import '../styles/LeftSidebarResponsive.css';

interface LeftSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const LeftSidebar: React.FC<LeftSidebarProps> = ({ isOpen = false, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  // ============================================================
  // 🔥 NOTIFICATIONS UNREAD COUNT
  // ============================================================
  useEffect(() => {
    const unsubscribe = getUnreadCount((count) => {
      setUnreadCount(count);
    });
    return () => unsubscribe();
  }, []);

  // ============================================================
  // 🔥 NAVIGATION
  // ============================================================
  const handleClick = (path: string) => {
    navigate(path);
    if (onClose) {
      setTimeout(onClose, 200);
    }
  };

  // ============================================================
  // 🔥 NAV ITEMS
  // ============================================================
  const navItems = [
    { to: '/', label: 'Home', icon: 'fa-house' },
    { to: '/explore', label: 'Explore', icon: 'fa-compass' },
    { to: '/messages', label: 'Messages', icon: 'fa-envelope' },
    { to: '/notifications', label: 'Notifications', icon: 'fa-bell', badge: unreadCount > 0 ? unreadCount : undefined },
    { to: '/events', label: 'Events', icon: 'fa-calendar-alt' },
    { to: '/groups', label: 'Groups', icon: 'fa-users' },
    { to: '/friends', label: 'Friends', icon: 'fa-user-friends' },
    { to: '/profile', label: 'Profile', icon: 'fa-user' },
    { to: '/settings', label: 'Settings', icon: 'fa-cog' },
  ];

  // ============================================================
  // 🔥 RENDER CONTENT
  // ============================================================
  const sidebarContent = (
    <>
      <div className="section-label">MAIN</div>
      {navItems.slice(0, 4).map((item) => (
        <NavItem
          key={item.to}
          item={item}
          isActive={location.pathname === item.to}
          onClick={() => handleClick(item.to)}
        />
      ))}
      <div className="section-label">SOCIAL</div>
      {navItems.slice(4, 7).map((item) => (
        <NavItem
          key={item.to}
          item={item}
          isActive={location.pathname === item.to}
          onClick={() => handleClick(item.to)}
        />
      ))}
      <div className="section-label">PERSONAL</div>
      {navItems.slice(7, 9).map((item) => (
        <NavItem
          key={item.to}
          item={item}
          isActive={location.pathname === item.to}
          onClick={() => handleClick(item.to)}
        />
      ))}
      <button className="create-btn" onClick={() => handleClick('/create-post')}>
        <i className="fas fa-plus create-icon" />
        <span>Create Post</span>
      </button>
    </>
  );

  // ============================================================
  // 🔥 USER SECTION
  // ============================================================
  const displayName = user?.displayName || user?.name || 'K-Pop Fan';
  const avatarUrl = user?.photoURL || user?.avatar || '';
  
  const hasAvatar = avatarUrl && avatarUrl !== '' && 
    !avatarUrl.startsWith('https://i.pravatar.cc') && 
    !avatarUrl.startsWith('https://picsum.photos');

  const userContent = (
    <div className="user-section">
      <div className="user-item" onClick={() => handleClick('/profile')}>
        <div className="user-avatar">
          {hasAvatar ? (
            <img 
              src={avatarUrl} 
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
        </div>
        <div className="user-info">
          <span className="user-name">{displayName}</span>
          <span className="user-status">
            <span className="online-dot" />
            Online
          </span>
        </div>
      </div>
    </div>
  );

  // ============================================================
  // 🔥 RENDER DESKTOP (tsy mobile)
  // ============================================================
  return (
    <>
      {/* ✅ SIDEBAR PRINCIPAL */}
      <div className="left-sidebar-premium">
        <div className="scroll-container">
          <div className="scroll-content">{sidebarContent}</div>
        </div>
        {userContent}
      </div>

      {/* ✅ OVERLAY MOBILE (rehefa misokatra) */}
      {isOpen && <div className="left-sidebar-overlay" onClick={() => onClose && onClose()} />}

      {/* ✅ SIDEBAR MOBILE (mipoitra rehefa misokatra) */}
      <div className={`left-sidebar-premium mobile-sidebar ${isOpen ? 'open' : ''}`}>
        <button className="left-sidebar-close-btn" onClick={() => onClose && onClose()}>
          <i className="fas fa-times" />
        </button>
        <div className="scroll-container">
          <div className="scroll-content">{sidebarContent}</div>
        </div>
        {userContent}
      </div>
    </>
  );
};

// ============================================================
// 🔥 COMPOSANT NAV ITEM
// ============================================================
const NavItem: React.FC<{
  item: { to: string; label: string; icon: string; badge?: number };
  isActive: boolean;
  onClick: () => void;
}> = ({ item, isActive, onClick }) => {
  return (
    <div className={`nav-item ${isActive ? 'active' : ''}`} onClick={onClick}>
      {isActive && <div className="active-bar" />}
      <i className={`fas ${item.icon} nav-icon`} />
      <span>{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="nav-badge">{item.badge}</span>
      )}
    </div>
  );
};

export default LeftSidebar;