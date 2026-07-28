import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/GroupDetails.css';

interface GroupPost {
  id: string;
  author: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
  comments: number;
}

const GroupDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isJoined, setIsJoined] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');

  // Données mockées du groupe
  const group = {
    id: id || '1',
    name: 'BTS ARMY',
    members: 15000,
    image: 'https://picsum.photos/seed/bts/800/400',
    fandom: 'ARMY',
    description: 'The largest K-Pop fandom in the world! 💜 Welcome to all ARMYs.',
    isActive: true,
  };

  const [posts] = useState<GroupPost[]>([
    {
      id: '1',
      author: 'ARMY_Leader',
      authorAvatar: 'https://i.pravatar.cc/150?img=21',
      content: 'Welcome to the BTS ARMY group! Please introduce yourselves 💜',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
      likes: 45,
      comments: 12,
    },
    {
      id: '2',
      author: 'K-Pop Fan',
      authorAvatar: 'https://i.pravatar.cc/150?img=16',
      content: 'Just joined! So excited to be here with fellow ARMYs 🎉',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      likes: 23,
      comments: 8,
    },
  ]);

  const formatTimeAgo = (timestamp: string) => {
    const diff = Date.now() - new Date(timestamp).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m`;
    if (hours < 24) return `${hours}h`;
    if (days < 7) return `${days}d`;
    return new Date(timestamp).toLocaleDateString();
  };

  const handleJoin = () => {
    setIsJoined(!isJoined);
  };

  const handleCreatePost = () => {
    if (newPostContent.trim()) {
      alert('✅ Post publié dans le groupe !');
      setNewPostContent('');
      setShowCreatePost(false);
    }
  };

  return (
    <div className="group-details-page">
      {/* HEADER */}
      <div className="group-details-header">
        <button className="back-btn" onClick={() => navigate('/groups')}>
          <i className="fas fa-arrow-left" />
        </button>
        <span className="group-details-title">{group.name}</span>
        <button className="group-details-actions">
          <i className="fas fa-ellipsis-h" />
        </button>
      </div>

      {/* COVER */}
      <div className="group-cover">
        <img src={group.image} alt={group.name} />
        <div className="group-cover-overlay">
          <h1 className="group-cover-name">{group.name}</h1>
          <p className="group-cover-fandom">@{group.fandom}</p>
        </div>
        <button
          className={`group-join-btn ${isJoined ? 'joined' : ''}`}
          onClick={handleJoin}
        >
          {isJoined ? 'Joined' : 'Join Group'}
        </button>
      </div>

      {/* INFO */}
      <div className="group-info-section">
        <div className="group-description">
          <p>{group.description}</p>
        </div>
        <div className="group-stats">
          <div className="group-stat">
            <span className="stat-value">{group.members.toLocaleString()}</span>
            <span className="stat-label">Members</span>
          </div>
          <div className="group-stat">
            <span className="stat-value">{posts.length}</span>
            <span className="stat-label">Posts</span>
          </div>
          <div className="group-stat">
            <span className="stat-value">{group.isActive ? '🟢' : '🔴'}</span>
            <span className="stat-label">{group.isActive ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>

      {/* POSTS */}
      <div className="group-posts-section">
        <div className="group-posts-header">
          <h3>
            <i className="fas fa-newspaper" /> Publications
          </h3>
          <button
            className="create-post-btn"
            onClick={() => setShowCreatePost(true)}
          >
            <i className="fas fa-plus" /> Nouveau post
          </button>
        </div>

        <div className="group-posts">
          {posts.map((post) => (
            <div key={post.id} className="group-post">
              <div className="group-post-header">
                <div className="group-post-avatar">
                  <img src={post.authorAvatar} alt={post.author} />
                </div>
                <div className="group-post-author">
                  <span className="group-post-name">{post.author}</span>
                  <span className="group-post-time">{formatTimeAgo(post.createdAt)}</span>
                </div>
              </div>
              <p className="group-post-content">{post.content}</p>
              <div className="group-post-actions">
                <button className="group-post-action">
                  <i className="fas fa-heart" /> {post.likes}
                </button>
                <button className="group-post-action">
                  <i className="fas fa-comment" /> {post.comments}
                </button>
                <button className="group-post-action">
                  <i className="fas fa-share" /> Share
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL CREATE POST */}
      {showCreatePost && (
        <div className="modal-overlay" onClick={() => setShowCreatePost(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ color: '#fff', marginBottom: '16px' }}>
              <i className="fas fa-plus" style={{ color: '#C084FC' }} /> Nouveau post
            </h3>
            <textarea
              placeholder="Quoi de neuf dans le groupe ?"
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              style={{
                width: '100%',
                minHeight: '100px',
                padding: '12px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: '10px', marginTop: '16px' }}>
              <button onClick={() => setShowCreatePost(false)} style={{ flex: 1, padding: '10px', borderRadius: '12px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
                Annuler
              </button>
              <button onClick={handleCreatePost} style={{ flex: 2, padding: '10px', borderRadius: '12px', background: 'linear-gradient(135deg, #C084FC, #EC4899)', border: 'none', color: '#fff', cursor: 'pointer' }}>
                Publier
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-content {
          background: #14141D;
          border-radius: 16px;
          padding: 24px;
          max-width: 500px;
          width: 90%;
          border: 1px solid rgba(255,255,255,0.04);
        }
      `}</style>
    </div>
  );
};

export default GroupDetails;