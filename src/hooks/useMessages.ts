// ========== src/hooks/useMessages.ts ==========
import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getUserConversations,
  getMessages,
  sendMessage,
  addReaction,
  getOrCreateConversation,
  createGroup,
  togglePin,
  toggleFavorite,
  toggleArchive,
  deleteMessage,
  deleteConversation,
  updateOnlineStatus,
  listenUserStatus,
  getUserData,
  searchUsers,
  type Conversation,
  type Message,
  type UserData,
} from '../services/messageService';
import { useNavigate } from 'react-router-dom';

export const useMessages = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [userStatus, setUserStatus] = useState<{ [key: string]: { online: boolean; lastSeen: number } }>({});
  const messagesUnsubscribeRef = useRef<(() => void) | null>(null);
  const statusUnsubscribesRef = useRef<(() => void)[]>([]);

  // ============================================================
  // CHARGER LES CONVERSATIONS
  // ============================================================
  useEffect(() => {
    if (!user) {
      setConversations([]);
      return;
    }
    
    const loadConversations = async () => {
      try {
        console.log('🔍 Chargement des conversations...');
        const convs = await getUserConversations();
        console.log('✅ Conversations chargées:', convs.length);
        setConversations(convs);
        setLoadingError(null);
      } catch (error) {
        console.error('❌ Error loading conversations:', error);
        setConversations([]);
        setLoadingError('Impossible de charger les conversations');
      }
    };
    
    loadConversations();
    
    return () => {};
  }, [user]);

  // ============================================================
  // CHARGER LES MESSAGES D'UNE CONVERSATION
  // ============================================================
  useEffect(() => {
    if (messagesUnsubscribeRef.current) {
      messagesUnsubscribeRef.current();
      messagesUnsubscribeRef.current = null;
    }

    if (!selectedConversationId) {
      setMessages([]);
      return;
    }

    const unsubscribe = getMessages(selectedConversationId, (msgs) => {
      setMessages(msgs);
    });

    messagesUnsubscribeRef.current = unsubscribe;
    
    return () => {
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
        messagesUnsubscribeRef.current = null;
      }
    };
  }, [selectedConversationId]);

  // ============================================================
  // ÉCOUTER LE STATUT DES UTILISATEURS
  // ============================================================
  useEffect(() => {
    statusUnsubscribesRef.current.forEach(unsub => unsub());
    statusUnsubscribesRef.current = [];

    if (!user || conversations.length === 0) return;

    conversations.forEach(conv => {
      conv.participants.forEach(participantId => {
        if (participantId !== user.id) {
          const unsubscribe = listenUserStatus(participantId, (online, lastSeen) => {
            setUserStatus(prev => ({
              ...prev,
              [participantId]: { online, lastSeen }
            }));
          });
          statusUnsubscribesRef.current.push(unsubscribe);
        }
      });
    });

    return () => {
      statusUnsubscribesRef.current.forEach(unsub => unsub());
      statusUnsubscribesRef.current = [];
    };
  }, [conversations, user]);

  // ============================================================
  // UPDATE ONLINE STATUS
  // ============================================================
  useEffect(() => {
    if (!user) return;
    
    const updateStatus = async () => {
      await updateOnlineStatus(true);
    };
    updateStatus();
    
    const handleBeforeUnload = () => {
      updateOnlineStatus(false);
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      updateOnlineStatus(false);
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [user]);

  // ============================================================
  // SELECTIONNER UNE CONVERSATION
  // ============================================================
  const selectConversation = useCallback((id: string) => {
    console.log('🔍 selectConversation:', id);
    setSelectedConversationId(id);
  }, []);

  // ============================================================
  // COMMENCER UNE CONVERSATION - VAOVAO
  // ============================================================
  const startConversation = useCallback(async (userId: string) => {
    if (!user) return null;
    
    try {
      console.log(`🔍 startConversation: ${userId}`);
      const convId = await getOrCreateConversation(userId);
      console.log(`✅ Conversation créée: ${convId}`);
      
      // ✅ Mamerina ny conversations
      const convs = await getUserConversations();
      setConversations(convs);
      
      return convId;
    } catch (error) {
      console.error('❌ Error starting conversation:', error);
      return null;
    }
  }, [user]);

  // ============================================================
  // ENVOYER UN MESSAGE
  // ============================================================
  const sendMessageTo = useCallback(async (conversationId: string, text: string, type: string = 'text', mediaUrl?: string, sharePreview?: any) => {
    setSending(true);
    try {
      await sendMessage(conversationId, { text, type, mediaUrl, sharePreview });
      
      const convs = await getUserConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }, []);

  // ============================================================
  // REAGIR A UN MESSAGE
  // ============================================================
  const reactToMessage = useCallback(async (conversationId: string, messageId: string, emoji: string) => {
    try {
      await addReaction(conversationId, messageId, emoji);
    } catch (error) {
      console.error('Error reacting to message:', error);
    }
  }, []);

  // ============================================================
  // CREER UN GROUPE
  // ============================================================
  const createNewGroup = useCallback(async (name: string, members: string[], avatar?: string) => {
    try {
      const groupId = await createGroup(name, members, avatar);
      setSelectedConversationId(groupId);
      
      const convs = await getUserConversations();
      setConversations(convs);
      
      return groupId;
    } catch (error) {
      console.error('Error creating group:', error);
      return null;
    }
  }, []);

  // ============================================================
  // TOGGLE CONVERSATION
  // ============================================================
  const toggleConversationPin = useCallback(async (id: string) => {
    try {
      await togglePin(id);
      const convs = await getUserConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error toggling pin:', error);
    }
  }, []);

  const toggleConversationFavorite = useCallback(async (id: string) => {
    try {
      await toggleFavorite(id);
      const convs = await getUserConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  }, []);

  const toggleConversationArchive = useCallback(async (id: string) => {
    try {
      await toggleArchive(id);
      const convs = await getUserConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error toggling archive:', error);
    }
  }, []);

  // ============================================================
  // SUPPRIMER
  // ============================================================
  const deleteMessageFrom = useCallback(async (conversationId: string, messageId: string) => {
    try {
      await deleteMessage(conversationId, messageId);
    } catch (error) {
      console.error('Error deleting message:', error);
    }
  }, []);

  const deleteConversationFrom = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
      if (selectedConversationId === id) {
        setSelectedConversationId(null);
      }
      const convs = await getUserConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error deleting conversation:', error);
    }
  }, [selectedConversationId]);

  // ============================================================
  // GET USER STATUS
  // ============================================================
  const getUserStatus = useCallback((userId: string) => {
    return userStatus[userId] || { online: false, lastSeen: Date.now() };
  }, [userStatus]);

  const formatLastSeen = useCallback((lastSeen: number) => {
    const diff = Date.now() - lastSeen;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'À l\'instant';
    if (minutes < 60) return `Il y a ${minutes}m`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days}j`;
    return `Le ${new Date(lastSeen).toLocaleDateString()}`;
  }, []);

  // ============================================================
  // REFRESH CONVERSATIONS
  // ============================================================
  const refreshConversations = useCallback(async () => {
    if (!user) return;
    try {
      const convs = await getUserConversations();
      setConversations(convs);
    } catch (error) {
      console.error('Error refreshing conversations:', error);
    }
  }, [user]);

  return {
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
    refreshConversations,
  };
};

export default useMessages;