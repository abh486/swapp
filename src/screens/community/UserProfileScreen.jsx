import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Alert,
  Share,
  Linking,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { resolveExerciseImageUri, getExerciseMuscleFallback } from '../../redux/actions/workoutActions';

const { width } = Dimensions.get('window');

// --- Helper Functions ---
const getDisplayName = user => {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  return name || user?.name || user?.username || '';
};

const getUsername = (user, defaultName = 'User') => {
  if (!user) return defaultName;
  const name = getDisplayName(user);
  return name || user.username || user.name || defaultName;
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

const formatDuration = mins => {
  if (!mins) return '0min';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) {
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  return `${m}min`;
};

const formatVolume = vol => {
  if (!vol) return '0 kg';
  const formatted = parseFloat(vol).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1
  });
  return `${formatted} kg`;
};

// --- Subcomponent: ProfileWorkoutPostItem ---
const ProfileWorkoutPostItem = ({
  item,
  onToggleLike,
  onOpenComments,
  onToggleCommentLike,
  onSharePost,
  loggedInUserAvatar,
  loggedInUserInitials,
  onPressLikes,
  onPress,
}) => {
  const [currentMediaSlide, setCurrentMediaSlide] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  const duration = item.stats?.duration || item.duration || 0;
  const volume = item.stats?.volume || 0;
  const calories = item.stats?.calories || item.calories || 0;
  const likesCount = item.likesCount ?? item.likes ?? 0;
  const commentsCount = item.commentsCount ?? item.comments?.length ?? 0;
  const userName = getDisplayName(item.user);
  const userInitials = getInitials(item.user);
  const caption = item.caption || item.description || item.notes;
  const imageUrl = item.imageUrl || item.image || item.mediaUrl;
  const isLiked = Boolean(item.isLiked);

  const formattedDate = getFormattedDate(item.date || item.createdAt);
  const workoutTitle = item.workoutName || item.workoutType || 'Workout';

  // Parse multiple images list
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
  imagesList = imagesList.filter(u => typeof u === 'string' && u.trim().length > 0);
  const cardWidth = Dimensions.get('window').width;

  return (
    <View style={styles.postContainer}>
      {/* Top Section with horizontal padding */}
      <View style={{ paddingHorizontal: 16 }}>
        {/* 1. Header (User Info & Date) */}
        <View style={styles.postHeader}>
          {item.user?.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={styles.postAvatar} />
          ) : (
            <View style={[styles.postAvatar, styles.initialsAvatar]}>
              <Text style={styles.initialsTextSmall}>{userInitials}</Text>
            </View>
          )}
          <View style={styles.postHeaderDetails}>
            <View style={styles.postHeaderNameRow}>
              {userName ? (
                <Text style={styles.postUserName}>{userName}</Text>
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

        {/* 2. Workout Title */}
        <Text style={styles.postWorkoutTitle}>{workoutTitle}</Text>

        {/* Caption (description/notes) right below Workout Title */}
        {caption ? (
          <View style={styles.captionContainer}>
            <Text style={styles.captionText}>{caption}</Text>
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
          {calories > 0 && (
            <View style={styles.postStatItem}>
              <Text style={styles.postStatLabel}>Calories</Text>
              <Text style={styles.postStatValue}>{calories} kcal</Text>
            </View>
          )}
          {item.stats?.records > 0 && (
            <View style={styles.postStatItem}>
              <Text style={styles.postStatLabel}>Records</Text>
              <Text style={styles.postStatValue}>🥇 {item.stats.records}</Text>
            </View>
          )}
        </View>
      </View>

      {/* 4. Media Content (Image Card Carousel) */}
      {imagesList.length > 0 ? (
        <View style={styles.postMediaContainer}>
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
              >
                <Image
                  source={{
                    uri,
                    
                  }}
                  style={[styles.postMediaImage, { width: cardWidth }]}
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
      ) : (() => {
        const exercises = (item.logs && item.logs.length > 0)
          ? item.logs
          : (item.exercises && item.exercises.length > 0)
            ? item.exercises
            : (item.sessionData?.exercises || []);

        if (exercises.length === 0) return null;

        return (
          <View style={[styles.postMediaContainer, { height: 260 }]}>
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
                const exObj = log.exercise || log;
                const exName = exObj.name || log.name || log.exerciseName || 'Exercise';
                const primaryUri = resolveExerciseImageUri(exObj) || log.imageUrl || log.gifUrl || exObj.imageUrl || exObj.gifUrl;
                const imageKey = `${item.id}-${index}-${primaryUri || 'none'}`;
                const isFailed = primaryUri ? failedImages[imageKey] : true;

                const imageSource = (primaryUri && !isFailed)
                  ? {
                      uri: primaryUri,
                      
                    }
                  : getExerciseMuscleFallback(exObj);

                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.95}
                    onPress={() => onPress && onPress(item)}
                    style={{ width: cardWidth, height: '100%' }}
                  >
                    <Image
                      source={imageSource}
                      onError={() => {
                        if (primaryUri) {
                          setFailedImages(prev => ({ ...prev, [imageKey]: true }));
                        }
                      }}
                      style={[styles.postMediaImage, { width: cardWidth, height: '100%' }]}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
            {exercises.length > 1 && (
              <View style={styles.mediaDotsRow}>
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
      })()}

      {/* 6. Action Footer & Inline Comments */}
      <View style={{ paddingHorizontal: 16 }}>
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
              {comment.user?.avatar ? (
                <Image
                  source={{ uri: comment.user.avatar }}
                  style={styles.commentAvatar}
                />
              ) : (
                <View style={[styles.commentAvatar, styles.initialsAvatarIcon]}>
                  <Text style={styles.commentInitialsText}>
                    {getInitials(comment.user)}
                  </Text>
                </View>
              )}
              <View style={styles.commentTextContainer}>
                <View style={styles.commentAuthorRow}>
                  <Text style={styles.commentName}>
                    {getDisplayName(comment.user)}
                  </Text>
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
          <View style={[styles.commentInputAvatar, styles.initialsAvatarIcon]}>
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
};

// --- Main Screen Component ---
const UserProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { userId, user: initialUser } = route.params || {};

  const { user: currentUser } = useAuth();
  const profileData = currentUser?.userProfile || currentUser?.memberProfile || currentUser || {};
  const loggedInUserAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.profilePhoto ||
    profileData.avatar;
  const loggedInUserInitials = getInitials(profileData);

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  useEffect(() => {
    fetchUserProfile();
  }, [userId]);

  const fetchUserProfile = async () => {
    setLoading(true);
    try {
      const targetId = userId || initialUser?.id;
      if (!targetId) {
        Alert.alert('Error', 'User ID is missing');
        navigation.goBack();
        return;
      }

      const [profileRes, workoutsRes] = await Promise.all([
        apiClient.get(`/users/profile/${targetId}`),
        apiClient.get(`/workouts/sessions/user/${targetId}`)
      ]);

      if (profileRes.data && profileRes.data.success) {
        const data = profileRes.data.data;
        setProfile(data);
        setIsFollowing(data.isFollowing);
        setFollowersCount(data.stats?.followers || 0);
      } else {
        throw new Error(profileRes.data?.message || 'Failed to load profile');
      }

      if (workoutsRes.data && workoutsRes.data.success) {
        setWorkouts(workoutsRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching user profile details:', error);
      Alert.alert('Profile Unreachable', 'Could not fetch this member details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async () => {
    try {
      const targetId = userId || initialUser?.id;
      const nextState = !isFollowing;
      setIsFollowing(nextState);
      setFollowersCount(prev => prev + (nextState ? 1 : -1));

      const response = await apiClient.post(`/users/follow/${targetId}`);
      if (response.data && response.data.success) {
        const backendState = response.data.data?.isFollowing;
        if (typeof backendState === 'boolean') {
          setIsFollowing(backendState);
        }
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      setIsFollowing(isFollowing);
      setFollowersCount(profile?.stats?.followers || 0);
    }
  };

  const handleToggleLike = async (item) => {
    // Optimistic UI update
    const updatedWorkouts = workouts.map(w => {
      if (w.id === item.id) {
        const nextLiked = !w.isLiked;
        return {
          ...w,
          isLiked: nextLiked,
          likesCount: Math.max((w.likesCount || 0) + (nextLiked ? 1 : -1), 0)
        };
      }
      return w;
    });
    setWorkouts(updatedWorkouts);

    try {
      await apiClient.post(`/workouts/sessions/${item.id}/like`);
    } catch (error) {
      console.error('Failed to toggle like:', error);
      // Revert optimistic updates
      fetchUserProfile();
    }
  };

  const handleToggleCommentLike = async (postId, commentId) => {
    // Optimistic UI update
    const updatedWorkouts = workouts.map(w => {
      if (w.id === postId) {
        return {
          ...w,
          comments: (w.comments || []).map(comment => {
            if (comment.id === commentId) {
              const isLikedNow = !comment.isLiked;
              const nextCount = Math.max((comment.likesCount || 0) + (isLikedNow ? 1 : -1), 0);
              return { ...comment, isLiked: isLikedNow, likesCount: nextCount };
            }
            return comment;
          })
        };
      }
      return w;
    });
    setWorkouts(updatedWorkouts);

    try {
      await apiClient.post(`/workouts/sessions/comments/${commentId}/like`);
    } catch (error) {
      console.error('Failed to toggle comment like:', error);
      fetchUserProfile();
    }
  };

  const [shareModalVisible, setShareModalVisible] = useState(false);
  const [shareItemInfo, setShareItemInfo] = useState({ text: '', url: '', title: '' });

  const handleOpenShareProfile = (userProfile) => {
    const username = userProfile.username || userProfile.name || 'Swapp Athlete';
    const profileUrl = `https://swapp.fit/user/${userProfile.username || userProfile.id || 'profile'}`;
    const text = `Check out ${username}'s profile on Swapp! 💪🔥\n${profileUrl}`;
    setShareItemInfo({ text, url: profileUrl, title: `Share ${username}'s Profile` });
    setShareModalVisible(true);
  };

  const handleOpenSharePost = (postItem) => {
    const authorName = getDisplayName(postItem.user) || profile.username || 'Swapp Athlete';
    const workoutName = postItem.workoutName || postItem.workoutType || 'workout';
    const postUrl = `https://swapp.fit/post/${postItem.id}`;
    const text = `Check out ${authorName}'s ${workoutName} on Swapp! 💪🔥\n${postUrl}`;
    setShareItemInfo({ text, url: postUrl, title: 'Share Workout Post' });
    setShareModalVisible(true);
  };

  const handleShareToWhatsApp = async () => {
    const { text, url } = shareItemInfo;
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

  const handleShareToTwitter = async () => {
    const { text, url } = shareItemInfo;
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    try {
      await Linking.openURL(twitterUrl);
    } catch (err) {
      Share.share({ message: text, url });
    }
  };

  const handleShareToFacebook = async () => {
    const { text, url } = shareItemInfo;
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    try {
      await Linking.openURL(fbUrl);
    } catch (err) {
      Share.share({ message: text, url });
    }
  };

  const handleShareToInstagram = async () => {
    const { text, url } = shareItemInfo;
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

  const handleNativeShare = () => {
    const { text, url, title } = shareItemInfo;
    Share.share({
      title: title || 'Share',
      message: text,
      url: url,
    }).catch(err => console.log('Share error:', err));
  };

  const handleShowUserOptions = () => {
    const userName = getUsername(profile, 'this athlete');
    Alert.alert(
      'Profile Options',
      `Choose an action for ${userName}.`,
      [
        {
          text: 'Report User',
          onPress: () => handleReportUser(profile)
        },
        {
          text: 'Block User',
          onPress: () => handleBlockUser(profile)
        },
        {
          text: 'Share Profile',
          onPress: () => handleOpenShareProfile(profile)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const handleReportUser = (userObj) => {
    const userName = getUsername(userObj, 'user');
    Alert.alert(
      'Report User',
      `Why are you reporting ${userName}?`,
      [
        {
          text: 'Spam or Scam',
          onPress: () => flagUser(userObj)
        },
        {
          text: 'Inappropriate Content',
          onPress: () => flagUser(userObj)
        },
        {
          text: 'Harassment or Abuse',
          onPress: () => flagUser(userObj)
        },
        {
          text: 'Cancel',
          style: 'cancel'
        }
      ]
    );
  };

  const flagUser = async (userObj) => {
    const targetId = userId || initialUser?.id || userObj?.id;
    try {
      await apiClient.post(`/users/report/${targetId}`);
    } catch (err) {
      console.warn('Report API note:', err?.message);
    }
    Alert.alert('Report Submitted', 'Thank you. We will review this profile within 24 hours.');
  };

  const handleBlockUser = (userObj) => {
    const targetId = userId || initialUser?.id || userObj?.id;
    const userName = getUsername(userObj, 'this user');
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${userName}? You will no longer see their posts or updates.`,
      [
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              const currentBlocked = await AsyncStorage.getItem('blocked_user_ids');
              const list = currentBlocked ? JSON.parse(currentBlocked) : [];
              const updated = [...list.filter(id => id !== targetId), targetId];
              await AsyncStorage.setItem('blocked_user_ids', JSON.stringify(updated));

              try {
                await apiClient.post(`/users/block/${targetId}`);
              } catch (apiErr) {
                console.warn('Block API note:', apiErr?.message);
              }
              Alert.alert('User Blocked', `${userName} has been blocked.`);
              navigation.goBack();
            } catch (err) {
              console.error('Error blocking user:', err);
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

  const handleOpenComments = (post) => {
    navigation.navigate('CommentsScreen', { post });
  };

  const handlePhotoPress = (photoUrl) => {
    const matchedWorkout = workouts.find(w => {
      if (!w.imageUrl) return false;
      try {
        if (w.imageUrl.startsWith('[')) {
          const list = JSON.parse(w.imageUrl);
          return list.includes(photoUrl);
        }
      } catch (e) { }
      return w.imageUrl.includes(photoUrl);
    });
    if (matchedWorkout) {
      navigation.navigate('PostDetails', { post: matchedWorkout });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5E5CE6" />
      </View>
    );
  }

  if (!profile) return null;

  const totalHoursThisWeek = profile.weeklyStats?.[profile.weeklyStats.length - 1]?.hours || 0;
  const maxHours = Math.max(...profile.weeklyStats.map(w => w.hours), 5);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 1. Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{profile.username}</Text>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => handleOpenShareProfile(profile)}
            activeOpacity={0.7}
          >
            <Icon name="share-outline" size={22} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerBtn}
            onPress={handleShowUserOptions}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Icon name="ellipsis-horizontal" size={22} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* 2. Top Photos Grid */}
        {profile.photos && profile.photos.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.photosGrid}>
            {profile.photos.map((url, index) => (
              <TouchableOpacity key={index} activeOpacity={0.9} onPress={() => handlePhotoPress(url)}>
                <Image source={{ uri: url }} style={styles.gridImage} />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* 3. Profile details section */}
        <View style={styles.profileDetailsRow}>
          {profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.profileAvatar} />
          ) : (
            <View style={styles.initialsAvatar}>
              <Text style={styles.initialsText}>
                {profile.name ? profile.name.slice(0, 2).toUpperCase() : 'ST'}
              </Text>
            </View>
          )}

          <View style={styles.profileStats}>
            <Text style={styles.displayName}>{profile.name}</Text>

            <View style={styles.statsMetricsRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Workouts</Text>
                <Text style={styles.metricValue}>{profile.stats?.workouts || 0}</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Followers</Text>
                <Text style={styles.metricValue}>{followersCount}</Text>
              </View>

              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>Following</Text>
                <Text style={styles.metricValue}>{profile.stats?.following || 0}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* 4. Bio Section */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>

        {/* 5. Follow / Following button */}
        <TouchableOpacity
          style={[styles.followButton, isFollowing && styles.followingButton]}
          onPress={handleToggleFollow}
        >
          <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
            {isFollowing ? 'Following' : 'Follow'}
          </Text>
        </TouchableOpacity>

        {/* 6. Activity Chart Header */}
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>
            {totalHoursThisWeek} hours <Text style={styles.chartSubtitle}>this week</Text>
          </Text>
        </View>

        {/* 7. Workout Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartPlotArea}>
            <View style={styles.gridLinesContainer}>
              <View style={styles.gridLineRow}><Text style={styles.gridLineLabel}>6 hrs</Text></View>
              <View style={styles.gridLineRow}><Text style={styles.gridLineLabel}>4 hrs</Text></View>
              <View style={styles.gridLineRow}><Text style={styles.gridLineLabel}>2 hrs</Text></View>
              <View style={styles.gridLineRow}><Text style={styles.gridLineLabel}>0 hrs</Text></View>
            </View>

            <View style={styles.barsContainer}>
              {profile.weeklyStats.map((item, idx) => {
                const barHeightPct = Math.min((item.hours / maxHours) * 85, 100) + '%';
                return (
                  <View key={idx} style={styles.barCol}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { height: barHeightPct }]} />
                    </View>
                    {idx % 2 === 0 ? (
                      <Text style={styles.barLabel}>{item.label}</Text>
                    ) : (
                      <View style={styles.emptyLabelSpacer} />
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* 8. Comparison Section */}
        <View style={styles.comparisonHeader}>
          <Text style={styles.comparisonTitle}>Comparison</Text>
        </View>

        <TouchableOpacity
          style={styles.compareBtn}
          onPress={() => navigation.navigate('Comparison', {
            currentUserProfile: profileData,
            comparedUserProfile: profile,
          })}
          activeOpacity={0.8}
        >
          <View style={styles.compareAvatars}>
            {profile.avatar ? (
              <Image source={{ uri: profile.avatar }} style={[styles.compareAvatar, { zIndex: 2 }]} />
            ) : (
              <View style={[styles.compareAvatar, styles.compareInitials, { zIndex: 2 }]}>
                <Text style={styles.compareInitialsText}>ST</Text>
              </View>
            )}
            <View style={[styles.compareAvatar, styles.compareCat, { zIndex: 1 }]}>
              <Text style={{ fontSize: 16 }}>🐱</Text>
            </View>
          </View>
          <Text style={styles.compareBtnText}>Compare</Text>
          <Icon name="chevron-forward" size={16} color="#8E8E93" />
        </TouchableOpacity>

        {/* 9. Recent Workouts Section */}
        <View style={styles.recentWorkoutsHeader}>
          <Text style={styles.recentWorkoutsTitle}>Recent Workouts</Text>
        </View>

        {workouts.length > 0 ? (
          workouts.map((item) => (
            <ProfileWorkoutPostItem
              key={item.id}
              item={item}
              onToggleLike={handleToggleLike}
              onOpenComments={handleOpenComments}
              onToggleCommentLike={handleToggleCommentLike}
              onSharePost={handleOpenSharePost}
              loggedInUserAvatar={loggedInUserAvatar}
              loggedInUserInitials={loggedInUserInitials}
              onPressLikes={(sessionId) => navigation.navigate('LikesList', { sessionId })}
              onPress={(postItem) => {
                console.log('[UserProfileScreen] Tapping post:', postItem.id);
                navigation.navigate('PostDetails', { post: { ...postItem, user: postItem.user || profile } });
              }}
            />
          ))
        ) : (
          <View style={styles.emptyWorkouts}>
            <Text style={styles.emptyWorkoutsText}>No logged workouts shared yet.</Text>
          </View>
        )}

      </ScrollView>

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
                  <Text style={styles.shareTitle}>{shareItemInfo.title || 'Share'}</Text>
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
                      handleShareToWhatsApp();
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
                      handleShareToTwitter();
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
                      handleShareToFacebook();
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
                      handleShareToInstagram();
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
                    handleNativeShare();
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
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
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
  headerBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 4,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  photosGrid: {
    flexDirection: 'row',
    marginTop: 2,
    marginBottom: 20,
  },
  gridImage: {
    width: width / 3.4,
    height: width / 3.4,
    marginRight: 2,
  },
  profileDetailsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  initialsAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  initialsText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  profileStats: {
    flex: 1,
    marginLeft: 20,
  },
  displayName: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
    marginBottom: 8,
  },
  statsMetricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metricBox: {
    alignItems: 'flex-start',
  },
  metricLabel: {
    color: '#8E8E93',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  metricValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  bioContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  bioText: {
    color: '#DDD',
    fontSize: 14,
    lineHeight: 18,
  },
  followButton: {
    backgroundColor: '#007AFF',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
  },
  followingButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  followButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  followingButtonText: {
    color: '#CCC',
  },
  chartHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  chartTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  chartSubtitle: {
    color: '#8E8E93',
    fontWeight: 'normal',
    fontSize: 14,
  },
  chartCard: {
    backgroundColor: '#0A0A0A',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 15,
    marginHorizontal: 20,
    padding: 16,
    paddingBottom: 24,
    marginBottom: 30,
  },
  chartPlotArea: {
    height: 180,
    position: 'relative',
    justifyContent: 'flex-end',
  },
  gridLinesContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  gridLineRow: {
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
    height: 45,
    justifyContent: 'flex-start',
  },
  gridLineLabel: {
    color: '#444',
    fontSize: 9,
    fontWeight: '600',
    position: 'absolute',
    left: -10,
    top: -5,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingLeft: 30,
    zIndex: 2,
  },
  barCol: {
    alignItems: 'center',
    flex: 1,
  },
  barTrack: {
    height: 140,
    width: 14,
    backgroundColor: 'transparent',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  barFill: {
    width: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 3,
  },
  barLabel: {
    color: '#666',
    fontSize: 8,
    marginTop: 8,
    fontWeight: '700',
    textAlign: 'center',
    width: 40,
  },
  emptyLabelSpacer: {
    height: 8,
    marginTop: 8,
  },
  comparisonHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  comparisonTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  compareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1C1C1E',
    marginHorizontal: 20,
    padding: 12,
    borderRadius: 12,
    justifyContent: 'space-between',
  },
  compareAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
  },
  compareAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#1C1C1E',
  },
  compareInitials: {
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareInitialsText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  compareCat: {
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -12,
  },
  compareBtnText: {
    flex: 1,
    marginLeft: 12,
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  recentWorkoutsHeader: {
    paddingHorizontal: 20,
    marginTop: 25,
    marginBottom: 12,
  },
  recentWorkoutsTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  postContainer: {
    paddingHorizontal: 0,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  postAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  initialsAvatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsTextSmall: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  postHeaderDetails: {
    marginLeft: 10,
  },
  postUserName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  postDateText: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 2,
  },
  postWorkoutTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
    marginBottom: 10,
    paddingHorizontal: 16,
  },
  postStatsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 24,
  },
  postStatItem: {
    alignItems: 'flex-start',
  },
  postStatLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  postStatValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
    fontFamily: 'BRLNSR',
  },
  captionContainer: {
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  captionText: {
    color: '#DDD',
    fontSize: 13,
    lineHeight: 18,
  },
  postMediaContainer: {
    width: '100%',
    height: width,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 12,
    position: 'relative',
  },
  postMediaImage: {
    height: '100%',
  },
  mediaDotsRow: {
    position: 'absolute',
    bottom: 12,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  mediaDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  mediaDotActive: {
    backgroundColor: '#5E5CE6',
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  postActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  postActionText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'flex-start',
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
  },
  commentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  initialsAvatarIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  commentInitialsText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  commentTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  commentName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  commentTimeText: {
    color: '#8E8E93',
    fontSize: 10,
    marginLeft: 8,
  },
  commentContent: {
    color: '#DDD',
    fontSize: 13,
    lineHeight: 16,
    marginTop: 2,
  },
  commentLikeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    flexDirection: 'column',
    gap: 2,
  },
  commentLikeCount: {
    color: '#8E8E93',
    fontSize: 10,
    fontWeight: 'bold',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 4,
  },
  commentInputAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 12,
  },
  commentInputInitialsText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: 'bold',
  },
  commentInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 13,
  },
  emptyWorkouts: {
    alignItems: 'center',
    padding: 30,
  },
  emptyWorkoutsText: {
    color: '#666',
    fontSize: 14,
  },
  verifiedIcon: {
    marginLeft: 4,
  },
});

export default UserProfileScreen;
