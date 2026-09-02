import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getConversationMessages, sendDieticianMessage } from '../../../services/aiDieticianService';

export const DieticianAIChatScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const flatListRef = useRef(null);

  // route.params.conversationId can be null for a new chat
  const [conversationId, setConversationId] = useState(route.params?.conversationId || null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [thinkingMessage, setThinkingMessage] = useState('AI is thinking...');

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;
  const isBackendProcessing = lastMessage && lastMessage.role === 'user' && !lastMessage.pending && (Date.now() - new Date(lastMessage.createdAt).getTime() < 130000);
  const isInputDisabled = sending || isBackendProcessing;
  const isSendDisabled = !newMessage.trim() || isInputDisabled;

  useEffect(() => {
    let interval;
    if (sending || isBackendProcessing) {
      const msgs = [
        'AI is thinking...',
        'Analyzing your profile...',
        'Reviewing past meals...',
        'Drafting advice...'
      ];
      let i = 0;
      setThinkingMessage(msgs[0]);
      interval = setInterval(() => {
        i = (i + 1) % msgs.length;
        setThinkingMessage(msgs[i]);
      }, 3000);
    } else {
      setThinkingMessage('AI is thinking...');
    }
    return () => clearInterval(interval);
  }, [sending, isBackendProcessing]);

  useEffect(() => {
    if (conversationId) {
      loadMessages();
    }
  }, [conversationId]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConversationMessages(conversationId);
      const msgList = Array.isArray(data) ? data : (data?.messages || []);
      setMessages(msgList);
      // Scroll to bottom after load
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 300);
    } catch (err) {
      console.error('[DieticianAIChatScreen] Error loading messages:', err);
      setError('Failed to load conversation history.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (isSendDisabled) return;

    const messageContent = newMessage.trim();
    setNewMessage('');
    setError(null);

    // Optimistically add user message
    const tempMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: messageContent,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      setSending(true);
      const response = await sendDieticianMessage(conversationId, messageContent);
      
      const targetConvId = response?.conversationId || response?.data?.conversationId || conversationId;
      if (targetConvId && !conversationId) {
        setConversationId(targetConvId);
      }

      if (targetConvId) {
        const data = await getConversationMessages(targetConvId);
        const msgList = Array.isArray(data) ? data : (data?.messages || []);
        if (msgList.length > 0) {
          setMessages(msgList);
        } else if (response?.message || response?.data?.message) {
          const assistantReply = response?.message || response?.data?.message;
          setMessages((prev) => [
            ...prev.map((m) => (m.id === tempMessage.id ? { ...m, pending: false } : m)),
            {
              id: `assistant-${Date.now()}`,
              role: 'assistant',
              content: typeof assistantReply === 'string' ? assistantReply : assistantReply?.content || '',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch (err) {
      console.error('[DieticianAIChatScreen] Error sending message:', err);
      // Remove the optimistic message on failure
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id));

      if (err?.response?.status === 429 || err?.status === 429 || err?.message?.includes('429')) {
        // AI is still processing. Don't clear the input text. Restore it from the tempMessage.
        setNewMessage(tempMessage.content);
        setError('The AI is still processing your previous message. Please wait a moment.');
      } else {
        if (err?.response?.status === 403 || err?.status === 403 || err?.message?.includes('not found')) {
          setConversationId(null);
        }
        setError('Failed to send message. Please check your connection and try again.');
      }
    } finally {
      setSending(false);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 300);
    }
  };

  const renderMessage = ({ item }) => {
    const isUser = item.role === 'user';
    
    // Parse time
    const date = new Date(item.createdAt);
    const timeString = isNaN(date.getTime()) ? '' : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

    return (
      <View style={[styles.messageWrapper, isUser ? styles.messageWrapperUser : styles.messageWrapperAssistant]}>
        {!isUser && (
          <View style={styles.assistantAvatar}>
            <Icon name="sparkles" size={16} color="#FFF" />
          </View>
        )}
        <View style={[styles.messageBubble, isUser ? styles.userMessage : styles.assistantMessage, item.pending && styles.pendingMessage]}>
          <Text style={[styles.messageText, isUser ? styles.userMessageText : styles.assistantMessageText]}>
            {item.content || item.message}
          </Text>
          <View style={styles.messageFooter}>
            <Text style={[styles.messageTime, isUser ? styles.userMessageTime : styles.assistantMessageTime]}>
              {timeString}
            </Text>
            {isUser && item.pending && (
              <Icon name="time-outline" size={12} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
            )}
            {isUser && !item.pending && (
              <Icon name="checkmark-done" size={14} color="rgba(255,255,255,0.7)" style={{ marginLeft: 4 }} />
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <View style={styles.headerIconContainer}>
            <Icon name="sparkles" size={18} color="#9333EA" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AI Dietician</Text>
            <Text style={styles.headerSubtitle}>Powered by NutriAI</Text>
          </View>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Icon name="alert-circle" size={20} color="#FFF" />
          <Text style={styles.errorBannerText}>{error}</Text>
          <TouchableOpacity onPress={() => setError(null)}>
            <Icon name="close" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      )}

      {/* Messages */}
      <KeyboardAvoidingView 
        style={styles.keyboardAvoid} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading && !sending ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#9333EA" />
          </View>
        ) : messages.length === 0 && !loading && !sending ? (
          <View style={styles.emptyStateContainer}>
            <Icon name="chatbubble-ellipses-outline" size={48} color="#374151" />
            <Text style={styles.emptyStateText}>Ask me about your diet, meals, or nutrition goals!</Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item, index) => item.id?.toString() || index.toString()}
            contentContainerStyle={styles.messagesContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {/* Thinking Indicator */}
        {(sending || isBackendProcessing) && (
          <View style={styles.thinkingContainer}>
            <ActivityIndicator size="small" color="#9333EA" style={{ marginRight: 8 }} />
            <Text style={styles.thinkingText}>{thinkingMessage}</Text>
          </View>
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Type your message..."
            placeholderTextColor="#888"
            multiline
            maxLength={1000}
            editable={!isInputDisabled}
          />
          <TouchableOpacity 
            style={[styles.sendButton, isSendDisabled && styles.sendButtonDisabled]} 
            onPress={handleSendMessage}
            disabled={isSendDisabled}
          >
            <Icon name="send" size={20} color={!isSendDisabled ? "#FFF" : "#888"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  headerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: '#9CA3AF',
    fontSize: 12,
  },
  errorBanner: {
    backgroundColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  errorBannerText: {
    color: '#FFF',
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  keyboardAvoid: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    color: '#9CA3AF',
    marginTop: 16,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 24,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  messageWrapperUser: {
    justifyContent: 'flex-end',
  },
  messageWrapperAssistant: {
    justifyContent: 'flex-start',
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: '#9333EA',
    borderBottomRightRadius: 4,
  },
  assistantMessage: {
    backgroundColor: '#1E1E1E',
    borderBottomLeftRadius: 4,
  },
  pendingMessage: {
    opacity: 0.7,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  assistantMessageText: {
    color: '#E5E7EB',
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 6,
  },
  messageTime: {
    fontSize: 11,
  },
  userMessageTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  assistantMessageTime: {
    color: '#9CA3AF',
  },
  thinkingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  thinkingText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontStyle: 'italic',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#111111',
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  textInput: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    color: '#FFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    maxHeight: 120,
    fontSize: 15,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#9333EA',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  sendButtonDisabled: {
    backgroundColor: '#374151',
  },
});

export default DieticianAIChatScreen;
