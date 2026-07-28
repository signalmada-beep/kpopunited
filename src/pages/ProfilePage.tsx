import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

const ProfilePage: React.FC = () => {
  const { username } = useParams();
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px', color: '#fff' }}>
      <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '16px', cursor: 'pointer', marginBottom: '16px' }}>
        ← Retour
      </button>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>@{username}</h1>
      <p style={{ color: 'rgba(255,255,255,0.5)' }}>Profil de l'utilisateur...</p>
    </div>
  );
};

export default ProfilePage;