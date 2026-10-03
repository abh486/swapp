import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  FlatList,
  Image,
  RefreshControl,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { GlobalLoader } from '../../components/GlobalLoader';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

const getDisplayName = user => {
  const target = user?.following || user?.follower || user?.user || user;
  const p = target?.profile || target?.userProfile || user?.profile || user?.userProfile;
  const u = target;
  const fullName = [p?.firstName || u?.firstName, p?.lastName || u?.lastName]
    .filter(Boolean)
    .join(' ');
  return (
    fullName ||
    p?.name ||
    u?.name ||
    p?.displayName ||
    u?.displayName ||
    p?.username ||
    u?.username ||
    'Swapp member'
  );
};

const getAvatar = user => {
  const target = user?.following || user?.follower || user?.user || user;
  const p = target?.profile || target?.userProfile || user?.profile || user?.userProfile;
  const u = target;
  return (
    p?.avatar ||
    p?.profileImage ||
    p?.profilePicture ||
    p?.profilePhoto ||
    u?.avatar ||
    u?.profileImage ||
    u?.profilePicture ||
    u?.profilePhoto
  );
};

const getInitials = user =>
  getDisplayName(user)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

const unwrapUsers = (payload, type) => {
  const body = payload?.data ?? payload;
  const candidates = [
    body?.data,
    body?.[type],
    body?.users,
    body?.items,
    body?.results,
    body,
  ];

  const rawList = candidates.find(Array.isArray) || [];
  return rawList
    .map((item, index) => {
      if (!item) return null;
      const targetUser = item?.following || item?.follower || item?.user || item;
      const profile =
        targetUser?.profile ||
        targetUser?.userProfile ||
        item?.profile ||
        item?.userProfile ||
        {};
      const id =
        targetUser?.id ||
        targetUser?._id ||
        targetUser?.userId ||
        item?.userId ||
        item?.id ||
        item?._id;

      return {
        ...targetUser,
        id: id ? String(id) : `user-${index}`,
        user: targetUser,
        profile,
        raw: item,
      };
    })
    .filter(Boolean);
};

const FollowListScreen = ({ navigation, route }) => {
  const initialTab =
    route?.params?.type === 'following' ? 'following' : 'followers';
  const targetUserId =
    route?.params?.userId ||
    route?.params?.targetUserId ||
    route?.params?.user?.id ||
    route?.params?.user?._id ||
    route?.params?.user?.userId;
  const targetUsername =
    route?.params?.username ||
    route?.params?.user?.username ||
    route?.params?.name;
  const [activeTab, setActiveTab] = useState(initialTab);
  const { user: currentUser } = useAuth();
  const currentUserId =
    currentUser?.id || currentUser?._id || currentUser?.userId;
  const isOwnList =
    !targetUserId || (currentUserId && String(targetUserId) === String(currentUserId));
  const [followingStatus, setFollowingStatus] = useState({});

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = useCallback(
    async ({ refresh = false } = {}) => {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        let response = null;
        if (targetUserId) {
          try {
            response = await apiClient.get(`/users/${activeTab}/${targetUserId}`);
          } catch (pathErr) {
            response = await apiClient.get(`/users/${activeTab}?userId=${targetUserId}`);
          }
        } else {
          response = await apiClient.get(`/users/${activeTab}`);
        }
        setUsers(unwrapUsers(response?.data, activeTab));
      } catch (fetchError) {
        console.log(
          `Failed to fetch ${activeTab}`,
          fetchError?.response?.data || fetchError.message,
        );
        setUsers([]);
        setError(`Could not load ${activeTab}.`);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [activeTab, targetUserId],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleToggleFollowInList = item => {
    const userId = item?.id || item?.user?.id || item?._id;
    if (!userId) return;

    const isCurrentlyFollowing =
      followingStatus[userId] !== undefined
        ? followingStatus[userId]
        : (activeTab === 'following' && isOwnList);

    const displayName = getDisplayName(item);

    if (isCurrentlyFollowing) {
      Alert.alert(
        `Unfollow ${displayName}?`,
        `Are you sure you want to unfollow ${displayName}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Unfollow',
            style: 'destructive',
            onPress: async () => {
              setFollowingStatus(prev => ({ ...prev, [userId]: false }));
              try {
                await apiClient.post(`/users/follow/${userId}`);
              } catch (err) {
                console.error('Error unfollowing user:', err);
                setFollowingStatus(prev => ({ ...prev, [userId]: true }));
              }
            },
          },
        ],
        { cancelable: true },
      );
      return;
    }

    setFollowingStatus(prev => ({ ...prev, [userId]: true }));
    apiClient.post(`/users/follow/${userId}`).catch(err => {
      console.error('Error following user:', err);
      setFollowingStatus(prev => ({ ...prev, [userId]: false }));
    });
  };

  const renderUser = ({ item }) => {
    const avatar = getAvatar(item);
    const displayName = getDisplayName(item);
    const target = item?.following || item?.follower || item?.user || item;
    const rawUsername =
      target?.username ||
      target?.userProfile?.username ||
      target?.profile?.username ||
      item?.username ||
      item?.profile?.username;
    const showHandle =
      rawUsername &&
      rawUsername.toLowerCase() !== displayName.toLowerCase();

    const profileUserId = item?.id || target?.id || target?._id || target?.userId || item?._id;
    const isFollowingUser =
      followingStatus[profileUserId] !== undefined
        ? followingStatus[profileUserId]
        : (activeTab === 'following' && isOwnList);

    return (
      <TouchableOpacity
        style={styles.userRow}
        activeOpacity={0.7}
        onPress={() => {
          if (profileUserId) {
            navigation.navigate('UserProfile', {
              userId: profileUserId,
              user: target || item?.user || item?.profile || item,
            });
          }
        }}
      >
        {avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.initialsText}>{getInitials(item)}</Text>
          </View>
        )}
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {displayName}
          </Text>
          {showHandle ? (
            <Text style={styles.userHandle} numberOfLines={1}>
              @{rawUsername}
            </Text>
          ) : null}
        </View>

        {isOwnList && activeTab === 'following' ? (
          <TouchableOpacity
            style={[
              styles.actionBtn,
              isFollowingUser ? styles.followingBtn : styles.followBtn,
            ]}
            onPress={() => handleToggleFollowInList(item)}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.actionBtnText,
                isFollowingUser
                  ? styles.followingBtnText
                  : styles.followBtnText,
              ]}
            >
              {isFollowingUser ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        ) : (
          <Icon name="chevron-forward" size={18} color="rgba(255,255,255,0.3)" />
        )}
      </TouchableOpacity>
    );
  };

  const title = activeTab === 'followers' ? 'Followers' : 'Following';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.headerBtn}
        >
          <Icon name="chevron-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {targetUsername || title}
          </Text>
          {targetUsername ? (
            <Text style={styles.headerSubtitle}>{title}</Text>
          ) : null}
        </View>
        <View style={styles.headerBtn} />
      </View>

      <View style={styles.tabs}>
        {['followers', 'following'].map(tab => {
          const isActive = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tab, isActive && styles.activeTab]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[styles.tabText, isActive && styles.activeTabText]}>
                {tab === 'followers' ? 'Followers' : 'Following'}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <GlobalLoader size={60} />
        </View>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item, index) =>
            String(item?.id || item?.user?.id || item?.following?.id || item?.follower?.id || item?.profile?.id || index)
          }
          renderItem={renderUser}
          contentContainerStyle={[
            styles.listContent,
            users.length === 0 && styles.emptyListContent,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchUsers({ refresh: true })}
              tintColor="#FFF"
            />
          }
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {error || `No ${activeTab} yet.`}
            </Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
  },
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 12,
    padding: 4,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  tab: {
    flex: 1,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: {
    backgroundColor: '#FFF',
  },
  tabText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14,
    fontWeight: '700',
  },
  activeTabText: {
    color: '#000',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
  },
  emptyListContent: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 14,
    backgroundColor: '#1E1E1E',
  },
  avatarFallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
  },
  userHandle: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
    marginTop: 3,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 15,
    textAlign: 'center',
  },
  actionBtn: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  followingBtn: {
    backgroundColor: '#1E1E1E',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  followBtn: {
    backgroundColor: '#FFF',
    borderColor: '#FFF',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  followingBtnText: {
    color: '#FFF',
  },
  followBtnText: {
    color: '#000',
  },
});

export default FollowListScreen;
