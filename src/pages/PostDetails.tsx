// ========== PostDetails.tsx ==========
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Post from '../components/Post';
import '../styles/PostDetails.css';

interface PostData {
  id: string;
  author: {
    id: string;
    name: string;
    username: string;
    avatar: string;
    group: string;
    verified?: boolean;
  };
  content: string;
  image?: string;
  images?: string[];
  timestamp: number;
  likes: number;
  comments: number;
  shares: number;
  liked: boolean;
  saved: boolean;
  reaction: string | null;
  tags: string[];
  category: string;
  privacy: 'public' | 'friends' | 'followers' | 'private';
}

const PostDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [post, setPost] = useState<PostData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('kpop_posts');
    if (stored) {
      try {
        const posts: PostData[] = JSON.parse(stored);
        const found = posts.find(p => p.id === id);
        if (found) {
          setPost(found);
        }
      } catch (e) {}
    }
    setLoading(false);
  }, [id]);

  // Handlers
  const handleLike = (postId: string) => {
    setPost(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        liked: !prev.liked,
        likes: prev.liked ? prev.likes - 1 : prev.likes + 1,
      };
    });
  };

  const handleReact = (postId: string, reaction: string) => {
    setPost(prev => {
      if (!prev) return prev;
      const hasReaction = prev.reaction === reaction;
      return {
        ...prev,
        reaction: hasReaction ? null : reaction,
        likes: hasReaction ? prev.likes - 1 : prev.likes + 1,
      };
    });
  };

  const handleComment = (postId: string) => {
    setPost(prev => {
      if (!prev) return prev;
      return { ...prev, comments: prev.comments + 1 };
    });
  };

  const handleShare = (postId: string) => {
    setPost(prev => {
      if (!prev) return prev;
      return { ...prev, shares: prev.shares + 1 };
    });
  };

  const handleSave = (postId: string) => {
    setPost(prev => {
      if (!prev) return prev;
      return { ...prev, saved: !prev.saved };
    });
  };

  if (loading) {
    return (
      <div className="post-details-loading">
        <div className="loading-spinner" />
        <span>Loading post...</span>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="post-details-notfound">
        <i className="fas fa-file-alt" />
        <h3>Post not found</h3>
        <p>The post you're looking for doesn't exist or has been removed.</p>
        <button onClick={() => navigate('/')}>Go Home</button>
      </div>
    );
  }

  return (
    <div className="post-details-page">
      <button className="post-details-back" onClick={() => navigate(-1)}>
        <i className="fas fa-arrow-left" /> Back
      </button>
      
      <div className="post-details-container">
        <Post
          post={post}
          isOwner={post.author.id === 'me'}
          onLike={handleLike}
          onReact={handleReact}
          onComment={handleComment}
          onShare={handleShare}
          onSave={handleSave}
          currentUser={{ id: 'me', name: 'K-Pop Fan', avatar: 'https://i.pravatar.cc/150?img=16' }}
        />
      </div>
    </div>
  );
};

export default PostDetails;