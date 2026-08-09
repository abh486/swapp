import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, StatusBar, SafeAreaView, FlatList, Image, TextInput, ScrollView, Alert, ImageBackground, Platform, Share, Linking, Modal, TouchableWithoutFeedback } from 'react-native';
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

const getFolderFromName = (name) => {
  if (!name) return '';
  return name
    .trim()
    .replace(/[\s\/]+/g, '_')
    .split('_')
    .map(word => {
      if (word.includes('-')) {
        return word.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
      }
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join('_');
};

// --- PostItem component ---
const PostItem = React.memo(({
  item,
  onToggleLike,
  onToggleFollow,
  onOpenComments,
  onToggleCommentLike,
  onSharePost,
  loggedInUserAvatar,
  loggedInUserInitials,
  onPressUser,
  onPressLikes,
  onPress,
  onShowOptions,
  listHeight,
}) => {
  const [currentMediaSlide, setCurrentMediaSlide] = useState(0);
  const [bgImageFailed, setBgImageFailed] = useState(false);
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
    <View
      style={[styles.postContainer, { height: listHeight, justifyContent: 'space-between' }]}
    >
      {/* Top Section */}
      <View style={{ paddingHorizontal: 16 }}>
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
        </View>

        {/* Clickable Area for post navigation */}
        <TouchableOpacity
          activeOpacity={0.95}
          onPress={() => onPress && onPress(item)}
        >
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
        </TouchableOpacity>
      </View>

      {/* Middle Section (takes all remaining space) */}
      <View style={{ flex: 1, justifyContent: 'center', marginVertical: 8 }}>
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

          if (imagesList.length === 0) {
            const exercises = item.logs || [];
            if (exercises.length === 0) return null;

            const cardWidth = Dimensions.get('window').width;

            return (
              <View style={[styles.postExercisesContainer, { flex: 1, padding: 0, overflow: 'hidden', marginVertical: 0 }]}>
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
                  {exercises.map((log, index) => {
                    let exName = log.exercise?.name || log.name || log.exerciseName;
                    let exGif = log.exercise?.imageUrl || log.exercise?.gifUrl || log.exercise?.videoUrl;

                    const imageSource = (exGif && !bgImageFailed)
                      ? { uri: exGif }
                      : { uri: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500' };

                    return (
                      <ImageBackground
                        key={index}
                        source={imageSource}
                        onError={() => {
                          console.log('[Community] Background exercise image failed, falling back to Unsplash.');
                          setBgImageFailed(true);
                        }}
                        style={{ width: cardWidth, height: '100%', justifyContent: 'flex-end', padding: 0 }}
                        imageStyle={{ borderRadius: 0 }}
                        resizeMode="cover"
                      >
                        <TouchableOpacity
                          activeOpacity={0.95}
                          onPress={() => onPress && onPress(item)}
                          style={StyleSheet.absoluteFillObject}
                        />
                        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: 'rgba(0,0,0,0.2)', borderRadius: 0 }]} pointerEvents="none" />

                        {/* Premium Bottom Banner Overlay */}
                        <View
                          style={{
                            width: '100%',
                            backgroundColor: 'rgba(10, 10, 18, 0.75)',
                            paddingVertical: 12,
                            paddingHorizontal: 16,
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                          pointerEvents="none"
                        >
                          <Text style={{ color: '#FFF', fontSize: 16, fontWeight: '700', flex: 1, marginRight: 10 }}>{exName || 'Exercise'}</Text>
                          {(() => {
                            const setsCount = Array.isArray(log.sets) ? log.sets.length : (log.sets ? 1 : 0);
                            return setsCount > 0 && (
                              <View style={{ backgroundColor: 'rgba(238, 130, 42, 0.2)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(238, 130, 42, 0.4)' }}>
                                <Text style={{ color: '#EE822A', fontSize: 13, fontWeight: '700' }}>{setsCount} {setsCount === 1 ? 'set' : 'sets'}</Text>
                              </View>
                            );
                          })()}
                        </View>
                      </ImageBackground>
                    );
                  })}
                </ScrollView>

                {/* Dots Indicator */}
                {exercises.length > 1 && (
                  <View style={[styles.mediaDotsRow, { position: 'absolute', bottom: 56, left: 0, right: 0 }]}>
                    {exercises.map((_, index) => (
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
          }

          const cardWidth = Dimensions.get('window').width;

          return (
            <View style={[styles.postMediaContainer, { height: undefined, flex: 1, minHeight: 200, marginBottom: 0 }]}>
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
      </View>

      {/* Bottom Section */}
      <View style={{ paddingHorizontal: 16 }}>
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

          <TouchableOpacity
            style={styles.postActionButton}
            onPress={() => onSharePost && onSharePost(item)}
            activeOpacity={0.7}
          >
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
      </View>
    </View>
  );
});

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
  const [searchQuery, setSearchQuery] = useState('');
  const [searchActive, setSearchActive] = useState(false);

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [postToShare, setPostToShare] = useState(null);

  const handleOpenShareModal = (post) => {
    setPostToShare(post);
    setShareModalVisible(true);
  };

  const getShareTextAndUrl = (post) => {
    if (!post) return { text: '', url: 'https://swapp.fit' };
    const userName = getDisplayName(post.user) || 'Swapp Athlete';
    const workoutName = post.workoutName || post.workoutTitle || 'workout';
    const postUrl = `https://swapp.fit/post/${post.id}`;
    const text = `Check out ${userName}'s ${workoutName} on Swapp! 💪🔥\n${postUrl}`;
    return { text, url: postUrl };
  };

  const handleShareToWhatsApp = async (post) => {
    const { text, url } = getShareTextAndUrl(post);
    const whatsappUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    try {
      const supported = await Linking.canOpenURL(whatsappUrl);
      if (supported) {
        await Linking.openURL(whatsappUrl);
      } else {
        await Linking.openURL(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`);
      }
    } catch (err) {
      Share.share({ message: text, url });
    }
  };

  const handleShareToTwitter = async (post) => {
    const { text, url } = getShareTextAndUrl(post);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    try {
      await Linking.openURL(twitterUrl);
    } catch (err) {
      Share.share({ message: text, url });
    }
  };

  const handleShareToFacebook = async (post) => {
    const { text, url } = getShareTextAndUrl(post);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    try {
      await Linking.openURL(fbUrl);
    } catch (err) {
      Share.share({ message: text, url });
    }
  };

  const handleShareToInstagram = async (post) => {
    const { text, url } = getShareTextAndUrl(post);
    const instaUrl = `instagram://app`;
    try {
      const supported = await Linking.canOpenURL(instaUrl);
      if (supported) {
        await Linking.openURL(instaUrl);
      } else {
        Share.share({ message: text, url });
      }
    } catch (err) {
      Share.share({ message: text, url });
    }
  };

  const handleNativeShare = (post) => {
    const { text, url } = getShareTextAndUrl(post);
    Share.share({
      title: 'Share Workout Post',
      message: text,
      url: url,
    }).catch(err => console.log('Share error:', err));
  };

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
    let filteredPosts = posts.filter(post => {
      const postUserId = post.user?.id || post.userId;
      const isBlocked = blockedUserIds.some(item => {
        if (typeof item === 'string') return item === postUserId;
        return item && item.id === postUserId;
      });
      return !blockedPostIds.includes(post.id) && !isBlocked;
    });

    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      filteredPosts = filteredPosts.filter(post =>
        (post.user?.name || '').toLowerCase().includes(q) ||
        (post.workoutTitle || '').toLowerCase().includes(q) ||
        (post.caption || '').toLowerCase().includes(q)
      );
    }

    if (filteredPosts.length === 0) return [];
    if (suggestedUsers.length === 0) return filteredPosts;
    // Insert a dummy item for suggestions at index 1
    const copy = [...filteredPosts];
    copy.splice(1, 0, { isSuggestionsItem: true, id: 'suggestions-standalone' });
    return copy;
  }, [posts, suggestedUsers, blockedPostIds, blockedUserIds, searchQuery]);

  const snapOffsets = React.useMemo(() => {
    const offsets = [];
    let currentOffset = 0;
    listData.forEach(() => {
      offsets.push(currentOffset);
      currentOffset += listHeight; // Full screen post / suggestions height
    });
    return offsets;
  }, [listData, listHeight]);

  const fetchSuggestions = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/suggestions');
      const data = response?.data?.data || response?.data || [];
      if (Array.isArray(data)) {
        setSuggestedUsers(data);
      } else {
        setSuggestedUsers([]);
      }
    } catch (error) {
      console.log('[Community] Error fetching suggestions:', error?.message);
      setSuggestedUsers([]);
    }
  }, []);

  const handleFollowSuggestion = async (suggestedUser) => {
    const userId = suggestedUser.id || suggestedUser._id;
    const isCurrentlyFollowing = Boolean(suggestedUser.isFollowing);
    setSuggestedUsers(current =>
      current.map(u => (u.id || u._id) === userId ? { ...u, isFollowing: !isCurrentlyFollowing } : u)
    );
    try {
      await apiClient.post(`/users/follow/${userId}`);
    } catch (error) {
      console.error('Error following suggestion athlete:', error);
      setSuggestedUsers(current =>
        current.map(u => (u.id || u._id) === userId ? { ...u, isFollowing: isCurrentlyFollowing } : u)
      );
    }
  };

  const handleRemoveSuggestion = (userId) => {
    setSuggestedUsers(current => current.filter(u => u.id !== userId));
  };

  const fetchPosts = useCallback(async (tab = activeTab) => {
    if (posts.length === 0) {
      setIsLoading(true);
    }
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
      if (publicPosts.length > 0) {
        AsyncStorage.setItem('@cached_community_posts', JSON.stringify(publicPosts)).catch(() => {});
      }
    } catch (error) {
      console.log(
        'Failed to fetch community workouts',
        error?.response?.data || error.message,
      );
      if (posts.length === 0) {
        setFetchError('Could not fetch community posts.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, posts.length]);

  useEffect(() => {
    const loadCachedCommunityPosts = async () => {
      try {
        const cached = await AsyncStorage.getItem('@cached_community_posts');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setPosts(parsed);
            setIsLoading(false);
          }
        }
      } catch (e) {}
    };
    loadCachedCommunityPosts();
  }, []);

  useEffect(() => {
    fetchPosts(activeTab);
    fetchSuggestions();
  }, [activeTab, fetchPosts, fetchSuggestions]);

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

  const [activePageIndex, setActivePageIndex] = useState(0);

  const suggestionPages = React.useMemo(() => {
    const pages = [];
    for (let i = 0; i < suggestedUsers.length; i += 4) {
      pages.push(suggestedUsers.slice(i, i + 4));
    }
    return pages;
  }, [suggestedUsers]);

  const renderListHeader = () => {
    if (suggestedUsers.length === 0) return null;

    const cardWidth = (Dimensions.get('window').width - 48) / 2;

    return (
      <View style={[styles.suggestionsFullScreenContainer, { height: listHeight }]}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={(e) => {
            const contentOffsetX = e.nativeEvent.contentOffset.x;
            const page = Math.round(contentOffsetX / (Dimensions.get('window').width - 32));
            if (page !== activePageIndex && page >= 0 && page < suggestionPages.length) {
              setActivePageIndex(page);
            }
          }}
          scrollEventThrottle={16}
          style={styles.suggestionsGridScroll}
        >
          {suggestionPages.map((pageItems, pageIdx) => (
            <View key={`page-${pageIdx}`} style={[styles.suggestionGridPage, { width: Dimensions.get('window').width - 32 }]}>
              {pageItems.map((item) => {
                const userId = item.id || item._id;
                const userAvatar = item.avatar || item.profileImage || item.profilePicture;
                const userName = getDisplayName(item) || item.name || item.username || 'User';
                const mutualsCount = item.mutualsCount ?? item.mutualCount ?? item.mutualFriendsCount;
                const mutualAvatars = item.mutualAvatars || item.mutualFriendsAvatars || item.mutualPhotos;

                return (
                  <View key={userId} style={[styles.suggestionCardGrid, { width: cardWidth }]}>
                    {/* Close Icon */}
                    <TouchableOpacity
                      style={styles.suggestionCloseBtnTopRight}
                      onPress={() => handleRemoveSuggestion(userId)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon name="close" size={16} color="rgba(255, 255, 255, 0.7)" />
                    </TouchableOpacity>

                    {/* Avatar */}
                    <TouchableOpacity
                      onPress={() => handlePressUser(userId, item)}
                      activeOpacity={0.8}
                      style={styles.suggestionAvatarContainer}
                    >
                      {userAvatar ? (
                        <Image source={{ uri: userAvatar }} style={styles.suggestionLargeAvatar} />
                      ) : (
                        <View style={[styles.suggestionLargeAvatar, styles.suggestionInitialsAvatar]}>
                          <Text style={styles.suggestionLargeInitialsText}>
                            {getInitials(item)}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>

                    {/* Name */}
                    <Text style={styles.suggestionGridName} numberOfLines={1}>
                      {userName}
                    </Text>

                    {/* Mutuals Count */}
                    {mutualsCount !== undefined && mutualsCount !== null && mutualsCount > 0 && (
                      <Text style={styles.suggestionMutualsText}>
                        {mutualsCount} mutuals
                      </Text>
                    )}

                    {/* Mutual Avatars Stack */}
                    {Array.isArray(mutualAvatars) && mutualAvatars.length > 0 && (
                      <View style={styles.mutualAvatarsRow}>
                        {mutualAvatars.slice(0, 3).map((uri, imgIdx) => (
                          <Image
                            key={`mut-${imgIdx}`}
                            source={{ uri }}
                            style={[
                              styles.mutualAvatarThumb,
                              imgIdx > 0 && { marginLeft: -8 }
                            ]}
                          />
                        ))}
                      </View>
                    )}

                    {/* Follow Button */}
                    <TouchableOpacity
                      style={[
                        styles.suggestionGridFollowBtn,
                        item.isFollowing && styles.suggestionGridFollowingBtn
                      ]}
                      onPress={() => handleFollowSuggestion(item)}
                      activeOpacity={0.8}
                    >
                      <Text
                        style={[
                          styles.suggestionGridFollowBtnText,
                          item.isFollowing && styles.suggestionGridFollowingBtnText
                        ]}
                      >
                        {item.isFollowing ? 'Following' : 'Follow'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          ))}
        </ScrollView>

        {/* Pagination Dots */}
        {suggestionPages.length > 1 && (
          <View style={styles.dotsPaginationRow}>
            {suggestionPages.map((_, dotIdx) => (
              <View
                key={`dot-${dotIdx}`}
                style={[
                  styles.paginationDot,
                  dotIdx === activePageIndex && styles.paginationDotActive
                ]}
              />
            ))}
          </View>
        )}

        {/* Section Heading at Bottom */}
        <View style={styles.suggestionsBottomHeadingRow}>
          <Text style={styles.suggestionsBottomHeadingText}>Suggested for you</Text>
        </View>
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

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <TouchableOpacity
            onPress={() => setSearchActive(prev => !prev)}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Icon name="search-outline" size={22} color="#FFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => navigation.navigate('NotificationScreen')}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <Icon name="notifications-outline" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar Overlay */}
      {searchActive && (
        <View style={styles.searchBarContainer}>
          <Icon name="search-outline" size={18} color="#8E8E93" style={styles.searchIconLeft} />
          <TextInput
            placeholder="Search posts, workouts or captions..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
            autoFocus
            clearButtonMode="while-editing"
          />
          <TouchableOpacity
            onPress={() => {
              setSearchQuery('');
              setSearchActive(false);
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.cancelSearchText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      )}



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
            removeClippedSubviews={Platform.OS === 'android'}
            initialNumToRender={2}
            maxToRenderPerBatch={2}
            windowSize={3}
            getItemLayout={(data, index) => ({
              length: listHeight,
              offset: listHeight * index,
              index,
            })}
            renderItem={({ item }) => {
              if (item.isSuggestionsItem) {
                return (
                  <View style={{ height: listHeight, justifyContent: 'center' }}>
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
                    onSharePost={handleOpenShareModal}
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

      {/* Share Bottom Sheet Modal */}
      <Modal
        visible={shareModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setShareModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShareModalVisible(false)}>
          <View style={styles.shareModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.shareBottomSheet}>
                <View style={styles.shareHandle} />
                
                <View style={styles.shareHeader}>
                  <Text style={styles.shareTitle}>Share Post</Text>
                  <TouchableOpacity
                    onPress={() => setShareModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Icon name="close" size={20} color="#8E8E93" />
                  </TouchableOpacity>
                </View>

                {/* Social Share Grid */}
                <View style={styles.socialGridRow}>
                  {/* WhatsApp */}
                  <TouchableOpacity
                    style={styles.socialOptionBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      setShareModalVisible(false);
                      handleShareToWhatsApp(postToShare);
                    }}
                  >
                    <View style={[styles.socialIconCircle, { backgroundColor: '#25D366' }]}>
                      <Icon name="logo-whatsapp" size={26} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialOptionLabel}>WhatsApp</Text>
                  </TouchableOpacity>

                  {/* Twitter / X */}
                  <TouchableOpacity
                    style={styles.socialOptionBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      setShareModalVisible(false);
                      handleShareToTwitter(postToShare);
                    }}
                  >
                    <View style={[styles.socialIconCircle, { backgroundColor: '#1DA1F2' }]}>
                      <Icon name="logo-twitter" size={24} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialOptionLabel}>Twitter / X</Text>
                  </TouchableOpacity>

                  {/* Facebook */}
                  <TouchableOpacity
                    style={styles.socialOptionBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      setShareModalVisible(false);
                      handleShareToFacebook(postToShare);
                    }}
                  >
                    <View style={[styles.socialIconCircle, { backgroundColor: '#1877F2' }]}>
                      <Icon name="logo-facebook" size={26} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialOptionLabel}>Facebook</Text>
                  </TouchableOpacity>

                  {/* Instagram */}
                  <TouchableOpacity
                    style={styles.socialOptionBtn}
                    activeOpacity={0.8}
                    onPress={() => {
                      setShareModalVisible(false);
                      handleShareToInstagram(postToShare);
                    }}
                  >
                    <View style={[styles.socialIconCircle, { backgroundColor: '#E1306C' }]}>
                      <Icon name="logo-instagram" size={26} color="#FFFFFF" />
                    </View>
                    <Text style={styles.socialOptionLabel}>Instagram</Text>
                  </TouchableOpacity>
                </View>

                {/* Native System Share Sheet Option */}
                <TouchableOpacity
                  style={styles.moreShareOptionsBtn}
                  activeOpacity={0.85}
                  onPress={() => {
                    setShareModalVisible(false);
                    handleNativeShare(postToShare);
                  }}
                >
                  <Feather name="share" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.moreShareOptionsText}>More Sharing Options...</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  shareBottomSheet: {
    backgroundColor: '#1C1C24',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    width: '100%',
  },
  shareHandle: {
    width: 38,
    height: 4,
    backgroundColor: '#3A3A42',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  shareHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  shareTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  socialGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 28,
  },
  socialOptionBtn: {
    alignItems: 'center',
    gap: 8,
  },
  socialIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialOptionLabel: {
    color: '#E0E0E0',
    fontSize: 12,
    fontWeight: '600',
  },
  moreShareOptionsBtn: {
    width: '100%',
    height: 50,
    backgroundColor: '#2A2A34',
    borderRadius: 14,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  moreShareOptionsText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  container: {
    flex: 1,
    backgroundColor: '#000',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    paddingHorizontal: 0,
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
    borderRadius: 0,
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
  suggestionsFullScreenContainer: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  suggestionsGridScroll: {
    flexGrow: 0,
  },
  suggestionGridPage: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 14,
  },
  suggestionCardGrid: {
    height: 246,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 0,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
  },
  suggestionCloseBtnTopRight: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 10,
    padding: 4,
  },
  suggestionAvatarContainer: {
    marginTop: 6,
  },
  suggestionLargeAvatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: '#2A2A32',
  },
  suggestionLargeInitialsText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  suggestionGridName: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
    marginTop: 2,
  },
  suggestionMutualsText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 1,
  },
  mutualAvatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  mutualAvatarThumb: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#181820',
  },
  suggestionGridFollowBtn: {
    width: '100%',
    height: 38,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  suggestionGridFollowingBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  suggestionGridFollowBtnText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  suggestionGridFollowingBtnText: {
    color: '#FFFFFF',
  },
  dotsPaginationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 16,
    gap: 8,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  paginationDotActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  suggestionsBottomHeadingRow: {
    width: '100%',
    paddingHorizontal: 4,
  },
  suggestionsBottomHeadingText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
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
    backgroundColor: 'transparent',
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
  postExercisesContainer: {
    backgroundColor: '#1C1C1E',
    borderRadius: 0,
    padding: 16,
    marginVertical: 10,
    borderWidth: 1,
    borderColor: '#2C2C2E',
  },
  postExerciseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2E',
  },
  postExerciseName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
    marginRight: 10,
  },
  postExerciseSets: {
    color: '#FF6F00',
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: 'rgba(255, 111, 0, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  postMoreExercisesText: {
    color: '#AEAEB2',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 10,
    fontWeight: '500',
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIconLeft: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    height: '100%',
    padding: 0,
  },
  cancelSearchText: {
    color: '#EE822A',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 10,
  },
});

export default Community;
