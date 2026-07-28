// ========== src/pages/Messages.tsx ==========
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useMessages } from '../hooks/useMessages';
import '../styles/Messages.css';

// ============================================================
// COMPOSANT PRINCIPAL
// ============================================================
const Messages: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const {
    conversations,
    messages,
    selectedConversationId,
    loading,
    loadingError,
    sending,
    userStatus,
    selectConversation,
    startConversation,
    sendMessageTo,
    reactToMessage,
    createNewGroup,
    toggleConversationPin,
    toggleConversationFavorite,
    toggleConversationArchive,
    deleteMessageFrom,
    deleteConversationFrom,
    getUserStatus,
    formatLastSeen,
    searchUsers,
  } = useMessages();
  
  // ============================================================
  // ÉTATS LOCAUX
  // ============================================================
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'unread' | 'groups' | 'favorites'>('all');
  const [messageInput, setMessageInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSearchInChat, setShowSearchInChat] = useState(false);
  const [searchInChatQuery, setSearchInChatQuery] = useState('');
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [showLeftPanel, setShowLeftPanel] = useState(true);
  const [showScrollToBottom, setShowScrollToBottom] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [groupAvatar, setGroupAvatar] = useState<string | null>(null);
  const [searchUsersQuery, setSearchUsersQuery] = useState('');
  const [sharePreview, setSharePreview] = useState<any>(null);
  const [showSharePreview, setShowSharePreview] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // ============================================================
  // RESPONSIVE
  // ============================================================
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // ============================================================
  // SCROLL
  // ============================================================
  useEffect(() => {
    if (messagesEndRef.current && !sending) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sending]);

  const handleScroll = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      setShowScrollToBottom(scrollHeight - scrollTop - clientHeight > 200);
    }
  }, []);

  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // ============================================================
  // RECHERCHE UTILISATEURS
  // ============================================================
  useEffect(() => {
    const delayDebounce = setTimeout(async () => {
      if (searchUsersQuery.trim()) {
        const results = await searchUsers(searchUsersQuery);
        setSearchResults(results);
      } else {
        setSearchResults([]);
      }
    }, 300);
    
    return () => clearTimeout(delayDebounce);
  }, [searchUsersQuery]);

  // ============================================================
  // RECEPTION DU SHARE VIA NAVIGATION STATE
  // ============================================================
  useEffect(() => {
    if (location.state?.shareData) {
      const data = location.state.shareData;
      setSharePreview(data);
      setShowSharePreview(true);
      if (selectedConversationId) {
        const shareMessage = `📌 ${data.title}\n🔗 ${data.link}`;
        sendMessageTo(selectedConversationId, shareMessage, 'share', undefined, {
          title: data.title,
          description: data.description,
          image: data.image,
          link: data.link,
          author: data.author,
          authorAvatar: data.authorAvatar,
          postId: data.postId,
        });
        setShowSharePreview(false);
        setSharePreview(null);
        window.history.replaceState({}, document.title);
      }
    }
  }, [location, selectedConversationId]);

  // ============================================================
  // ✅ RECEPTION DU START CHAT DEPUIS LE PROFIL - VAOVAO
  // ============================================================
  useEffect(() => {
    const handleStartChat = async () => {
      console.log('🔍 Location state rehetra:', location.state);
      
      // ✅ Raha misy conversationId efa voasokatra
      if (location.state?.conversationId) {
        console.log('🔍 Ouvrir conversation existante:', location.state.conversationId);
        selectConversation(location.state.conversationId);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      // ✅ Raha misy startChat (user ID)
      if (location.state?.startChat) {
        const userId = location.state.startChat;
        const userName = location.state.userName || 'Utilisateur';
        console.log(`🔍 Démarrer chat avec: ${userName} (${userId})`);
        
        try {
          // ✅ Mampiasa setTimeout mba hahazoana antoka fa voasokatra tsara
          setTimeout(async () => {
            const convId = await startConversation(userId);
            if (convId) {
              console.log('✅ Conversation créée:', convId);
              selectConversation(convId);
            }
          }, 300);
          
          // ✅ Esory ny state
          window.history.replaceState({}, document.title, window.location.pathname);
        } catch (error) {
          console.error('❌ Erreur création conversation:', error);
        }
      }
    };
    
    handleStartChat();
  }, [location.state, startConversation, selectConversation]);

  // ============================================================
  // FILTRES
  // ============================================================
  const filteredConversations = useMemo(() => {
    let filtered = [...conversations];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c =>
        (c.isGroup ? c.groupName : c.participants.join('')).toLowerCase().includes(q) ||
        c.lastMessage?.text.toLowerCase().includes(q)
      );
    }

    switch (filter) {
      case 'unread': filtered = filtered.filter(c => c.unreadCount > 0); break;
      case 'groups': filtered = filtered.filter(c => c.isGroup); break;
      case 'favorites': filtered = filtered.filter(c => c.isFavorite); break;
      default: break;
    }

    filtered.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.lastMessageTime - a.lastMessageTime;
    });

    return filtered;
  }, [conversations, searchQuery, filter]);

  // ============================================================
  // SÉLECTION
  // ============================================================
  const handleSelectConversation = (id: string) => {
    selectConversation(id);
    setShowDrawer(false);
    if (isMobileView) {
      setShowLeftPanel(false);
    }
  };

  // ============================================================
  // ENVOI DE MESSAGE
  // ============================================================
  const handleSendMessage = () => {
    if (!selectedConversationId) return;
    if (!messageInput.trim()) return;

    sendMessageTo(selectedConversationId, messageInput.trim());
    setMessageInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // ============================================================
  // UPLOAD DE FICHIER
  // ============================================================
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedConversationId) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const data = ev.target?.result as string;
        if (file.type.startsWith('image/')) {
          sendMessageTo(selectedConversationId, '', 'image', data);
        } else {
          sendMessageTo(selectedConversationId, `📎 ${file.name}`, 'file', data);
        }
      };
      reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // ============================================================
  // FORMATAGE
  // ============================================================
  const formatTime = (ts: number) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  const formatDate = (ts: number) => {
    const now = new Date();
    const date = new Date(ts);
    if (date.toDateString() === now.toDateString()) return "Aujourd'hui";
    if (date.toDateString() === new Date(now.getTime() - 86400000).toDateString()) return 'Hier';
    return date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  // ============================================================
  // GET USER NAME FROM CONVERSATION - MIARAKA AMIN'NY FANAMARIHANA
  // ============================================================
  const getConversationName = (conversation: any) => {
    if (!conversation) return 'Utilisateur';
    if (conversation.isGroup) return conversation.groupName || 'Groupe';
    const otherId = conversation.participants?.find((id: string) => id !== user?.id);
    return otherId || 'Utilisateur';
  };

  const getConversationAvatar = (conversation: any) => {
    if (!conversation) return 'https://i.pravatar.cc/150?img=16';
    if (conversation.isGroup) return conversation.groupAvatar || 'https://i.pravatar.cc/150?img=25';
    const otherId = conversation.participants?.find((id: string) => id !== user?.id);
    return 'https://i.pravatar.cc/150';
  };

  const getConversationStatus = (conversation: any) => {
    if (!conversation) return 'Offline';
    if (conversation.isGroup) return `${conversation.participants?.length || 0} members`;
    const otherId = conversation.participants?.find((id: string) => id !== user?.id);
    if (!otherId) return 'Offline';
    const status = getUserStatus(otherId);
    return status.online ? 'Online' : formatLastSeen(status.lastSeen);
  };

  // ============================================================
  // RENDER CONVERSATION ITEM - MIARAKA AMIN'NY FANAMARIHANA
  // ============================================================
  const renderConversationItem = (conversation: any) => {
    if (!conversation) return null;
    
    const name = getConversationName(conversation);
    const avatar = getConversationAvatar(conversation);
    const status = getConversationStatus(conversation);
    const last = conversation.lastMessage;
    const isUnread = conversation.unreadCount > 0;

    return (
      <div
        key={conversation.id}
        className={`conversation-item ${selectedConversationId === conversation.id ? 'active' : ''} ${conversation.isPinned ? 'pinned' : ''}`}
        onClick={() => handleSelectConversation(conversation.id)}
      >
        <div className="conversation-avatar">
          <img src={avatar} alt={name} />
          {!conversation.isGroup && status === 'Online' && (
            <span className="status-dot online" />
          )}
          {conversation.isGroup && (
            <span className="status-dot group"><i className="fas fa-users" /></span>
          )}
        </div>
        <div className="conversation-info">
          <div className="conversation-name">
            {name}
            {conversation.isPinned && <i className="fas fa-thumbtack pin-icon" />}
          </div>
          <div className="conversation-last-msg">
            {last && (
              <>
                {last.senderId === user?.id && 'You: '}
                {last.type === 'image' && '📷 Image'}
                {last.type === 'file' && '📎 Fichier'}
                {last.type === 'share' && '📌 Shared post'}
                {last.type === 'text' && last.text}
              </>
            )}
          </div>
        </div>
        <div className="conversation-meta">
          <span className="conversation-time">{last && formatTime(last.timestamp)}</span>
          {isUnread && <span className="unread-badge">{conversation.unreadCount}</span>}
        </div>
      </div>
    );
  };

  // ============================================================
  // RENDER EMPTY STATE
  // ============================================================
  const renderEmptyState = () => (
    <div className="chat-empty-state-premium">
      <div className="empty-illustration-premium">
        <i className="fas fa-comments" />
      </div>
      <h3>Bienvenue dans vos messages</h3>
      <p>Commencez une nouvelle conversation ou rejoignez un groupe.</p>
      <div className="empty-actions-premium">
        <button className="empty-btn-premium primary" onClick={() => setShowCreateGroup(true)}>
          <i className="fas fa-users" /> Créer un groupe
        </button>
        <button className="empty-btn-premium secondary" onClick={() => navigate('/friends')}>
          <i className="fas fa-user-plus" /> Trouver des amis
        </button>
        <button className="empty-btn-premium secondary" onClick={() => navigate('/explore')}>
          <i className="fas fa-compass" /> Explorer
        </button>
      </div>
    </div>
  );

  // ============================================================
  // RENDU PRINCIPAL
  // ============================================================
  return (
    <div className="messages-page">
      {/* LEFT PANEL - Conversations */}
      <div className={`messages-left ${!showLeftPanel && isMobileView ? 'hidden' : ''}`}>
        <div className="messages-left-sticky">
          <div className="messages-left-header">
            <div className="search-container">
              <i className="fas fa-search" />
              <input
                type="text"
                placeholder="Rechercher des conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="search-clear-btn" onClick={() => setSearchQuery('')}>
                  <i className="fas fa-times-circle" />
                </button>
              )}
            </div>
            <button 
              className="new-chat-btn" 
              onClick={() => setShowCreateGroup(true)}
              title="Créer un groupe"
            >
              <i className="fas fa-users" />
            </button>
            <button 
              className="new-chat-btn friends" 
              onClick={() => navigate('/friends')}
              title="Trouver des amis"
            >
              <i className="fas fa-user-plus" />
            </button>
          </div>

          <div className="filter-tabs">
            {['all', 'unread', 'groups', 'favorites'].map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? 'active' : ''}`}
                onClick={() => setFilter(f as any)}
              >
                {f === 'all' && 'Tous'}
                {f === 'unread' && 'Non lus'}
                {f === 'groups' && 'Groupes'}
                {f === 'favorites' && 'Favoris'}
              </button>
            ))}
          </div>
        </div>

        <div className="conversation-list">
          {filteredConversations.length > 0 ? (
            filteredConversations.map(renderConversationItem)
          ) : (
            <div className="no-conversations-premium">
              <i className="fas fa-inbox" />
              <span>Aucune conversation</span>
              <p className="no-conversations-hint">
                Commencez une nouvelle discussion avec un ami
              </p>
              <button className="no-conversations-btn" onClick={() => navigate('/friends')}>
                <i className="fas fa-user-plus" /> Trouver des amis
              </button>
            </div>
          )}
        </div>
      </div>

      {/* CENTER PANEL - Chat Area */}
      <div className="messages-center">
        {selectedConversationId && messages ? (
          <div className="chat-container">
            {/* Chat header */}
            <div className="chat-header">
              <div className="chat-header-left">
                {isMobileView && (
                  <button className="back-btn" onClick={() => setShowLeftPanel(true)}>
                    <i className="fas fa-arrow-left" />
                  </button>
                )}
                <div className="chat-avatar">
                  {(() => {
                    const conv = conversations.find(c => c.id === selectedConversationId);
                    return (
                      <>
                        <img src={getConversationAvatar(conv)} alt="Avatar" />
                        {!conv?.isGroup && (
                          <span className={`status-dot ${getConversationStatus(conv) === 'Online' ? 'online' : 'offline'}`} />
                        )}
                      </>
                    );
                  })()}
                </div>
                <div className="chat-info">
                  <span className="chat-name">
                    {(() => {
                      const conv = conversations.find(c => c.id === selectedConversationId);
                      return getConversationName(conv);
                    })()}
                  </span>
                  <span className="chat-status">
                    {(() => {
                      const conv = conversations.find(c => c.id === selectedConversationId);
                      return getConversationStatus(conv);
                    })()}
                  </span>
                </div>
              </div>
              <div className="chat-header-right">
                <button className="chat-header-btn" onClick={() => setShowSearchInChat(!showSearchInChat)}>
                  <i className="fas fa-search" />
                </button>
                <button className="chat-header-btn" onClick={() => setShowDrawer(!showDrawer)}>
                  <i className="fas fa-info-circle" />
                </button>
              </div>
            </div>

            {/* Search in chat */}
            {showSearchInChat && (
              <div className="chat-search-bar">
                <i className="fas fa-search" />
                <input
                  type="text"
                  placeholder="Rechercher dans la conversation..."
                  value={searchInChatQuery}
                  onChange={(e) => setSearchInChatQuery(e.target.value)}
                />
                <button onClick={() => setShowSearchInChat(false)}>
                  <i className="fas fa-times" />
                </button>
              </div>
            )}

            {/* Messages */}
            <div className="chat-messages" ref={messagesContainerRef} onScroll={handleScroll}>
              {messages.map((msg, index) => {
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const showDate = !prevMsg || new Date(msg.timestamp).toDateString() !== new Date(prevMsg.timestamp).toDateString();
                const isGrouped = prevMsg && prevMsg.senderId === msg.senderId && !showDate;

                return (
                  <React.Fragment key={msg.id}>
                    {showDate && (
                      <div className="message-date-divider">
                        <span>{formatDate(msg.timestamp)}</span>
                      </div>
                    )}
                    <div className={`message-wrapper ${msg.isOwn ? 'own' : 'other'} ${isGrouped ? 'grouped' : ''}`}>
                      {!msg.isOwn && !isGrouped && (
                        <div className="message-avatar">
                          <img src={msg.senderAvatar} alt={msg.senderName} />
                        </div>
                      )}
                      {!msg.isOwn && isGrouped && <div className="message-avatar-spacer" />}
                      <div className="message-bubble-wrapper">
                        {!msg.isOwn && !isGrouped && (
                          <div className="message-sender-name">{msg.senderName}</div>
                        )}
                        <div className={`message-bubble ${msg.isOwn ? 'own' : 'other'}`}>
                          {msg.type === 'text' && <p className="message-text">{msg.text}</p>}
                          {msg.type === 'image' && msg.mediaUrl && (
                            <div className="message-image">
                              <img src={msg.mediaUrl} alt="Image" />
                            </div>
                          )}
                          {msg.type === 'file' && (
                            <div className="message-file">
                              <i className="fas fa-file" />
                              <span className="file-name">{msg.fileName || 'Fichier'}</span>
                            </div>
                          )}
                          {msg.type === 'share' && msg.sharePreview && (
                            <div className="message-shared">
                              <div className="shared-icon">
                                <i className="fas fa-share-alt" />
                              </div>
                              <div className="shared-info">
                                <div className="shared-title">{msg.sharePreview.title}</div>
                                <div className="shared-subtitle">{msg.sharePreview.description}</div>
                              </div>
                            </div>
                          )}
                          <div className="message-footer">
                            <span className="message-time">{formatTime(msg.timestamp)}</span>
                            {msg.isOwn && (
                              <span className="message-status">
                                {msg.isRead ? <i className="fas fa-check-double read" /> : <i className="fas fa-check sent" />}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      {msg.isOwn && !isGrouped && (
                        <div className="message-avatar">
                          <img src={user?.photoURL || 'https://i.pravatar.cc/150?img=16'} alt="You" />
                        </div>
                      )}
                      {msg.isOwn && isGrouped && <div className="message-avatar-spacer" />}
                    </div>
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Scroll to bottom button */}
            {showScrollToBottom && (
              <button className="scroll-to-bottom" onClick={scrollToBottom}>
                <i className="fas fa-arrow-down" />
              </button>
            )}

            {/* Input area */}
            <div className="chat-input-area">
              <button className="input-btn" onClick={() => fileInputRef.current?.click()}>
                <i className="fas fa-paperclip" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handleFileUpload}
              />
              <button className="input-btn" onClick={() => setShowEmojiPicker(!showEmojiPicker)}>
                <i className="fas fa-smile" />
              </button>
              <input
                type="text"
                className="message-input"
                placeholder="Tapez votre message..."
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyPress={handleKeyPress}
              />
              <button 
                className={`send-btn ${messageInput.trim() ? 'active' : ''}`} 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || sending}
              >
                <i className="fas fa-paper-plane" />
              </button>
            </div>
          </div>
        ) : (
          renderEmptyState()
        )}
      </div>

      {/* CREATE GROUP MODAL */}
      {showCreateGroup && (
        <div className="modal-overlay" onClick={() => {
          setShowCreateGroup(false);
          setGroupName('');
          setGroupDescription('');
          setSelectedMembers([]);
          setGroupAvatar(null);
          setSearchUsersQuery('');
        }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3><i className="fas fa-users" style={{ color: '#C084FC' }} /> Créer un groupe</h3>
              <button className="modal-close" onClick={() => setShowCreateGroup(false)}>
                <i className="fas fa-times" />
              </button>
            </div>
            <div className="modal-body">
              <div className="group-avatar-upload" onClick={() => {}}>
                {groupAvatar ? (
                  <img src={groupAvatar} alt="Group" />
                ) : (
                  <div className="group-avatar-placeholder">
                    <i className="fas fa-users" />
                    <span>Photo</span>
                  </div>
                )}
              </div>
              <div className="modal-input-group">
                <label>Nom du groupe</label>
                <input
                  type="text"
                  placeholder="Nom du groupe..."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                />
              </div>
              <div className="modal-input-group">
                <label>Description</label>
                <textarea
                  placeholder="Description du groupe..."
                  value={groupDescription}
                  onChange={(e) => setGroupDescription(e.target.value)}
                />
              </div>
              <div className="modal-input-group">
                <label>Ajouter des membres</label>
                <div className="member-search">
                  <i className="fas fa-search" />
                  <input
                    type="text"
                    placeholder="Rechercher des amis..."
                    value={searchUsersQuery}
                    onChange={(e) => setSearchUsersQuery(e.target.value)}
                  />
                </div>
                {searchResults.length > 0 && (
                  <div className="member-suggestions">
                    {searchResults.slice(0, 5).map((result) => (
                      <div key={result.id} className="member-suggestion">
                        <img src={result.avatar} alt={result.name} />
                        <div className="suggestion-info">
                          <span className="suggestion-name">{result.name}</span>
                          <span className="suggestion-username">@{result.username}</span>
                        </div>
                        <button 
                          className="suggestion-add"
                          onClick={() => {
                            if (!selectedMembers.includes(result.id)) {
                              setSelectedMembers([...selectedMembers, result.id]);
                            }
                          }}
                        >
                          <i className="fas fa-plus" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {selectedMembers.length > 0 && (
                  <div className="selected-members">
                    {selectedMembers.map((id) => (
                      <div key={id} className="selected-member">
                        <img src="https://i.pravatar.cc/150" alt="Member" />
                        <span>Membre</span>
                        <button onClick={() => setSelectedMembers(selectedMembers.filter(m => m !== id))}>
                          <i className="fas fa-times" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-cancel" onClick={() => setShowCreateGroup(false)}>Annuler</button>
              <button 
                className="modal-submit" 
                onClick={() => {
                  if (groupName.trim() && selectedMembers.length > 0) {
                    createNewGroup(groupName, selectedMembers, groupAvatar || undefined);
                    setShowCreateGroup(false);
                    setGroupName('');
                    setGroupDescription('');
                    setSelectedMembers([]);
                    setGroupAvatar(null);
                  }
                }}
                disabled={!groupName.trim() || selectedMembers.length === 0}
              >
                <i className="fas fa-check" /> Créer le groupe
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .loading-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(255,255,255,0.04);
          border-top-color: #C084FC;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        
        .no-conversations-premium {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--text-tertiary);
          gap: 8px;
        }
        .no-conversations-premium i {
          font-size: 32px;
          color: var(--text-dim);
        }
        .no-conversations-premium span {
          font-size: 15px;
          font-weight: 500;
        }
        .no-conversations-hint {
          font-size: 12px;
          color: var(--text-dim);
          margin: 0;
        }
        .no-conversations-btn {
          margin-top: 8px;
          padding: 6px 20px;
          border-radius: 30px;
          background: var(--gradient-primary);
          border: none;
          color: #fff;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
        }
        .no-conversations-btn:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.15);
        }
        
        .chat-empty-state-premium {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          color: var(--text-muted);
          text-align: center;
          gap: 12px;
        }
        .empty-illustration-premium {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          background: rgba(192, 132, 252, 0.06);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 36px;
          color: var(--kpop-violet);
        }
        .chat-empty-state-premium h3 {
          font-size: 18px;
          color: var(--text-primary);
          margin: 0;
        }
        .chat-empty-state-premium p {
          font-size: 14px;
          margin: 0;
          max-width: 320px;
        }
        .empty-actions-premium {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          justify-content: center;
          margin-top: 8px;
        }
        .empty-btn-premium {
          padding: 8px 20px;
          border-radius: 30px;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-family: inherit;
          transition: all 0.3s ease;
        }
        .empty-btn-premium.primary {
          background: var(--gradient-primary);
          color: #fff;
        }
        .empty-btn-premium.primary:hover {
          transform: scale(1.03);
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.15);
        }
        .empty-btn-premium.secondary {
          background: var(--bg-input);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }
        .empty-btn-premium.secondary:hover {
          background: var(--bg-hover);
        }
        .new-chat-btn.friends {
          background: rgba(16, 185, 129, 0.1);
          color: #10B981;
        }
        .new-chat-btn.friends:hover {
          background: rgba(16, 185, 129, 0.2);
        }
        .conversation-avatar {
          position: relative;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-right: 12px;
        }
        .conversation-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .status-dot {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid var(--msg-card);
        }
        .status-dot.online { background: #4CAF50; }
        .status-dot.offline { background: #9E9E9E; }
        .status-dot.group {
          background: var(--kpop-violet);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 6px;
          color: #fff;
        }
        .conversation-item {
          display: flex;
          align-items: center;
          padding: 10px 16px;
          cursor: pointer;
          transition: all 0.2s ease;
          border-left: 3px solid transparent;
        }
        .conversation-item:hover {
          background: rgba(255, 255, 255, 0.02);
        }
        .conversation-item.active {
          background: rgba(192, 132, 252, 0.04);
          border-left-color: var(--kpop-violet);
        }
        .conversation-item.pinned {
          background: rgba(255, 215, 0, 0.02);
        }
        .conversation-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .conversation-name .pin-icon { color: #FFD700; font-size: 10px; margin-left: auto; }
        .conversation-last-msg {
          font-size: 13px;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          margin-top: 2px;
        }
        .conversation-meta {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          flex-shrink: 0;
          margin-left: 8px;
        }
        .conversation-time { font-size: 11px; color: var(--text-dim); }
        .unread-badge {
          margin-top: 4px;
          background: var(--kpop-rose);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          min-width: 20px;
          height: 20px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 6px;
        }
        .chat-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 10px 16px;
          border-bottom: 1px solid var(--border-color);
          background: var(--bg-primary);
          flex-shrink: 0;
          min-height: 64px;
        }
        .chat-avatar {
          position: relative;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          cursor: pointer;
        }
        .chat-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .chat-avatar .status-dot {
          width: 10px;
          height: 10px;
          border: 2px solid var(--bg-primary);
        }
        .chat-info { display: flex; flex-direction: column; }
        .chat-name {
          font-size: 15px;
          font-weight: 600;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .chat-status { font-size: 12px; color: var(--text-muted); }
        .message-date-divider {
          text-align: center;
          padding: 16px 0 12px;
          position: relative;
        }
        .message-date-divider span {
          font-size: 11px;
          color: var(--text-dim);
          background: rgba(255, 255, 255, 0.04);
          padding: 4px 16px;
          border-radius: 30px;
          border: 1px solid var(--border-color);
          backdrop-filter: blur(8px);
        }
        .message-wrapper {
          display: flex;
          gap: 8px;
          max-width: 78%;
          animation: messageSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes messageSlideIn {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .message-wrapper.own {
          align-self: flex-end;
          flex-direction: row-reverse;
        }
        .message-wrapper.other {
          align-self: flex-start;
        }
        .message-wrapper.grouped {
          margin-top: 2px;
        }
        .message-wrapper.grouped .message-avatar {
          visibility: hidden;
          width: 32px;
          flex-shrink: 0;
        }
        .message-wrapper.grouped .message-sender-name {
          display: none;
        }
        .message-wrapper.grouped .message-time {
          display: none;
        }
        .message-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          flex-shrink: 0;
          margin-top: 2px;
          border: 2px solid rgba(192, 132, 252, 0.15);
          transition: all 0.2s;
          cursor: pointer;
        }
        .message-avatar:hover {
          border-color: rgba(192, 132, 252, 0.4);
          transform: scale(1.05);
        }
        .message-avatar img {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
        }
        .message-avatar-spacer {
          width: 32px;
          flex-shrink: 0;
        }
        .message-sender-name {
          font-size: 11px;
          font-weight: 600;
          color: var(--kpop-violet);
          margin-bottom: 2px;
          padding-left: 4px;
          letter-spacing: 0.3px;
        }
        .message-bubble-wrapper {
          max-width: 100%;
          display: flex;
          flex-direction: column;
        }
        .message-bubble {
          padding: 8px 14px;
          max-width: 100%;
          word-wrap: break-word;
          position: relative;
          transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .message-wrapper.own .message-bubble {
          background: var(--gradient-primary);
          color: #FFFFFF;
          border-radius: 20px 20px 4px 20px;
          box-shadow: 0 4px 24px rgba(192, 132, 252, 0.25);
          border: none;
        }
        .message-wrapper.own .message-bubble:hover {
          transform: scale(1.02);
          box-shadow: 0 6px 32px rgba(192, 132, 252, 0.35);
        }
        .message-wrapper.other .message-bubble {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(16px);
          border: 1px solid var(--border-color);
          border-radius: 20px 20px 20px 4px;
          color: var(--text-primary);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
        }
        .message-wrapper.other .message-bubble:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 28px rgba(0, 0, 0, 0.3);
        }
        .message-text {
          font-size: 14px;
          line-height: 1.5;
          margin: 0;
          font-weight: 400;
          letter-spacing: 0.2px;
          word-wrap: break-word;
          color: var(--text-primary);
        }
        .message-image {
          border-radius: 12px;
          overflow: hidden;
          max-width: 280px;
          margin: 4px 0;
          border: 1px solid var(--border-color);
        }
        .message-image img {
          width: 100%;
          height: auto;
          max-height: 280px;
          object-fit: cover;
          display: block;
        }
        .message-file {
          display: flex;
          align-items: center;
          gap: 10px;
          background: rgba(255, 255, 255, 0.02);
          padding: 8px 14px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
        }
        .message-file i { font-size: 22px; color: var(--kpop-violet); }
        .message-file .file-name { flex: 1; font-size: 13px; color: var(--text-primary); }
        .message-file .file-size { font-size: 11px; color: var(--text-dim); margin-left: auto; }
        .message-shared {
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 12px;
          border: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          transition: all 0.2s;
          min-width: 200px;
        }
        .message-shared:hover {
          background: rgba(255, 255, 255, 0.06);
          transform: translateY(-2px);
        }
        .message-shared .shared-icon {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          background: rgba(192, 132, 252, 0.08);
          color: var(--kpop-violet);
          flex-shrink: 0;
        }
        .message-shared .shared-info {
          flex: 1;
          min-width: 0;
        }
        .message-shared .shared-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-primary);
        }
        .message-shared .shared-subtitle {
          font-size: 11px;
          color: var(--text-muted);
        }
        .message-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          margin-top: 2px;
        }
        .message-time {
          font-size: 10px;
          color: var(--text-dim);
          letter-spacing: 0.2px;
        }
        .message-status {
          font-size: 12px;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 4px;
        }
        .message-status .sent { color: var(--text-dim); }
        .message-status .read { color: #4CAF50; }
        .chat-messages {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          position: relative;
          scroll-behavior: smooth;
        }
        .chat-messages::-webkit-scrollbar {
          width: 4px;
        }
        .chat-messages::-webkit-scrollbar-track {
          background: transparent;
        }
        .chat-messages::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 100px;
        }
        .chat-input-area {
          display: flex;
          align-items: flex-end;
          gap: 6px;
          padding: 10px 16px;
          border-top: 1px solid var(--border-color);
          background: var(--bg-primary);
          flex-shrink: 0;
          min-height: 64px;
        }
        .message-input {
          flex: 1;
          padding: 8px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: 30px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          resize: none;
          max-height: 120px;
          font-family: inherit;
        }
        .message-input:focus {
          border-color: rgba(192, 132, 252, 0.15);
          background: rgba(192, 132, 252, 0.02);
        }
        .message-input::placeholder { color: var(--text-dim); }
        .send-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.04);
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .send-btn.active {
          background: var(--gradient-primary);
          color: #fff;
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.15);
        }
        .send-btn.active:hover { transform: scale(1.05); }
        .send-btn:disabled { opacity: 0.3; cursor: not-allowed; }
        .input-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: transparent;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          flex-shrink: 0;
        }
        .input-btn:hover {
          background: rgba(255, 255, 255, 0.04);
          color: var(--text-primary);
        }
        .scroll-to-bottom {
          position: absolute;
          bottom: 90px;
          right: 20px;
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--bg-card);
          border: 1px solid var(--border-color);
          color: var(--kpop-violet);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
          transition: all 0.3s ease;
          z-index: 10;
        }
        .scroll-to-bottom:hover {
          transform: scale(1.05);
          background: var(--kpop-violet);
          color: #fff;
        }
        .chat-search-bar {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 16px;
          background: var(--bg-card);
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
        }
        .chat-search-bar i {
          color: var(--text-dim);
          font-size: 14px;
        }
        .chat-search-bar input {
          flex: 1;
          padding: 6px 0;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
        }
        .chat-search-bar button {
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          font-size: 16px;
        }
        .chat-search-bar button:hover { color: var(--text-primary); }
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(12px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
          animation: fadeIn 0.25s ease;
        }
        .modal-content {
          background: var(--bg-card);
          border-radius: 20px;
          padding: 24px;
          max-width: 480px;
          width: 92%;
          max-height: 90vh;
          overflow-y: auto;
          border: 1px solid var(--border-color);
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          animation: slideUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 16px;
        }
        .modal-header h3 {
          font-size: 18px;
          font-weight: 700;
          color: var(--text-primary);
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 0;
        }
        .modal-close {
          background: none;
          border: none;
          color: var(--text-dim);
          font-size: 18px;
          cursor: pointer;
          transition: color 0.2s;
        }
        .modal-close:hover {
          color: var(--text-primary);
        }
        .modal-body {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .modal-input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .modal-input-group label {
          font-size: 12px;
          font-weight: 600;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .modal-input-group input,
        .modal-input-group textarea {
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          color: var(--text-primary);
          font-size: 14px;
          outline: none;
          font-family: inherit;
          transition: all 0.2s;
        }
        .modal-input-group input:focus,
        .modal-input-group textarea:focus {
          border-color: rgba(192, 132, 252, 0.2);
          box-shadow: 0 0 0 3px rgba(192, 132, 252, 0.04);
        }
        .modal-input-group textarea {
          resize: vertical;
          min-height: 60px;
        }
        .group-avatar-upload {
          width: 80px;
          height: 80px;
          border-radius: 50%;
          margin: 0 auto 8px;
          cursor: pointer;
          overflow: hidden;
          border: 2px solid rgba(192, 132, 252, 0.15);
          transition: all 0.2s;
          background: rgba(255, 255, 255, 0.02);
        }
        .group-avatar-upload:hover {
          border-color: rgba(192, 132, 252, 0.3);
          transform: scale(1.02);
        }
        .group-avatar-upload img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .group-avatar-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          color: var(--text-dim);
          gap: 4px;
          background: rgba(255, 255, 255, 0.02);
        }
        .group-avatar-placeholder i {
          font-size: 24px;
        }
        .group-avatar-placeholder span {
          font-size: 10px;
        }
        .member-search {
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0 12px;
          transition: all 0.2s;
        }
        .member-search:focus-within {
          border-color: rgba(192, 132, 252, 0.2);
        }
        .member-search i {
          color: var(--text-dim);
          font-size: 14px;
        }
        .member-search input {
          flex: 1;
          padding: 8px 10px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
        }
        .member-search input::placeholder {
          color: var(--text-dim);
        }
        .selected-members {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          padding: 4px 0;
        }
        .selected-member {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px 4px 6px;
          background: rgba(192, 132, 252, 0.08);
          border: 1px solid rgba(192, 132, 252, 0.06);
          border-radius: 30px;
        }
        .selected-member img {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          object-fit: cover;
        }
        .selected-member span {
          font-size: 12px;
          color: var(--text-primary);
        }
        .selected-member button {
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          padding: 0 2px;
          font-size: 10px;
        }
        .selected-member button:hover {
          color: #EF4444;
        }
        .member-suggestions {
          max-height: 180px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .member-suggestions::-webkit-scrollbar {
          width: 3px;
        }
        .member-suggestions::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 100px;
        }
        .member-suggestion {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 8px 12px;
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.2s;
        }
        .member-suggestion:hover {
          background: rgba(255, 255, 255, 0.04);
        }
        .member-suggestion img {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          object-fit: cover;
        }
        .suggestion-info {
          flex: 1;
          min-width: 0;
        }
        .suggestion-name {
          display: block;
          font-size: 13px;
          font-weight: 500;
          color: var(--text-primary);
        }
        .suggestion-username {
          font-size: 11px;
          color: var(--text-dim);
        }
        .suggestion-add {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: rgba(192, 132, 252, 0.08);
          border: none;
          color: var(--kpop-violet);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .suggestion-add:hover {
          background: rgba(192, 132, 252, 0.15);
        }
        .modal-footer {
          display: flex;
          gap: 10px;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-color);
        }
        .modal-cancel {
          flex: 1;
          padding: 10px;
          border-radius: 10px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          color: var(--text-dim);
          cursor: pointer;
          font-size: 14px;
          font-weight: 500;
          font-family: inherit;
          transition: all 0.2s;
        }
        .modal-cancel:hover {
          background: rgba(255, 255, 255, 0.08);
        }
        .modal-submit {
          flex: 2;
          padding: 10px;
          border-radius: 10px;
          background: var(--gradient-primary);
          border: none;
          color: #FFFFFF;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .modal-submit:hover:not(:disabled) {
          transform: scale(1.02);
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.2);
        }
        .modal-submit:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .messages-left {
          width: 340px;
          min-width: 340px;
          height: 100%;
          background: var(--bg-card);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex-shrink: 0;
        }
        .messages-left-sticky {
          flex-shrink: 0;
          background: var(--bg-card);
          padding-bottom: 2px;
        }
        .messages-left-header {
          padding: 12px 16px 10px 16px;
          border-bottom: 1px solid var(--border-color);
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .search-container {
          flex: 1;
          display: flex;
          align-items: center;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid var(--border-color);
          border-radius: 30px;
          padding: 0 14px;
          transition: all 0.3s ease;
        }
        .search-container:focus-within {
          border-color: var(--kpop-violet);
          box-shadow: 0 0 0 3px rgba(192, 132, 252, 0.05);
        }
        .search-container i {
          color: var(--text-dim);
          font-size: 14px;
        }
        .search-container input {
          flex: 1;
          padding: 8px 10px;
          background: transparent;
          border: none;
          color: var(--text-primary);
          font-size: 13px;
          outline: none;
        }
        .search-container input::placeholder {
          color: var(--text-dim);
        }
        .search-clear-btn {
          background: none;
          border: none;
          color: var(--text-dim);
          cursor: pointer;
          padding: 4px;
          font-size: 14px;
        }
        .search-clear-btn:hover {
          color: var(--text-primary);
        }
        .new-chat-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--gradient-primary);
          border: none;
          color: #fff;
          font-size: 16px;
          cursor: pointer;
          transition: all 0.3s ease;
          flex-shrink: 0;
        }
        .new-chat-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 4px 20px rgba(192, 132, 252, 0.15);
        }
        .filter-tabs {
          display: flex;
          gap: 2px;
          padding: 8px 16px 10px 16px;
          border-bottom: 1px solid var(--border-color);
          flex-shrink: 0;
          background: var(--bg-card);
        }
        .filter-tab {
          padding: 4px 14px;
          border-radius: 30px;
          background: transparent;
          border: none;
          color: var(--text-dim);
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.3s ease;
        }
        .filter-tab:hover {
          color: var(--text-primary);
          background: rgba(255, 255, 255, 0.02);
        }
        .filter-tab.active {
          background: rgba(192, 132, 252, 0.08);
          color: var(--kpop-violet);
        }
        .conversation-list {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          padding: 4px 0 16px 0;
          scroll-behavior: smooth;
        }
        .conversation-list::-webkit-scrollbar {
          width: 4px;
        }
        .conversation-list::-webkit-scrollbar-track {
          background: transparent;
        }
        .conversation-list::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.06);
          border-radius: 100px;
        }
        .conversation-list::-webkit-scrollbar-thumb:hover {
          background: var(--kpop-violet);
        }
        @media (max-width: 768px) {
          .messages-left {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            min-width: 100%;
            height: 100%;
            z-index: 10;
            border-right: none;
            transform: translateX(0);
            transition: transform 0.3s ease;
          }
          .messages-left.hidden { transform: translateX(-100%); }
          .back-btn { display: flex; }
          .message-wrapper { max-width: 88%; }
          .chat-messages { padding: 12px; }
          .chat-input-area { padding: 8px 12px; }
          .drawer-content { --drawer-width: 100%; border-radius: 0; }
          .messages-center { width: 100%; }
        }
        @media (max-width: 480px) {
          .messages-left { min-width: 100%; }
          .chat-name { font-size: 14px; }
          .message-text { font-size: 13px; }
          .chat-input-area { gap: 4px; padding: 6px 8px; }
          .input-btn { width: 28px; height: 28px; font-size: 14px; }
          .send-btn { width: 32px; height: 32px; font-size: 14px; }
          .message-input { font-size: 13px; padding: 6px 10px; }
          .message-bubble { padding: 6px 12px; }
          .message-wrapper { max-width: 92%; }
          .message-text { font-size: 12px; }
          .message-bubble { padding: 6px 10px; }
          .message-image { max-width: 160px; }
        }
        body.light-mode .messages-left {
          background: var(--bg-card);
        }
        body.light-mode .search-container {
          background: rgba(0, 0, 0, 0.02);
        }
        body.light-mode .conversation-item:hover {
          background: rgba(0, 0, 0, 0.02);
        }
        body.light-mode .conversation-item.active {
          background: rgba(192, 132, 252, 0.04);
        }
        body.light-mode .message-wrapper.other .message-bubble {
          background: rgba(0, 0, 0, 0.02);
          border: 1px solid var(--border-color);
        }
        body.light-mode .message-wrapper.own .message-bubble {
          color: #FFFFFF;
        }
        body.light-mode .message-input {
          background: rgba(0, 0, 0, 0.02);
        }
        body.light-mode .message-input::placeholder {
          color: rgba(0, 0, 0, 0.2);
        }
        body.light-mode .chat-header {
          background: var(--bg-primary);
        }
        body.light-mode .chat-messages {
          background: var(--bg-primary);
        }
        body.light-mode .chat-input-area {
          background: var(--bg-primary);
        }
        body.light-mode .status-dot {
          border-color: var(--bg-card);
        }
        body.light-mode .modal-content {
          background: var(--bg-card);
        }
        body.light-mode .modal-header h3 {
          color: var(--text-primary);
        }
        body.light-mode .modal-input-group input,
        body.light-mode .modal-input-group textarea {
          background: rgba(0, 0, 0, 0.02);
          border-color: var(--border-color);
          color: var(--text-primary);
        }
        body.light-mode .selected-member span {
          color: var(--text-primary);
        }
        body.light-mode .suggestion-name {
          color: var(--text-primary);
        }
        body.light-mode .modal-cancel {
          background: rgba(0, 0, 0, 0.02);
          border-color: var(--border-color);
          color: var(--text-dim);
        }
        body.light-mode .modal-cancel:hover {
          background: rgba(0, 0, 0, 0.04);
        }
        body.light-mode .no-conversations-premium span {
          color: var(--text-tertiary);
        }
        body.light-mode .no-conversations-hint {
          color: var(--text-dim);
        }
      `}</style>
    </div>
  );
};

export default Messages;