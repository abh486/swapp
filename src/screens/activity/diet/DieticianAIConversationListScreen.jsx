import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { getConversations } from '../../../services/aiDieticianService';
import { GlobalLoader } from '../../../components/GlobalLoader';

const { width } = Dimensions.get('window');

const DieticianAIConversationListScreen = () => {
  const navigation = useNavigation();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Refresh conversations every time screen focuses
    const unsubscribe = navigation.addListener('focus', () => {
      fetchConversations();
    });
    fetchConversations();
    return unsubscribe;
  }, [navigation]);

  const fetchConversations = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getConversations();
      // Ensure data is an array
      setConversations(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('[DieticianAIConversationListScreen] Error fetching conversations:', err);
      setError('Failed to load conversations. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStartNewChat = () => {
    navigation.navigate('DieticianAIChat', { conversationId: null });
  };

  const handleOpenConversation = (conversationId) => {
    navigation.navigate('DieticianAIChat', { conversationId });
  };

  const renderConversationItem = ({ item }) => {
    const date = new Date(item.updatedAt || item.createdAt);
    const dateString = date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleOpenConversation(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Icon name="chatbubbles" size={24} color="#9333EA" />
        </View>
        <View style={styles.conversationDetails}>
          <Text style={styles.conversationTitle} numberOfLines={1}>
            {item.title || 'Diet Consultation'}
          </Text>
          <Text style={styles.conversationDate}>{dateString}</Text>
        </View>
        <Icon name="chevron-forward" size={20} color="#6B7280" />
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Icon name="nutrition-outline" size={64} color="#374151" />
      <Text style={styles.emptyStateTitle}>No Conversations Yet</Text>
      <Text style={styles.emptyStateSubtext}>
        Start a new chat to get personalized nutrition advice and meal recommendations from your AI Dietician.
      </Text>
      <TouchableOpacity style={styles.newChatButtonLarge} onPress={handleStartNewChat}>
        <Text style={styles.newChatButtonText}>Start New Chat</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} activeOpacity={0.75}>
          <Icon name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Icon name="sparkles" size={18} color="#9333EA" style={styles.headerIcon} />
          <Text style={styles.headerTitle}>AI Dietician</Text>
        </View>
        {conversations.length > 0 ? (
          <TouchableOpacity onPress={handleStartNewChat} style={styles.newChatIconBtn}>
            <Icon name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 40 }} />
        )}
      </View>

      {/* Content */}
      {loading && conversations.length === 0 ? (
        <View style={styles.centerContainer}>
          <GlobalLoader size={60} text="Loading conversations..." />
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Icon name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchConversations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : conversations.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderConversationItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 24 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E1E1E',
    backgroundColor: '#111111',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 6,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  newChatIconBtn: {
    padding: 8,
    marginRight: -8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    color: '#9CA3AF',
    marginTop: 12,
    fontSize: 16,
  },
  errorText: {
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 20,
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 16,
  },
  listContent: {
    padding: 16,
    paddingBottom: 40,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(147, 51, 234, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  conversationDetails: {
    flex: 1,
  },
  conversationTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  conversationDate: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyStateTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
    marginTop: 24,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    color: '#9CA3AF',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  newChatButtonLarge: {
    backgroundColor: '#9333EA',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#9333EA',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  newChatButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default DieticianAIConversationListScreen;
