import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { useNavigation, useRoute, useFocusEffect } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { useDispatch } from 'react-redux';
import { resolveExerciseImageUri, getExerciseMuscleFallback, deleteWorkoutSession } from '../../redux/actions/workoutActions';
import { calculateWorkoutCalories } from '../../utils/workoutCalorieCalculator';
import EditWorkoutPostModal from '../../components/EditWorkoutPostModal';
import PostedSuccessPopup from '../../components/PostedSuccessPopup';
import LinearGradient from 'react-native-linear-gradient';
import { FullScreenLoader } from '../../components/GlobalLoader';

const { width } = Dimensions.get('window');

// --- Helper Functions ---
const getDisplayName = user => {
  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ');
  return name || user?.name || user?.userProfile?.name || user?.username || user?.userProfile?.username || '';
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

const formatDuration = value => {
  if (!value) return '0s';
  const str = String(value).trim().toLowerCase();

  // If it's already pre-formatted with time unit strings, return as is
  if (str.includes('min') || str.includes('h') || str.includes('m') || str.includes('s')) {
    return str;
  }

  // Otherwise, treat as seconds and format cleanly
  const totalSecs = parseInt(str, 10) || 0;
  if (totalSecs <= 0) return '0s';

  const h = Math.floor(totalSecs / 3600);
  const m = Math.floor((totalSecs % 3600) / 60);
  const s = totalSecs % 60;

  if (h > 0) {
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }
  if (m > 0) {
    return s > 0 ? `${m}min ${s}s` : `${m}min`;
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

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const getChartTimeframeData = (timeframe) => {
  const points = [];
  const now = new Date();

  if (timeframe === 'day') {
    const count = 7;
    for (let i = count - 1; i >= 0; i--) {
      const start = new Date(now);
      start.setDate(now.getDate() - i);
      start.setHours(0, 0, 0, 0);

      const end = new Date(start);
      end.setHours(23, 59, 59, 999);

      const isToday = i === 0;
      const label = isToday ? 'Today' : DAYS_SHORT[start.getDay()];
      points.push({
        date: start,
        label,
        startTime: start.getTime(),
        endTime: end.getTime(),
      });
    }
  } else if (timeframe === 'week') {
    const count = 6;
    for (let i = count - 1; i >= 0; i--) {
      const endTime = now.getTime() - i * 7 * 24 * 60 * 60 * 1000;
      const startTime = endTime - 7 * 24 * 60 * 60 * 1000;
      const date = new Date(endTime);
      const isCurrentWeek = i === 0;
      const label = isCurrentWeek ? 'This Wk' : `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
      points.push({
        date,
        label,
        startTime,
        endTime,
      });
    }
  } else if (timeframe === 'month') {
    const count = 6;
    for (let i = count - 1; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
      const label = MONTHS_SHORT[start.getMonth()];
      points.push({
        date: start,
        label,
        startTime: start.getTime(),
        endTime: end.getTime(),
      });
    }
  } else {
    // '3months' (6 intervals of 14 days, total 84 days ~ 12 weeks)
    const count = 6;
    for (let i = count - 1; i >= 0; i--) {
      const endTime = now.getTime() - i * 14 * 24 * 60 * 60 * 1000;
      const startTime = endTime - 14 * 24 * 60 * 60 * 1000;
      const date = new Date(endTime);
      const label = `${MONTHS_SHORT[date.getMonth()]} ${date.getDate()}`;
      points.push({
        date,
        label,
        startTime,
        endTime,
      });
    }
  }
  return points;
};

const findPointIndex = (wDate, points) => {
  if (!wDate || !points || points.length === 0) return -1;
  const d = new Date(wDate);
  if (isNaN(d.getTime())) return -1;
  const t = d.getTime();

  for (let i = 0; i < points.length; i++) {
    if (t >= points[i].startTime && t <= points[i].endTime) {
      return i;
    }
  }
  return -1;
};

const extractWorkoutStats = (workout) => {
  const rawDuration = Number(workout.duration || workout.stats?.duration || 0);
  const durationHours = rawDuration > 120 ? rawDuration / 3600 : (rawDuration > 0 ? rawDuration / 60 : 0);

  let volume = Number(workout.volume || workout.stats?.volume || 0);
  let reps = Number(workout.reps || workout.stats?.reps || 0);

  const logs = workout.logs || workout.exercises || workout.sessionData?.exercises || [];
  if (Array.isArray(logs) && logs.length > 0) {
    let logsVolume = 0;
    let logsReps = 0;
    logs.forEach(log => {
      const sets = log.sets || [];
      if (Array.isArray(sets)) {
        sets.forEach(set => {
          const r = Number(set.reps) || 0;
          const w = Number(set.weight) || 0;
          logsReps += r;
          logsVolume += (r * w);
        });
      }
    });
    if (logsVolume > 0) volume = logsVolume;
    if (logsReps > 0) reps = logsReps;
  }

  return { durationHours, volume, reps };
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
  onShowOptions,
}) => {
  const [currentMediaSlide, setCurrentMediaSlide] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  const duration = item.stats?.duration || item.duration || 0;
  const volume = item.stats?.volume || 0;
  const workoutTitle = item.workoutName || item.workoutType || 'Workout';
  const rawCalories = item.stats?.calories || item.calories || 0;
  const calories = rawCalories > 0
    ? rawCalories
    : (duration > 0
        ? calculateWorkoutCalories({
            duration,
            workoutTitle,
            volume,
            exercises: item.logs || item.exercises || [],
          })
        : 0);
  const likesCount = item.likesCount ?? item.likes ?? 0;
  const commentsCount = item.commentsCount ?? item.comments?.length ?? 0;
  const userName = getDisplayName(item.user);
  const userInitials = getInitials(item.user);
  const caption = item.caption || item.description || item.notes;
  const imageUrl = item.imageUrl || item.image || item.mediaUrl;
  const isLiked = Boolean(item.isLiked);

  const formattedDate = getFormattedDate(item.date || item.createdAt);

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
          {item.user?.avatar || item.user?.profileImage || item.user?.userProfile?.profileImage ? (
            <Image source={{ uri: item.user.avatar || item.user.profileImage || item.user.userProfile?.profileImage }} style={styles.postAvatar} />
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
          <TouchableOpacity
            style={styles.postOptionsBtn}
            onPress={() => onShowOptions && onShowOptions(item)}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            activeOpacity={0.7}
          >
            <Icon name="ellipsis-horizontal" size={20} color="#8E8E93" />
          </TouchableOpacity>
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
  const { userId, user: initialUser, fromHomeScreen } = route.params || {};

  const isFromHome = Boolean(
    fromHomeScreen ||
    route.params?.from === 'home' ||
    route.name === 'Profile'
  );

  const { user: currentUser } = useAuth();
  const profileData = currentUser?.userProfile || currentUser?.memberProfile || currentUser || {};
  const loggedInUserAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.profilePhoto ||
    profileData.avatar;
  const loggedInUserInitials = getInitials(profileData);

  const currentUserId =
    currentUser?.id ||
    currentUser?._id ||
    currentUser?.userId ||
    currentUser?.userProfile?.id;

  const targetId =
    userId ||
    initialUser?.id ||
    initialUser?._id ||
    initialUser?.userId ||
    currentUserId;

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);

  // Timeframe and metric filter states
  const [activeMetric, setActiveMetric] = useState('duration'); // 'reps' | 'volume' | 'duration'
  const [timeframe, setTimeframe] = useState('week'); // 'day' | 'week' | 'month' | '3months'
  const [selectedPointIdx, setSelectedPointIdx] = useState(null);

  const isOwnProfile = Boolean(
    (!userId && !initialUser?.id && !initialUser?._id && !initialUser?.userId) ||
    (currentUserId && targetId && String(currentUserId) === String(targetId))
  );

  const isSelf = Boolean(
    isOwnProfile ||
    (currentUserId && profile?.userId && String(currentUserId) === String(profile.userId)) ||
    (currentUserId && profile?.id && String(currentUserId) === String(profile.id))
  );

  const dispatch = useDispatch();
  const [editingPost, setEditingPost] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successPopupTitle, setSuccessPopupTitle] = useState('Post Updated! 🎉');

  const timeframePoints = useMemo(() => getChartTimeframeData(timeframe), [timeframe]);

  const chartData = useMemo(() => {
    const data = timeframePoints.map(p => ({
      date: p.date,
      label: p.label,
      duration: 0,
      volume: 0,
      reps: 0,
    }));

    let hasWorkoutData = false;
    if (Array.isArray(workouts) && workouts.length > 0) {
      workouts.forEach(w => {
        const wDate = w.date || w.createdAt || w.startTime || w.endedAt;
        const idx = findPointIndex(wDate, timeframePoints);
        if (idx >= 0 && idx < data.length) {
          hasWorkoutData = true;
          const stats = extractWorkoutStats(w);
          data[idx].duration += stats.durationHours;
          data[idx].volume += stats.volume;
          data[idx].reps += stats.reps;
        }
      });
    }

    if (!hasWorkoutData && profile?.weeklyStats && Array.isArray(profile.weeklyStats)) {
      if (timeframe === 'week' || timeframe === '3months') {
        profile.weeklyStats.forEach((ws, idx) => {
          if (idx < data.length) {
            data[idx].duration = Number(ws.hours) || 0;
            if (ws.label && timeframe === '3months') {
              data[idx].label = ws.label;
            }
          }
        });
      }
    }

    return data;
  }, [workouts, timeframePoints, timeframe, profile?.weeklyStats]);

  const maxVal = useMemo(() => {
    const values = chartData.map(d => {
      if (activeMetric === 'duration') return d.duration;
      if (activeMetric === 'volume') return d.volume;
      return d.reps;
    });
    const max = Math.max(...values, 0);
    if (activeMetric === 'duration') {
      return max > 0 ? Math.max(Math.ceil(max * 1.25), 6) : 6;
    } else if (activeMetric === 'volume') {
      return max > 0 ? Math.max(Math.ceil(max * 1.25), 1000) : 1000;
    } else {
      return max > 0 ? Math.max(Math.ceil(max * 1.25), 100) : 100;
    }
  }, [chartData, activeMetric]);

  const yAxisLabels = useMemo(() => {
    if (activeMetric === 'duration') {
      return [
        `${Math.round(maxVal)} hrs`,
        `${Math.round((maxVal * 2) / 3)} hrs`,
        `${Math.round(maxVal / 3)} hrs`,
        `0 hrs`,
      ];
    } else if (activeMetric === 'volume') {
      const formatVol = v => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`);
      return [
        `${formatVol(maxVal)} kg`,
        `${formatVol((maxVal * 2) / 3)}`,
        `${formatVol(maxVal / 3)}`,
        `0 kg`,
      ];
    } else {
      const formatRep = v => (v >= 1000 ? `${Math.round(v / 1000)}k` : `${Math.round(v)}`);
      return [
        `${formatRep(maxVal)} reps`,
        `${formatRep((maxVal * 2) / 3)}`,
        `${formatRep(maxVal / 3)}`,
        `0`,
      ];
    }
  }, [maxVal, activeMetric]);

  const chartTitleText = useMemo(() => {
    let timeframeLabel = 'this week';
    if (timeframe === 'day') timeframeLabel = 'today';
    else if (timeframe === 'week') timeframeLabel = 'this week';
    else if (timeframe === 'month') timeframeLabel = 'this month';
    else timeframeLabel = 'last 3 months';

    if (selectedPointIdx !== null && chartData[selectedPointIdx]) {
      const p = chartData[selectedPointIdx];
      if (activeMetric === 'duration') {
        const formatted = Math.round(p.duration * 10) / 10;
        return { main: `${formatted} hours`, sub: `on ${p.label}` };
      } else if (activeMetric === 'volume') {
        const vol = Math.round(p.volume);
        const formatted = vol >= 1000 ? `${(vol / 1000).toFixed(1)}k kg` : `${vol} kg`;
        return { main: formatted, sub: `volume on ${p.label}` };
      } else {
        const reps = Math.round(p.reps);
        return { main: `${reps.toLocaleString()} reps`, sub: `on ${p.label}` };
      }
    }

    if (timeframe === '3months') {
      if (activeMetric === 'duration') {
        const totalDuration = chartData.reduce((sum, d) => sum + d.duration, 0);
        const val = Math.round(totalDuration * 10) / 10;
        return { main: `${val} hours`, sub: timeframeLabel };
      } else if (activeMetric === 'volume') {
        const totalVol = chartData.reduce((sum, d) => sum + d.volume, 0);
        const formatted = totalVol >= 1000 ? `${(totalVol / 1000).toFixed(1)}k kg` : `${Math.round(totalVol)} kg`;
        return { main: formatted, sub: `volume ${timeframeLabel}` };
      } else {
        const totalReps = chartData.reduce((sum, d) => sum + d.reps, 0);
        return { main: `${Math.round(totalReps).toLocaleString()} reps`, sub: timeframeLabel };
      }
    }

    const latest = chartData[chartData.length - 1] || { duration: 0, volume: 0, reps: 0 };
    if (activeMetric === 'duration') {
      const val = Math.round(latest.duration * 10) / 10;
      return { main: `${val} hours`, sub: timeframeLabel };
    } else if (activeMetric === 'volume') {
      const vol = Math.round(latest.volume);
      const formatted = vol >= 1000 ? `${(vol / 1000).toFixed(1)}k kg` : `${vol} kg`;
      return { main: formatted, sub: `volume ${timeframeLabel}` };
    } else {
      const reps = Math.round(latest.reps);
      return { main: `${reps.toLocaleString()} reps`, sub: timeframeLabel };
    }
  }, [selectedPointIdx, chartData, activeMetric, timeframe]);

  const handleShowPostOptions = (postItem) => {
    const loggedInId = currentUser?.id || currentUser?._id || currentUser?.userId;
    const postUserId = postItem?.userId || postItem?.user?.id || postItem?.user?._id || postItem?.user?.userId || profile?.id;
    const isMyPost = Boolean(loggedInId && postUserId && String(loggedInId) === String(postUserId));

    if (isMyPost) {
      Alert.alert(
        'Workout Post Options',
        'Manage your workout post',
        [
          {
            text: 'Edit Post',
            onPress: () => {
              setEditingPost(postItem);
              setIsEditModalVisible(true);
            },
          },
          {
            text: 'Delete Post',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Delete Post',
                'Are you sure you want to delete this workout post? This action cannot be undone.',
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await dispatch(deleteWorkoutSession(postItem.id));
                        setWorkouts(prev => prev.filter(p => p.id !== postItem.id));
                        setSuccessPopupTitle('Post Deleted! 🗑️');
                        setShowSuccessPopup(true);
                      } catch (err) {
                        Alert.alert('Error', err.message || 'Failed to delete post.');
                      }
                    },
                  },
                ]
              );
            },
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleEditPostSuccess = (updatedPost) => {
    setWorkouts(prev =>
      prev.map(p => {
        if (p.id === updatedPost.id) {
          const mergedUser = {
            ...(p.user || {}),
            ...(updatedPost.user || {}),
            avatar:
              updatedPost.user?.avatar ||
              updatedPost.user?.profileImage ||
              updatedPost.user?.userProfile?.profileImage ||
              p.user?.avatar ||
              p.user?.profileImage ||
              p.user?.userProfile?.profileImage ||
              null,
            name:
              updatedPost.user?.name ||
              updatedPost.user?.userProfile?.name ||
              p.user?.name ||
              p.user?.userProfile?.name ||
              null,
            username:
              updatedPost.user?.username ||
              updatedPost.user?.userProfile?.username ||
              p.user?.username ||
              p.user?.userProfile?.username ||
              null,
            firstName: updatedPost.user?.firstName || p.user?.firstName || null,
            lastName: updatedPost.user?.lastName || p.user?.lastName || null,
          };
          return {
            ...p,
            ...updatedPost,
            user: mergedUser,
          };
        }
        return p;
      })
    );
    setSuccessPopupTitle('Post Updated! 🎉');
    setShowSuccessPopup(true);
  };

  const fetchUserProfile = useCallback(async () => {
    setLoading(true);
    try {
      const activeTargetId = targetId || currentUserId;
      if (!activeTargetId) {
        Alert.alert('Error', 'User ID is missing');
        navigation.goBack();
        return;
      }

      const [profileRes, workoutsRes] = await Promise.allSettled([
        apiClient.get(`/users/profile/${activeTargetId}`),
        apiClient.get(`/workouts/sessions/user/${activeTargetId}`)
      ]);

      if (profileRes.status === 'fulfilled' && profileRes.value.data?.success) {
        const data = profileRes.value.data.data;
        setProfile(data);
        setIsFollowing(Boolean(data.isFollowing));
        setFollowersCount(data.stats?.followers || 0);
      } else {
        const errMsg =
          profileRes.status === 'rejected'
            ? profileRes.reason?.message
            : profileRes.value?.data?.message || 'Failed to load profile';
        throw new Error(errMsg);
      }

      if (workoutsRes.status === 'fulfilled' && workoutsRes.value.data?.success) {
        setWorkouts(workoutsRes.value.data.data || []);
      } else {
        setWorkouts([]);
      }
    } catch (error) {
      console.error('Error fetching user profile details:', error);
      Alert.alert('Profile Unreachable', 'Could not fetch this member details.');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  }, [targetId, currentUserId, navigation]);

  useFocusEffect(
    useCallback(() => {
      fetchUserProfile();
    }, [fetchUserProfile])
  );

  const handleEditProfile = () => {
    navigation.navigate('EditPersonalInfo');
  };

  const performFollowToggle = async () => {
    try {
      const followTargetId = targetId || userId || initialUser?.id;
      const nextState = !isFollowing;
      setIsFollowing(nextState);
      setFollowersCount(prev => Math.max(0, prev + (nextState ? 1 : -1)));

      const response = await apiClient.post(`/users/follow/${followTargetId}`);
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

  const handleToggleFollow = () => {
    if (isSelf) return;

    if (isFollowing) {
      const targetName = profile?.name || profile?.username || 'this user';
      Alert.alert(
        `Unfollow ${targetName}?`,
        `Are you sure you want to unfollow ${targetName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unfollow',
            style: 'destructive',
            onPress: performFollowToggle,
          },
        ],
        { cancelable: true },
      );
      return;
    }

    performFollowToggle();
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
    const username = userProfile.name || userProfile.username || 'Swapp Athlete';
    const profileUrl = `https://swapp.fit/user/${userProfile.username || userProfile.id || 'profile'}`;
    const text = `Check out ${username}'s profile on Swapp! 💪🔥\n${profileUrl}`;
    setShareItemInfo({ text, url: profileUrl, title: `Share ${username}'s Profile` });
    setShareModalVisible(true);
  };

  const handleOpenSharePost = (postItem) => {
    const authorName = getDisplayName(postItem.user) || profile.name || profile.username || 'Swapp Athlete';
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
    if (isSelf) {
      Alert.alert(
        'Profile Options',
        'Manage your profile',
        [
          {
            text: 'Edit Profile',
            onPress: handleEditProfile,
          },
          {
            text: 'Share Profile',
            onPress: () => handleOpenShareProfile(profile),
          },
          {
            text: 'Cancel',
            style: 'cancel',
          },
        ]
      );
      return;
    }

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
    return <FullScreenLoader />;
  }

  if (!profile) return null;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* 1. Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => {
            if (navigation.canGoBack()) {
              navigation.goBack();
            } else {
              navigation.navigate('MainTabs');
            }
          }}
          activeOpacity={0.7}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>

        <Text style={styles.headerTitle}>{profile.name || profile.username}</Text>

        <View style={styles.headerRightActions}>
          {isFromHome ? (
            <TouchableOpacity
              style={styles.headerBtn}
              onPress={() => navigation.navigate('ProfileSettings')}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Icon name="settings-outline" size={23} color="#FFF" />
            </TouchableOpacity>
          ) : (
            <>
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
            </>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Profile details section */}
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

              <TouchableOpacity
                style={styles.metricBox}
                onPress={() => navigation.navigate('FollowList', {
                  type: 'followers',
                  userId: profile?.userId || profile?.id || profile?._id || targetId,
                  username: profile?.name || profile?.username
                })}
                activeOpacity={0.7}
              >
                <Text style={styles.metricLabel}>Followers</Text>
                <Text style={styles.metricValue}>{followersCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.metricBox}
                onPress={() => navigation.navigate('FollowList', {
                  type: 'following',
                  userId: profile?.userId || profile?.id || profile?._id || targetId,
                  username: profile?.name || profile?.username
                })}
                activeOpacity={0.7}
              >
                <Text style={styles.metricLabel}>Following</Text>
                <Text style={styles.metricValue}>{profile.stats?.following || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 4. Bio Section */}
        <View style={styles.bioContainer}>
          <Text style={styles.bioText}>{profile.bio}</Text>
        </View>

        {/* 5. Follow / Following button OR Edit Profile button */}
        {isSelf ? (
          <TouchableOpacity
            style={styles.editProfileButton}
            onPress={handleEditProfile}
            activeOpacity={0.8}
          >
            <Feather name="edit-2" size={16} color="#FFF" style={styles.editProfileButtonIcon} />
            <Text style={styles.editProfileButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleToggleFollow}
            activeOpacity={0.8}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        )}

        {/* 6. Activity Chart Header */}
        <View style={styles.chartHeader}>
          <Text style={styles.chartTitle}>
            {chartTitleText.main} <Text style={styles.chartSubtitle}>{chartTitleText.sub}</Text>
          </Text>
        </View>

        {/* Timeframe Selector Segmented Control */}
        <View style={styles.timeframeTabsContainer}>
          {[
            { key: 'day', label: 'Day' },
            { key: 'week', label: 'Week' },
            { key: 'month', label: 'Month' },
            { key: '3months', label: '3 Months' },
          ].map(tab => {
            const isActive = timeframe === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={styles.timeframeTabTouch}
                onPress={() => {
                  setTimeframe(tab.key);
                  setSelectedPointIdx(null);
                }}
                activeOpacity={0.8}
              >
                {isActive ? (
                  <LinearGradient
                    colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                    style={styles.timeframeActiveTabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.timeframeActiveTabLabel}>{tab.label}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.timeframeInactiveTabLabel}>{tab.label}</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* 7. Workout Bar Chart */}
        <View style={styles.chartCard}>
          <View style={styles.chartPlotArea}>
            <View style={styles.gridLinesContainer}>
              <View style={styles.gridLineRow}><Text style={styles.gridLineLabel}>{yAxisLabels[0]}</Text></View>
              <View style={styles.gridLineRow}><Text style={styles.gridLineLabel}>{yAxisLabels[1]}</Text></View>
              <View style={styles.gridLineRow}><Text style={styles.gridLineLabel}>{yAxisLabels[2]}</Text></View>
              <View style={styles.gridLineRow}><Text style={styles.gridLineLabel}>{yAxisLabels[3]}</Text></View>
            </View>

            <View style={styles.barsContainer}>
              {chartData.map((item, idx) => {
                const val = activeMetric === 'duration'
                  ? item.duration
                  : activeMetric === 'volume'
                    ? item.volume
                    : item.reps;
                const barHeightPct = val > 0
                  ? Math.max(Math.min((val / maxVal) * 85, 95), 6) + '%'
                  : '0%';
                const isSelected = selectedPointIdx === idx;
                const isLatest = selectedPointIdx === null && idx === chartData.length - 1;
                const highlight = isSelected || isLatest;

                return (
                  <TouchableOpacity
                    key={idx}
                    style={styles.barCol}
                    activeOpacity={0.8}
                    onPress={() => setSelectedPointIdx(selectedPointIdx === idx ? null : idx)}
                  >
                    <View style={styles.barTrack}>
                      <View
                        style={[
                          styles.barFill,
                          {
                            height: barHeightPct,
                            backgroundColor: highlight ? '#EE822A' : 'rgba(238, 130, 42, 0.4)',
                          },
                        ]}
                      />
                    </View>
                    <Text
                      style={[styles.barLabel, highlight && styles.barLabelActive]}
                      numberOfLines={1}
                    >
                      {item.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Metric Pills (Rep, Volume, Duration) */}
          <View style={styles.metricFiltersRow}>
            {[
              { key: 'reps', label: 'Rep' },
              { key: 'volume', label: 'Volume' },
              { key: 'duration', label: 'Duration' },
            ].map(m => {
              const isActive = activeMetric === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.metricPill, isActive && styles.metricPillActive]}
                  onPress={() => {
                    setActiveMetric(m.key);
                    setSelectedPointIdx(null);
                  }}
                  activeOpacity={0.8}
                >
                  {isActive && (
                    <LinearGradient
                      colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                      style={StyleSheet.absoluteFillObject}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    />
                  )}
                  <Text style={isActive ? styles.metricPillTextActive : styles.metricPillText}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* 8. Comparison Section (Only shown when viewing other athletes) */}
        {!isSelf && (
          <View>
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
          </View>
        )}

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
              onShowOptions={handleShowPostOptions}
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

      {/* Edit Workout Post Modal */}
      <EditWorkoutPostModal
        visible={isEditModalVisible}
        post={editingPost}
        onClose={() => {
          setIsEditModalVisible(false);
          setTimeout(() => {
            setEditingPost(null);
          }, 450);
        }}
        onSaveSuccess={handleEditPostSuccess}
      />

      {/* Posted / Updated Success Pop Up 🎉 */}
      <PostedSuccessPopup
        visible={showSuccessPopup}
        title={successPopupTitle}
        duration={3000}
        onDismiss={() => setShowSuccessPopup(false)}
      />
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
    marginTop: 14,
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
    backgroundColor: '#EE822A',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 25,
    overflow: 'hidden',
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
  editProfileButton: {
    backgroundColor: '#1E1E24',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 25,
  },
  editProfileButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  editProfileButtonIcon: {
    marginRight: 8,
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
  timeframeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#161618',
    height: 38,
    borderRadius: 19,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 20,
    marginBottom: 16,
  },
  timeframeTabTouch: {
    flex: 1,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeframeActiveTabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeframeActiveTabLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'BRLNSR',
  },
  timeframeInactiveTabLabel: {
    color: 'rgba(255, 255, 255, 0.45)',
    fontSize: 12,
    fontWeight: '600',
  },
  metricFiltersRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    gap: 12,
  },
  metricPillActive: {
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 20,
    overflow: 'hidden',
    borderColor: 'transparent',
  },
  metricPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingVertical: 7,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    overflow: 'hidden',
  },
  metricPillTextActive: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'BRLNSR',
  },
  metricPillText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 12,
    fontWeight: '600',
  },
  barLabelActive: {
    color: '#EE822A',
    fontWeight: 'bold',
  },
  gridLineLabel: {
    color: '#555',
    fontSize: 9,
    fontWeight: '600',
    position: 'absolute',
    left: 0,
    top: -6,
  },
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: '100%',
    paddingLeft: 38,
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
    backgroundColor: '#EE822A',
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
  postOptionsBtn: {
    padding: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
