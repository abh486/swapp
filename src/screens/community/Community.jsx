import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, SafeAreaView, FlatList, Image, TextInput, ScrollView, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from '@react-navigation/native';

const { height: screenHeight } = Dimensions.get('window');

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

const getShortTimeAgo = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInMins = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInMs / (1000 * 60 * 60 * 24 * 7));

  if (diffInMins < 1) return 'now';
  if (diffInMins < 60) return `${diffInMins}m`;
  if (diffInHours < 24) return `${diffInHours}h`;
  if (diffInDays < 7) return `${diffInDays}d`;
  return `${diffInWeeks || 1}w`;
};

const getFormattedDate = dateString => {
  if (!dateString) return '';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return '';

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${weekday}, ${month} ${day}, ${year}`;
};

const formatDuration = value => {
  if (!value) return '0s';
  const str = String(value).trim().toLowerCase();

  // If it's already pre-formatted with time unit strings, return as is
  if (str.includes('min') || str.includes('h') || str.includes('m') || str.includes('s')) {
    return str;
  }

  // Otherwise, treat as seconds and format cleanly
  const totalSecs = parseInt(str) || 0;
  if (totalSecs <= 0) return '0s';

  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  if (h > 0) {
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }
  if (m > 0) {
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${s}s`;
};

const formatVolume = vol => {
  if (!vol) return '0 kg';
  const formatted = parseFloat(vol).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
  return `${formatted} kg`;
};

// --- PostItem component ---
const PostItem = ({
  item,
  onToggleLike,
  onToggleFollow,
  onOpenComments,
  onToggleCommentLike,
  loggedInUserAvatar,
  loggedInUserInitials,
  onPressUser,
  onPressLikes,
  onPress,
  onShowOptions,
  listHeight,
}) => {
  const [currentMediaSlide, setCurrentMediaSlide] = useState(0);
  const duration = item.stats?.duration || item.duration || 0;
  const volume = item.stats?.volume || 0;
  const sets = item.stats?.sets || 0;
  const likesCount = item.likesCount ?? item.likes ?? 0;
  const commentsCount = item.commentsCount ?? item.comments ?? 0;
  const userName = getDisplayName(item.user);
  const userInitials = getInitials(item.user);
  const caption = item.caption || item.description || item.notes;
  const imageUrl = item.imageUrl || item.image || item.mediaUrl;
  const isLiked = Boolean(
    item.isLiked || item.likedByMe || item.hasLiked || item.userLiked,
  );

  const formattedDate = getFormattedDate(item.date || item.createdAt);
  const workoutTitle = item.workoutName || item.workoutType || 'Workout';

  return (
    <TouchableOpacity
      activeOpacity={0.95}
      onPress={() => onPress && onPress(item)}
      style={[styles.postContainer, { height: listHeight }]}
    >
      {/* 1. Header (User Info & Date) */}
      <View style={styles.postHeader}>
        <TouchableOpacity onPress={() => onPressUser && onPressUser(item.userId || item.user?.id, item.user)} activeOpacity={0.8}>
          {item.user?.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={styles.postAvatar} />
          ) : (
            <View style={[styles.postAvatar, styles.initialsAvatar]}>
              <Text style={styles.initialsText}>{userInitials}</Text>
            </View>
          )}
        </TouchableOpacity>
        <View style={styles.postHeaderDetails}>
          <View style={styles.postHeaderNameRow}>
            {userName ? (
              <TouchableOpacity onPress={() => onPressUser && onPressUser(item.userId || item.user?.id, item.user)} activeOpacity={0.8}>
                <Text style={styles.postUserName}>{userName}</Text>
              </TouchableOpacity>
            ) : null}
            {item.user?.isVerified ? (
              <Icon
                name="checkmark-circle"
                size={14}
                color="#5E5CE6"
                style={styles.verifiedIcon}
              />
            ) : null}
          </View>
          {formattedDate ? (
            <Text style={styles.postDateText}>{formattedDate}</Text>
          ) : null}
        </View>
        <TouchableOpacity onPress={() => onShowOptions && onShowOptions(item)} style={styles.postOptionsBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Icon name="ellipsis-horizontal" size={20} color="#AEAEB2" />
        </TouchableOpacity>
      </View>

      {/* 2. Workout Title */}
      <Text style={styles.postWorkoutTitle} numberOfLines={1}>{workoutTitle}</Text>

      {/* Caption (description/notes) right below Workout Title */}
      {caption ? (
        <View style={styles.captionContainer}>
          <Text style={styles.captionText} numberOfLines={2}>{caption}</Text>
        </View>
      ) : null}

      {/* 3. Workout Stats */}
      <View style={styles.postStatsRow}>
        <View style={styles.postStatItem}>
          <Text style={styles.postStatLabel}>Time</Text>
          <Text style={styles.postStatValue}>{formatDuration(duration)}</Text>
        </View>
        <View style={styles.postStatItem}>
          <Text style={styles.postStatLabel}>Volume</Text>
          <Text style={styles.postStatValue}>{formatVolume(volume)}</Text>
        </View>
        {item.stats?.records > 0 && (
          <View style={styles.postStatItem}>
            <Text style={styles.postStatLabel}>Records</Text>
            <Text style={styles.postStatValue}>🥇 {item.stats.records}</Text>
          </View>
        )}
      </View>

      {/* 4. Media Content (Image Card Carousel) */}
      {(() => {
        let imagesList = [];
        if (imageUrl) {
          try {
            if (imageUrl.startsWith('[')) {
              imagesList = JSON.parse(imageUrl);
            } else {
              imagesList = imageUrl.split(',').map(u => u.trim()).filter(Boolean);
            }
          } catch (e) {
            imagesList = [imageUrl];
          }
        }

        // Filter out null or empty strings
        imagesList = imagesList.filter(u => typeof u === 'string' && u.trim().length > 0);

        if (imagesList.length === 0) return null;
        const cardWidth = Dimensions.get('window').width - 32;

        return (
          <View style={[styles.postMediaContainer, { height: undefined, flex: 1, minHeight: 200, maxHeight: 420 }]}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onScroll={(event) => {
                const slide = Math.round(
                  event.nativeEvent.contentOffset.x /
                  event.nativeEvent.layoutMeasurement.width
                );
                if (slide !== currentMediaSlide) {
                  setCurrentMediaSlide(slide);
                }
              }}
              scrollEventThrottle={16}
              style={{ flex: 1 }}
            >
              {imagesList.map((uri, index) => (
                <TouchableOpacity
                  key={index}
                  activeOpacity={0.95}
                  onPress={() => onPress && onPress(item)}
                  style={{ width: cardWidth, height: '100%' }}
                >
                  <Image
                    source={{ uri }}
                    style={[styles.postMediaImage, { width: cardWidth, height: '100%' }]}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
            {/* Dots Indicator */}
            {imagesList.length > 1 && (
              <View style={styles.mediaDotsRow}>
                {imagesList.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.mediaDot,
                      index === currentMediaSlide && styles.mediaDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        );
      })()}

      {/* 6. Action Footer (Like, Comment, Share) */}
      <View style={styles.postActionsRow}>
        <View style={[styles.postActionButton, { gap: 4 }]}>
          <TouchableOpacity onPress={() => onToggleLike(item)}>
            <Feather
              name="thumbs-up"
              size={22}
              color={isLiked ? '#5E5CE6' : '#FFF'}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => onPressLikes && onPressLikes(item.id)}>
            <Text style={styles.postActionText}>{likesCount}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.postActionButton}
          onPress={() => onOpenComments(item)}
        >
          <Icon name="chatbubble-outline" size={22} color="#FFF" />
          <Text style={styles.postActionText}>{commentsCount}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.postActionButton}>
          <Icon name="share-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* 7. Inline Comments list preview (Max 2 comments) */}
      {item.comments && item.comments.length > 0 ? (
        <View style={{ marginTop: 4, marginBottom: 8 }}>
          {item.comments.slice(0, 2).map((comment, idx) => (
            <View key={comment.id || idx} style={styles.commentRow}>
              <TouchableOpacity onPress={() => onPressUser && onPressUser(comment.userId || comment.user?.id, comment.user)} activeOpacity={0.8}>
                {comment.user?.avatar ? (
                  <Image
                    source={{ uri: comment.user.avatar }}
                    style={styles.commentAvatar}
                  />
                ) : (
                  <View style={[styles.commentAvatar, styles.initialsAvatar]}>
                    <Text style={styles.commentInitialsText}>
                      {getInitials(comment.user)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.commentTextContainer}>
                <View style={styles.commentAuthorRow}>
                  <TouchableOpacity onPress={() => onPressUser && onPressUser(comment.userId || comment.user?.id, comment.user)} activeOpacity={0.8}>
                    <Text style={styles.commentName}>
                      {getDisplayName(comment.user)}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.commentTimeText}>
                    {getShortTimeAgo(comment.createdAt)}
                  </Text>
                </View>
                <Text style={styles.commentContent}>{comment.content}</Text>
              </View>
              <TouchableOpacity
                style={styles.commentLikeButton}
                onPress={() => onToggleCommentLike(item.id, comment.id)}
              >
                <Feather
                  name="thumbs-up"
                  size={14}
                  color={comment.isLiked ? '#5E5CE6' : '#8E8E93'}
                />
                <Text style={[styles.commentLikeCount, comment.isLiked && { color: '#5E5CE6' }]}>
                  {comment.likesCount ?? 0}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      ) : null}

      {/* 8. Inline Comment Input Footer (Tapping navigates to CommentsScreen) */}
      <TouchableOpacity
        style={styles.commentInputRow}
        activeOpacity={0.8}
        onPress={() => onOpenComments(item)}
      >
        {loggedInUserAvatar ? (
          <Image
            source={{ uri: loggedInUserAvatar }}
            style={styles.commentInputAvatar}
          />
        ) : (
          <View style={[styles.commentInputAvatar, styles.initialsAvatar]}>
            <Text style={styles.commentInputInitialsText}>{loggedInUserInitials}</Text>
          </View>
        )}
        <Text style={[styles.commentInput, { color: 'rgba(255,255,255,0.4)', paddingVertical: 12 }]}>
          Add a comment...
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const Community = ({ navigation }) => {
  const { user } = useAuth();
  const profileData = user?.userProfile || user?.memberProfile || user || {};
  const loggedInUserAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.profilePhoto ||
    profileData.avatar;
  const loggedInUserInitials = getInitials(profileData);

  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [listHeight, setListHeight] = useState(screenHeight - 180);

  const [blockedPostIds, setBlockedPostIds] = useState([]);
  const [blockedUserIds, setBlockedUserIds] = useState([]);
  const [activeTab, setActiveTab] = useState('explore');

  useEffect(() => {
    const loadBlocked = async () => {
      try {
        const postsBlocked = await AsyncStorage.getItem('blocked_post_ids');
        if (postsBlocked) setBlockedPostIds(JSON.parse(postsBlocked));
        const usersBlocked = await AsyncStorage.getItem('blocked_user_ids');
        if (usersBlocked) setBlockedUserIds(JSON.parse(usersBlocked));
      } catch (err) {
        console.warn('Failed to load blocked list:', err);
      }
    };
    loadBlocked();
  }, []);

  const handleLayout = (event) => {
    const { height } = event.nativeEvent.layout;
    if (height && height !== listHeight) {
      setListHeight(height);
    }
  };

  const listData = React.useMemo(() => {
    const filteredPosts = posts.filter(post => {
      const postUserId = post.user?.id || post.userId;
      const isBlocked = blockedUserIds.some(item => {
        if (typeof item === 'string') return item === postUserId;
        return item && item.id === postUserId;
      });
      return !blockedPostIds.includes(post.id) && !isBlocked;
    });

    if (filteredPosts.length === 0) return [];
    if (suggestedUsers.length === 0) return filteredPosts;
    // Insert a dummy item for suggestions at index 1
    const copy = [...filteredPosts];
    copy.splice(1, 0, { isSuggestionsItem: true, id: 'suggestions-standalone' });
    return copy;
  }, [posts, suggestedUsers, blockedPostIds, blockedUserIds]);

  const snapOffsets = React.useMemo(() => {
    const offsets = [];
    let currentOffset = 0;
    listData.forEach((item) => {
      offsets.push(currentOffset);
      if (item.isSuggestionsItem) {
        currentOffset += 250; // Height of suggestions row (no clipping)
      } else {
        currentOffset += listHeight; // Height of full screen post
      }
    });
    return offsets;
  }, [listData, listHeight]);

  const fetchSuggestions = async () => {
    try {
      const response = await apiClient.get('/users/suggestions');
      if (response.data && response.data.success) {
        setSuggestedUsers(response.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching suggested users:', error);
    }
  };

  const handleFollowSuggestion = async (suggestedUser) => {
    const isCurrentlyFollowing = Boolean(suggestedUser.isFollowing);
    setSuggestedUsers(current =>
      current.map(u => u.id === suggestedUser.id ? { ...u, isFollowing: !isCurrentlyFollowing } : u)
    );
    try {
      if (suggestedUser.isMock) {
        return;
      }
      await apiClient.post(`/users/follow/${suggestedUser.id}`);
    } catch (error) {
      console.error('Error following suggestion athlete:', error);
      setSuggestedUsers(current =>
        current.map(u => u.id === suggestedUser.id ? { ...u, isFollowing: isCurrentlyFollowing } : u)
      );
    }
  };

  const handleRemoveSuggestion = (userId) => {
    setSuggestedUsers(current => current.filter(u => u.id !== userId));
  };

  const fetchPosts = useCallback(async (tab = activeTab) => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await apiClient.get('/workouts/sessions/community', {
        params: { feedType: tab }
      });
      const communityPosts = Array.isArray(response.data?.data)
        ? response.data.data
        : [];
      const publicPosts = communityPosts.filter(
        post => post.visibility !== 'PRIVATE',
      );
      setPosts(publicPosts);
    } catch (error) {
      console.log(
        'Failed to fetch community workouts',
        error?.response?.data || error.message,
      );
      setPosts([]);
      setFetchError('Could not fetch community posts.');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchPosts(activeTab);
  }, [activeTab, fetchPosts]);

  useFocusEffect(
    useCallback(() => {
      fetchPosts(activeTab);
      fetchSuggestions();
    }, [fetchPosts, activeTab])
  );

  const updatePost = (postId, updater) => {
    setPosts(currentPosts =>
      currentPosts.map(post => (post.id === postId ? updater(post) : post)),
    );
  };

  const handleToggleLike = async post => {
    const wasLiked = Boolean(
      post.isLiked || post.likedByMe || post.hasLiked || post.userLiked,
    );
    const currentLikes = post.likesCount ?? post.likes ?? 0;
    const nextLikes = Math.max(currentLikes + (wasLiked ? -1 : 1), 0);

    updatePost(post.id, item => ({
      ...item,
      isLiked: !wasLiked,
      likesCount: nextLikes,
      likes: nextLikes,
    }));

    try {
      const response = await apiClient.post(
        `/workouts/sessions/${post.id}/like`,
      );
      const nextData = response.data?.data;
      if (nextData) {
        updatePost(post.id, item => ({
          ...item,
          isLiked: nextData.isLiked,
          likesCount: nextData.likesCount,
          likes: nextData.likesCount,
        }));
      }
    } catch (error) {
      updatePost(post.id, item => ({
        ...item,
        isLiked: wasLiked,
        likesCount: currentLikes,
      }));
    }
  };

  const handleToggleFollow = async post => {
    const targetUserId = post.user?.id || post.userId;
    if (post.isOwnPost) return;

    const wasFollowing = Boolean(post.isFollowing);
    if (!targetUserId) {
      updatePost(post.id, item => ({ ...item, isFollowing: !wasFollowing }));
      return;
    }

    setPosts(currentPosts =>
      currentPosts.map(item => {
        const itemUserId = item.user?.id || item.userId;
        return itemUserId === targetUserId
          ? { ...item, isFollowing: !wasFollowing }
          : item;
      }),
    );

    try {
      const response = await apiClient.post(`/users/follow/${targetUserId}`);
      const nextFollowing = response.data?.data?.isFollowing;
      if (typeof nextFollowing === 'boolean') {
        setPosts(currentPosts =>
          currentPosts.map(item => {
            const itemUserId = item.user?.id || item.userId;
            return itemUserId === targetUserId
              ? { ...item, isFollowing: nextFollowing }
              : item;
          }),
        );
      }
    } catch (error) {
      setPosts(currentPosts =>
        currentPosts.map(item => {
          const itemUserId = item.user?.id || item.userId;
          return itemUserId === targetUserId
            ? { ...item, isFollowing: wasFollowing }
            : item;
        }),
      );
    }
  };

  const openComments = post => {
    navigation.navigate('CommentsScreen', { post });
  };

  const handleToggleCommentLike = async (postId, commentId) => {
    updatePost(postId, item => ({
      ...item,
      comments: (item.comments || []).map(comment => {
        if (comment.id === commentId) {
          const isLikedNow = !comment.isLiked;
          const nextCount = Math.max((comment.likesCount || 0) + (isLikedNow ? 1 : -1), 0);
          return { ...comment, isLiked: isLikedNow, likesCount: nextCount };
        }
        return comment;
      })
    }));

    try {
      await apiClient.post(`/workouts/sessions/comments/${commentId}/like`);
    } catch (error) {
      updatePost(postId, item => ({
        ...item,
        comments: (item.comments || []).map(comment => {
          if (comment.id === commentId) {
            const isLikedNow = !comment.isLiked;
            const nextCount = Math.max((comment.likesCount || 0) + (isLikedNow ? 1 : -1), 0);
            return { ...comment, isLiked: isLikedNow, likesCount: nextCount };
          }
          return comment;
        })
      }));
    }
  };

  const handlePressUser = (userId, userObj) => {
    if (!userId) return;
    if (userId.startsWith && userId.startsWith('mock-')) {
      Alert.alert('Mock Profile', 'This is a demo athlete profile.');
      return;
    }
    navigation.navigate('UserProfile', { userId, user: userObj });
  };

  const handleShowPostOptions = (post) => {
    Alert.alert(
      'Workout Options',
      'Choose an action for this content.',
      [
        {
          text: 'Report Content',
          onPress: () => handleReportPost(post)
        },
        {
          text: 'Block User',
          onPress: () => handleBlockUser(post)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleReportPost = (post) => {
    Alert.alert(
      'Report Workout',
      'Why are you reporting this workout?',
      [
        {
          text: 'Spam or Scam',
          onPress: () => flagPost(post.id)
        },
        {
          text: 'Inappropriate Content',
          onPress: () => flagPost(post.id)
        },
        {
          text: 'Harassment or Abuse',
          onPress: () => flagPost(post.id)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const flagPost = async (postId) => {
    try {
      const newBlocked = [...blockedPostIds, postId];
      setBlockedPostIds(newBlocked);
      await AsyncStorage.setItem('blocked_post_ids', JSON.stringify(newBlocked));
      Alert.alert(
        'Content Flagged',
        'Thank you for reporting. This content has been hidden. Our team will review this user generated content within 24 hours.'
      );
    } catch (err) {
      console.warn('Failed to report post:', err);
    }
  };

  const handleBlockUser = (post) => {
    const targetUserId = post.user?.id || post.userId;
    const targetUserName = getDisplayName(post.user) || 'this user';
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${targetUserName}? You will no longer see their posts or comments.`,
      [
        {
          text: 'Block User',
          style: 'destructive',
          onPress: async () => {
            try {
              const userObj = { id: targetUserId, name: targetUserName };
              const filteredList = blockedUserIds.filter(item => {
                const itemId = typeof item === 'string' ? item : item?.id;
                return itemId !== targetUserId;
              });
              const newBlockedUsers = [...filteredList, userObj];
              setBlockedUserIds(newBlockedUsers);
              await AsyncStorage.setItem('blocked_user_ids', JSON.stringify(newBlockedUsers));
              Alert.alert('User Blocked', `${targetUserName} has been blocked successfully.`);
            } catch (err) {
              console.warn('Failed to block user:', err);
            }
          }
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const renderListHeader = () => {
    if (suggestedUsers.length === 0) return null;

    return (
      <View style={styles.suggestionsSection}>
        <View style={styles.suggestionsHeaderRow}>
          <Text style={styles.suggestionsHeaderTitle}>Suggested Athletes</Text>
          <TouchableOpacity style={styles.inviteFriendButton}>
            <Icon name="add" size={16} color="#007AFF" />
            <Text style={styles.inviteFriendText}>Invite a friend</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.suggestionsScrollContent}
        >
          {suggestedUsers.map((item) => (
            <View key={item.id} style={styles.suggestionCard}>
              {/* Close Button */}
              <TouchableOpacity
                style={styles.suggestionCloseBtn}
                onPress={() => handleRemoveSuggestion(item.id)}
              >
                <Icon name="close" size={16} color="#8E8E93" />
              </TouchableOpacity>

              {/* Avatar */}
              <TouchableOpacity
                onPress={() => handlePressUser(item.id, item)}
                activeOpacity={0.8}
              >
                {item.avatar ? (
                  <Image source={{ uri: item.avatar }} style={styles.suggestionAvatar} />
                ) : (
                  <View style={[styles.suggestionAvatar, styles.suggestionInitialsAvatar]}>
                    <Text style={styles.suggestionInitialsText}>
                      {getInitials(item)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>

              {/* Name */}
              <TouchableOpacity
                onPress={() => handlePressUser(item.id, item)}
                activeOpacity={0.8}
                style={{ width: '100%', alignItems: 'center' }}
              >
                <Text style={styles.suggestionName} numberOfLines={1}>
                  {item.name}
                </Text>
              </TouchableOpacity>

              {/* Subtitle */}
              <Text style={styles.suggestionSubtitle}>Featured</Text>

              {/* Follow Button */}
              <TouchableOpacity
                style={[
                  styles.suggestionFollowBtn,
                  item.isFollowing && styles.suggestionFollowingBtn
                ]}
                onPress={() => handleFollowSuggestion(item)}
              >
                <Text
                  style={[
                    styles.suggestionFollowBtnText,
                    item.isFollowing && styles.suggestionFollowingBtnText
                  ]}
                >
                  {item.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Screen Header with Tabs */}
      <View style={styles.screenHeader}>
        <TouchableOpacity
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('Home');
            }
          }}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Icon name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>

        <View style={styles.headerTabsContainer}>
          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'explore' && styles.headerTabActive]}
            onPress={() => setActiveTab('explore')}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerTabText, activeTab === 'explore' && styles.headerTabTextActive]}>
              Explore
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerTab, activeTab === 'friends' && styles.headerTabActive]}
            onPress={() => setActiveTab('friends')}
            activeOpacity={0.7}
          >
            <Text style={[styles.headerTabText, activeTab === 'friends' && styles.headerTabTextActive]}>
              Friends
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => navigation.navigate('NotificationScreen')}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <Icon name="notifications-outline" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>



      {/* Content */}
      <View style={styles.content} onLayout={handleLayout}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <GlobalLoader size={60} />
          </View>
        ) : (
          <FlatList
            data={listData}
            keyExtractor={item => item.id.toString()}
            decelerationRate="fast"
            snapToOffsets={snapOffsets}
            snapToAlignment="start"
            renderItem={({ item }) => {
              if (item.isSuggestionsItem) {
                return (
                  <View style={{ height: 250, justifyContent: 'center' }}>
                    {renderListHeader()}
                  </View>
                );
              }
              return (
                <View style={{ height: listHeight }}>
                  <PostItem
                    item={item}
                    onToggleLike={handleToggleLike}
                    onToggleFollow={handleToggleFollow}
                    onOpenComments={openComments}
                    onToggleCommentLike={handleToggleCommentLike}
                    loggedInUserAvatar={loggedInUserAvatar}
                    loggedInUserInitials={loggedInUserInitials}
                    onPressUser={handlePressUser}
                    onPressLikes={(sessionId) => navigation.navigate('LikesList', { sessionId })}
                    onPress={(postItem) => {
                      console.log('[Community] Tapping post:', postItem.id);
                      navigation.navigate('PostDetails', { post: postItem });
                    }}
                    onShowOptions={handleShowPostOptions}
                    listHeight={listHeight}
                  />
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {fetchError || 'No community posts yet.'}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.listContent, { paddingBottom: 0 }]}
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
    fontFamily: 'BRLNSR',
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
  emptyContainer: {
    minHeight: screenHeight - 220,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    textAlign: 'center',
  },
  postContainer: {
    width: '100%',
    paddingVertical: 16,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  postAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 10,
    backgroundColor: '#FFF',
  },
  postHeaderDetails: {
    flex: 1,
  },
  postHeaderNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postUserName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    marginRight: 4,
    fontFamily: 'BRLNSR',
  },
  postDateText: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  postWorkoutTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 6,
    marginBottom: 8,
    fontFamily: 'BRLNSR',
  },
  postStatsRow: {
    flexDirection: 'row',
    marginBottom: 10,
    gap: 32,
  },
  postStatItem: {
    alignItems: 'flex-start',
  },
  postStatLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 3,
  },
  postStatValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  postMediaContainer: {
    width: '100%',
    height: 380,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#1C1C1E',
    marginBottom: 12,
  },
  postMediaImage: {
    width: '100%',
    height: '100%',
  },
  postMediaPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mediaDotsRow: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  mediaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  mediaDotActive: {
    backgroundColor: '#5E5CE6',
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 20,
    marginBottom: 10,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  initialsAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  initialsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  verifiedIcon: {
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  followBtnText: {
    color: '#5E5CE6',
    fontSize: 12,
    fontWeight: '600',
  },
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.45)',
  },
  followingBtnText: {
    color: '#FFF',
  },
  captionContainer: {
    marginTop: 8,
    marginBottom: 12,
  },
  captionText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingRight: 6,
  },
  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    backgroundColor: '#333',
  },
  commentInitialsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  commentTextContainer: {
    flex: 1,
    paddingRight: 10,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 6,
  },
  commentName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  commentTimeText: {
    color: '#8E8E93',
    fontSize: 13,
  },
  commentContent: {
    color: '#E5E5EA',
    fontSize: 14,
    lineHeight: 19,
  },
  commentLikeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 24,
    marginTop: 2,
  },
  commentLikeCount: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
    fontWeight: '500',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  commentInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    paddingVertical: 8,
  },
  commentInputAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#333',
  },
  commentInputInitialsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  suggestionsSection: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 8,
    marginTop: 16,
  },
  suggestionsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginBottom: 14,
  },
  suggestionsHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  inviteFriendButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  inviteFriendText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  suggestionsScrollContent: {
    paddingRight: 16,
  },
  suggestionCard: {
    backgroundColor: '#1C1C1E',
    width: 145,
    borderRadius: 15,
    padding: 16,
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  suggestionCloseBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
    zIndex: 10,
  },
  suggestionAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  suggestionInitialsAvatar: {
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionInitialsText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  suggestionName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
    marginBottom: 2,
    textAlign: 'center',
  },
  suggestionSubtitle: {
    color: '#8E8E93',
    fontSize: 11,
    marginBottom: 12,
    fontWeight: '600',
  },
  suggestionFollowBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  suggestionFollowingBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  suggestionFollowBtnText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  suggestionFollowingBtnText: {
    color: '#CCC',
  },
  screenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
    backgroundColor: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  headerTabsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  headerTab: {
    paddingVertical: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  headerTabActive: {
    borderBottomColor: '#007AFF', // Solid blue indicator
  },
  headerTabText: {
    color: '#8E8E93',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'BRLNSR',
  },
  headerTabTextActive: {
    color: '#FFF',
    fontWeight: '800',
  },
  postOptionsBtn: {
    padding: 8,
    marginRight: -4,
  },
});

export default Community;
