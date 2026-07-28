// ========== src/components/RightSidebar.tsx ==========
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/RightSidebar.css';

// ============================================================
// TYPES
// ============================================================
interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  category: string;
  image: string;
  organizer: {
    id: string;
    name: string;
    avatar: string;
  };
  participants: number;
  interested: number;
  views: number;
  venue: string;
  city: string;
  country: string;
}

interface VoteOption {
  id: string;
  name: string;
  votes: number;
  image: string;
  color: string;
  category: 'artist' | 'song' | 'group';
  addedBy: string;
  addedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  artistName?: string;
}

interface UserVote {
  artistId: string | null;
  songId: string | null;
  groupId: string | null;
  lastVoteTime: number;
}

interface UserProposals {
  artist: string | null;
  song: string | null;
  group: string | null;
  lastProposalDate: string;
}

// ============================================================
// CONSTANTES
// ============================================================
const SIDEBAR_STATE_KEY = 'kpop_rightsidebar_hidden';

// ============================================================
// DONNÉES MOCKÉES
// ============================================================
const initialVoteOptions: VoteOption[] = [
  { id: 'jimin', name: 'Jimin', votes: 12450, image: 'https://i.pravatar.cc/150?img=11', color: '#C084FC', category: 'artist', addedBy: 'system', addedAt: new Date().toISOString(), status: 'approved' },
  { id: 'jungkook', name: 'Jungkook', votes: 11800, image: 'https://i.pravatar.cc/150?img=17', color: '#EC4899', category: 'artist', addedBy: 'system', addedAt: new Date().toISOString(), status: 'approved' },
  { id: 'lisa', name: 'Lisa', votes: 10200, image: 'https://i.pravatar.cc/150?img=12', color: '#4A90D9', category: 'artist', addedBy: 'system', addedAt: new Date().toISOString(), status: 'approved' },
  { id: 'jennie', name: 'Jennie', votes: 9800, image: 'https://i.pravatar.cc/150?img=18', color: '#FDCB6E', category: 'artist', addedBy: 'system', addedAt: new Date().toISOString(), status: 'approved' },
  { id: 'nayeon', name: 'Nayeon', votes: 8700, image: 'https://i.pravatar.cc/150?img=15', color: '#FF69B4', category: 'artist', addedBy: 'system', addedAt: new Date().toISOString(), status: 'approved' },
  { id: 'bts', name: 'BTS', votes: 15600, image: 'https://picsum.photos/seed/bts/100/100', color: '#FF1493', category: 'group', addedBy: 'system', addedAt: new Date().toISOString(), status: 'approved' },
  { id: 'blackpink', name: 'BLACKPINK', votes: 14200, image: 'https://picsum.photos/seed/blackpink/100/100', color: '#8B00FF', category: 'group', addedBy: 'system', addedAt: new Date().toISOString(), status: 'approved' },
];

const mockEvents: Event[] = [
  {
    id: '1',
    title: 'BTS World Tour "Yet to Come" Finale',
    date: '2026-10-15',
    time: '19:00',
    category: 'Concert',
    image: 'https://picsum.photos/seed/bts-event/400/300',
    organizer: {
      id: '1',
      name: 'ARMY_Leader',
      avatar: 'https://i.pravatar.cc/150?img=21',
    },
    participants: 45230,
    interested: 12800,
    views: 56000,
    venue: 'Seoul Olympic Stadium',
    city: 'Seoul',
    country: 'South Korea',
  },
  {
    id: '2',
    title: 'BLACKPINK Fan Meeting 2026',
    date: '2026-11-05',
    time: '14:00',
    category: 'Fan Meeting',
    image: 'https://picsum.photos/seed/blackpink-event/400/300',
    organizer: {
      id: '2',
      name: 'BLINK_Captain',
      avatar: 'https://i.pravatar.cc/150?img=22',
    },
    participants: 5200,
    interested: 2300,
    views: 15000,
    venue: 'Tokyo Dome',
    city: 'Tokyo',
    country: 'Japan',
  },
];

const RightSidebar: React.FC = () => {
  const navigate = useNavigate();

  // ============================================================
  // STATE - SIDEBAR HIDDEN
  // ============================================================
  const [isHidden, setIsHidden] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STATE_KEY);
    return saved === 'true';
  });

  // Sauvegarde de l'état quand il change
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STATE_KEY, String(isHidden));
  }, [isHidden]);

  const toggleSidebar = () => {
    setIsHidden(!isHidden);
  };

  // ============================================================
  // STATES - VOTE
  // ============================================================
  const [selectedVoteCategory, setSelectedVoteCategory] = useState<'artist' | 'song' | 'group'>('artist');
  const [voteOptions, setVoteOptions] = useState<VoteOption[]>(initialVoteOptions);
  const [userVote, setUserVote] = useState<UserVote>({ artistId: null, songId: null, groupId: null, lastVoteTime: 0 });
  const [userProposals, setUserProposals] = useState<UserProposals>({ artist: null, song: null, group: null, lastProposalDate: '' });
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCandidateName, setNewCandidateName] = useState('');
  const [newCandidateImage, setNewCandidateImage] = useState('');
  const [newCandidateCategory, setNewCandidateCategory] = useState<'artist' | 'song' | 'group'>('artist');
  const [newCandidateArtist, setNewCandidateArtist] = useState('');
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [sessionTime, setSessionTime] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================
  // TIMER
  // ============================================================
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const canVote = () => {
    if (userVote.lastVoteTime === 0) return true;
    return Date.now() - userVote.lastVoteTime >= 3600000;
  };

  const getVoteRemainingTime = () => {
    if (userVote.lastVoteTime === 0) return 'Prêt à voter !';
    const remaining = 3600000 - (Date.now() - userVote.lastVoteTime);
    if (remaining <= 0) return 'Prêt à voter !';
    const minutes = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    return `${minutes}m ${secs}s`;
  };

  const canPropose = () => sessionTime >= 3600;

  const getProposalStatus = () => {
    const today = new Date().toDateString();
    if (userProposals.lastProposalDate === today) {
      const hasAll = userProposals.artist && userProposals.song && userProposals.group;
      if (hasAll) {
        return { canPropose: false, message: '✅ Toutes vos propositions sont faites !', icon: 'fa-check-circle' };
      }
      return { canPropose: true, message: '📝 Propositions restantes', icon: 'fa-pen' };
    }
    if (!canPropose()) {
      const remaining = 3600 - sessionTime;
      return { canPropose: false, message: `⏳ ${Math.floor(remaining/60)}min restantes`, icon: 'fa-clock', progress: (sessionTime/3600)*100 };
    }
    return { canPropose: true, message: '🎯 Proposez 1 par catégorie !', icon: 'fa-plus-circle' };
  };

  const handleVote = (id: string, category: 'artist' | 'song' | 'group') => {
    if (!canVote()) {
      alert(`⏳ Attendez ${getVoteRemainingTime()}`);
      return;
    }
    const currentVote = category === 'artist' ? userVote.artistId : category === 'song' ? userVote.songId : userVote.groupId;
    if (currentVote) {
      setVoteOptions(prev => prev.map(opt => opt.id === currentVote ? { ...opt, votes: opt.votes - 1 } : opt));
    }
    setVoteOptions(prev => prev.map(opt => opt.id === id ? { ...opt, votes: opt.votes + 1 } : opt));
    const newUserVote = { ...userVote };
    if (category === 'artist') newUserVote.artistId = id;
    else if (category === 'song') newUserVote.songId = id;
    else newUserVote.groupId = id;
    newUserVote.lastVoteTime = Date.now();
    setUserVote(newUserVote);
  };

  const handleAddCandidate = () => {
    setAddError('');
    setAddSuccess('');
    const status = getProposalStatus();
    if (!status.canPropose) { setAddError(status.message); return; }
    if (!newCandidateName.trim()) { setAddError('❌ Entrez un nom'); return; }
    const exists = voteOptions.some(opt => opt.name.toLowerCase() === newCandidateName.trim().toLowerCase() && opt.category === newCandidateCategory);
    if (exists) { setAddError('❌ Ce nom existe déjà'); return; }
    if (newCandidateCategory === 'song' && !newCandidateArtist.trim()) { setAddError('❌ Entrez le nom de l\'artiste'); return; }

    const colors = ['#C084FC', '#EC4899', '#4A90D9', '#FFD700', '#FF6B6B', '#00B894', '#FF69B4'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    const newOption: VoteOption = {
      id: `${newCandidateCategory}_${Date.now()}`,
      name: newCandidateName.trim(),
      votes: 0,
      image: newCandidateImage.trim() || newCandidateName.trim().charAt(0).toUpperCase(),
      color: randomColor,
      category: newCandidateCategory,
      addedBy: 'K-Pop Fan',
      addedAt: new Date().toISOString(),
      status: 'pending',
      artistName: newCandidateCategory === 'song' ? newCandidateArtist.trim() : undefined,
    };
    setVoteOptions(prev => [...prev, newOption]);
    const today = new Date().toDateString();
    const newProposals = { ...userProposals };
    if (newCandidateCategory === 'artist') newProposals.artist = newCandidateName.trim();
    else if (newCandidateCategory === 'song') newProposals.song = newCandidateName.trim();
    else newProposals.group = newCandidateName.trim();
    newProposals.lastProposalDate = today;
    setUserProposals(newProposals);
    setAddSuccess(`✅ "${newCandidateName}" proposé !`);
    setNewCandidateName('');
    setNewCandidateImage('');
    setNewCandidateArtist('');
    setTimeout(() => { setAddSuccess(''); setShowAddModal(false); }, 2500);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const isImageUrl = (str: string) => str.startsWith('http') || str.startsWith('data:image');

  const filteredVotes = voteOptions.filter(opt => opt.category === selectedVoteCategory && opt.status === 'approved');
  const totalVotes = filteredVotes.reduce((sum, opt) => sum + opt.votes, 0);
  const sortedVotes = [...filteredVotes].sort((a, b) => b.votes - a.votes);
  const pendingCount = voteOptions.filter(opt => opt.status === 'pending').length;
  const proposalStatus = getProposalStatus();

  const getPercentage = (votes: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((votes / totalVotes) * 100);
  };

  const formatEventDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getTimeRemaining = (dateStr: string, timeStr: string) => {
    const eventDateTime = new Date(`${dateStr}T${timeStr}`);
    const now = new Date();
    const diff = eventDateTime.getTime() - now.getTime();
    if (diff < 0) return 'Terminé';
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (days > 0) return `${days}j ${hours}h`;
    return `${hours}h`;
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Concert: '#EC4899',
      'Fan Meeting': '#C084FC',
      Festival: '#FF6B6B',
      'Dance Cover': '#4A90D9',
    };
    return colors[category] || '#7A7A9A';
  };

  // ============================================================
  // RENDU
  // ============================================================
  return (
    <>
      {/* BOUTON TOGGLE - Rehefa miafina ny sidebar */}
      {isHidden && (
        <button className="sidebar-toggle-btn hidden" onClick={toggleSidebar} title="Show Sidebar">
          <i className="fas fa-chevron-left" />
        </button>
      )}

      <aside className={`right-sidebar-premium ${isHidden ? 'hidden' : ''}`}>
        {/* TOGGLE BUTTON - ao anatiny */}
        <div className="sidebar-toggle-wrapper">
          <button className="sidebar-toggle-btn" onClick={toggleSidebar} title="Hide Sidebar">
            <i className="fas fa-chevron-right" />
          </button>
        </div>

        {/* ============================================================
            K-POP VOTE
        ============================================================ */}
        <div className="premium-widget vote-widget">
          <div className="widget-header-premium">
            <div className="widget-title-premium">
              <span className="title-icon vote"><i className="fas fa-vote-yea" /></span>
              <span>K-Pop Vote</span>
            </div>
            <div className="widget-actions-premium">
              {pendingCount > 0 && <span className="pending-badge-premium"><i className="fas fa-clock" /> {pendingCount}</span>}
              <button className={`add-btn-premium ${proposalStatus.canPropose ? 'active' : 'disabled'}`} onClick={() => proposalStatus.canPropose && setShowAddModal(true)} disabled={!proposalStatus.canPropose}>
                <i className="fas fa-plus" />
              </button>
              <span className="vote-badge-premium">{totalVotes.toLocaleString()} votes</span>
            </div>
          </div>

          <div className="proposal-status-premium">
            <div className="proposal-status-info">
              <i className={`fas ${proposalStatus.icon}`} style={{ color: proposalStatus.canPropose ? '#C084FC' : 'rgba(255,255,255,0.2)' }} />
              <span>{proposalStatus.message}</span>
            </div>
            {proposalStatus.progress !== undefined && (
              <div className="proposal-progress-premium">
                <div className="progress-bar-premium">
                  <div className="progress-fill-premium" style={{ width: `${Math.min(proposalStatus.progress, 100)}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="vote-status-premium">
            <span><i className={`fas ${canVote() ? 'fa-check-circle' : 'fa-clock'}`} style={{ color: canVote() ? '#4CAF50' : '#FFD700' }} /> {canVote() ? 'Prêt à voter' : `⏳ ${getVoteRemainingTime()}`}</span>
            <div className="vote-icons-premium">
              <span className={userVote.artistId ? 'active' : ''}><i className="fas fa-microphone" /></span>
              <span className={userVote.songId ? 'active' : ''}><i className="fas fa-music" /></span>
              <span className={userVote.groupId ? 'active' : ''}><i className="fas fa-users" /></span>
            </div>
          </div>

          <div className="vote-tabs-premium">
            {['artist', 'song', 'group'].map((cat) => (
              <button key={cat} className={`vote-tab-premium ${selectedVoteCategory === cat ? 'active' : ''}`} onClick={() => setSelectedVoteCategory(cat as any)}>
                <i className={`fas ${cat === 'artist' ? 'fa-microphone' : cat === 'song' ? 'fa-music' : 'fa-users'}`} />
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          <div className="vote-list-premium">
            {sortedVotes.slice(0, 5).map((option, idx) => {
              const percentage = getPercentage(option.votes);
              const isSelected = (selectedVoteCategory === 'artist' && userVote.artistId === option.id) ||
                               (selectedVoteCategory === 'song' && userVote.songId === option.id) ||
                               (selectedVoteCategory === 'group' && userVote.groupId === option.id);
              return (
                <div key={option.id} className={`vote-item-premium ${isSelected ? 'selected' : ''}`} onClick={() => handleVote(option.id, option.category)}>
                  <span className="vote-rank-premium">#{idx + 1}</span>
                  <div className="vote-avatar-premium" style={{ background: isImageUrl(option.image) ? 'transparent' : option.color }}>
                    {isImageUrl(option.image) ? <img src={option.image} alt={option.name} /> : <span>{option.image}</span>}
                  </div>
                  <div className="vote-info-premium">
                    <div className="vote-name-premium">{option.name}</div>
                    <div className="vote-bar-premium">
                      <div className="vote-bar-fill-premium" style={{ width: `${percentage}%`, background: option.color }} />
                    </div>
                  </div>
                  <div className="vote-stats-premium">
                    <span className="vote-percent-premium">{percentage}%</span>
                    <span className="vote-count-premium">{formatNumber(option.votes)}</span>
                  </div>
                  {isSelected && <div className="vote-check-premium"><i className="fas fa-check-circle" /></div>}
                </div>
              );
            })}
          </div>

          <Link to="/vote" className="vote-view-all-premium">View Full Ranking <i className="fas fa-arrow-right" /></Link>
        </div>

        {/* ============================================================
            UPCOMING EVENTS
        ============================================================ */}
        <div className="premium-widget events-widget-premium">
          <div className="widget-header-premium">
            <div className="widget-title-premium">
              <span className="title-icon events"><i className="fas fa-calendar-alt" /></span>
              <span>Upcoming Events</span>
            </div>
            <Link to="/events" className="see-all-premium">See all <i className="fas fa-arrow-right" /></Link>
          </div>

          <div className="events-list-premium">
            {mockEvents.map((event) => {
              const remaining = getTimeRemaining(event.date, event.time);
              return (
                <div key={event.id} className="event-item-premium" onClick={() => navigate(`/events/${event.id}`)}>
                  <div className="event-image-premium">
                    <img src={event.image} alt={event.title} />
                    <span className="event-category-badge" style={{ background: getCategoryColor(event.category) }}>
                      <i className="fas fa-tag" />
                    </span>
                  </div>
                  <div className="event-info-premium">
                    <div className="event-title-premium">{event.title}</div>
                    <div className="event-date-premium"><i className="fas fa-calendar-day" /> {formatEventDate(event.date)}</div>
                    <div className="event-meta-premium">
                      <span><i className="fas fa-clock" /> {event.time.substring(0, 5)}</span>
                      <span><i className="fas fa-map-marker-alt" /> {event.city}</span>
                    </div>
                    <div className="event-countdown-premium"><i className="fas fa-hourglass-half" /> {remaining}</div>
                    <div className="event-organizer-premium">
                      <img src={event.organizer.avatar} alt={event.organizer.name} />
                      <span>{event.organizer.name}</span>
                    </div>
                  </div>
                  <button className="event-join-btn-premium"><i className="fas fa-chevron-right" /></button>
                </div>
              );
            })}
          </div>

          <Link to="/events/create" className="create-event-btn-premium">
            <i className="fas fa-plus" /> Create Event
          </Link>
        </div>

        {/* ============================================================
            ACTIVE FRIENDS
        ============================================================ */}
        <div className="premium-widget friends-widget-premium">
          <div className="widget-header-premium">
            <div className="widget-title-premium">
              <span className="title-icon friends"><i className="fas fa-user-friends" /></span>
              <span>Active Friends</span>
            </div>
            <Link to="/friends" className="see-all-premium">See all</Link>
          </div>

          <div className="friends-list-premium">
            {[
              { id: '1', name: 'ARMY_Leader', avatar: 'https://i.pravatar.cc/150?img=21', activity: 'Listening to BTS', online: true },
              { id: '2', name: 'BLINK_Captain', avatar: 'https://i.pravatar.cc/150?img=22', activity: 'Watching BLACKPINK', online: true },
              { id: '3', name: 'TWICE_Artist', avatar: 'https://i.pravatar.cc/150?img=23', activity: 'Drawing fan art', online: false },
              { id: '4', name: 'MOA_Helper', avatar: 'https://i.pravatar.cc/150?img=24', activity: 'Voting', online: true },
            ].map((friend) => (
              <div key={friend.id} className={`friend-item-premium ${!friend.online ? 'offline' : ''}`}>
                <div className="friend-avatar-premium">
                  <img src={friend.avatar} alt={friend.name} />
                  {friend.online && <span className="online-dot-premium" />}
                </div>
                <div className="friend-info-premium">
                  <div className="friend-name-premium">{friend.name}</div>
                  <div className="friend-activity-premium">{friend.online ? friend.activity : 'Offline'}</div>
                </div>
                {friend.online && <button className="friend-msg-btn-premium"><i className="fas fa-envelope" /></button>}
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================
            FOOTER
        ============================================================ */}
        <div className="footer-premium">
          <Link to="/privacy"><i className="fas fa-lock" /> Privacy</Link>
          <span>•</span>
          <Link to="/terms"><i className="fas fa-file-contract" /> Terms</Link>
          <span>•</span>
          <Link to="/help"><i className="fas fa-question-circle" /> Help</Link>
          <span>•</span>
          <button className="lang-btn-premium"><i className="fas fa-globe" /> EN</button>
        </div>

        {/* ============================================================
            MODAL - ADD CANDIDATE
        ============================================================ */}
        {showAddModal && (
          <div className="modal-overlay-premium" onClick={() => setShowAddModal(false)}>
            <div className="modal-premium" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-premium">
                <h3><i className="fas fa-plus-circle" style={{ color: '#C084FC' }} /> Proposer</h3>
                <button className="modal-close-premium" onClick={() => setShowAddModal(false)}><i className="fas fa-times" /></button>
              </div>
              <div className="modal-body-premium">
                {addError && <div className="modal-error-premium"><i className="fas fa-exclamation-circle" /> {addError}</div>}
                {addSuccess && <div className="modal-success-premium"><i className="fas fa-check-circle" /> {addSuccess}</div>}
                
                <div className="modal-group-premium">
                  <label>Catégorie</label>
                  <div className="category-select-premium">
                    {['artist', 'song', 'group'].map((cat) => (
                      <button key={cat} className={`cat-btn-premium ${newCandidateCategory === cat ? 'active' : ''}`} onClick={() => setNewCandidateCategory(cat as any)}>
                        <i className={`fas ${cat === 'artist' ? 'fa-microphone' : cat === 'song' ? 'fa-music' : 'fa-users'}`} />
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="modal-group-premium">
                  <label>Nom *</label>
                  <input type="text" className="modal-input-premium" placeholder="Ex: Jennie" value={newCandidateName} onChange={(e) => setNewCandidateName(e.target.value)} />
                </div>

                {newCandidateCategory === 'song' && (
                  <div className="modal-group-premium">
                    <label>Artiste *</label>
                    <input type="text" className="modal-input-premium" placeholder="Ex: BLACKPINK" value={newCandidateArtist} onChange={(e) => setNewCandidateArtist(e.target.value)} />
                  </div>
                )}

                <div className="modal-group-premium">
                  <label>Image</label>
                  <div className="image-upload-premium">
                    <input type="text" className="modal-input-premium" placeholder="https://exemple.com/photo.jpg" value={newCandidateImage} onChange={(e) => setNewCandidateImage(e.target.value)} />
                    <label className="upload-btn-premium">
                      <i className="fas fa-upload" />
                      <input type="file" ref={fileInputRef} accept="image/*" style={{ display: 'none' }} onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) { const reader = new FileReader(); reader.onload = (ev) => setNewCandidateImage(ev.target?.result as string); reader.readAsDataURL(file); }
                      }} />
                    </label>
                  </div>
                </div>

                <div className="modal-actions-premium">
                  <button className="cancel-btn-premium" onClick={() => setShowAddModal(false)}>Annuler</button>
                  <button className="submit-btn-premium" onClick={handleAddCandidate}><i className="fas fa-paper-plane" /> Proposer</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </aside>
    </>
  );
};

export default RightSidebar;