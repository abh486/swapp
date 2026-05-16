import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
  ImageBackground
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/apiClient';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch community workouts using the new backend route
      const response = await apiClient.get('/workouts/sessions/community');
      if (response.data && response.data.data) {
        setPosts(response.data.data);
      }
    } catch (error) {
      console.log('Failed to fetch community workouts, loading fallback data from local storage');
      // If backend is not yet updated or returned 403, try fallback from AsyncStorage
      try {
        const storedDataStr = await AsyncStorage.getItem('latestWorkoutData');
        if (storedDataStr) {
          const storedData = JSON.parse(storedDataStr);
          setPosts([
            {
              id: 'dummy-local',
              user: {
                firstName: 'You',
                lastName: '(Me)',
                avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
              },
              date: new Date().toISOString(),
              stats: {
                duration: storedData.duration || 1, // min
                volume: storedData.volume || 198,
                sets: storedData.exercises ? storedData.exercises.reduce((acc, ex) => acc + (ex.sets ? ex.sets.length : 0), 0) : 3
              },
              likes: 0,
              comments: 0,
              shares: 0,
              saves: 0,
              imageUrl: storedData.imageUrl || 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop'
            }
          ]);
        } else {
          // Default fallback if no local storage
          setPosts([
            {
              id: 'dummy-1',
              user: {
                firstName: 'Mike',
                lastName: 'Thomas',
                avatar: 'https://randomuser.me/api/portraits/men/32.jpg'
              },
              date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
              stats: {
                duration: 1, // min
                volume: 198,
                sets: 3
              },
              likes: 12400,
              comments: 238,
              shares: 512,
              saves: 1200,
              imageUrl: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop'
            }
          ]);
        }
      } catch (e) {
        console.error('Failed to load local fallback data', e);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const formatCount = (count) => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count;
  };

  const getTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  const PostItem = ({ item }) => {
    const isDummy = item.id === 'dummy-1';
    
    const duration = item.stats?.duration || (item.duration || 0);
    const volume = item.stats?.volume || 0;
    const sets = item.stats?.sets || 0;
    
    // Determine image URL
    // Try to get image from logs, else use fallback
    let imageSource = { uri: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1000&auto=format&fit=crop' }; // default fallback
    if (item.imageUrl) {
      imageSource = { uri: item.imageUrl };
    }

    return (
      <View style={styles.postContainer}>
        {/* Main Image Background */}
        <View style={styles.imageWrapper}>
          <ImageBackground
            source={imageSource}
            style={styles.backgroundImage}
            imageStyle={{ borderRadius: 16 }}
          >
            {/* Top Overlay - Stats */}
            <View style={styles.topOverlay}>
              <View style={styles.statItem}>
                <View style={styles.statIconPlaceholder} />
                <View>
                  <Text style={styles.statLabel}>DURATION</Text>
                  <Text style={styles.statValue}>{duration}min</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconPlaceholder} />
                <View>
                  <Text style={styles.statLabel}>VOLUME</Text>
                  <Text style={styles.statValue}>{volume} kg</Text>
                </View>
              </View>
              <View style={styles.statItem}>
                <View style={styles.statIconPlaceholder} />
                <View>
                  <Text style={styles.statLabel}>SETS</Text>
                  <Text style={styles.statValue}>{sets}</Text>
                </View>
              </View>
            </View>

            {/* Right Overlay - Actions */}
            <View style={styles.rightOverlay}>
              <TouchableOpacity style={styles.actionBtn}>
                <Icon name="heart" size={28} color="#FF3B30" />
                <Text style={styles.actionText}>{formatCount(item.likesCount || 0)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Icon name="chatbubble-outline" size={28} color="#FFF" />
                <Text style={styles.actionText}>{formatCount(item.commentsCount || 0)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Icon name="paper-plane-outline" size={28} color="#FFF" />
                <Text style={styles.actionText}>{formatCount(item.sharesCount || 0)}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionBtn}>
                <Icon name="bookmark-outline" size={28} color="#FFF" />
                <Text style={styles.actionText}>{formatCount(item.savesCount || 0)}</Text>
              </TouchableOpacity>
            </View>

            {/* Bottom Overlay - User Info & Caption */}
            <View style={styles.bottomOverlay}>
              <View style={styles.userInfoRow}>
                <Image 
                  source={{ uri: item.user?.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} 
                  style={styles.avatar} 
                />
                <View style={styles.userDetails}>
                  <View style={styles.nameRow}>
                    <Text style={styles.userName}>
                      {item.user?.firstName} {item.user?.lastName}
                    </Text>
                    <Icon name="checkmark-circle" size={14} color="#5E5CE6" style={styles.verifiedIcon} />
                  </View>
                  <Text style={styles.timeAgo}>{getTimeAgo(item.date)}</Text>
                </View>
                <TouchableOpacity style={styles.followBtn}>
                  <Text style={styles.followBtnText}>Follow</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.captionContainer}>
                <Text style={styles.captionText}>Write a caption...</Text>
              </View>
            </View>
          </ImageBackground>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Community</Text>
          <TouchableOpacity style={styles.followingDropdown}>
            <Text style={styles.followingText}>Following</Text>
            <Icon name="chevron-down" size={16} color="#5E5CE6" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Icon name="notifications-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#5E5CE6" />
          </View>
        ) : (
          <FlatList
            data={posts}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => <PostItem item={item} />}
            showsVerticalScrollIndicator={false}
            snapToInterval={screenHeight - 180} // Approximate height of the card + margins
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  followingDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followingText: {
    color: '#5E5CE6',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 4,
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 100, // Space for bottom tab
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postContainer: {
    height: screenHeight - 220, // Adjust based on header/tab height
    width: '100%',
    marginBottom: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  imageWrapper: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  topOverlay: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    paddingHorizontal: 10,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statIconPlaceholder: {
    width: 24,
    height: 24,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderRadius: 4,
  },
  statLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  statValue: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  rightOverlay: {
    position: 'absolute',
    right: 16,
    bottom: 120,
    alignItems: 'center',
  },
  actionBtn: {
    alignItems: 'center',
    marginBottom: 24,
  },
  actionText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    paddingRight: 80, // Keep text away from right actions
    backgroundColor: 'rgba(0,0,0,0.3)', // subtle gradient could be used here
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    backgroundColor: '#FFF',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 4,
  },
  verifiedIcon: {
    marginTop: 2,
  },
  timeAgo: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  followBtnText: {
    color: '#5E5CE6',
    fontSize: 12,
    fontWeight: '600',
  },
  captionContainer: {
    marginTop: 8,
  },
  captionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});

export default Community;