import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  FlatList,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  StatusBar,
  Alert,
  Share,
  Linking,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { resolveExerciseImageUri, getExerciseMuscleFallback } from '../../redux/actions/workoutActions';

const { width } = Dimensions.get('window');

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

  if (str.includes('min') || str.includes('h') || str.includes('m') || str.includes('s')) {
    return str;
  }

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

const popularEmojis = ['💪', '🔥', '👏', '🏋️', '👊', '😰', '🏆'];

// Muscle split exercise name mapping
const EXERCISE_MUSCLE_MAP = {
  'bench press': 'Chest',
  'incline bench press': 'Chest',
  'decline bench press': 'Chest',
  'dumbbell fly': 'Chest',
  'chest fly': 'Chest',
  'push up': 'Chest',
  'push-up': 'Chest',
  'dip': 'Chest',
  'bicep': 'Arms',
  'curl': 'Arms',
  'tricep': 'Arms',
  'extension': 'Arms',
  'pushdown': 'Arms',
  'skull crusher': 'Arms',
  'hammer curl': 'Arms',
  'shoulder press': 'Shoulders',
  'military press': 'Shoulders',
  'lateral raise': 'Shoulders',
  'front raise': 'Shoulders',
  'rear delt': 'Shoulders',
  'overhead press': 'Shoulders',
  'row': 'Back',
  'pulldown': 'Back',
  'pull up': 'Back',
  'pull-up': 'Back',
  'chin up': 'Back',
  'chin-up': 'Back',
  'deadlift': 'Back',
  'hyperextension': 'Back',
  'squat': 'Legs',
  'leg press': 'Legs',
  'leg extension': 'Legs',
  'leg curl': 'Legs',
  'calf raise': 'Legs',
  'lunge': 'Legs',
  'leg': 'Legs',
  'crunch': 'Core',
  'plank': 'Core',
  'sit up': 'Core',
  'sit-up': 'Core',
  'leg raise': 'Core',
  'ab': 'Core'
};

const calculateMuscleSplit = (exercises) => {
  if (!exercises || exercises.length === 0) return [];

  const muscleSets = {};
  let totalSets = 0;

  exercises.forEach(ex => {
    const nameLower = (ex.name || '').toLowerCase();
    let muscleGroup = 'Other';

    for (const [key, group] of Object.entries(EXERCISE_MUSCLE_MAP)) {
      if (nameLower.includes(key)) {
        muscleGroup = group;
        break;
      }
    }

    const setsCount = ex.sets?.length || 0;
    if (setsCount > 0) {
      muscleSets[muscleGroup] = (muscleSets[muscleGroup] || 0) + setsCount;
      totalSets += setsCount;
    }
  });

  if (totalSets === 0) return [];

  return Object.entries(muscleSets)
    .map(([muscle, count]) => ({
      muscle,
      percentage: Math.round((count / totalSets) * 100)
    }))
    .sort((a, b) => b.percentage - a.percentage);
};

// Fallback mock exercises when no exercise details exist in the session
const fallbackExercises = [
  {
    exerciseId: 'fallback-ex-1',
    name: 'Bench Press (Barbell)',
    sets: [
      { reps: 25, weight: 15, completed: true, isPR: true, isWeightPR: true, isVolumePR: true, is1RMPR: true }
    ]
  }
];

const PostDetailsScreen = ({ route, navigation }) => {
  const { post: initialPost } = route.params;
  const { user } = useAuth();
  const profileData = user?.userProfile || user?.memberProfile || user || {};
  const loggedInUserAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.profilePhoto ||
    profileData.avatar;
  const loggedInUserInitials = getInitials(profileData);

  const [post, setPost] = useState(initialPost);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [isLoadingComments, setIsLoadingComments] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [currentMediaSlide, setCurrentMediaSlide] = useState(0);
  const [failedImages, setFailedImages] = useState({});

  const [shareModalVisible, setShareModalVisible] = useState(false);

  const getShareTextAndUrl = (targetPost) => {
    if (!targetPost) return { text: '', url: 'https://swapp.fit' };
    const userName = getDisplayName(targetPost.user) || 'Swapp Athlete';
    const workoutName = targetPost.workoutName || targetPost.workoutType || 'workout';
    const postUrl = `https://swapp.fit/post/${targetPost.id}`;
    const text = `Check out ${userName}'s ${workoutName} on Swapp! 💪🔥\n${postUrl}`;
    return { text, url: postUrl };
  };

  const handleShareToWhatsApp = async () => {
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

  const handleShareToTwitter = async () => {
    const { text, url } = getShareTextAndUrl(post);
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    try {
      await Linking.openURL(twitterUrl);
    } catch (err) {
      Share.share({ message: text, url });
    }
  };

  const handleShareToFacebook = async () => {
    const { text, url } = getShareTextAndUrl(post);
    const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    try {
      await Linking.openURL(fbUrl);
    } catch (err) {
      Share.share({ message: text, url });
    }
  };

  const handleShareToInstagram = async () => {
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

  const handleNativeShare = () => {
    const { text, url } = getShareTextAndUrl(post);
    Share.share({
      title: 'Share Workout Post',
      message: text,
      url: url,
    }).catch(err => console.log('Share error:', err));
  };

  const postUserDisplayName = getDisplayName(post.user);
  const postUserInitials = getInitials(post.user);
  const postFormattedDate = getFormattedDate(post.date || post.createdAt);
  const workoutTitle = post.workoutName || post.workoutType || 'Workout';
  const caption = post.caption || post.description || post.notes;
  const imageUrl = post.imageUrl || post.image || post.mediaUrl;
  const likesCount = post.likesCount ?? post.likes ?? 0;
  const isLiked = Boolean(post.isLiked || post.likedByMe || post.hasLiked || post.userLiked);
  const duration = post.stats?.duration || post.duration || 0;
  const volume = post.stats?.volume || 0;
  const calories = post.stats?.calories || post.calories || 0;

  // Determine exercises list from logs or props
  let exercises = [];
  if (Array.isArray(post.logs) && post.logs.length > 0) {
    exercises = post.logs.map(log => ({
      exerciseId: log.exerciseId,
      name: log.exercise?.name || 'Exercise',
      sets: Array.isArray(log.sets) ? log.sets : []
    }));
  } else {
    exercises = post.exercises || post.sessionData?.exercises || [];
  }
  const exercisesToRender = exercises;

  // Calculate muscle split
  const rawMuscleSplit = calculateMuscleSplit(exercisesToRender);
  const muscleSplit = rawMuscleSplit.length > 0 ? rawMuscleSplit : [
    { muscle: 'Chest', percentage: 50 },
    { muscle: 'Arms', percentage: 25 },
    { muscle: 'Shoulders', percentage: 25 }
  ];

  const isOwnPost = post.userId === user?.id || post.user?.id === user?.id;

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

  useEffect(() => {
    fetchComments();
  }, [post.id]);

  const fetchComments = async () => {
    setIsLoadingComments(true);
    try {
      const response = await apiClient.get(`/workouts/sessions/${post.id}/comments`);
      setComments(response.data?.data || []);
    } catch (error) {
      console.log('Failed to fetch comments', error);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleToggleLike = async () => {
    const nextLiked = !isLiked;
    const nextLikesCount = Math.max(likesCount + (nextLiked ? 1 : -1), 0);
    setPost(prev => ({
      ...prev,
      isLiked: nextLiked,
      likesCount: nextLikesCount
    }));

    try {
      await apiClient.post(`/workouts/sessions/${post.id}/like`);
    } catch (error) {
      setPost(prev => ({
        ...prev,
        isLiked: !nextLiked,
        likesCount: likesCount
      }));
    }
  };

  const submitComment = async () => {
    const content = commentText.trim();
    if (!content || commentSubmitting) return;

    setCommentSubmitting(true);
    try {
      const response = await apiClient.post(
        `/workouts/sessions/${post.id}/comments`,
        { content },
      );
      const newComment = response.data?.data;
      if (newComment) {
        setComments(currentComments => [...currentComments, newComment]);
        setCommentText('');
        setPost(prev => ({
          ...prev,
          commentsCount: (prev.commentsCount || 0) + 1
        }));
      }
    } catch (error) {
      console.log('Failed to submit comment', error);
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleToggleCommentLike = async (commentId) => {
    setComments(currentComments =>
      currentComments.map(comment => {
        if (comment.id === commentId) {
          const isLikedNow = !comment.isLiked;
          const nextCount = Math.max((comment.likesCount || 0) + (isLikedNow ? 1 : -1), 0);
          return { ...comment, isLiked: isLikedNow, likesCount: nextCount };
        }
        return comment;
      })
    );

    try {
      await apiClient.post(`/workouts/sessions/comments/${commentId}/like`);
    } catch (error) {
      setComments(currentComments =>
        currentComments.map(comment => {
          if (comment.id === commentId) {
            const isLikedNow = !comment.isLiked;
            const nextCount = Math.max((comment.likesCount || 0) + (isLikedNow ? 1 : -1), 0);
            return { ...comment, isLiked: isLikedNow, likesCount: nextCount };
          }
          return comment;
        })
      );
    }
  };

  const handleEmojiPress = (emoji) => {
    setCommentText(prev => prev + emoji);
  };

  const handleEditWorkout = () => {
    Alert.alert('Edit Workout', 'Would you like to edit this workout session?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Edit',
        onPress: () => {
          if (post.templateId) {
            navigation.navigate('WorkoutEditorScreen', { templateId: post.templateId });
          } else {
            Alert.alert('Info', 'This is a finished workout session and cannot be modified.');
          }
        }
      }
    ]);
  };

  const renderPostHeader = () => {
    return (
      <View style={styles.postCard}>
        <View style={{ paddingHorizontal: 16 }}>
          {/* User Info Row */}
          <View style={styles.postHeaderRow}>
            <TouchableOpacity
              style={styles.authorRow}
              onPress={() => navigation.navigate('UserProfile', { userId: post.userId || post.user?.id, user: post.user })}
              activeOpacity={0.8}
            >
              {post.user?.avatar ? (
                <Image source={{ uri: post.user.avatar }} style={styles.authorAvatar} />
              ) : (
                <View style={[styles.authorAvatar, styles.initialsAvatar]}>
                  <Text style={styles.authorInitialsText}>{postUserInitials}</Text>
                </View>
              )}
              <View style={styles.authorDetails}>
                <Text style={styles.authorName}>{postUserDisplayName}</Text>
                <Text style={styles.postDate}>{postFormattedDate}</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Workout Title */}
          <Text style={styles.postWorkoutTitle}>{workoutTitle}</Text>

          {/* Caption */}
          {caption ? (
            <View style={styles.captionContainer}>
              <Text style={styles.captionText}>{caption}</Text>
            </View>
          ) : null}

          {/* Workout Stats */}
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
            {post.stats?.records > 0 && (
              <View style={styles.postStatItem}>
                <Text style={styles.postStatLabel}>Records</Text>
                <Text style={styles.postStatValue}>🥇 {post.stats.records}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Media Content (Image Card Carousel) */}
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
                <Image
                  key={index}
                  source={{
                    uri,
                    headers: uri.includes('rapidapi') ? {
                      'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
                      'x-rapidapi-key': '0232da47famsh2b99ed94d5627b8p195111jsnc217869da53d',
                    } : undefined,
                  }}
                  style={[styles.postMediaImage, { width: cardWidth }]}
                  resizeMode="cover"
                />
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
          const exercises = (post.logs && post.logs.length > 0)
            ? post.logs
            : (post.exercises && post.exercises.length > 0)
              ? post.exercises
              : (post.sessionData?.exercises || []);

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
                  const imageKey = `${post.id}-${index}-${primaryUri || 'none'}`;
                  const isFailed = primaryUri ? failedImages[imageKey] : true;

                  const imageSource = (primaryUri && !isFailed)
                    ? {
                        uri: primaryUri,
                        headers: primaryUri.includes('rapidapi') ? {
                          'x-rapidapi-host': 'edb-with-videos-and-images-by-ascendapi.p.rapidapi.com',
                          'x-rapidapi-key': '0232da47famsh2b99ed94d5627b8p195111jsnc217869da53d',
                        } : undefined,
                      }
                    : getExerciseMuscleFallback(exObj);

                  return (
                    <View key={index} style={{ width: cardWidth, height: '100%' }}>
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
                    </View>
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

        {/* Action Buttons & Detail Sections */}
        <View style={{ paddingHorizontal: 16 }}>
          <View style={styles.postActionsRow}>
            <View style={[styles.postActionButton, { gap: 4 }]}>
              <TouchableOpacity onPress={handleToggleLike} activeOpacity={0.7}>
                <Feather
                  name="thumbs-up"
                  size={22}
                  color={isLiked ? '#5E5CE6' : '#FFF'}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('LikesList', { sessionId: post.id })} activeOpacity={0.7}>
                <Text style={styles.postActionText}>{likesCount}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.postActionButton}>
              <Icon name="chatbubble-outline" size={22} color="#FFF" />
              <Text style={styles.postActionText}>{comments.length}</Text>
            </View>

            <TouchableOpacity
              style={styles.postActionButton}
              activeOpacity={0.7}
              onPress={() => setShareModalVisible(true)}
            >
              <Icon name="share-outline" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>

          {/* Overlapping Liked users */}
          {likesCount > 0 && (
            <TouchableOpacity
              style={styles.likedBySection}
              onPress={() => navigation.navigate('LikesList', { sessionId: post.id })}
              activeOpacity={0.8}
            >
              <View style={styles.overlappingAvatars}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80' }}
                  style={[styles.smallAvatar, { zIndex: 3 }]}
                />
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=100&q=80' }}
                  style={[styles.smallAvatar, { zIndex: 2, marginLeft: -6 }]}
                />
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80' }}
                  style={[styles.smallAvatar, { zIndex: 1, marginLeft: -6 }]}
                />
              </View>
              <Text style={styles.likedByText}>
                Liked by <Text style={styles.likedByHighlight}>somemaren</Text> and others
              </Text>
            </TouchableOpacity>
          )}

          <View style={styles.divider} />

          {/* Muscle Split Section */}
          {muscleSplit.length > 0 && (
            <View style={styles.muscleSplitSection}>
              <Text style={styles.sectionHeaderTitle}>Muscle Split</Text>
              {muscleSplit.map((item, idx) => (
                <View key={idx} style={styles.muscleRow}>
                  <Text style={styles.muscleLabel}>{item.muscle}</Text>
                  <View style={styles.barContainer}>
                    <View style={styles.barTrack}>
                      <View style={[styles.barFill, { width: `${item.percentage}%` }]} />
                    </View>
                    <Text style={styles.percentageText}>{item.percentage}%</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          <View style={styles.divider} />

          {/* Workout Exercises Section */}
          <View style={styles.workoutSection}>
            <View style={styles.workoutHeaderRow}>
              <Text style={styles.sectionHeaderTitle}>Workout</Text>
              {isOwnPost && (
                <TouchableOpacity onPress={handleEditWorkout} activeOpacity={0.7}>
                  <Text style={styles.editWorkoutBtnText}>Edit Workout</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {exercisesToRender.map((ex, exIdx) => (
            <View key={ex.exerciseId || exIdx} style={styles.exerciseCard}>
              <View style={styles.exerciseHeader}>
                <View style={styles.exerciseIconContainer}>
                  <Icon name="barbell" size={18} color="#007AFF" />
                </View>
                <Text style={styles.exerciseName}>{ex.name}</Text>
              </View>

              <View style={styles.setTableHeader}>
                <Text style={[styles.tableHeaderCell, { width: 50 }]}>SET</Text>
                <Text style={styles.tableHeaderCell}>WEIGHT & REPS</Text>
              </View>

              {ex.sets.map((set, setIdx) => {
                const showMedals = Boolean(set.isPR || set.isWeightPR || set.isVolumePR || set.is1RMPR);
                return (
                  <View key={setIdx} style={styles.setRowContainer}>
                    <View style={styles.setRow}>
                      <Text style={[styles.setText, { width: 50 }]}>{setIdx + 1}</Text>
                      <Text style={styles.setDetailText}>
                        {set.weight} kg x {set.reps}
                      </Text>
                    </View>
                    {showMedals && (
                      <View style={styles.medalsRow}>
                        <View style={styles.medalBadge}>
                          <Text style={styles.medalIcon}>🥇</Text>
                          <Text style={styles.medalText}>Weight</Text>
                        </View>
                        <View style={styles.medalBadge}>
                          <Text style={styles.medalIcon}>🥇</Text>
                          <Text style={styles.medalText}>Volume</Text>
                        </View>
                        <View style={styles.medalBadge}>
                          <Text style={styles.medalIcon}>🥇</Text>
                          <Text style={styles.medalText}>1RM</Text>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Comments Section Title */}
        <Text style={styles.commentsSectionTitle}>Comments</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      {/* 1. Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        style={{ flex: 1 }}
      >
        {/* 2. Main content list */}
        <FlatList
          data={comments}
          keyExtractor={(item, index) => (item.id || index).toString()}
          ListHeaderComponent={renderPostHeader}
          renderItem={({ item }) => (
            <View style={styles.commentRow}>
              <TouchableOpacity
                onPress={() => navigation.navigate('UserProfile', { userId: item.userId || item.user?.id, user: item.user })}
                activeOpacity={0.8}
              >
                {item.user?.avatar ? (
                  <Image
                    source={{ uri: item.user.avatar }}
                    style={styles.commentAvatar}
                  />
                ) : (
                  <View style={[styles.commentAvatar, styles.initialsAvatar]}>
                    <Text style={styles.commentInitialsText}>
                      {getInitials(item.user)}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.commentTextContainer}>
                <View style={styles.commentAuthorRow}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('UserProfile', { userId: item.userId || item.user?.id, user: item.user })}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.commentName}>
                      {getDisplayName(item.user)}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.commentTimeText}>
                    {getShortTimeAgo(item.createdAt)}
                  </Text>
                </View>
                <Text style={styles.commentContent}>{item.content}</Text>
                <TouchableOpacity style={styles.replyButton} activeOpacity={0.7}>
                  <Text style={styles.replyText}>Reply</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.commentLikeButton}
                onPress={() => handleToggleCommentLike(item.id)}
                activeOpacity={0.7}
              >
                <Feather
                  name="thumbs-up"
                  size={14}
                  color={item.isLiked ? '#5E5CE6' : '#8E8E93'}
                />
                <Text style={[styles.commentLikeCount, item.isLiked && { color: '#5E5CE6' }]}>
                  {item.likesCount ?? 0}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={
            isLoadingComments ? (
              <ActivityIndicator size="large" color="#5E5CE6" style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.emptyText}>No comments yet. Be the first to reply!</Text>
            )
          }
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* 3. Footer Emoji bar & text input */}
        <View style={styles.inputContainer}>
          {/* Emojis row */}
          <View style={styles.emojisRow}>
            {popularEmojis.map((emoji) => (
              <TouchableOpacity
                key={emoji}
                style={styles.emojiButton}
                onPress={() => handleEmojiPress(emoji)}
                activeOpacity={0.7}
              >
                <Text style={styles.emojiText}>{emoji}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Text input row */}
          <View style={styles.inputRow}>
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
            <View style={styles.textInputWrapper}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment..."
                placeholderTextColor="rgba(255,255,255,0.4)"
                style={styles.textInput}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !commentText.trim() && styles.sendButtonDisabled
                ]}
                onPress={submitComment}
                disabled={!commentText.trim() || commentSubmitting}
                activeOpacity={0.8}
              >
                <Icon name="arrow-up" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: 24,
  },
  postCard: {
    paddingVertical: 16,
  },
  postHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    backgroundColor: '#333',
  },
  authorDetails: {
    justifyContent: 'center',
  },
  authorName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'BRLNSR',
  },
  postDate: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  postWorkoutTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'BRLNSR',
    marginBottom: 8,
  },
  captionContainer: {
    marginBottom: 16,
  },
  captionText: {
    color: '#DDD',
    fontSize: 15,
    lineHeight: 20,
  },
  postStatsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 0,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 16,
    gap: 24,
  },
  postStatItem: {
    flexDirection: 'column',
  },
  postStatLabel: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  postStatValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  postMediaContainer: {
    height: 320,
    borderRadius: 0,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#111',
  },
  postMediaImage: {
    height: 320,
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
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  mediaDotActive: {
    backgroundColor: '#007AFF',
    width: 16,
  },
  postActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 16,
    paddingHorizontal: 4,
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
  likedBySection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  overlappingAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  smallAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: '#000',
  },
  likedByText: {
    color: '#8E8E93',
    fontSize: 13,
  },
  likedByHighlight: {
    color: '#FFF',
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 16,
  },
  muscleSplitSection: {
    paddingHorizontal: 4,
  },
  sectionHeaderTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
    marginBottom: 16,
  },
  muscleRow: {
    marginBottom: 16,
  },
  muscleLabel: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  barTrack: {
    height: 12,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 6,
    flex: 1,
  },
  barFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 6,
  },
  percentageText: {
    color: '#8E8E93',
    fontSize: 14,
    marginLeft: 12,
    minWidth: 35,
    textAlign: 'right',
  },
  workoutSection: {
    paddingHorizontal: 4,
  },
  workoutHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  editWorkoutBtnText: {
    color: '#007AFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  exerciseCard: {
    marginBottom: 24,
  },
  exerciseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,122,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  exerciseName: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setTableHeader: {
    flexDirection: 'row',
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    paddingBottom: 4,
  },
  tableHeaderCell: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
  },
  setRowContainer: {
    marginBottom: 12,
  },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  setText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  setDetailText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  medalsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingLeft: 50,
    marginTop: 4,
  },
  medalBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  medalIcon: {
    fontSize: 14,
  },
  medalText: {
    color: '#E0A900',
    fontSize: 12,
    fontWeight: '600',
  },
  commentsSectionTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    fontFamily: 'BRLNSR',
    marginTop: 8,
    paddingBottom: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  commentAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    marginRight: 12,
    backgroundColor: '#333',
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
    fontFamily: 'BRLNSR',
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
  replyButton: {
    marginTop: 6,
  },
  replyText: {
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
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
  emptyText: {
    color: 'rgba(255,255,255,0.4)',
    textAlign: 'center',
    marginTop: 24,
    fontSize: 14,
  },
  initialsAvatar: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  commentInitialsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  authorInitialsText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  inputContainer: {
    backgroundColor: '#000',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.12)',
  },
  emojisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  emojiButton: {
    padding: 4,
  },
  emojiText: {
    fontSize: 24,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 22,
    paddingLeft: 16,
    paddingRight: 6,
    height: 44,
  },
  textInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 15,
    paddingVertical: 8,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#5E5CE6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#2C2C2E',
    opacity: 0.5,
  },
});

export default PostDetailsScreen;
