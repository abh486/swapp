
// src/components/ChatScreen.jsx
import { GlobalLoader } from '../../../../components/GlobalLoader';
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, KeyboardAvoidingView, Platform, TextInput, Image, Alert, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useDispatch } from 'react-redux';
import { getTrainerMessages, sendMessageToTrainer, initializeTrainerChat, endTrainerChat, sendMessageViaSocket } from '../../../../redux/actions/trainerActions';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getToken } from '../../../../api/apiClient';
import { useAuth } from '../../../../context/AuthContext';
import { Strings } from '../../../../config/config'; // Import Config

const { width: screenWidth } = Dimensions.get('window');

export const ChatScreen = ({ trainer, user, onBack, onClose, conversationId, token }) => {
  const dispatch = useDispatch();
  const { userProfile } = useAuth();
  const strings = Strings.ChatScreen;
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [currentToken, setCurrentToken] = useState(token);
  const [messageCallbackId, setMessageCallbackId] = useState(null);
  const flatListRef = useRef(null);

  const currentUser = user || userProfile;

  useEffect(() => {
    if (conversationId) {
      const setupChat = async () => {
        setLoading(true);
        try {
          let token = currentToken;
          if (!token) {
            token = await getToken();
            setCurrentToken(token);
          }
          
          if (!token) {
            setError(strings.auth.required);
            return;
          }

          await Promise.all([
            loadMessagesInternal(),
            initializeChatInternal(token)
          ]);
        } catch (error) {
          console.error('Setup error:', error);
        } finally {
          setLoading(false);
        }
      };

      setupChat();
    }

    return () => {
      if (conversationId && messageCallbackId) {
        dispatch(endTrainerChat(conversationId));
      }
    };
  }, [conversationId]);

  const loadMessages = async () => {
    setLoading(true);
    await loadMessagesInternal();
    setLoading(false);
  };

  const loadMessagesInternal = async () => {
    try {
      setError('');
      console.log('Loading messages for conversation:', conversationId);
      const fetchedMessages = await dispatch(getTrainerMessages(conversationId));
      console.log('Loaded messages:', fetchedMessages);
      
      if (fetchedMessages && Array.isArray(fetchedMessages)) {
        setMessages(fetchedMessages);
      } else {
        console.error('Invalid messages data received:', fetchedMessages);
        setError(strings.alerts.invalidData);
      }
    } catch (err) {
      console.error("Error loading messages:", err);
      
      if (err.response?.status === 401) {
        await AsyncStorage.removeItem('accessToken');
        setCurrentToken(null);
        setError(strings.auth.tokenNotFound);
      } else if (err.response?.status === 404) {
        setError(strings.alerts.notFound);
      } else if (err.response?.status >= 500) {
        setError(strings.alerts.serverError);
      } else {
        setError(`${strings.alerts.loadError}${err.message || 'Unknown error'}`);
      }
    }
  };

  const initializeChatInternal = async (token) => {
    try {
      setConnectionStatus('connecting');
      console.log('Initializing chat for conversation:', conversationId);
      await initializeTrainerChat(
        token, 
        conversationId, 
        handleNewMessage
      );
      setConnectionStatus('connected');
      console.log('Chat initialized successfully');
    } catch (err) {
      console.error("Error initializing chat:", err);
      setConnectionStatus('error');
      // Intentionally not setting a generic blocking error here. 
      // The app will silently fall back to HTTP if the socket fails.
    }
  };

  const handleNewMessage = (newMessage) => {
    console.log('Received new message via socket:', newMessage);
    
    if (!newMessage || !newMessage.id) {
      console.error('Invalid message object received:', newMessage);
      return;
    }
    
    setMessages(prevMessages => {
      const messageExists = prevMessages.some(msg => msg.id === newMessage.id);
      if (!messageExists) {
        return [...prevMessages, newMessage];
      }
      return prevMessages;
    });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    let tempMessage = null;

    try {
      setSending(true);
      const messageContent = newMessage.trim();
      
      tempMessage = {
        id: `temp-${Date.now()}`,
        content: messageContent,
        senderId: currentUser.id,
        sender: { email: currentUser.email },
        createdAt: new Date().toISOString(),
        pending: true
      };

      setMessages(prevMessages => [...prevMessages, tempMessage]);
      setNewMessage('');

      try {
        await sendMessageViaSocket(conversationId, messageContent);
        
        setTimeout(() => {
          setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
        }, 1000);
      } catch (socketError) {
        console.error('Socket send failed, falling back to HTTP:', socketError);
        
        const response = await dispatch(sendMessageToTrainer(conversationId, messageContent));
        
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === tempMessage.id 
              ? {
                  id: response.id || response._id,
                  content: response.content || response.text || response.message,
                  senderId: currentUser.id,
                  sender: { email: currentUser.email },
                  createdAt: response.createdAt || new Date().toISOString()
                }
              : msg
          )
        );
      }
      
    } catch (err) {
      console.error("Error sending message:", err);
      
      setMessages(prevMessages => prevMessages.filter(msg => msg.id !== tempMessage.id));
      
      if (err.response?.status === 401) {
        await AsyncStorage.removeItem('accessToken');
        setCurrentToken(null);
        setError(strings.auth.tokenExpired);
      } else {
        setError(strings.alerts.sendError);
      }
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }) => {
    const isUserMessage = item.senderId === currentUser.id;
    const messageStyle = isUserMessage ? styles.userMessage : styles.trainerMessage;
    const textStyle = isUserMessage ? styles.userMessageText : styles.trainerMessageText;
    const timeStyle = isUserMessage ? styles.userMessageTime : styles.trainerMessageTime;

    return (
      <View style={[styles.messageBubble, messageStyle, item.pending && styles.pendingMessage]}>
        <Text style={[styles.messageText, textStyle]}>{item.content}</Text>
        <View style={styles.messageFooter}>
          <Text style={[styles.messageTime, timeStyle]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
          {isUserMessage && (
            <Icon 
              name={item.pending ? "time" : "checkmark-done"} 
              size={14} 
              color={item.pending ? "#888" : "#4CAF50"} 
              style={styles.readReceipt}
            />
          )}
        </View>
      </View>
    );
  };

  const renderConnectionStatus = () => {
    if (connectionStatus === 'connected') return null;
    
    return (
      <View style={styles.connectionStatus}>
        <Icon 
          name={connectionStatus === 'connecting' ? "sync" : "alert-circle"} 
          size={16} 
          color="#ff9800" 
        />
        <Text style={styles.connectionStatusText}>
          {connectionStatus === 'connecting' ? strings.status.connecting : strings.status.error}
        </Text>
      </View>
    );
  };

  const handleLoginRedirect = () => {
    Alert.alert(
      strings.auth.required,
      strings.auth.requiredMsg,
      [
        { text: strings.actions.close, style: "cancel" },
        { text: strings.auth.loginBtn, onPress: () => onClose() }
      ]
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.chatContainer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.chatHeader}>
        <Image source={{ uri: trainer.gallery?.[0] || 'https://via.placeholder.com/150' }} style={[styles.chatAvatar, { marginLeft: 0 }]} />
        <View style={styles.chatHeaderInfo}>
          <Text style={styles.chatHeaderName}>{trainer.user?.email.split('@')[0] || 'Trainer'}</Text>
          <View style={styles.statusContainer}>
            <View style={[styles.statusIndicator, styles.statusOnline]} />
            <Text style={styles.chatHeaderStatus}>{strings.header.online}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.closeChatButton} onPress={onClose}>
          <Icon name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>

      {!currentToken ? (
        <View style={styles.authRequiredContainer}>
          <Icon name="lock-closed" size={48} color="#ffffff" />
          <Text style={styles.authRequiredText}>{strings.emptyState.loginRequired}</Text>
          <Text style={styles.authRequiredSubtext}>{strings.emptyState.loginSubtext}</Text>
          <TouchableOpacity style={styles.loginButton} onPress={handleLoginRedirect}>
            <Text style={styles.loginButtonText}>{strings.auth.loginBtn}</Text>
          </TouchableOpacity>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <GlobalLoader size={60} />
          <Text style={styles.loadingText}>{strings.emptyState.loading}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadMessages}>
            <Text style={styles.retryButtonText}>{strings.actions.retry}</Text>
          </TouchableOpacity>
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyStateContainer}>
          <Icon name="chatbubble-ellipses-outline" size={48} color="#888" />
          <Text style={styles.emptyStateText}>{strings.emptyState.title}</Text>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item, index) => item.id || `message-${index}`}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.messageInputContainer}>
        <TextInput
          style={styles.messageInput}
          value={newMessage}
          onChangeText={setNewMessage}
          placeholder={strings.input.placeholder}
          placeholderTextColor="#888"
          multiline
          maxLength={500}
          editable={!!currentToken}
        />
        <TouchableOpacity 
          style={[styles.sendButton, sending && styles.disabledSendButton]} 
          onPress={handleSendMessage}
          disabled={sending || !newMessage.trim() || !currentToken}
        >
          {sending ? (
            <GlobalLoader size={30} />
          ) : (
            <Icon name="send" size={20} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  chatContainer: { 
    flex:1, 
    backgroundColor: '#000000' 
  },
  chatHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#111111', 
    paddingVertical: 15, 
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222'
  },
  backButton: { 
    padding: 5 
  },
  chatAvatar: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    marginLeft: 10 
  },
  chatHeaderInfo: { 
    flex:1, 
    marginLeft: 15 
  },
  chatHeaderName: { 
    color: '#ffffff', 
    fontSize: 18, 
    fontWeight: 'bold' 
  },
  statusContainer: { 
    flexDirection: 'row', 
    alignItems: 'center' 
  },
  statusIndicator: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginRight: 5 
  },
  statusOnline: { 
    backgroundColor: '#10B981' 
  },
  statusOffline: { 
    backgroundColor: '#6B7280' 
  },
  chatHeaderStatus: { 
    color: '#9CA3AF', 
    fontSize: 12 
  },
  closeChatButton: { 
    padding: 5 
  },
  authRequiredContainer: {
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  authRequiredText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 10
  },
  authRequiredSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 5,
    marginBottom: 20
  },
  loginButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8
  },
  loginButtonText: {
    color: '#ffffff',
    fontWeight: 'bold'
  },
  loadingContainer: { 
    flex:1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 20 
  },
  loadingText: { 
    color: '#ffffff', 
    marginTop: 10,
    fontSize: 14
  },
  errorContainer: { 
    flex:1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20 
  },
  errorText: { 
    color: '#EF4444', 
    textAlign: 'center', 
    marginVertical: 10,
    fontSize: 14
  },
  retryButton: { 
    backgroundColor: '#9333EA', 
    paddingVertical: 10, 
    paddingHorizontal: 20, 
    borderRadius: 8, 
    marginTop: 10 
  },
  retryButtonText: { 
    color: '#ffffff', 
    fontWeight: 'bold' 
  },
  emptyStateContainer: { 
    flex:1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingVertical: 40 
  },
  emptyStateText: { 
    color: '#9CA3AF', 
    marginTop: 10,
    fontSize: 14
  },
  messagesContent: { 
    flex:1, 
    padding: 10,
    paddingBottom: 20
  },
  messageBubble: { 
    maxWidth: '80%', 
    padding: 12, 
    borderRadius: 18, 
    marginVertical: 5,
  },
  userMessage: { 
    backgroundColor: '#9333EA', 
    alignSelf: 'flex-end', 
    borderBottomRightRadius: 5 
  },
  trainerMessage: { 
    backgroundColor: '#1E1E1E', 
    alignSelf: 'flex-start', 
    borderBottomLeftRadius: 5 
  },
  pendingMessage: { 
    opacity: 0.7 
  },
  messageText: { 
    fontSize: 16, 
    lineHeight: 20 
  },
  userMessageText: { 
    color: '#ffffff' 
  },
  trainerMessageText: { 
    color: '#ffffff' 
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4
  },
  messageTime: { 
    fontSize: 10, 
    color: '#9CA3AF',
    marginRight: 5
  },
  userMessageTime: { 
    color: 'rgba(255,255,255,0.7)' 
  },
  trainerMessageTime: { 
    color: '#9CA3AF' 
  },
  sendingMessage: { 
    backgroundColor: '#9333EA', 
    alignSelf: 'flex-end', 
    borderBottomRightRadius: 5,
    opacity: 0.7 
  },
  readReceipt: {
    marginLeft: 5
  },
  connectionStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.05)'
  },
  connectionStatusText: {
    color: '#F59E0B',
    fontSize: 12,
    marginLeft: 5
  },
  messageInputContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 16, 
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#222222'
  },
  messageInput: { 
    flex:1, 
    backgroundColor: '#1E1E1E', 
    color: '#ffffff', 
    borderRadius: 20, 
    paddingHorizontal: 15, 
    paddingVertical: 10, 
    marginRight: 10,
    maxHeight: 100
  },
  sendButton: { 
    backgroundColor: '#9333EA', 
    width: 40, 
    height: 40, 
    borderRadius: 20,
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  disabledSendButton: {
    backgroundColor: '#374151',
  }
});