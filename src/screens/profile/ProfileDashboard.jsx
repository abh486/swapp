


import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Circle } from 'react-native-svg';
import { fetchWorkoutHistory } from '../../redux/actions/workoutActions';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';

const THEME = {
  colors: {
    background: '#000000',
    surface: '#1E1E1E',
    text: '#FFFFFF',
    textSecondary: 'rgba(255, 255, 255, 0.6)',
    primary: '#F08A5D',
    accent: '#4B6EE1',
    border: 'rgba(255, 255, 255, 0.1)',
  },
};

const ProfileDashboard = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const { user } = useAuth();

  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    followersCount: 0,
    followingCount: 0,
  });

  // Dynamic user data
  const profileData = user?.userProfile || user?.memberProfile || user || {};
  const userName =
    profileData.name ||
    `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() ||
    'Member';
  const userAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.profilePhoto ||
    profileData.avatar;
  const hasUserAvatar = Boolean(userAvatar);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const response = await dispatch(fetchWorkoutHistory());
        if (response && response.data && response.data.length > 0) {
          // Filter to only show PRIVATE workouts in profile (everyone goes only to community)
          const privateWorkouts = response.data.filter(
            w => w.visibility === 'PRIVATE',
          );
          setWorkouts(privateWorkouts);
        } else {
          // If no workouts from backend, check AsyncStorage for a fallback
          const storedDataStr = await AsyncStorage.getItem('latestWorkoutData');
          if (storedDataStr) {
            const storedData = JSON.parse(storedDataStr);
            if (storedData.visibility === 'PRIVATE') {
              setWorkouts([
                {
                  id: 'dummy-local-profile',
                  date: new Date().toISOString(),
                  duration: storedData.duration || 60,
                  volume: storedData.volume || 0,
                  visibility: 'PRIVATE',
                  imageUrl: storedData.imageUrl,
                },
              ]);
            } else {
              setWorkouts([]);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch workouts', error);
        // Fallback on error
        try {
          const storedDataStr = await AsyncStorage.getItem('latestWorkoutData');
          if (storedDataStr) {
            const storedData = JSON.parse(storedDataStr);
            if (storedData.visibility === 'PRIVATE') {
              setWorkouts([
                {
                  id: 'dummy-local-profile',
                  date: new Date().toISOString(),
                  duration: storedData.duration || 60,
                  volume: storedData.volume || 0,
                  visibility: 'PRIVATE',
                  imageUrl: storedData.imageUrl,
                },
              ]);
            } else {
              setWorkouts([]);
            }
          }
        } catch (e) {
          console.error('Failed to load profile local fallback', e);
        }
      } finally {
        setLoading(false);
      }
    };
    loadWorkouts();
  }, [dispatch]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await apiClient.get('/users/stats');
        const nextStats = response.data?.data || {};
        setStats({
          totalWorkouts: nextStats.totalWorkouts ?? 0,
          followersCount: nextStats.followersCount ?? 0,
          followingCount: nextStats.followingCount ?? 0,
        });
      } catch (error) {
        console.error('Failed to fetch profile stats', error);
      }
    };

    loadStats();
  }, []);

  const handleSettingsPress = () => {
    navigation.navigate('ProfileSettings');
  };

  const openFollowList = type => {
    navigation.navigate('FollowList', { type });
  };

  // Dynamic calculations based on screen width
  const avatarSize = width * 0.28;
  const avatarImageSize = avatarSize - 12;
  const headerHeight = avatarSize + 36;

  const formatTime = totalSeconds => {
    if (!totalSeconds) return '0min';
    const mins = Math.floor(totalSeconds / 60);
    return `${mins}min`;
  };

  const formatCount = count => {
    const numericCount = Number(count) || 0;
    if (numericCount >= 1000000)
      return `${(numericCount / 1000000).toFixed(1)}M`;
    if (numericCount >= 1000) return `${(numericCount / 1000).toFixed(1)}K`;
    return numericCount.toString();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        {/* TOP BAR */}
        <View style={[styles.headerContainer, { height: headerHeight }]}>
          {/* Settings Button */}
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={handleSettingsPress}
          >
            <Icon name="settings-outline" size={24} color="#FFF" />
          </TouchableOpacity>

          {/* Avatar over banner */}
          <View style={styles.avatarWrapper}>
            <View
              style={[
                styles.avatarBorder,
                {
                  width: avatarSize,
                  height: avatarSize,
                  borderRadius: avatarSize / 2,
                },
              ]}
            >
              {hasUserAvatar ? (
                <Image
                  source={{ uri: userAvatar }}
                  style={[
                    styles.avatarImage,
                    {
                      width: avatarImageSize,
                      height: avatarImageSize,
                      borderRadius: avatarImageSize / 2,
                    },
                  ]}
                />
              ) : (
                <View
                  style={[
                    styles.avatarIconFallback,
                    {
                      width: avatarImageSize,
                      height: avatarImageSize,
                      borderRadius: avatarImageSize / 2,
                    },
                  ]}
                >
                  <Icon
                    name="person"
                    size={Math.round(avatarImageSize * 0.48)}
                    color="rgba(255,255,255,0.72)"
                  />
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.editButton}
              onPress={handleSettingsPress}
            >
              <Icon name="pencil-outline" size={16} color="#000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* PROFILE INFO */}
        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{userName}</Text>
            <Icon
              name="ribbon"
              size={20}
              color="#888"
              style={{ marginLeft: 6 }}
            />
          </View>

          {/* STATS */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {formatCount(stats.totalWorkouts)}
              </Text>
              <Text style={styles.statLabel}>Workouts</Text>
            </View>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => openFollowList('followers')}
              activeOpacity={0.75}
            >
              <Text style={styles.statValue}>
                {formatCount(stats.followersCount)}
              </Text>
              <Text style={styles.statLabel}>Followers</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => openFollowList('following')}
              activeOpacity={0.75}
            >
              <Text style={styles.statValue}>
                {formatCount(stats.followingCount)}
              </Text>
              <Text style={styles.statLabel}>Following</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CHART SECTION */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>4 mins this week</Text>
            <TouchableOpacity style={styles.dropdownButton}>
              <Text style={styles.dropdownText}>last 3months</Text>
              <Icon name="chevron-down" size={14} color="#FFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.chartContainer}>
            <View style={styles.yAxis}>
              <Text style={styles.axisText}>1 hrs</Text>
              <Text style={styles.axisText}>0 hrs</Text>
            </View>

            <View style={styles.chartArea}>
              <Svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${width - 80} 150`}
                preserveAspectRatio="none"
              >
                <Path
                  d={`M 0 0 L 0 150 L ${width - 80} 150`}
                  stroke="rgba(255,255,255,0.3)"
                  strokeWidth="1"
                  fill="none"
                />
                <Path
                  d={`M 0 150 Q ${width * 0.2} 20, ${width * 0.4} 80 T ${
                    width * 0.7
                  } 40 T ${width - 80} 20`}
                  stroke={THEME.colors.accent}
                  strokeWidth="3"
                  fill="none"
                />
                <Circle
                  cx={width * 0.7}
                  cy={40}
                  r="5"
                  fill="#FFF"
                  stroke={THEME.colors.accent}
                  strokeWidth="2"
                />
              </Svg>

              <View style={styles.xAxis}>
                <Text style={styles.axisText}>Jan 25</Text>
                <Text style={styles.axisText}>Feb 8</Text>
                <Text style={styles.axisText}>Feb 22</Text>
                <Text style={styles.axisText}>Mar 8</Text>
                <Text style={styles.axisText}>Mar 22</Text>
                <Text style={styles.axisText}>Apr 5</Text>
              </View>
            </View>
          </View>

          {/* Filter Pills */}
          <View style={styles.filtersRow}>
            <TouchableOpacity style={styles.filterPillActive}>
              <Text style={styles.filterPillTextActive}>Duration</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPill}>
              <Text style={styles.filterPillText}>Volume</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.filterPill}>
              <Text style={styles.filterPillText}>Reps</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* WORKOUTS LIST */}
        <View style={styles.workoutsSection}>
          <Text style={styles.sectionTitle}>Workouts</Text>

          {loading ? (
            <GlobalLoader size={60} style={{ marginTop: 20 }} />
          ) : workouts.length === 0 ? (
            <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>
              No workouts logged yet.
            </Text>
          ) : (
            workouts.map((workout, idx) => (
              <View key={workout.id || idx} style={styles.workoutCard}>
                <View style={styles.workoutHeader}>
                  {hasUserAvatar ? (
                    <Image
                      source={{ uri: userAvatar }}
                      style={styles.workoutAvatar}
                    />
                  ) : (
                    <View
                      style={[
                        styles.workoutAvatar,
                        styles.workoutAvatarFallback,
                      ]}
                    >
                      <Icon
                        name="person"
                        size={22}
                        color="rgba(255,255,255,0.72)"
                      />
                    </View>
                  )}
                  <View>
                    <Text style={styles.workoutUserName}>{userName}</Text>
                    <Text style={styles.workoutDate}>
                      {workout.date
                        ? new Date(workout.date).toLocaleDateString('en-GB', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })
                        : 'Unknown Date'}
                    </Text>
                  </View>
                </View>

                <View style={styles.workoutImageContainer}>
                  <Image
                    source={{
                      uri:
                        workout.imageUrl ||
                        'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop',
                    }}
                    style={styles.workoutMainImage}
                    resizeMode="cover"
                  />
                  <View style={styles.durationTag}>
                    <Icon name="time-outline" size={12} color="#FFF" />
                    <Text style={styles.durationText}>
                      {formatTime(workout.duration)}
                    </Text>
                  </View>
                  {workout.visibility === 'PRIVATE' && (
                    <View style={styles.privateTag}>
                      <Icon name="lock-closed" size={12} color="#FFF" />
                      <Text style={styles.privateText}>Private</Text>
                    </View>
                  )}
                </View>
              </View>
            ))
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  headerContainer: {
    position: 'relative',
    alignItems: 'center',
    width: '100%',
  },
  settingsButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
  },
  avatarWrapper: {
    position: 'absolute',
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
  },
  avatarBorder: {
    borderWidth: 4,
    borderColor: THEME.colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#333',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  avatarImage: {
    backgroundColor: '#1E1E1E',
  },
  avatarIconFallback: {
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  editButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#FFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: THEME.colors.background,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 2,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  infoContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 20,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: THEME.colors.text,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 24,
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 400,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    color: THEME.colors.text,
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: THEME.colors.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  chartSection: {
    marginTop: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  chartTitle: {
    color: THEME.colors.text,
    fontSize: 15,
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  dropdownText: {
    color: THEME.colors.text,
    fontSize: 13,
    marginRight: 6,
  },
  chartContainer: {
    flexDirection: 'row',
    height: 180,
    width: '100%',
  },
  yAxis: {
    justifyContent: 'space-between',
    paddingRight: 10,
    height: 150,
  },
  axisText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
  },
  chartArea: {
    flex: 1,
  },
  xAxis: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  filtersRow: {
    flexDirection: 'row',
    marginTop: 36,
    gap: 12,
    flexWrap: 'wrap',
  },
  filterPillActive: {
    backgroundColor: '#333',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  filterPill: {
    backgroundColor: '#EAEAEA',
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 20,
  },
  filterPillTextActive: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '700',
  },
  filterPillText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  workoutsSection: {
    marginTop: 40,
    paddingHorizontal: 20,
    width: '100%',
  },
  sectionTitle: {
    color: THEME.colors.text,
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  workoutCard: {
    marginBottom: 24,
    width: '100%',
  },
  workoutHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  workoutAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  workoutAvatarFallback: {
    backgroundColor: '#1E1E1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  workoutUserName: {
    color: THEME.colors.text,
    fontWeight: 'bold',
    fontSize: 15,
  },
  workoutDate: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginTop: 2,
  },
  workoutImageContainer: {
    width: '100%',
    aspectRatio: 16 / 9, // This keeps the image proportionate across all devices
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#2A2A2A',
  },
  workoutMainImage: {
    width: '100%',
    height: '100%',
  },
  durationTag: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  durationText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
  privateTag: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.7)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  privateText: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 6,
  },
});

export default ProfileDashboard;
