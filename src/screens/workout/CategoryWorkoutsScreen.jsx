import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StatusBar,
  SafeAreaView
} from 'react-native';
import Svg, { Path, Polyline, Rect, Circle } from 'react-native-svg';
import { PRESET_ROUTINES } from '../../utils/presetRoutinesData';

const BackIcon = () => (
  <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    <Polyline points="12 19 5 12 12 5" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const PlayIcon = () => (
  <Svg width="14" height="14" viewBox="0 0 24 24" fill="#FFFFFF">
    <Path d="M8 5v14l11-7z" />
  </Svg>
);

const AtHomeIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <Path d="M6 22L24 6L42 22" stroke="#EE822A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M10 20V42C10 43.1046 10.8954 44 12 44H36C37.1046 44 38 43.1046 38 42V20" stroke="#EE822A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    <Path d="M20 44V32H28V44" stroke="#EE822A" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" />
  </Svg>
);

const TravelIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="16" width="32" height="22" rx="6" fill="#EE822A" />
    <Path d="M14 16V10C14 8.89543 14.8954 8 16 8H32C33.1046 8 34 8.89543 34 10V16" stroke="#EE822A" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

const DumbbellCategoryIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="18" width="6" height="12" rx="3" fill="#EE822A" />
    <Rect x="34" y="18" width="6" height="12" rx="3" fill="#EE822A" />
    <Rect x="14" y="22" width="20" height="4" rx="1" fill="#EE822A" />
  </Svg>
);

const BandIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <Path d="M8 24C8 15.1634 15.1634 8 24 8C32.8366 8 40 15.1634 40 24" stroke="#EE822A" strokeWidth="4.5" strokeLinecap="round" />
    <Path d="M12 28C12 21.3726 17.3726 16 24 16C30.6274 16 36 21.3726 36 28" stroke="#EE822A" strokeWidth="3.5" strokeLinecap="round" />
  </Svg>
);

const CardioIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <Rect x="16" y="14" width="16" height="20" rx="3" fill="#EE822A" />
    <Circle cx="24" cy="24" r="6" stroke="#EE822A" strokeWidth="3" />
  </Svg>
);

const GymIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="16" width="32" height="24" rx="4" fill="#EE822A" />
    <Path d="M6 16H42" stroke="#EE822A" strokeWidth="4.5" strokeLinecap="round" />
  </Svg>
);

const BodyweightIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <Rect x="8" y="14" width="32" height="20" rx="10" fill="#EE822A" />
    <Circle cx="16" cy="24" r="6" fill="#EE822A" />
  </Svg>
);

const SuspensionIcon = () => (
  <Svg width="28" height="28" viewBox="0 0 48 48" fill="none">
    <Path d="M24 6V18" stroke="#EE822A" strokeWidth="4" strokeLinecap="round" />
    <Path d="M24 18L14 36" stroke="#EE822A" strokeWidth="3" />
    <Path d="M24 18L34 36" stroke="#EE822A" strokeWidth="3" />
  </Svg>
);

const CategoryWorkoutsScreen = ({ route, navigation }) => {
  const { category = 'At home' } = route.params || {};

  const [selectedSubFilter, setSelectedSubFilter] = useState('ALL'); // Sub-filters vary by category

  const categoryIcon = useMemo(() => {
    switch (category) {
      case 'At home': return <AtHomeIcon />;
      case 'Travel': return <TravelIcon />;
      case 'Dumbbells Only': return <DumbbellCategoryIcon />;
      case 'Band': return <BandIcon />;
      case 'Cardio & HIIT': return <CardioIcon />;
      case 'Gym': return <GymIcon />;
      case 'Bodyweight': return <BodyweightIcon />;
      case 'Suspension Band': return <SuspensionIcon />;
      default: return <AtHomeIcon />;
    }
  }, [category]);

  const filteredRoutines = useMemo(() => {
    // 1. Initial filter based on category
    let list = PRESET_ROUTINES;
    if (category === 'At home') {
      list = list.filter(r => r.equipment === 'NONE' || r.equipment === 'DUMBBELLS');
    } else if (category === 'Travel') {
      list = list.filter(r => r.equipment === 'NONE');
    } else if (category === 'Dumbbells Only') {
      list = list.filter(r => r.equipment === 'DUMBBELLS');
    } else if (category === 'Band') {
      list = list.filter(r => r.equipment === 'NONE'); // Fallback
    } else if (category === 'Cardio & HIIT') {
      list = list.filter(r => r.goal === 'LOSE_WEIGHT');
    } else if (category === 'Gym') {
      list = list.filter(r => r.equipment === 'GYM');
    } else if (category === 'Bodyweight') {
      list = list.filter(r => r.equipment === 'NONE');
    } else if (category === 'Suspension Band') {
      list = list.filter(r => r.equipment === 'NONE'); // Fallback
    }

    // 2. Sub-filtering
    if (selectedSubFilter !== 'ALL') {
      if (category === 'At home') {
        if (selectedSubFilter === 'BODYWEIGHT') {
          list = list.filter(r => r.equipment === 'NONE');
        } else if (selectedSubFilter === 'DUMBBELLS') {
          list = list.filter(r => r.equipment === 'DUMBBELLS');
        }
      } else {
        // Levels filter (BEGINNER, INTERMEDIATE, ADVANCED)
        list = list.filter(r => r.level === selectedSubFilter);
      }
    }

    return list;
  }, [category, selectedSubFilter]);

  const subFilters = useMemo(() => {
    if (category === 'At home') {
      return [
        { id: 'ALL', label: 'All' },
        { id: 'BODYWEIGHT', label: 'Bodyweight' },
        { id: 'DUMBBELLS', label: 'Dumbbells' }
      ];
    } else {
      return [
        { id: 'ALL', label: 'All Levels' },
        { id: 'BEGINNER', label: 'Beginner' },
        { id: 'INTERMEDIATE', label: 'Medium' },
        { id: 'ADVANCED', label: 'Advanced' }
      ];
    }
  }, [category]);

  const renderRoutineItem = ({ item: routine }) => {
    const levelLabel = routine.level.charAt(0) + routine.level.slice(1).toLowerCase();
    let eqLabel = 'Gym';
    if (routine.equipment === 'NONE') eqLabel = 'Bodyweight';
    if (routine.equipment === 'DUMBBELLS') eqLabel = 'Dumbbells';

    return (
      <TouchableOpacity
        style={styles.routineCard}
        activeOpacity={0.85}
        onPress={() => {
          navigation.navigate('RoutineDetailScreen', { program: routine });
        }}
      >
        <View style={styles.routineCardBody}>
          <Text style={styles.routineTitle} numberOfLines={2}>
            {routine.name}
          </Text>
          <Text style={styles.routineSubtitle}>
            {levelLabel} • {eqLabel} • {routine.routinesCount} Workouts
          </Text>
        </View>
        <TouchableOpacity
          style={styles.playButton}
          activeOpacity={0.7}
          onPress={() => {
            navigation.navigate('RoutineDetailScreen', { program: routine });
          }}
        >
          <PlayIcon />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#0A0A12" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <BackIcon />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          {categoryIcon}
          <Text style={styles.headerTitle}>{category}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterTabsContainer}>
        {subFilters.map(tab => {
          const isActive = selectedSubFilter === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabButton, isActive && styles.tabButtonActive]}
              onPress={() => setSelectedSubFilter(tab.id)}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Workouts List */}
      <FlatList
        contentContainerStyle={styles.listContent}
        data={filteredRoutines}
        keyExtractor={(item) => item.id}
        renderItem={renderRoutineItem}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No workouts found matching selection.</Text>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A12',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  filterTabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginVertical: 18,
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#1E1E26',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  tabButtonActive: {
    backgroundColor: '#EE822A',
    borderColor: '#EE822A',
  },
  tabText: {
    color: '#8E8E9A',
    fontSize: 13,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  routineCard: {
    width: '100%',
    padding: 18,
    backgroundColor: '#1E1E26',
    borderRadius: 16,
    marginBottom: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  routineCardBody: {
    flex: 1,
    paddingRight: 10,
  },
  routineTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  routineSubtitle: {
    color: '#8E8E9A',
    fontSize: 13,
    fontWeight: '500',
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EE822A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#8E8E9A',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default CategoryWorkoutsScreen;
