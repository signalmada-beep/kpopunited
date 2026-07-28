// ========== src/pages/Events.tsx ==========
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getEvents, 
  toggleGoing, 
  toggleInterested, 
  toggleFavorite,
  incrementViews,
  deleteEvent,
  type Event 
} from '../services/eventService';
import { useAuth } from '../context/AuthContext';
import '../styles/Events.css';

const Events: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [showEventModal, setShowEventModal] = useState(false);
  const [loading, setLoading] = useState(true);

  // ============================================================
  // 🔥 CHARGER LES ÉVÉNEMENTS (REALTIME)
  // ============================================================
  useEffect(() => {
    setLoading(true);
    
    const unsubscribe = getEvents((data) => {
      setEvents(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // ============================================================
  // 🔥 FILTRES
  // ============================================================
  const filteredEvents = events.filter(event => {
    // Recherche
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.country.toLowerCase().includes(searchQuery.toLowerCase());

    // Catégorie
    const matchesCategory = selectedCategory === 'all' || event.category === selectedCategory;

    // Filtre
    let matchesFilter = true;
    switch (filter) {
      case 'going':
        matchesFilter = event.going.includes(user?.uid || '');
        break;
      case 'interested':
        matchesFilter = event.interestedUsers.includes(user?.uid || '');
        break;
      case 'favorites':
        matchesFilter = event.favorites.includes(user?.uid || '');
        break;
      default:
        matchesFilter = true;
    }

    return matchesSearch && matchesCategory && matchesFilter;
  });

  // ============================================================
  // 🔥 FORMATAGE
  // ============================================================
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const formatTime = (timeStr: string) => {
    return timeStr.substring(0, 5);
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Concert: '#EC4899',
      'Fan Meeting': '#C084FC',
      Festival: '#FF6B6B',
      'Dance Cover': '#4A90D9',
      'Random Play Dance': '#00B894',
      'Birthday Event': '#FFD700',
      'Streaming Party': '#FDCB6E',
    };
    return colors[category] || '#7A7A9A';
  };

  const getCategoryIcon = (category: string) => {
    const icons: Record<string, string> = {
      Concert: 'fa-microphone',
      'Fan Meeting': 'fa-user-friends',
      Festival: 'fa-music',
      'Dance Cover': 'fa-dance',
      'Random Play Dance': 'fa-random',
      'Birthday Event': 'fa-birthday-cake',
      'Streaming Party': 'fa-play',
    };
    return icons[category] || 'fa-calendar-plus';
  };

  // ============================================================
  // 🔥 HANDLERS
  // ============================================================
  const handleGoing = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleGoing(eventId);
  };

  const handleInterested = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleInterested(eventId);
  };

  const handleFavorite = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await toggleFavorite(eventId);
  };

  const handleViewEvent = (event: Event) => {
    setSelectedEvent(event);
    setShowEventModal(true);
    incrementViews(event.id);
  };

  const handleDelete = async (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Supprimer cet événement ?')) {
      await deleteEvent(eventId);
    }
  };

  // ============================================================
  // RENDER EVENT CARD
  // ============================================================
  const renderEventCard = (event: Event) => {
    const isGoing = event.going.includes(user?.uid || '');
    const isInterested = event.interestedUsers.includes(user?.uid || '');
    const isFavorite = event.favorites.includes(user?.uid || '');
    const isOwner = event.organizer.id === user?.uid;

    return (
      <div
        key={event.id}
        className={`event-card ${isFavorite ? 'favorite' : ''}`}
        onClick={() => handleViewEvent(event)}
      >
        <div className="event-card-image">
          <img src={event.image} alt={event.title} loading="lazy" />
          <span
            className="event-card-category"
            style={{ backgroundColor: getCategoryColor(event.category) }}
          >
            <i className={`fas ${getCategoryIcon(event.category)}`} />
            {event.category}
          </span>
          {isFavorite && (
            <span className="event-card-favorite-badge">
              <i className="fas fa-star" />
            </span>
          )}
        </div>

        <div className="event-card-content">
          <h3 className="event-card-title">{event.title}</h3>

          <div className="event-card-date">
            <i className="fas fa-calendar-day" />
            {formatDate(event.date)}
          </div>

          <div className="event-card-time">
            <i className="fas fa-clock" />
            {formatTime(event.time)}
            {event.endTime && ` - ${formatTime(event.endTime)}`}
          </div>

          <div className="event-card-location">
            <i className="fas fa-map-marker-alt" />
            {event.venue}, {event.city}
          </div>

          <div className="event-card-organizer">
            <img src={event.organizer.avatar} alt={event.organizer.name} />
            <span>
              {event.organizer.name}
              {event.organizer.verified && <i className="fas fa-check-circle verified" />}
            </span>
          </div>

          <div className="event-card-stats">
            <span className="event-stat">
              <i className="fas fa-user-check" />
              {formatNumber(event.participants)} Going
            </span>
            <span className="event-stat">
              <i className="fas fa-heart" />
              {formatNumber(event.interested)} Interested
            </span>
            <span className="event-stat">
              <i className="fas fa-eye" />
              {formatNumber(event.views)} Views
            </span>
          </div>

          <div className="event-card-actions">
            <button
              className={`event-action-btn going ${isGoing ? 'active' : ''}`}
              onClick={(e) => handleGoing(event.id, e)}
            >
              <i className="fas fa-check" />
              {isGoing ? 'Going' : 'Going'}
            </button>
            <button
              className={`event-action-btn interested ${isInterested ? 'active' : ''}`}
              onClick={(e) => handleInterested(event.id, e)}
            >
              <i className="fas fa-heart" />
              {isInterested ? 'Interested' : 'Interested'}
            </button>
            <button
              className={`event-action-btn favorite ${isFavorite ? 'active' : ''}`}
              onClick={(e) => handleFavorite(event.id, e)}
            >
              <i className="fas fa-star" />
            </button>
            {isOwner && (
              <button
                className="event-action-btn delete"
                onClick={(e) => handleDelete(event.id, e)}
              >
                <i className="fas fa-trash" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // ============================================================
  // LOADING
  // ============================================================
  if (loading) {
    return (
      <div className="events-page" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <div className="loading-spinner" />
        <span style={{ marginLeft: '12px', color: 'rgba(255,255,255,0.3)' }}>Chargement des événements...</span>
      </div>
    );
  }

  return (
    <div className="events-page">
      {/* HEADER */}
      <div className="events-header">
        <div className="events-header-top">
          <h1 className="events-title">
            <i className="fas fa-calendar-alt" style={{ color: '#C084FC' }} />
            Events
            <span className="events-count-badge">{filteredEvents.length}</span>
          </h1>
          <div className="events-header-actions">
            <button
              className="events-create-btn"
              onClick={() => navigate('/events/create')}
            >
              <i className="fas fa-plus" /> Create
            </button>
          </div>
        </div>

        <div className="events-search">
          <i className="fas fa-search" />
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="events-search-clear" onClick={() => setSearchQuery('')}>
              <i className="fas fa-times-circle" />
            </button>
          )}
        </div>

        {/* FILTERS */}
        <div className="events-filters">
          <div className="filter-group">
            {['all', 'going', 'interested', 'favorites'].map((f) => (
              <button
                key={f}
                className={`filter-btn ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f)}
              >
                {f === 'all' && 'All'}
                {f === 'going' && 'Going'}
                {f === 'interested' && 'Interested'}
                {f === 'favorites' && 'Favorites'}
              </button>
            ))}
          </div>

          <div className="filter-group">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Categories</option>
              {['Concert', 'Fan Meeting', 'Festival', 'Dance Cover', 'Random Play Dance', 'Birthday Event', 'Streaming Party'].map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* EVENTS GRID */}
      <div className="events-content">
        {filteredEvents.length > 0 ? (
          <div className="events-grid">
            {filteredEvents.map(renderEventCard)}
          </div>
        ) : (
          <div className="events-empty">
            <i className="fas fa-calendar-times" />
            <h3>No events found</h3>
            <p>Try adjusting your filters or create a new event!</p>
            <button
              className="events-empty-btn"
              onClick={() => navigate('/events/create')}
            >
              <i className="fas fa-plus" /> Create Event
            </button>
          </div>
        )}
      </div>

      {/* EVENT DETAIL MODAL */}
      {showEventModal && selectedEvent && (
        <div className="modal-overlay" onClick={() => setShowEventModal(false)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowEventModal(false)}>
              <i className="fas fa-times" />
            </button>

            <div className="event-detail">
              <div className="event-detail-image">
                <img src={selectedEvent.image} alt={selectedEvent.title} />
                <span
                  className="event-detail-category"
                  style={{ backgroundColor: getCategoryColor(selectedEvent.category) }}
                >
                  <i className={`fas ${getCategoryIcon(selectedEvent.category)}`} />
                  {selectedEvent.category}
                </span>
              </div>

              <div className="event-detail-content">
                <h2 className="event-detail-title">{selectedEvent.title}</h2>

                <div className="event-detail-meta">
                  <div className="event-detail-meta-item">
                    <i className="fas fa-calendar-day" />
                    {formatDate(selectedEvent.date)}
                  </div>
                  <div className="event-detail-meta-item">
                    <i className="fas fa-clock" />
                    {formatTime(selectedEvent.time)}
                    {selectedEvent.endTime && ` - ${formatTime(selectedEvent.endTime)}`}
                  </div>
                  <div className="event-detail-meta-item">
                    <i className="fas fa-map-marker-alt" />
                    {selectedEvent.venue}, {selectedEvent.city}
                  </div>
                </div>

                <div className="event-detail-organizer">
                  <img src={selectedEvent.organizer.avatar} alt={selectedEvent.organizer.name} />
                  <div>
                    <span className="organizer-name">
                      {selectedEvent.organizer.name}
                      {selectedEvent.organizer.verified && <i className="fas fa-check-circle verified" />}
                    </span>
                    <span className="organizer-label">Organizer</span>
                  </div>
                </div>

                <p className="event-detail-description">{selectedEvent.description}</p>

                {selectedEvent.artists && selectedEvent.artists.length > 0 && (
                  <div className="event-detail-tags">
                    <span className="tag-label">Artists:</span>
                    {selectedEvent.artists.map(artist => (
                      <span key={artist} className="tag">{artist}</span>
                    ))}
                  </div>
                )}

                {selectedEvent.hashtags && selectedEvent.hashtags.length > 0 && (
                  <div className="event-detail-tags">
                    {selectedEvent.hashtags.map(tag => (
                      <span key={tag} className="hashtag">#{tag}</span>
                    ))}
                  </div>
                )}

                <div className="event-detail-stats">
                  <div className="event-detail-stat">
                    <span className="stat-value">{formatNumber(selectedEvent.participants)}</span>
                    <span className="stat-label">Going</span>
                  </div>
                  <div className="event-detail-stat">
                    <span className="stat-value">{formatNumber(selectedEvent.interested)}</span>
                    <span className="stat-label">Interested</span>
                  </div>
                  <div className="event-detail-stat">
                    <span className="stat-value">{formatNumber(selectedEvent.views)}</span>
                    <span className="stat-label">Views</span>
                  </div>
                </div>

                <div className="event-detail-actions">
                  <button
                    className={`detail-action going ${selectedEvent.going.includes(user?.uid || '') ? 'active' : ''}`}
                    onClick={() => toggleGoing(selectedEvent.id)}
                  >
                    <i className="fas fa-check" />
                    {selectedEvent.going.includes(user?.uid || '') ? 'Going' : 'Going'}
                  </button>
                  <button
                    className={`detail-action interested ${selectedEvent.interestedUsers.includes(user?.uid || '') ? 'active' : ''}`}
                    onClick={() => toggleInterested(selectedEvent.id)}
                  >
                    <i className="fas fa-heart" />
                    {selectedEvent.interestedUsers.includes(user?.uid || '') ? 'Interested' : 'Interested'}
                  </button>
                  <button
                    className={`detail-action favorite ${selectedEvent.favorites.includes(user?.uid || '') ? 'active' : ''}`}
                    onClick={() => toggleFavorite(selectedEvent.id)}
                  >
                    <i className="fas fa-star" />
                  </button>
                </div>

                {selectedEvent.externalLink && (
                  <a
                    href={selectedEvent.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="event-detail-link"
                  >
                    <i className="fas fa-external-link-alt" /> Official Link
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .loading-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(255,255,255,0.04);
          border-top-color: #C084FC;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .event-action-btn.delete {
          color: #EF4444;
        }
        .event-action-btn.delete:hover {
          background: rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </div>
  );
};

export default Events;