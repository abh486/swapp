import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  ActivityIndicator,
  StatusBar,
  Alert
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/apiClient';
import { GlobalLoader } from '../../components/GlobalLoader';

const LikesListScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { sessionId } = route.params || {};

  const [loading, setLoading] = useState(true);
  const [likes, setLikes] = useState([]);

  useEffect(() => {
    fetchSessionLikes();
  }, [sessionId]);

  const fetchSessionLikes = async () => {
    setLoading(true);
    try {
      if (!sessionId) {
        Alert.alert('Error', 'Session ID is missing');
        navigation.goBack();
        return;
      }
      const response = await apiClient.get(`/workouts/sessions/${sessionId}/likes`);
      if (response.data && response.data.success) {
        setLikes(response.data.data || []);
      } else {
        throw new Error(response.data?.message || 'Failed to fetch likes');
      }
    } catch (error) {
      console.error('Error fetching session likes:', error);
      Alert.alert('Error', 'Could not retrieve list of likes.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const getDisplayName = user => {
    const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
    return name || user?.name || user?.username || '';
  };

  const getInitials = user => {
    const displayName = getDisplayName(user);
    return displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part.charAt(0).toUpperCase())
      .join('');
  };

  const renderItem = ({ item }) => {
    const initials = getInitials(item);
    const displayName = getDisplayName(item);

    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.8}
        onPress={() => navigation.navigate('UserProfile', { userId: item.id, user: item })}
      >
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.initialsAvatar]}>
            <Text style={styles.initialsText}>{initials}</Text>
          </View>
        )}
        <View style={styles.userDetails}>
          <Text style={styles.userName}>{displayName}</Text>
          {item.username ? (
            <Text style={styles.userSubName}>@{item.username}</Text>
          ) : null}
        </View>
        <Icon name="chevron-forward" size={16} color="#444" />
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Likes</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <GlobalLoader size={60} />
        </View>
      ) : (
        <FlatList
          data={likes}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No likes on this post yet.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingVertical: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  initialsAvatar: {
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userDetails: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  userSubName: {
    color: '#8E8E93',
    fontSize: 12,
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 80,
  },
  emptyText: {
    color: '#666',
    fontSize: 14,
  },
});

export default LikesListScreen;
