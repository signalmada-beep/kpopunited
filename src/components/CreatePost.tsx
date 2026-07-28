// ========== src/components/CreatePost.tsx ==========
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/CreatePost.css';

interface CreatePostProps {
  onPostCreated?: (postData: any) => void;
}

const CreatePost: React.FC<CreatePostProps> = ({ onPostCreated }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ✅ Mampiasa ny tena anarana avy amin'ny Firebase
  const displayName = user?.displayName || user?.name || 'K-Pop Fan';
  
  // ✅ Mijery raha tena sary nampidirin'ny user (tsy avy any ivelany)
  const hasRealAvatar = (avatarUrl?: string): boolean => {
    if (!avatarUrl) return false;
    return avatarUrl !== '' && 
           !avatarUrl.startsWith('https://i.pravatar.cc') && 
           !avatarUrl.startsWith('https://picsum.photos');
  };

  const avatarUrl = user?.photoURL || user?.avatar || '';
  const hasAvatar = hasRealAvatar(avatarUrl);

  const handleOpenCreatePost = () => {
    navigate('/create-post');
  };

  return (
    <div className="create-post-trigger" onClick={handleOpenCreatePost}>
      <div className="create-post-trigger-avatar">
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
          <div className="avatar-placeholder-trigger">
            <i className="fas fa-user" />
          </div>
        )}
      </div>
      <div className="create-post-trigger-placeholder">
        {`What's happening, ${displayName}? ✨`}
      </div>
      <div className="create-post-trigger-actions">
        <button 
          className="trigger-btn photo" 
          onClick={(e) => {
            e.stopPropagation();
            navigate('/create-post');
          }}
          title="Add Photo"
        >
          <i className="fas fa-image" />
        </button>
        <button 
          className="trigger-btn mood" 
          onClick={(e) => {
            e.stopPropagation();
            navigate('/create-post');
          }}
          title="Add Mood"
        >
          <i className="fas fa-smile" />
        </button>
        <button 
          className="trigger-btn poll" 
          onClick={(e) => {
            e.stopPropagation();
            navigate('/create-post');
          }}
          title="Create Poll"
        >
          <i className="fas fa-chart-bar" />
        </button>
      </div>

      <style>{`
        .create-post-trigger-avatar {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
          border: 2px solid rgba(192, 132, 252, 0.08);
          background: var(--bg-input);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .create-post-trigger-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .create-post-trigger-avatar.no-avatar img {
          display: none !important;
        }
        .create-post-trigger-avatar.no-avatar .avatar-placeholder-trigger {
          display: flex !important;
        }
        .avatar-placeholder-trigger {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(192, 132, 252, 0.15), rgba(236, 72, 153, 0.08));
          color: rgba(255, 255, 255, 0.3);
          font-size: 14px;
        }
        .create-post-trigger-placeholder {
          flex: 1;
          color: rgba(255, 255, 255, 0.15);
          font-size: 14px;
          font-weight: 400;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        body.light-mode .create-post-trigger-avatar {
          border-color: rgba(0, 0, 0, 0.06);
          background: var(--bg-input);
        }
        body.light-mode .avatar-placeholder-trigger {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.1), rgba(236, 72, 153, 0.05));
          color: rgba(0, 0, 0, 0.15);
        }
        body.light-mode .create-post-trigger-placeholder {
          color: rgba(0, 0, 0, 0.15);
        }
      `}</style>
    </div>
  );
};

export default CreatePost;