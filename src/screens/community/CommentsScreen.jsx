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
  ActivityIndicator
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

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

const popularEmojis = ['💪', '🔥', '👏', '🏋️', '👊', '😰', '🏆'];

const CommentsScreen = ({ route, navigation }) => {
  const { post } = route.params;
  const { user } = useAuth();
  const profileData = user?.userProfile || user?.memberProfile || user || {};
  const loggedInUserAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.profilePhoto ||
    profileData.avatar;
  const loggedInUserInitials = getInitials(profileData);

  const [comments, setComments] = useState(post.comments || []);
  const [commentText, setCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  const postUserDisplayName = getDisplayName(post.user);
  const postUserInitials = getInitials(post.user);
  const postFormattedDate = getFormattedDate(post.date || post.createdAt);
  const workoutTitle = post.workoutName || post.workoutType || 'Workout';
  const [likesCount, setLikesCount] = useState(post.likesCount ?? post.likes ?? 0);
  const [isLiked, setIsLiked] = useState(
    Boolean(post.isLiked || post.likedByMe || post.hasLiked || post.userLiked)
  );

  const handleToggleLike = async () => {
    const nextLiked = !isLiked;
    setIsLiked(nextLiked);
    setLikesCount(prev => Math.max(prev + (nextLiked ? 1 : -1), 0));
    try {
      await apiClient.post(`/workouts/sessions/${post.id}/like`);
    } catch (error) {
      setIsLiked(!nextLiked);
      setLikesCount(prev => Math.max(prev + (nextLiked ? -1 : 1), 0));
    }
  };

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await apiClient.get(`/workouts/sessions/${post.id}/comments`);
        setComments(response.data?.data || []);
      } catch (error) {
        console.log('Failed to fetch comments', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchComments();
  }, [post.id]);

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
      // rollback
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

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Custom Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
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
          removeClippedSubviews={Platform.OS === 'android'}
          initialNumToRender={6}
          maxToRenderPerBatch={6}
          windowSize={5}
          ListHeaderComponent={
            <View style={styles.postHeaderBlock}>
              {/* Post Author Info */}
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

              {/* Workout Name Row */}
              <TouchableOpacity style={styles.workoutNameRow}>
                <Text style={styles.workoutNameText}>{workoutTitle}</Text>
                <Icon name="chevron-forward" size={18} color="#8E8E93" />
              </TouchableOpacity>

              {/* Likes & Comments Count Header Row */}
              <View style={styles.statsRow}>
                <View style={styles.likesLeft}>
                  <TouchableOpacity onPress={handleToggleLike} activeOpacity={0.7}>
                    <Feather
                      name="thumbs-up"
                      size={18}
                      color={isLiked ? '#5E5CE6' : '#FFF'}
                      style={{ marginRight: 10 }}
                    />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{ flexDirection: 'row', alignItems: 'center' }}
                    onPress={() => navigation.navigate('LikesList', { sessionId: post.id })}
                    activeOpacity={0.7}
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
                    <Text style={styles.statsText}>{likesCount} likes</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.statsText}>{comments.length} comments</Text>
              </View>
            </View>
          }
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
                <TouchableOpacity style={styles.replyButton}>
                  <Text style={styles.replyText}>Reply</Text>
                </TouchableOpacity>
              </View>
              <TouchableOpacity
                style={styles.commentLikeButton}
                onPress={() => handleToggleCommentLike(item.id)}
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
            isLoading ? (
              <ActivityIndicator size="large" color="#5E5CE6" style={{ marginTop: 40 }} />
            ) : (
              <Text style={styles.emptyText}>No comments yet.</Text>
            )
          }
          contentContainerStyle={styles.listContent}
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
              >
                <Icon name="arrow-up" size={18} color="#FFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  postHeaderBlock: {
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.15)',
    marginBottom: 20,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: 12,
    backgroundColor: '#333',
  },
  authorDetails: {
    flex: 1,
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
  workoutNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  workoutNameText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '800',
    fontFamily: 'BRLNSR',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  likesLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  statsText: {
    color: '#8E8E93',
    fontSize: 14,
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
    marginTop: 40,
    fontSize: 15,
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

export default CommentsScreen;
