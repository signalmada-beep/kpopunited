// ========== src/components/PrivateRoute.tsx ==========
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

export const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { user, loading, isAuthenticated } = useAuth();

  // ✅ Raha mbola loading dia mampiseho spinner
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        background: '#0A0A0F',
        color: '#FFFFFF',
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '3px solid rgba(255,255,255,0.04)',
          borderTopColor: '#C084FC',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>
    );
  }

  // ✅ Raha tsy misy user dia alefa any amin'ny /auth
  if (!isAuthenticated || !user) {
    console.log('🔒 PrivateRoute: User not authenticated, redirecting to /auth');
    return <Navigate to="/auth" replace />;
  }

  // ✅ Raha misy user dia aseho ny enfants
  return <>{children}</>;
};