import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Image,
  ScrollView,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Svg, { Polygon, Line, Circle } from 'react-native-svg';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';

const EXERCISE_MUSCLE_MAP = {
  'bench press': 'Chest',
  'incline bench': 'Chest',
  'decline bench': 'Chest',
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

const ComparisonScreen = ({ route, navigation }) => {
  const { currentUserProfile, comparedUserProfile } = route.params || {};
  const { user: authUser } = useAuth();

  const userA = currentUserProfile || authUser?.userProfile || authUser?.memberProfile || authUser || {};
  const userB = comparedUserProfile || {};

  const getAvatarUri = (u, defaultUrl) => {
    if (!u) return defaultUrl;
    const nested = u.userProfile || u.memberProfile;
    const target = nested || u;
    return target.profileImage || target.profilePicture || target.avatar || target.profilePhoto || defaultUrl;
  };

  const getUsername = (u, defaultName) => {
    if (!u) return defaultName;
    const nested = u.userProfile || u.memberProfile;
    const target = nested || u;
    const name = target.username || target.displayName || target.name;
    if (name) return name;
    const parts = [target.firstName, target.lastName].filter(Boolean).join(' ');
    return parts || defaultName;
  };

  const getInitials = (u) => {
    if (!u) return '';
    const nested = u.userProfile || u.memberProfile;
    const target = nested || u;
    const displayName = target.displayName || target.username || target.name;
    if (displayName) {
      return displayName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map(part => part.charAt(0).toUpperCase())
        .join('');
    }
    const parts = [target.firstName, target.lastName].filter(Boolean);
    if (parts.length > 0) {
      return parts.slice(0, 2).map(part => part.charAt(0).toUpperCase()).join('');
    }
    return '';
  };

  const [loading, setLoading] = useState(true);
  const [userASessions, setUserASessions] = useState([]);
  const [userBSessions, setUserBSessions] = useState([]);
  const [failedA, setFailedA] = useState(false);
  const [failedB, setFailedB] = useState(false);

  useEffect(() => {
    const loadComparisonData = async () => {
      setLoading(true);
      try {
        const targetAId = userA.userId || userA.id || userA._id;
        const targetBId = userB.userId || userB.id || userB._id;

        const promises = [];

        // Fetch User A
        if (targetAId && targetAId !== 'me') {
          promises.push(
            apiClient.get(`/workouts/sessions/user/${targetAId}`)
              .then(res => res.data?.success ? res.data.data || [] : [])
              .catch(() => [])
          );
        } else {
          promises.push(
            apiClient.get('/workouts/sessions/my')
              .then(res => res.data?.success ? res.data.data || [] : [])
              .catch(() => [])
          );
        }

        // Fetch User B
        if (targetBId && targetBId !== 'mock-target') {
          promises.push(
            apiClient.get(`/workouts/sessions/user/${targetBId}`)
              .then(res => res.data?.success ? res.data.data || [] : [])
              .catch(() => [])
          );
        } else {
          promises.push(Promise.resolve([]));
        }

        const [sessionsA, sessionsB] = await Promise.all(promises);

        setUserASessions(sessionsA);
        setUserBSessions(sessionsB);
      } catch (err) {
        console.error('Failed to load comparison sessions:', err);
      } finally {
        setLoading(false);
      }
    };

    loadComparisonData();
  }, [userA.id, userA.userId, userB.id, userB.userId]);

  // Aggregate stats helper
  const calculateAggregatedStats = (sessionsList) => {
    let workoutCount = sessionsList.length;
    let totalMinutes = 0;
    let totalVolume = 0;

    const muscleSets = {
      Back: 0,
      Chest: 0,
      Core: 0,
      Shoulders: 0,
      Arms: 0,
      Legs: 0
    };

    sessionsList.forEach(session => {
      totalMinutes += Number(session.stats?.duration || session.duration || 0);
      totalVolume += Number(session.stats?.volume || 0);

      const exercises = session.exercises || session.sessionData?.exercises || [];
      exercises.forEach(ex => {
        const nameLower = (ex.name || '').toLowerCase();
        let muscleGroup = null;

        for (const [key, group] of Object.entries(EXERCISE_MUSCLE_MAP)) {
          if (nameLower.includes(key)) {
            muscleGroup = group;
            break;
          }
        }

        if (muscleGroup && muscleSets[muscleGroup] !== undefined) {
          const setsCount = ex.sets?.length || 0;
          muscleSets[muscleGroup] += setsCount;
        }
      });
    });

    const totalSets = Object.values(muscleSets).reduce((sum, v) => sum + v, 0);
    const splitValues = {
      Core: 0.15,
      Shoulders: 0.15,
      Arms: 0.15,
      Legs: 0.15,
      Back: 0.15,
      Chest: 0.15
    };

    if (totalSets > 0) {
      Object.keys(muscleSets).forEach(muscle => {
        const pct = muscleSets[muscle] / totalSets;
        splitValues[muscle] = Math.max(0.15, Math.min(1.0, 0.15 + pct * 0.85));
      });
    }

    return {
      workoutCount,
      totalMinutes,
      totalVolume,
      splitValues
    };
  };

  const statsA = calculateAggregatedStats(userASessions);
  const statsB = calculateAggregatedStats(userBSessions);

  // Radar chart constants
  const cx = 150;
  const cy = 150;
  const R = 100;
  const angles = [0, 60, 120, 180, 240, 300].map(deg => (deg * Math.PI) / 180);

  const getPointsStr = (splitValues) => {
    return [
      splitValues.Core,
      splitValues.Shoulders,
      splitValues.Arms,
      splitValues.Legs,
      splitValues.Back,
      splitValues.Chest
    ].map((val, i) => {
      const x = cx + R * val * Math.cos(angles[i]);
      const y = cy + R * val * Math.sin(angles[i]);
      return `${x},${y}`;
    }).join(' ');
  };

  const pointsA = getPointsStr(statsA.splitValues);
  const pointsB = getPointsStr(statsB.splitValues);

  // Metric Calculation helper
  const calculateMetricProps = (valA, valB, isTime = false) => {
    const maxVal = Math.max(valA, valB, 1);
    const pctA = (valA / maxVal) * 100;
    const pctB = (valB / maxVal) * 100;

    let diffPct = 0;
    let isDown = false;

    if (valA !== valB) {
      if (valA < valB) {
        isDown = true;
        diffPct = Math.round(((valB - valA) / valB) * 100);
      } else {
        isDown = false;
        diffPct = Math.round(((valA - valB) / valA) * 100);
      }
    }

    const labelA = isTime ? `${Math.round(valA / 60)}h` : valA.toLocaleString('en-US');
    const labelB = isTime ? `${Math.round(valB / 60)}h` : valB.toLocaleString('en-US');

    return {
      widthA: `${Math.max(4, pctA)}%`,
      widthB: `${Math.max(4, pctB)}%`,
      diffText: `${diffPct}%`,
      isDown,
      labelA,
      labelB
    };
  };

  const getExerciseFolderFromName = (name) => {
    if (!name) return '';
    return name
      .trim()
      .replace(/[\s\/]+/g, '_')
      .split('_')
      .map(word => {
        if (word.includes('-')) {
          return word.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('-');
        }
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join('_');
  };

  const commonExercises = React.useMemo(() => {
    const mapA = new Map();
    const mapB = new Map();

    userASessions.forEach(session => {
      const exercises = session.exercises || session.logs || session.sessionData?.exercises || [];
      exercises.forEach(ex => {
        const name = ex.name || ex.exercise?.name;
        if (!name) return;
        const key = name.trim().toLowerCase();
        if (!mapA.has(key)) {
          let cat = ex.target || ex.bodyPart || 'Workout';
          for (const [k, g] of Object.entries(EXERCISE_MUSCLE_MAP)) {
            if (key.includes(k)) {
              cat = g;
              break;
            }
          }
          mapA.set(key, { name, category: cat });
        }
      });
    });

    userBSessions.forEach(session => {
      const exercises = session.exercises || session.logs || session.sessionData?.exercises || [];
      exercises.forEach(ex => {
        const name = ex.name || ex.exercise?.name;
        if (!name) return;
        const key = name.trim().toLowerCase();
        if (!mapB.has(key)) {
          let cat = ex.target || ex.bodyPart || 'Workout';
          for (const [k, g] of Object.entries(EXERCISE_MUSCLE_MAP)) {
            if (key.includes(k)) {
              cat = g;
              break;
            }
          }
          mapB.set(key, { name, category: cat });
        }
      });
    });

    const common = [];
    mapA.forEach((obj, key) => {
      if (mapB.has(key)) {
        common.push(obj);
      }
    });

    return common;
  }, [userASessions, userBSessions]);

  const countProps = calculateMetricProps(statsA.workoutCount, statsB.workoutCount);
  const timeProps = calculateMetricProps(statsA.totalMinutes, statsB.totalMinutes, true);
  const volumeProps = calculateMetricProps(statsA.totalVolume, statsB.totalVolume);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Comparing workouts...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comparison</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Dropdown */}
        <TouchableOpacity style={styles.dropdown} activeOpacity={0.8}>
          <Text style={styles.dropdownText}>Last 30 days</Text>
          <Icon name="chevron-down" size={16} color="#FFF" />
        </TouchableOpacity>

        {/* Versus Row */}
        <View style={styles.vsRow}>
          <View style={styles.userContainer}>
            <View style={[styles.avatarWrapper, styles.blueRing]}>
              {(!failedA && getAvatarUri(userA, '')) ? (
                <Image
                  source={{ uri: getAvatarUri(userA, '') }}
                  style={styles.avatar}
                  onError={() => setFailedA(true)}
                />
              ) : (
                <View style={[styles.avatar, styles.initialsAvatar]}>
                  <Text style={styles.initialsText}>{getInitials(userA) || 'A'}</Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>{getUsername(userA, 'ab114')}</Text>
          </View>

          <View style={styles.vsBadge}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          <View style={styles.userContainer}>
            <View style={[styles.avatarWrapper, styles.greyRing]}>
              {(!failedB && getAvatarUri(userB, '')) ? (
                <Image
                  source={{ uri: getAvatarUri(userB, '') }}
                  style={styles.avatar}
                  onError={() => setFailedB(true)}
                />
              ) : (
                <View style={[styles.avatar, styles.initialsAvatar]}>
                  <Text style={styles.initialsText}>{getInitials(userB) || 'B'}</Text>
                </View>
              )}
            </View>
            <Text style={styles.username}>{getUsername(userB, 'emmmu')}</Text>
          </View>
        </View>

        {/* Muscle Split Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Muscle Split</Text>
          <TouchableOpacity style={styles.infoBadge} activeOpacity={0.8}>
            <Icon name="help" size={12} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Radar Chart Visual */}
        <View style={styles.chartContainer}>
          <Svg width={300} height={300} style={styles.svg}>
            {/* 5 concentric hexagons */}
            {[0.2, 0.4, 0.6, 0.8, 1.0].map((scale, idx) => {
              const hexPoints = angles.map(angle => {
                const x = cx + R * scale * Math.cos(angle);
                const y = cy + R * scale * Math.sin(angle);
                return `${x},${y}`;
              }).join(' ');
              return (
                <Polygon
                  key={idx}
                  points={hexPoints}
                  fill="none"
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={1}
                />
              );
            })}

            {/* Hexagon Axes */}
            {angles.map((angle, idx) => {
              const x2 = cx + R * Math.cos(angle);
              const y2 = cy + R * Math.sin(angle);
              return (
                <Line
                  key={idx}
                  x1={cx}
                  y1={cy}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.08)"
                  strokeWidth={1}
                />
              );
            })}

            {/* Polygon User B (Compared User - Grey) */}
            <Polygon
              points={pointsB}
              fill="rgba(255, 255, 255, 0.06)"
              stroke="#8E8E93"
              strokeWidth={1.5}
            />

            {/* Polygon User A (Current User - Blue) */}
            <Polygon
              points={pointsA}
              fill="rgba(0, 122, 255, 0.18)"
              stroke="#007AFF"
              strokeWidth={1.5}
            />

            {/* Small blue dot in center */}
            <Circle cx={cx} cy={cy} r={3} fill="#007AFF" />
          </Svg>

          {/* Absolute labels placed around the chart */}
          {/* Core (Right) */}
          <Text style={[styles.chartLabel, { top: cy - 8, left: cx + R + 10, textAlign: 'left' }]}>Core</Text>
          {/* Shoulders (Bottom Right) */}
          <Text style={[styles.chartLabel, { top: cy + R * Math.sin(60 * Math.PI / 180) + 5, left: cx + R * Math.cos(60 * Math.PI / 180) - 15 }]}>Shoulders</Text>
          {/* Arms (Bottom Left) */}
          <Text style={[styles.chartLabel, { top: cy + R * Math.sin(120 * Math.PI / 180) + 5, left: cx + R * Math.cos(120 * Math.PI / 180) - 35 }]}>Arms</Text>
          {/* Legs (Left) */}
          <Text style={[styles.chartLabel, { top: cy - 8, left: cx - R - 40, textAlign: 'right' }]}>Legs</Text>
          {/* Back (Top Left) */}
          <Text style={[styles.chartLabel, { top: cy - R * Math.sin(120 * Math.PI / 180) - 22, left: cx - R * Math.cos(120 * Math.PI / 180) - 35 }]}>Back</Text>
          {/* Chest (Top Right) */}
          <Text style={[styles.chartLabel, { top: cy - R * Math.sin(60 * Math.PI / 180) - 22, left: cx + R * Math.cos(60 * Math.PI / 180) - 15 }]}>Chest</Text>
        </View>

        {/* Stats List with Progress Bars */}
        <View style={styles.statsContainer}>
          {/* Workout Count */}
          <View style={styles.metricBlock}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Workout Count</Text>
              <View style={styles.diffBadge}>
                <Icon name={countProps.isDown ? 'arrow-down' : 'arrow-up'} size={14} color={countProps.isDown ? '#FF453A' : '#30D158'} />
                <Text style={[styles.diffText, { color: countProps.isDown ? '#FF453A' : '#30D158' }]}>{countProps.diffText}</Text>
              </View>
            </View>
            {/* User A Row */}
            <View style={styles.progressBarRow}>
              <Image
                source={{ uri: failedA ? 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150' : (userA.avatar || 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150') }}
                style={styles.smallAvatar}
              />
              <View style={styles.progressTrack}>
                <View style={[styles.progressFillBlue, { width: countProps.widthA }]} />
              </View>
              <Text style={styles.progressValue}>{countProps.labelA}</Text>
            </View>
            {/* User B Row */}
            <View style={styles.progressBarRow}>
              <Image
                source={{ uri: failedB ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' : (userB.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150') }}
                style={styles.smallAvatar}
              />
              <View style={styles.progressTrack}>
                <View style={[styles.progressFillGrey, { width: countProps.widthB }]} />
              </View>
              <Text style={styles.progressValue}>{countProps.labelB}</Text>
            </View>
          </View>

          {/* Workout Time */}
          <View style={styles.metricBlock}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Workout Time</Text>
              <View style={styles.diffBadge}>
                <Icon name={timeProps.isDown ? 'arrow-down' : 'arrow-up'} size={14} color={timeProps.isDown ? '#FF453A' : '#30D158'} />
                <Text style={[styles.diffText, { color: timeProps.isDown ? '#FF453A' : '#30D158' }]}>{timeProps.diffText}</Text>
              </View>
            </View>
            {/* User A Row */}
            <View style={styles.progressBarRow}>
              <Image
                source={{ uri: failedA ? 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150' : (userA.avatar || 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150') }}
                style={styles.smallAvatar}
              />
              <View style={styles.progressTrack}>
                <View style={[styles.progressFillBlue, { width: timeProps.widthA }]} />
              </View>
              <Text style={styles.progressValue}>{timeProps.labelA}</Text>
            </View>
            {/* User B Row */}
            <View style={styles.progressBarRow}>
              <Image
                source={{ uri: failedB ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' : (userB.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150') }}
                style={styles.smallAvatar}
              />
              <View style={styles.progressTrack}>
                <View style={[styles.progressFillGrey, { width: timeProps.widthB }]} />
              </View>
              <Text style={styles.progressValue}>{timeProps.labelB}</Text>
            </View>
          </View>

          {/* Total Volume */}
          <View style={styles.metricBlock}>
            <View style={styles.metricHeaderRow}>
              <Text style={styles.metricTitle}>Total Volume</Text>
              <View style={styles.diffBadge}>
                <Icon name={volumeProps.isDown ? 'arrow-down' : 'arrow-up'} size={14} color={volumeProps.isDown ? '#FF453A' : '#30D158'} />
                <Text style={[styles.diffText, { color: volumeProps.isDown ? '#FF453A' : '#30D158' }]}>{volumeProps.diffText}</Text>
              </View>
            </View>
            {/* User A Row */}
            <View style={styles.progressBarRow}>
              <Image
                source={{ uri: failedA ? 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150' : (userA.avatar || 'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=150') }}
                style={styles.smallAvatar}
              />
              <View style={styles.progressTrack}>
                <View style={[styles.progressFillBlue, { width: volumeProps.widthA }]} />
              </View>
              <Text style={styles.progressValue}>{volumeProps.labelA}</Text>
            </View>
            {/* User B Row */}
            <View style={styles.progressBarRow}>
              <Image
                source={{ uri: failedB ? 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' : (userB.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150') }}
                style={styles.smallAvatar}
              />
              <View style={styles.progressTrack}>
                <View style={[styles.progressFillGrey, { width: volumeProps.widthB }]} />
              </View>
              <Text style={styles.progressValue}>{volumeProps.labelB}</Text>
            </View>
          </View>
        </View>

        {/* Exercises in Common Title */}
        <View style={styles.sectionHeaderCommon}>
          <Text style={styles.sectionTitle}>Exercises in Common</Text>
          <TouchableOpacity style={styles.infoBadge} activeOpacity={0.8}>
            <Icon name="help" size={12} color="#8E8E93" />
          </TouchableOpacity>
        </View>

        {/* Exercises in Common List */}
        <View style={styles.commonExercisesList}>
          {commonExercises.length > 0 ? (
            commonExercises.map((ex, idx) => {
              const imgUri = ex.imageUrl || ex.gifUrl || ex.videoUrl || 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500';
              return (
                <TouchableOpacity key={idx} style={styles.commonExerciseRow} activeOpacity={0.8}>
                  <Image
                    source={{ uri: imgUri }}
                    style={styles.commonExerciseImg}
                  />
                  <View style={styles.commonExerciseInfo}>
                    <Text style={styles.commonExerciseName}>{ex.name}</Text>
                    <Text style={styles.commonExerciseCategory}>{ex.category}</Text>
                  </View>
                  <Icon name="chevron-forward" size={18} color="#8E8E93" />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCommonContainer}>
              <Text style={styles.emptyCommonText}>No exercises in common yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  emptyCommonContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCommonText: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '500',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#8E8E93',
    fontSize: 14,
    marginTop: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    alignSelf: 'center',
    marginTop: 20,
    marginBottom: 25,
    gap: 8,
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  vsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 35,
    gap: 20,
  },
  userContainer: {
    alignItems: 'center',
    width: 100,
  },
  avatarWrapper: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 3,
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  blueRing: {
    borderColor: '#007AFF',
  },
  greyRing: {
    borderColor: '#E5E5EA',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 38,
  },
  username: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'BRLNSR',
  },
  vsBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vsText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '900',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 6,
  },
  sectionTitle: {
    color: '#E5E5EA',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartContainer: {
    alignSelf: 'center',
    position: 'relative',
    width: 300,
    height: 300,
    marginBottom: 35,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  chartLabel: {
    position: 'absolute',
    color: '#8E8E93',
    fontSize: 12,
    fontWeight: '600',
    width: 80,
    textAlign: 'center',
  },
  statsContainer: {
    marginBottom: 35,
  },
  metricBlock: {
    marginBottom: 24,
  },
  metricHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 8,
  },
  metricTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  diffBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  diffText: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  smallAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 10,
  },
  progressTrack: {
    flex: 1,
    height: 8,
    backgroundColor: '#1C1C1E',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFillBlue: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressFillGrey: {
    height: '100%',
    backgroundColor: '#2C2C2E',
    borderRadius: 4,
  },
  progressValue: {
    color: '#8E8E93',
    fontSize: 14,
    fontWeight: '600',
    width: 80,
    textAlign: 'right',
    paddingLeft: 10,
  },
  sectionHeaderCommon: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: '#1C1C1E',
    paddingTop: 24,
  },
  commonExercisesList: {
    marginBottom: 20,
  },
  commonExerciseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1E',
  },
  commonExerciseImg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF',
    marginRight: 14,
  },
  commonExerciseInfo: {
    flex: 1,
  },
  commonExerciseName: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
  },
  commonExerciseCategory: {
    color: '#8E8E93',
    fontSize: 13,
    marginTop: 2,
  },
  initialsAvatar: {
    backgroundColor: '#3A3A3C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
});

export default ComparisonScreen;
