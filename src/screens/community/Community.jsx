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
  ImageBackground,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import apiClient from '../../api/apiClient';

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

const Community = () => {
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setFetchError(null);
    try {
      const response = await apiClient.get('/workouts/sessions/community');
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
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const formatCount = count => {
    if (count >= 1000) {
      return (count / 1000).toFixed(1) + 'K';
    }
    return count;
  };

  const getTimeAgo = dateString => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));

    if (diffInHours < 1) return 'Just now';
    if (diffInHours === 1) return '1 hour ago';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

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

  const openComments = async post => {
    setSelectedPost(post);
    setComments([]);
    setCommentsLoading(true);

    try {
      const response = await apiClient.get(
        `/workouts/sessions/${post.id}/comments`,
      );
      setComments(response.data?.data || []);
    } catch (error) {
      setComments([]);
    } finally {
      setCommentsLoading(false);
    }
  };

  const submitComment = async () => {
    const content = commentText.trim();
    if (!content || !selectedPost || commentSubmitting) return;

    setCommentSubmitting(true);

    try {
      const response = await apiClient.post(
        `/workouts/sessions/${selectedPost.id}/comments`,
        { content },
      );
      const newComment = response.data?.data;
      if (newComment) {
        setComments(currentComments => [newComment, ...currentComments]);
        updatePost(selectedPost.id, item => ({
          ...item,
          commentsCount:
            newComment.commentsCount ?? (item.commentsCount || 0) + 1,
          comments: newComment.commentsCount ?? (item.comments || 0) + 1,
        }));
        setSelectedPost(item =>
          item
            ? {
                ...item,
                commentsCount:
                  newComment.commentsCount ?? (item.commentsCount || 0) + 1,
                comments: newComment.commentsCount ?? (item.comments || 0) + 1,
              }
            : item,
        );
      }
      setCommentText('');
    } catch (error) {
      console.log(
        'Failed to submit comment',
        error?.response?.data || error.message,
      );
    } finally {
      setCommentSubmitting(false);
    }
  };

  const PostItem = ({ item }) => {
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

    return (
      <View style={styles.postContainer}>
        <View style={styles.imageWrapper}>
          {imageUrl ? (
            <ImageBackground
              source={{ uri: imageUrl }}
              style={styles.backgroundImage}
              imageStyle={{ borderRadius: 16 }}
            >
              <PostOverlays
                item={item}
                duration={duration}
                volume={volume}
                sets={sets}
                likesCount={likesCount}
                commentsCount={commentsCount}
                isLiked={isLiked}
                userName={userName}
                userInitials={userInitials}
                caption={caption}
              />
            </ImageBackground>
          ) : (
            <View style={[styles.backgroundImage, styles.missingImage]}>
              <PostOverlays
                item={item}
                duration={duration}
                volume={volume}
                sets={sets}
                likesCount={likesCount}
                commentsCount={commentsCount}
                isLiked={isLiked}
                userName={userName}
                userInitials={userInitials}
                caption={caption}
              />
            </View>
          )}
        </View>
      </View>
    );
  };

  const PostOverlays = ({
    item,
    duration,
    volume,
    sets,
    likesCount,
    commentsCount,
    isLiked,
    userName,
    userInitials,
    caption,
  }) => (
    <>
      {/* Top Overlay - Stats */}
      <View style={styles.topOverlay}>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Icon name="time-outline" size={16} color="#111" />
          </View>
          <View>
            <Text style={styles.statLabel}>DURATION</Text>
            <Text style={styles.statValue}>{duration}min</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Icon name="barbell-outline" size={16} color="#111" />
          </View>
          <View>
            <Text style={styles.statLabel}>VOLUME</Text>
            <Text style={styles.statValue}>{volume} kg</Text>
          </View>
        </View>
        <View style={styles.statItem}>
          <View style={styles.statIcon}>
            <Icon name="list-outline" size={16} color="#111" />
          </View>
          <View>
            <Text style={styles.statLabel}>SETS</Text>
            <Text style={styles.statValue}>{sets}</Text>
          </View>
        </View>
      </View>

      {/* Right Overlay - Actions */}
      <View style={styles.rightOverlay}>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => handleToggleLike(item)}
        >
          <Icon
            name={isLiked ? 'heart' : 'heart-outline'}
            size={28}
            color={isLiked ? '#FF3B30' : '#FFF'}
          />
          <Text style={styles.actionText}>{formatCount(likesCount)}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => openComments(item)}
        >
          <Icon name="chatbubble-outline" size={28} color="#FFF" />
          <Text style={styles.actionText}>{formatCount(commentsCount)}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="paper-plane-outline" size={28} color="#FFF" />
          <Text style={styles.actionText}>
            {formatCount(item.sharesCount ?? item.shares ?? 0)}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Icon name="bookmark-outline" size={28} color="#FFF" />
          <Text style={styles.actionText}>
            {formatCount(item.savesCount ?? item.saves ?? 0)}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Overlay - User Info & Caption */}
      <View style={styles.bottomOverlay}>
        <View style={styles.userInfoRow}>
          {item.user?.avatar ? (
            <Image source={{ uri: item.user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.initialsAvatar]}>
              <Text style={styles.initialsText}>{userInitials}</Text>
            </View>
          )}
          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              {userName ? (
                <Text style={styles.userName}>{userName}</Text>
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
            {item.date || item.createdAt ? (
              <Text style={styles.timeAgo}>
                {getTimeAgo(item.date || item.createdAt)}
              </Text>
            ) : null}
          </View>
          {!item.isOwnPost && (
            <TouchableOpacity
              style={[
                styles.followBtn,
                item.isFollowing && styles.followingBtn,
              ]}
              onPress={() => handleToggleFollow(item)}
            >
              <Text
                style={[
                  styles.followBtnText,
                  item.isFollowing && styles.followingBtnText,
                ]}
              >
                {item.isFollowing ? 'Following' : 'Follow'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {caption ? (
          <View style={styles.captionContainer}>
            <Text style={styles.captionText}>{caption}</Text>
          </View>
        ) : null}
      </View>
    </>
  );

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
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => <PostItem item={item} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {fetchError || 'No community posts yet.'}
                </Text>
              </View>
            }
            showsVerticalScrollIndicator={false}
            snapToInterval={screenHeight - 180} // Approximate height of the card + margins
            snapToAlignment="start"
            decelerationRate="fast"
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
      <Modal
        visible={Boolean(selectedPost)}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPost(null)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalBackdrop}
        >
          <TouchableOpacity
            style={styles.modalScrim}
            activeOpacity={1}
            onPress={() => setSelectedPost(null)}
          />
          <View style={styles.commentsSheet}>
            <View style={styles.sheetHandle} />
            <View style={styles.commentsHeader}>
              <Text style={styles.commentsTitle}>Comments</Text>
              <TouchableOpacity onPress={() => setSelectedPost(null)}>
                <Icon name="close" size={24} color="#FFF" />
              </TouchableOpacity>
            </View>

            {commentsLoading ? (
              <ActivityIndicator
                size="large"
                color="#5E5CE6"
                style={{ marginTop: 24 }}
              />
            ) : (
              <FlatList
                data={comments}
                keyExtractor={item => item.id.toString()}
                style={styles.commentsList}
                ListEmptyComponent={
                  <Text style={styles.emptyCommentsText}>No comments yet.</Text>
                }
                renderItem={({ item }) => (
                  <View style={styles.commentRow}>
                    {item.user?.avatar ? (
                      <Image
                        source={{ uri: item.user.avatar }}
                        style={styles.commentAvatar}
                      />
                    ) : (
                      <View
                        style={[styles.commentAvatar, styles.initialsAvatar]}
                      >
                        <Text style={styles.commentInitialsText}>
                          {getInitials(item.user)}
                        </Text>
                      </View>
                    )}
                    <View style={styles.commentBubble}>
                      <Text style={styles.commentName}>
                        {getDisplayName(item.user)}
                      </Text>
                      <Text style={styles.commentContent}>{item.content}</Text>
                    </View>
                  </View>
                )}
              />
            )}

            <View style={styles.commentInputRow}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Add a comment"
                placeholderTextColor="rgba(255,255,255,0.45)"
                style={styles.commentInput}
              />
              <TouchableOpacity
                style={[
                  styles.sendCommentBtn,
                  (!commentText.trim() || commentSubmitting) &&
                    styles.sendCommentBtnDisabled,
                ]}
                onPress={submitComment}
                disabled={!commentText.trim() || commentSubmitting}
              >
                {commentSubmitting ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Icon name="send" size={18} color="#FFF" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  missingImage: {
    backgroundColor: '#141414',
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
  statIcon: {
    width: 24,
    height: 24,
    backgroundColor: '#FFF',
    marginRight: 8,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
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
  followingBtn: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderColor: 'rgba(255,255,255,0.45)',
  },
  followingBtnText: {
    color: '#FFF',
  },
  captionContainer: {
    marginTop: 8,
  },
  captionText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalScrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  commentsSheet: {
    maxHeight: screenHeight * 0.72,
    minHeight: screenHeight * 0.42,
    backgroundColor: '#111',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 28 : 18,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 14,
  },
  commentsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  commentsTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  commentsList: {
    flexGrow: 0,
    marginBottom: 12,
  },
  emptyCommentsText: {
    color: 'rgba(255,255,255,0.55)',
    textAlign: 'center',
    marginTop: 28,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 14,
  },
  commentAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    marginRight: 10,
    backgroundColor: '#333',
  },
  commentInitialsText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  commentBubble: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  commentName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  commentContent: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 14,
    lineHeight: 19,
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentInput: {
    flex: 1,
    minHeight: 44,
    borderRadius: 22,
    paddingHorizontal: 16,
    color: '#FFF',
    backgroundColor: 'rgba(255,255,255,0.09)',
  },
  sendCommentBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#5E5CE6',
  },
  sendCommentBtnDisabled: {
    opacity: 0.45,
  },
});

export default Community;
