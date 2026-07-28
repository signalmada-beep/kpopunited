// ========== src/layout/AppLayout.tsx ==========
import React, { useState, useEffect, useCallback } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import '../styles/AppLayout.css';

interface AppLayoutProps {
  toggleTheme: () => void;
  isDark: boolean;
}

const PAGES_WITHOUT_RIGHT_SIDEBAR = [
  '/auth',
  '/splash',
  '/create-post',
  '/settings',
  '/messages',
];

const PAGES_FULL_WIDTH = [
  '/auth',
  '/splash',
];

const AppLayout: React.FC<AppLayoutProps> = ({ toggleTheme, isDark }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

  // ============================================================
  // 🔥 RESPONSIVE
  // ============================================================
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // ✅ Raha mihoatra ny 768 dia mihidy ny menu mobile
      if (!mobile && isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
        document.body.style.overflow = '';
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileMenuOpen]);

  // ============================================================
  // 🔥 HANIDY NY MENU REHEFA MIVADY PEJY
  // ============================================================
  useEffect(() => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
      document.body.style.overflow = '';
    }
  }, [location.pathname]);

  // ============================================================
  // 🔥 HANDLE TOGGLE MOBILE MENU
  // ============================================================
  const handleToggleMobileMenu = useCallback(() => {
    setIsMobileMenuOpen(prev => {
      const newState = !prev;
      document.body.style.overflow = newState ? 'hidden' : '';
      return newState;
    });
  }, []);

  // ============================================================
  // 🔥 HANDLE CLOSE SIDEBAR
  // ============================================================
  const handleCloseSidebar = useCallback(() => {
    setIsMobileMenuOpen(false);
    document.body.style.overflow = '';
  }, []);

  // ============================================================
  // 🔥 FEPETRA HAMPISEHANA NY SIDEBARS
  // ============================================================
  const currentPath = location.pathname;
  const isFullWidth = PAGES_FULL_WIDTH.some(p => currentPath.startsWith(p));
  const showRightSidebar = !PAGES_WITHOUT_RIGHT_SIDEBAR.some(p => currentPath.startsWith(p)) && !isFullWidth;
  const showLeftSidebar = !isFullWidth;

  // ✅ Debug - Jereo amin'ny console
  console.log('🔍 AppLayout - showLeftSidebar:', showLeftSidebar);
  console.log('🔍 AppLayout - isMobile:', isMobile);
  console.log('🔍 AppLayout - isMobileMenuOpen:', isMobileMenuOpen);
  console.log('🔍 AppLayout - currentPath:', currentPath);

  // ============================================================
  // 🔥 RENDU
  // ============================================================
  return (
    <div className="app-layout">
      {/* ✅ HEADER */}
      <Header
        toggleTheme={toggleTheme}
        isDark={isDark}
        onToggleMobileMenu={handleToggleMobileMenu}
        isMobileMenuOpen={isMobileMenuOpen}
      />

      {/* ✅ BODY - 3 COLONNES */}
      <div className="app-layout-body">
        
        {/* ✅ LEFT SIDEBAR - MIPOITRA REOHENA */}
        {showLeftSidebar && (
          <LeftSidebar 
            isOpen={isMobileMenuOpen} 
            onClose={handleCloseSidebar}
          />
        )}

        {/* ✅ MAIN CONTENT */}
        <main className="app-main-content">
          <div className="app-main-content-inner">
            <Outlet />
          </div>
        </main>

        {/* ✅ RIGHT SIDEBAR */}
        {showRightSidebar && <RightSidebar />}
      </div>
    </div>
  );
};

export default AppLayout;