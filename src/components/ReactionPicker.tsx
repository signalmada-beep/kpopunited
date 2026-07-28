// ========== ReactionPicker.tsx ==========
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import '../styles/ReactionPicker.css';

// ============================================================
// TYPES
// ============================================================
export interface Reaction {
  emoji: string;
  label: string;
  category?: 'standard' | 'kpop' | 'special';
}

interface ReactionPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (emoji: string) => void;
  anchorRef: React.RefObject<HTMLElement | null>;
  selectedReaction?: string | null;
  reactions?: Reaction[];
  postId?: string;
}

// ============================================================
// REACTIONS PAR DEFAUT - Compact & Premium
// ============================================================
export const PREMIUM_REACTIONS: Reaction[] = [
  { emoji: '❤️', label: 'Love', category: 'standard' },
  { emoji: '🔥', label: 'Fire', category: 'standard' },
  { emoji: '😂', label: 'Haha', category: 'standard' },
  { emoji: '😍', label: 'Adore', category: 'standard' },
  { emoji: '👏', label: 'Clap', category: 'standard' },
  { emoji: '👍', label: 'Like', category: 'standard' },
  { emoji: '😮', label: 'Wow', category: 'standard' },
  { emoji: '😢', label: 'Sad', category: 'standard' },
  { emoji: '😡', label: 'Angry', category: 'standard' },
  { emoji: '⭐', label: 'Stan', category: 'kpop' },
  { emoji: '💜', label: 'Bias', category: 'kpop' },
  { emoji: '🎤', label: 'Encore', category: 'kpop' },
  { emoji: '💖', label: 'Heart', category: 'kpop' },
  { emoji: '✨', label: 'Magic', category: 'kpop' },
];

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const ReactionPicker: React.FC<ReactionPickerProps> = ({
  isOpen,
  onClose,
  onSelect,
  anchorRef,
  selectedReaction = null,
  reactions = PREMIUM_REACTIONS,
  postId,
}) => {
  const pickerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'top' | 'bottom' | 'left' | 'right'>('top');
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);

  // ============================================================
  // CATEGORISE REACTIONS
  // ============================================================
  const groupedReactions = React.useMemo(() => {
    const groups: { [key: string]: Reaction[] } = {};
    reactions.forEach(r => {
      const cat = r.category || 'standard';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(r);
    });
    return groups;
  }, [reactions]);

  const categoryLabels: { [key: string]: string } = {
    standard: 'Popular',
    kpop: 'K-POP',
    special: 'Special',
  };

  // ============================================================
  // CALCUL POSITION - INTELLIGENT POPOVER
  // ============================================================
  const calculatePosition = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const pickerWidth = 280;
    const pickerHeight = 220;
    const gap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Position par défaut: au-dessus
    let x = rect.left + rect.width / 2 - pickerWidth / 2;
    let y = rect.top - pickerHeight - gap;
    let newPosition: 'top' | 'bottom' | 'left' | 'right' = 'top';

    // Vérifier l'espace au-dessus
    const spaceAbove = rect.top - gap;
    const spaceBelow = viewportHeight - rect.bottom - gap;
    const spaceLeft = rect.left;
    const spaceRight = viewportWidth - rect.right;

    // Ajuster horizontalement
    if (x < 10) x = 10;
    if (x + pickerWidth > viewportWidth - 10) {
      x = viewportWidth - pickerWidth - 10;
    }

    // Choisir la meilleure position
    if (spaceAbove >= pickerHeight) {
      // Au-dessus
      y = rect.top - pickerHeight - gap;
      newPosition = 'top';
    } else if (spaceBelow >= pickerHeight) {
      // En-dessous
      y = rect.bottom + gap;
      newPosition = 'bottom';
    } else if (spaceRight >= pickerWidth) {
      // À droite
      x = rect.right + gap;
      y = rect.top + rect.height / 2 - pickerHeight / 2;
      newPosition = 'right';
      if (y < 10) y = 10;
      if (y + pickerHeight > viewportHeight - 10) {
        y = viewportHeight - pickerHeight - 10;
      }
    } else if (spaceLeft >= pickerWidth) {
      // À gauche
      x = rect.left - pickerWidth - gap;
      y = rect.top + rect.height / 2 - pickerHeight / 2;
      newPosition = 'left';
      if (y < 10) y = 10;
      if (y + pickerHeight > viewportHeight - 10) {
        y = viewportHeight - pickerHeight - 10;
      }
    } else {
      // Fallback: au-dessus avec centrage
      x = Math.max(10, viewportWidth / 2 - pickerWidth / 2);
      y = Math.max(10, rect.top - pickerHeight - gap);
      newPosition = 'top';
    }

    setPosition(newPosition);
    setCoords({ x, y });
  }, [anchorRef]);

  // ============================================================
  // EFFETS
  // ============================================================
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      calculatePosition();
      
      // Recalculate on scroll or resize
      const handleUpdate = () => {
        if (isOpen) calculatePosition();
      };
      
      window.addEventListener('resize', handleUpdate);
      window.addEventListener('scroll', handleUpdate, true);
      
      return () => {
        window.removeEventListener('resize', handleUpdate);
        window.removeEventListener('scroll', handleUpdate, true);
      };
    } else {
      // Délai pour l'animation de sortie
      const timer = setTimeout(() => setIsVisible(false), 200);
      return () => clearTimeout(timer);
    }
  }, [isOpen, calculatePosition]);

  // ============================================================
  // CLICK OUTSIDE & ESCAPE
  // ============================================================
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const anchor = anchorRef.current;
      
      // Ne pas fermer si on clique sur le bouton d'ancrage
      if (anchor && anchor.contains(target)) return;
      
      // Ne pas fermer si on clique à l'intérieur du picker
      if (pickerRef.current && pickerRef.current.contains(target)) return;
      
      onClose();
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    const handleScroll = () => {
      // Fermer si on scroll loin
      const anchor = anchorRef.current;
      if (anchor) {
        const rect = anchor.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        // Si l'anchor est hors de vue
        if (rect.bottom < 0 || rect.top > viewportHeight) {
          onClose();
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen, onClose, anchorRef]);

  // ============================================================
  // HANDLE SELECT
  // ============================================================
  const handleSelect = (emoji: string) => {
    onSelect(emoji);
    onClose();
  };

  // ============================================================
  // RENDU
  // ============================================================
  if (!isOpen && !isVisible) return null;

  const pickerStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${coords.x}px`,
    top: `${coords.y}px`,
    zIndex: 9999999,
    opacity: isOpen ? 1 : 0,
    transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.9) translateY(4px)',
    transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
  };

  // Style du tail (flèche)
  const getTailStyle = (): React.CSSProperties => {
    const tailSize = 8;
    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      width: `${tailSize}px`,
      height: `${tailSize}px`,
      background: '#1A1A2E',
      border: '1px solid rgba(255,255,255,0.06)',
      transform: 'rotate(45deg)',
      zIndex: -1,
    };

    switch (position) {
      case 'top':
        return {
          ...baseStyle,
          bottom: `-${tailSize / 2}px`,
          left: '50%',
          marginLeft: `-${tailSize / 2}px`,
          borderTop: 'none',
          borderLeft: 'none',
        };
      case 'bottom':
        return {
          ...baseStyle,
          top: `-${tailSize / 2}px`,
          left: '50%',
          marginLeft: `-${tailSize / 2}px`,
          borderBottom: 'none',
          borderRight: 'none',
        };
      case 'left':
        return {
          ...baseStyle,
          right: `-${tailSize / 2}px`,
          top: '50%',
          marginTop: `-${tailSize / 2}px`,
          borderLeft: 'none',
          borderBottom: 'none',
        };
      case 'right':
        return {
          ...baseStyle,
          left: `-${tailSize / 2}px`,
          top: '50%',
          marginTop: `-${tailSize / 2}px`,
          borderRight: 'none',
          borderTop: 'none',
        };
      default:
        return baseStyle;
    }
  };

  return createPortal(
    <div 
      ref={pickerRef} 
      className="reaction-picker-anchored" 
      style={pickerStyle}
      data-post-id={postId}
    >
      {/* Tail */}
      <div style={getTailStyle()} />

      {/* Content */}
      <div className="reaction-picker-content">
        {Object.entries(groupedReactions).map(([category, items]) => (
          <div key={category} className="reaction-group">
            <div className="reaction-group-label">
              <span>{categoryLabels[category] || category}</span>
            </div>
            <div className="reaction-grid">
              {items.map((reaction) => (
                <button
                  key={reaction.emoji}
                  className={`reaction-btn ${selectedReaction === reaction.emoji ? 'active' : ''}`}
                  onClick={() => handleSelect(reaction.emoji)}
                  title={reaction.label}
                >
                  <span className="reaction-emoji">{reaction.emoji}</span>
                  <span className="reaction-label">{reaction.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>,
    document.body
  );
};

export default ReactionPicker;