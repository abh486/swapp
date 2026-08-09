import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  SafeAreaView,
  Image,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import Icon from 'react-native-vector-icons/Ionicons';
import { getUserNotifications, markNotificationAsRead } from '../../redux/actions/notificationActions';

const NotificationScreen = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  
  // Real notifications from redux store
  const realNotifications = useSelector(state => state.notification?.notifications || []);
  const [refreshing, setRefreshing] = useState(false);

  const loadNotifications = useCallback(async () => {
    setRefreshing(true);
    try {
      await dispatch(getUserNotifications());
    } catch (err) {
      console.warn('Failed to reload notifications:', err);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = () => {
    // Mark all real notifications as read
    realNotifications.forEach(notif => {
      if (!notif.read && !notif.isRead) {
        dispatch(markNotificationAsRead(notif.id));
      }
    });
  };

  const handleNotificationPress = (item) => {
    if (!item.read && !item.isRead) {
      dispatch(markNotificationAsRead(item.id));
    }
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const diffMs = Date.now() - new Date(timeStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    return `${diffDays}d`;
  };

  const getNotificationIconInfo = (type) => {
    const normType = type ? type.toUpperCase() : 'GENERAL';
    switch (normType) {
      case 'FOLLOW':
        return { name: 'person-add', color: '#3498db', bg: 'rgba(52, 152, 219, 0.1)' };
      case 'UNFOLLOW':
        return { name: 'person-remove', color: '#8e8e93', bg: 'rgba(142, 142, 147, 0.1)' };
      case 'LIKE_COMMENT':
      case 'LIKE':
        return { name: 'heart', color: '#e74c3c', bg: 'rgba(230, 76, 60, 0.1)' };
      case 'COMMENT':
        return { name: 'chatbubble', color: '#2ecc71', bg: 'rgba(46, 204, 113, 0.1)' };
      default:
        return { name: 'notifications', color: '#EE822A', bg: 'rgba(238, 130, 42, 0.1)' };
    }
  };

  const renderItem = ({ item }) => {
    const isRead = item.read || item.isRead;
    const timeLabel = formatTime(item.createdAt || item.created_at);
    const iconInfo = getNotificationIconInfo(item.type || item.category);

    const initials = item.sender?.displayName
      ? item.sender.displayName.split(' ').map(p => p[0]).join('').substring(0, 2).toUpperCase()
      : 'U';

    return (
      <TouchableOpacity
        style={[styles.notificationCard, !isRead && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.85}
      >
        {/* Avatar Area */}
        <View style={styles.avatarContainer}>
          {item.sender?.avatar ? (
            <Image source={{ uri: item.sender.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, styles.initialsAvatar]}>
              <Text style={styles.initialsText}>{initials}</Text>
            </View>
          )}
          {/* Small type badge overlapping bottom right */}
          <View style={[styles.typeBadge, { backgroundColor: iconInfo.color }]}>
            <Icon name={iconInfo.name} size={10} color="#FFF" />
          </View>
        </View>

        {/* Message details */}
        <View style={styles.detailsContainer}>
          <Text style={styles.messageText}>
            {item.message}
          </Text>
          <Text style={styles.timeText}>{timeLabel}</Text>
        </View>

        {/* Unread circle badge */}
        {!isRead && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  // Format real notifications ensuring sender profile default if undefined
  const formattedNotifications = Array.isArray(realNotifications)
    ? realNotifications.map(n => ({
        ...n,
        sender: n.sender || { displayName: 'System Notification', avatar: null }
      }))
    : [];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
          activeOpacity={0.8}
        >
          <Icon name="chevron-back" size={26} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity
          onPress={handleMarkAllRead}
          style={styles.markAllBtn}
          activeOpacity={0.8}
        >
          <Text style={styles.markAllText}>Mark all read</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={formattedNotifications}
        keyExtractor={item => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={loadNotifications}
            tintColor="#3498db"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Icon name="notifications-off-outline" size={40} color="rgba(255, 255, 255, 0.3)" />
            </View>
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptySubtitle}>You don't have any new alerts at the moment.</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  headerBtn: {
    padding: 4,
    width: 44,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  markAllBtn: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  markAllText: {
    color: '#3498db',
    fontSize: 13,
    fontWeight: '600',
  },
  listContent: {
    paddingVertical: 8,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.03)',
  },
  unreadCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  initialsAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  initialsText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  typeBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#050505',
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  messageText: {
    color: '#E0E0E0',
    fontSize: 14,
    lineHeight: 18,
  },
  timeText: {
    color: '#8E8E93',
    fontSize: 11,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3498db',
    marginLeft: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
    paddingHorizontal: 40,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  emptySubtitle: {
    color: '#8E8E93',
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default NotificationScreen;
