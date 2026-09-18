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
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { GlobalLoader } from '../../components/GlobalLoader';
import apiClient from '../../api/apiClient';

const getDisplayName = user => {
  const profile = user?.user || user?.profile || user;
  const name = [profile?.firstName, profile?.lastName]
    .filter(Boolean)
    .join(' ');
  return name || profile?.name || profile?.username || 'Swapp member';
};

const getAvatar = user => {
  const profile = user?.user || user?.profile || user;
  return (
    profile?.avatar ||
    profile?.profileImage ||
    profile?.profilePicture ||
    profile?.profilePhoto
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

  return candidates.find(Array.isArray) || [];
};

const FollowListScreen = ({ navigation, route }) => {
  const initialTab =
    route?.params?.type === 'following' ? 'following' : 'followers';
  const [activeTab, setActiveTab] = useState(initialTab);
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
        const response = await apiClient.get(`/users/${activeTab}`);
        setUsers(unwrapUsers(response.data, activeTab));
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
    [activeTab],
  );

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const renderUser = ({ item }) => {
    const avatar = getAvatar(item);
    const displayName = getDisplayName(item);
    const username =
      item?.user?.username || item?.profile?.username || item?.username;

    return (
      <View style={styles.userRow}>
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
          {username ? (
            <Text style={styles.userHandle} numberOfLines={1}>
              @{username}
            </Text>
          ) : null}
        </View>
      </View>
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
        <Text style={styles.headerTitle}>{title}</Text>
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
            String(item?.user?.id || item?.profile?.id || item?.id || index)
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
  headerTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '700',
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
});

export default FollowListScreen;
