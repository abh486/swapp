


import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useState, useEffect, useMemo } from 'react';
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
  Alert,
  StatusBar,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Path, Circle, Defs, LinearGradient as SvgLinearGradient, Stop } from 'react-native-svg';
import { fetchWorkoutHistory } from '../../redux/actions/workoutActions';
import { useAuth } from '../../context/AuthContext';
import apiClient from '../../api/apiClient';
import LinearGradient from 'react-native-linear-gradient';

const filterApplePrivateRelayEmail = (email) => {
  if (!email) return '';
  const str = String(email).trim();
  if (str.toLowerCase().includes('privaterelay.appleid.com') || str.toLowerCase().includes('appleid.com')) {
    return '';
  }
  return str;
};

const isCustomAvatar = (url) => {
  if (!url || typeof url !== 'string') return false;
  const str = url.trim().toLowerCase();
  if (!str) return false;
  if (str.includes('cdn.auth0.com') || str.includes('gravatar.com') || str.includes('default-avatar') || str.includes('avatar-placeholder')) {
    return false;
  }
  return true;
};

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

const getChartTimeframeData = (timeframe, numPoints = 6) => {
  const points = [];
  const now = new Date();
  const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let i = numPoints - 1; i >= 0; i--) {
    const d = new Date(now);
    let label = '';
    
    if (timeframe === 'day') {
      d.setDate(now.getDate() - i);
      label = daysShort[d.getDay()];
    } else if (timeframe === 'week') {
      d.setDate(now.getDate() - i * 7);
      label = `${monthsShort[d.getMonth()]} ${d.getDate()}`;
    } else if (timeframe === 'month') {
      d.setMonth(now.getMonth() - i);
      label = monthsShort[d.getMonth()];
    } else { // '3months' (12 weeks total, so 14-day intervals)
      d.setDate(now.getDate() - i * 14);
      label = `${monthsShort[d.getMonth()]} ${d.getDate()}`;
    }
    
    points.push({ date: d, label });
  }
  return points;
};

const getPointIndex = (wDate, timeframePoints, timeframe) => {
  const dateMs = new Date(wDate).getTime();
  let intervalMs;
  
  if (timeframe === 'day') {
    intervalMs = 24 * 60 * 60 * 1000;
  } else if (timeframe === 'week') {
    intervalMs = 7 * 24 * 60 * 60 * 1000;
  } else if (timeframe === 'month') {
    intervalMs = 30 * 24 * 60 * 60 * 1000;
  } else { // '3months'
    intervalMs = 14 * 24 * 60 * 60 * 1000;
  }

  let closestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < timeframePoints.length; i++) {
    const diff = Math.abs(dateMs - timeframePoints[i].date.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closestIdx = i;
    }
  }

  const diff = Math.abs(dateMs - timeframePoints[closestIdx].date.getTime());
  if (diff <= intervalMs * 0.75) {
    return closestIdx;
  }
  return -1;
};

const ProfileDashboard = () => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { width } = useWindowDimensions();
  const { user, refreshAuthStatus } = useAuth();

  const lastProfileCheckRef = React.useRef(0);

  useFocusEffect(
    React.useCallback(() => {
      const now = Date.now();
      if (refreshAuthStatus && now - lastProfileCheckRef.current > 60000) {
        lastProfileCheckRef.current = now;
        refreshAuthStatus();
      }
    }, [refreshAuthStatus])
  );

  const [workouts, setWorkouts] = useState([]);
  const [allUserWorkouts, setAllUserWorkouts] = useState([]);
  const [activeMetric, setActiveMetric] = useState('duration'); // 'duration' | 'volume' | 'reps'
  const [timeframe, setTimeframe] = useState('3months'); // 'day' | 'week' | 'month' | '3months'
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalWorkouts: 0,
    followersCount: 0,
    followingCount: 0,
  });

  // Dynamic user data
  const profileData = user?.userProfile || user?.memberProfile || user || {};
  const userName = profileData.username
    ? (profileData.username.startsWith('@') ? profileData.username : `@${profileData.username}`)
    : profileData.name ||
      `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim() ||
      'Member';
  const userAvatar =
    profileData.profileImage ||
    profileData.profilePicture ||
    profileData.profilePhoto ||
    profileData.avatar;
  const hasUserAvatar = Boolean(userAvatar);

  const profileCompletion = useMemo(() => {
    const p = user?.userProfile || user?.memberProfile || {};
    const rawAvatar = p.profileImage || p.profilePicture || p.avatar || user?.profileImage || user?.avatar;
    const hasAvatar = isCustomAvatar(rawAvatar);
    const hasName = Boolean(p.name && String(p.name).trim().length > 0);
    const hasUsername = Boolean(p.username && String(p.username).trim().length > 0);
    const hasBio = Boolean((p.bio || p.otherInfo) && String(p.bio || p.otherInfo).trim().length > 0);
    const hasGender = Boolean(p.gender && String(p.gender).trim().length > 0);
    const hasDob = Boolean((p.dateOfBirth || p.birthDate || user?.birthDate) && String(p.dateOfBirth || p.birthDate || user?.birthDate).trim().length > 0);
    const hasFood = Boolean((p.foodPreference || p.dietPreference) && String(p.foodPreference || p.dietPreference).trim().length > 0);
    const hasFitness = Boolean((p.fitnessLevel || p.activityLevel) && String(p.fitnessLevel || p.activityLevel).trim().length > 0);
    const rawPhoneDigits = String(p.phone || p.mobileNumber || user?.mobileNumber || '').replace(/[^0-9]/g, '');
    const hasPhone = Boolean(rawPhoneDigits.length >= 10);
    const rawEmail = p.email || user?.email || '';
    const cleanEmail = filterApplePrivateRelayEmail(rawEmail);
    const hasEmail = Boolean(cleanEmail && cleanEmail.trim().length > 0);
    const hasCountry = Boolean((p.country || user?.countryOfResidence) && String(p.country || user?.countryOfResidence).trim().length > 0);

    const fields = [
      { label: 'Profile Photo', isFilled: hasAvatar },
      { label: 'Name', isFilled: hasName },
      { label: 'Username', isFilled: hasUsername },
      { label: 'Bio', isFilled: hasBio },
      { label: 'Gender', isFilled: hasGender },
      { label: 'Date of Birth', isFilled: hasDob },
      { label: 'Food Preference', isFilled: hasFood },
      { label: 'Fitness Level', isFilled: hasFitness },
      { label: 'Phone Number', isFilled: hasPhone },
      { label: 'Gmail', isFilled: hasEmail },
      { label: 'Country', isFilled: hasCountry },
    ];

    const filledCount = fields.filter(f => f.isFilled).length;
    const totalCount = fields.length;
    const percentage = Math.round((filledCount / totalCount) * 100);
    const pendingFields = fields.filter(f => !f.isFilled).map(f => f.label);

    return {
      percentage,
      filledCount,
      totalCount,
      pendingFields,
    };
  }, [user]);

  useEffect(() => {
    const loadWorkouts = async () => {
      try {
        const response = await dispatch(fetchWorkoutHistory());
        if (response && response.data && response.data.length > 0) {
          setAllUserWorkouts(response.data);
          // Show all logged workouts (both EVERYONE and PRIVATE) in the user's profile
          setWorkouts(response.data);
        } else {
          // If no workouts from backend, check AsyncStorage for this user's fallback
          const userWorkoutKey = user?.id ? `latestWorkoutData_${user.id}` : null;
          const storedDataStr = userWorkoutKey ? await AsyncStorage.getItem(userWorkoutKey) : null;
          if (storedDataStr) {
            const storedData = JSON.parse(storedDataStr);
            const fallbackWorkouts = [
              {
                id: 'dummy-local-profile',
                date: new Date().toISOString(),
                duration: storedData.duration || 60,
                volume: storedData.volume || 0,
                visibility: storedData.visibility || 'PRIVATE',
                imageUrl: storedData.imageUrl,
              },
            ];
            setAllUserWorkouts(fallbackWorkouts);
            setWorkouts(fallbackWorkouts);
          }
        }
      } catch (error) {
        console.error('Failed to fetch workouts', error);
        // Fallback on error
        try {
          const userWorkoutKey = user?.id ? `latestWorkoutData_${user.id}` : null;
          const storedDataStr = userWorkoutKey ? await AsyncStorage.getItem(userWorkoutKey) : null;
          if (storedDataStr) {
            const storedData = JSON.parse(storedDataStr);
            const fallbackWorkouts = [
              {
                id: 'dummy-local-profile',
                date: new Date().toISOString(),
                duration: storedData.duration || 60,
                volume: storedData.volume || 0,
                visibility: storedData.visibility || 'PRIVATE',
                imageUrl: storedData.imageUrl,
              },
            ];
            setAllUserWorkouts(fallbackWorkouts);
            setWorkouts(fallbackWorkouts);
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

  const timeframePoints = useMemo(() => getChartTimeframeData(timeframe, 6), [timeframe]);

  const chartData = useMemo(() => {
    const data = timeframePoints.map(p => ({
      date: p.date,
      label: p.label,
      duration: 0,
      volume: 0,
      reps: 0,
    }));

    allUserWorkouts.forEach(workout => {
      if (!workout.date) return;
      const pointIdx = getPointIndex(workout.date, timeframePoints, timeframe);
      if (pointIdx === -1) return;
      
      const durationMins = (workout.duration || 0) / 60;
      data[pointIdx].duration += durationMins;

      if (workout.logs && Array.isArray(workout.logs)) {
        workout.logs.forEach(log => {
          if (log.sets && Array.isArray(log.sets)) {
            log.sets.forEach(set => {
              const reps = Number(set.reps) || 0;
              const weight = Number(set.weight) || 0;
              data[pointIdx].reps += reps;
              data[pointIdx].volume += (reps * weight);
            });
          }
        });
      }
    });

    return data;
  }, [allUserWorkouts, timeframePoints, timeframe]);

  const metricValues = useMemo(() => {
    return chartData.map(d => Math.round(d[activeMetric]));
  }, [chartData, activeMetric]);

  const maxVal = useMemo(() => {
    return Math.max(...metricValues, 1);
  }, [metricValues]);

  const chartWidth = width - 80;
  const chartHeight = 120;

  const points = useMemo(() => {
    const xStep = chartWidth / 5;
    return metricValues.map((val, idx) => {
      const x = idx * xStep;
      const y = 120 - (val / maxVal) * 110;
      return { x, y, val };
    });
  }, [metricValues, chartWidth, maxVal]);

  const pathD = useMemo(() => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      const cp1x = p1.x + (p2.x - p1.x) / 3;
      const cp1y = p1.y;
      const cp2x = p1.x + 2 * (p2.x - p1.x) / 3;
      const cp2y = p2.y;
      d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
    }
    return d;
  }, [points]);

  const gradientPathD = useMemo(() => {
    if (!pathD || points.length === 0) return '';
    const firstPoint = points[0];
    const lastPoint = points[points.length - 1];
    return `${pathD} L ${lastPoint.x} 130 L ${firstPoint.x} 130 Z`;
  }, [pathD, points]);

  const currentWeekValue = metricValues[metricValues.length - 1] || 0;

  const chartTitleText = useMemo(() => {
    let timeframeLabel = 'this week';
    if (timeframe === 'day') timeframeLabel = 'today';
    else if (timeframe === 'week') timeframeLabel = 'this week';
    else if (timeframe === 'month') timeframeLabel = 'this month';
    else timeframeLabel = 'last 3 months';

    if (activeMetric === 'duration') {
      return `${currentWeekValue} mins ${timeframeLabel}`;
    } else if (activeMetric === 'volume') {
      return `${currentWeekValue} kg volume ${timeframeLabel}`;
    } else {
      return `${currentWeekValue} reps ${timeframeLabel}`;
    }
  }, [currentWeekValue, activeMetric, timeframe]);



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
    navigation.navigate('FollowList', {
      type,
      userId: user?.id || user?._id || user?.userId || profileData?.userId,
      username: profileData?.name || user?.name
    });
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
  const getSingleImageUri = (imageUrl) => {
    if (!imageUrl) return 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2070&auto=format&fit=crop';
    try {
      if (imageUrl.startsWith('[')) {
        const list = JSON.parse(imageUrl);
        if (list && list.length > 0) return list[0];
      } else if (imageUrl.includes(',')) {
        const list = imageUrl.split(',').map(u => u.trim()).filter(Boolean);
        if (list && list.length > 0) return list[0];
      }
    } catch (e) {
      console.warn('Error parsing image list in ProfileDashboard:', e);
    }
    return imageUrl;
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
          {/* Back Button Top Left */}
          <TouchableOpacity
            style={styles.backButtonTopLeft}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Icon name="chevron-back" size={24} color="#FFF" />
          </TouchableOpacity>

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
              onPress={() => navigation.navigate('EditPersonalInfo')}
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

        {/* PROFILE COMPLETION CARD - Shown only when pending items exist */}
        {profileCompletion.percentage < 100 && (
          <TouchableOpacity
            style={styles.completionDashboardCard}
            activeOpacity={0.88}
            onPress={() => navigation.navigate('EditPersonalInfo')}
          >
            <View style={styles.completionDashboardHeader}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.completionDashboardTitle}>Profile Completion</Text>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={styles.completionDashboardPercentage}>
                  {profileCompletion.percentage}%
                </Text>
                <Icon name="chevron-forward" size={16} color="#888" style={{ marginLeft: 4 }} />
              </View>
            </View>

            {/* Progress Bar */}
            <View style={styles.completionProgressBarBg}>
              <View style={[
                styles.completionProgressBarFill,
                {
                  width: `${profileCompletion.percentage}%`,
                  backgroundColor: '#0055FF'
                }
              ]} />
            </View>

            {/* Subtitle / pending summary */}
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={styles.completionPendingText}>
                {profileCompletion.pendingFields.length} pending
              </Text>
              <Text style={styles.completionActionText}>Complete now ›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* CHART SECTION */}
        <View style={styles.chartSection}>
          <View style={styles.chartHeader}>
            <Text style={styles.chartTitle}>{chartTitleText}</Text>
          </View>

          {/* Timeframe Selector Segmented Control */}
          <View style={styles.timeframeTabsContainer}>
            {[
              { key: 'day', label: 'Day' },
              { key: 'week', label: 'Week' },
              { key: 'month', label: 'Month' },
              { key: '3months', label: '3 Months' }
            ].map((tab) => {
              const isActive = timeframe === tab.key;
              return (
                <TouchableOpacity
                  key={tab.key}
                  style={styles.timeframeTabTouch}
                  onPress={() => setTimeframe(tab.key)}
                  activeOpacity={0.8}
                >
                  {isActive ? (
                    <LinearGradient
                      colors={['rgba(124, 77, 255, 0.95)', 'rgba(236, 72, 153, 0.95)']}
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

          <View style={styles.chartContainer}>
            <View style={styles.yAxis}>
              <Text style={styles.axisText}>{maxVal} {activeMetric === 'volume' ? 'kg' : activeMetric === 'duration' ? 'm' : 'reps'}</Text>
              <Text style={styles.axisText}>0 {activeMetric === 'volume' ? 'kg' : activeMetric === 'duration' ? 'm' : 'reps'}</Text>
            </View>

            <View style={styles.chartArea}>
              <Svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${chartWidth} 150`}
                preserveAspectRatio="none"
              >
                <Defs>
                  <SvgLinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0%" stopColor={THEME.colors.accent} stopOpacity={0.35} />
                    <Stop offset="100%" stopColor={THEME.colors.accent} stopOpacity={0.0} />
                  </SvgLinearGradient>
                </Defs>

                {/* Grid Lines */}
                <Path d={`M 0 35 L ${chartWidth} 35`} stroke="rgba(255, 255, 255, 0.04)" strokeWidth={1} />
                <Path d={`M 0 70 L ${chartWidth} 70`} stroke="rgba(255, 255, 255, 0.04)" strokeWidth={1} />
                <Path d={`M 0 105 L ${chartWidth} 105`} stroke="rgba(255, 255, 255, 0.04)" strokeWidth={1} />

                {/* Bottom Border Line */}
                <Path
                  d={`M 0 0 L 0 130 L ${chartWidth} 130`}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth="1"
                  fill="none"
                />

                {/* Gradient Area under Curve */}
                {gradientPathD ? (
                  <Path
                    d={gradientPathD}
                    fill="url(#chartGrad)"
                  />
                ) : null}

                {/* Smooth Curve Line */}
                {pathD ? (
                  <Path
                    d={pathD}
                    stroke={THEME.colors.accent}
                    strokeWidth={3.5}
                    strokeLinecap="round"
                    fill="none"
                  />
                ) : null}

                {/* Circles for each week point */}
                {points.map((p, idx) => (
                  <Circle
                    key={idx}
                    cx={p.x}
                    cy={p.y}
                    r="4"
                    fill="#FFF"
                    stroke={THEME.colors.accent}
                    strokeWidth="2"
                  />
                ))}
              </Svg>

              <View style={styles.xAxis}>
                {chartData.map((d, idx) => (
                  <Text key={idx} style={styles.axisText}>
                    {d.label}
                  </Text>
                ))}
              </View>
            </View>
          </View>

          {/* Metric Pills */}
          <View style={styles.filtersRow}>
            <TouchableOpacity 
              style={activeMetric === 'duration' ? styles.filterPillActive : styles.filterPill}
              onPress={() => setActiveMetric('duration')}
            >
              <Text style={activeMetric === 'duration' ? styles.filterPillTextActive : styles.filterPillText}>Duration</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={activeMetric === 'volume' ? styles.filterPillActive : styles.filterPill}
              onPress={() => setActiveMetric('volume')}
            >
              <Text style={activeMetric === 'volume' ? styles.filterPillTextActive : styles.filterPillText}>Volume</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={activeMetric === 'reps' ? styles.filterPillActive : styles.filterPill}
              onPress={() => setActiveMetric('reps')}
            >
              <Text style={activeMetric === 'reps' ? styles.filterPillTextActive : styles.filterPillText}>Reps</Text>
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
              <TouchableOpacity
                key={workout.id || idx}
                style={styles.workoutCard}
                activeOpacity={0.95}
                onPress={() => navigation.navigate('PostDetails', { post: { ...workout, user: profileData } })}
              >
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
                      uri: getSingleImageUri(workout.imageUrl),
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
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* App Version Footer */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>App Version 1.0.5</Text>
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
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
  backButtonTopLeft: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 10 : 20,
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 8,
    borderRadius: 20,
    zIndex: 10,
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
  // Profile Completion Dashboard Card Styles
  completionDashboardCard: {
    marginHorizontal: 20,
    marginTop: 20,
    marginBottom: 8,
  },
  completionDashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionDashboardTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  completionDashboardPercentage: {
    color: '#0055FF',
    fontSize: 17,
    fontWeight: '700',
  },
  completionProgressBarBg: {
    height: 8,
    backgroundColor: '#1F1F28',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 10,
  },
  completionProgressBarFill: {
    height: '100%',
    backgroundColor: '#0055FF',
    borderRadius: 4,
  },
  completionSuccessText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '500',
  },
  completionPendingText: {
    color: '#9CA3AF',
    fontSize: 12.5,
    flex: 1,
    marginRight: 8,
  },
  completionActionText: {
    color: '#0055FF',
    fontSize: 12.5,
    fontWeight: '600',
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
  timeframeTabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#111115',
    height: 40,
    borderRadius: 20,
    padding: 3,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    borderRadius: 17,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeframeActiveTabLabel: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  timeframeInactiveTabLabel: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    fontWeight: '600',
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
  versionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginBottom: 10,
  },
  versionText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

export default ProfileDashboard;
