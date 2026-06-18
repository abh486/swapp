import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DietLogs = ({ trackedMealImage, handleTrackFood, navigation }) => {
  const [selectedFilter, setSelectedFilter] = useState('Nutrition Tracker');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const filterOptions = ['Step tracker', 'Sleep Tracker', 'Nutrition Tracker'];

  const handleSelectFilter = (opt) => {
    setSelectedFilter(opt);
    setIsDropdownOpen(false);
    if (opt === 'Step tracker') {
      navigation.navigate('DietAllLogs', { mode: 'steps' });
    } else if (opt === 'Nutrition Tracker') {
      navigation.navigate('DietAllLogs', { mode: 'diet' });
    } else if (opt === 'Sleep Tracker') {
      navigation.navigate('DietAllLogs', { mode: 'sleep' });
    }
  };

  // Mock logged items for visualization
  const mockMeals = [
    {
      id: 'breakfast',
      type: 'Breakfast',
      time: '08:15 AM',
      name: 'Oatmeal with Mixed Berries',
      calories: 320,
      macros: 'P: 10g  •  C: 54g  •  F: 6g',
      image: 'https://images.unsplash.com/photo-1517881917430-e70dfb3610aa?auto=format&fit=crop&w=120&q=80',
    },
    {
      id: 'lunch',
      type: 'Lunch',
      time: '01:30 PM',
      name: 'Grilled Salmon Salad',
      calories: 450,
      macros: 'P: 35g  •  C: 12g  •  F: 28g',
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=120&q=80',
    },
  ];

  // If a meal is actively tracked, we prepend it to the list
  const activeMeals = [];
  if (trackedMealImage) {
    activeMeals.push({
      id: 'tracked',
      type: 'Lunch',
      time: '02:00 PM',
      name: 'Green Luxe Bowl (AI Logged)',
      calories: 360,
      macros: 'P: 12g  •  C: 18g  •  F: 8g',
      image: trackedMealImage,
    });
  }
  
  // Combine lists
  const allMeals = [...activeMeals, ...mockMeals];

  // Filter based on dropdown
  const filteredMeals = selectedFilter === 'All Meals'
    ? allMeals
    : allMeals.filter(m => m.type === selectedFilter);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.logsCard} onPress={handleTrackFood} activeOpacity={0.95}>
        {/* Header Row */}
        <View style={styles.headerRow}>
          <Text style={styles.title}>TODAY'S LOGS</Text>
          
          <View style={styles.dropdownContainer}>
            <TouchableOpacity 
              style={styles.dropdownBtn} 
              onPress={() => setIsDropdownOpen(!isDropdownOpen)}
              activeOpacity={0.8}
            >
              <Text style={styles.dropdownText}>{selectedFilter}</Text>
              <Icon name={isDropdownOpen ? 'chevron-up' : 'chevron-down'} size={12} color="#FFF" />
            </TouchableOpacity>

            {isDropdownOpen && (
              <View style={styles.dropdownList}>
                {filterOptions.map((opt) => (
                  <TouchableOpacity 
                    key={opt} 
                    style={styles.dropdownItem}
                    onPress={() => handleSelectFilter(opt)}
                  >
                    <Text style={[
                      styles.dropdownItemText, 
                      selectedFilter === opt && styles.dropdownItemTextActive
                    ]}>
                      {opt}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Overlapping Food Circles + Plus Button Row */}
        <View style={styles.circlesRow}>
          <View style={styles.avatarStack}>
            {allMeals.slice(0, 4).map((meal, idx) => (
              <Image
                key={meal.id}
                source={{ uri: meal.image }}
                style={[
                  styles.foodAvatar,
                  { marginLeft: idx === 0 ? 0 : -16, zIndex: 10 - idx }
                ]}
              />
            ))}
            {allMeals.length === 0 && (
              <View style={styles.emptyAvatarCircle}>
                <Icon name="restaurant-outline" size={16} color="rgba(255, 255, 255, 0.3)" />
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.plusBtn} onPress={handleTrackFood} activeOpacity={0.8}>
            <Icon name="add" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Meal Breakdown List */}
        <View style={styles.breakdownList}>
          {filteredMeals.map((meal) => (
            <View key={meal.id} style={styles.mealRow}>
              <Image source={{ uri: meal.image }} style={styles.mealThumb} />
              <View style={styles.mealInfo}>
                <View style={styles.mealHeader}>
                  <Text style={styles.mealType}>{meal.type.toUpperCase()}</Text>
                  <Text style={styles.mealTime}>{meal.time}</Text>
                </View>
                <Text style={styles.mealName} numberOfLines={1}>{meal.name}</Text>
                <Text style={styles.mealMacros}>{meal.macros}</Text>
              </View>
              <Text style={styles.mealCal}>{meal.calories} kcal</Text>
            </View>
          ))}

          {filteredMeals.length === 0 && (
            <View style={styles.emptyBreakdown}>
              <Text style={styles.emptyText}>No logs found for {selectedFilter}</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 40,
  },
  logsCard: {
    backgroundColor: '#111115',
    borderRadius: 24,
    padding: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 100,
  },
  title: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  dropdownContainer: {
    position: 'relative',
  },
  dropdownBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  dropdownText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
    marginRight: 6,
  },
  dropdownList: {
    position: 'absolute',
    top: 32,
    right: 0,
    backgroundColor: '#1C1C24',
    borderRadius: 12,
    paddingVertical: 6,
    width: 110,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
    zIndex: 999,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  dropdownItemText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 11,
    fontWeight: '600',
  },
  dropdownItemTextActive: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  circlesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  foodAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#111115',
    backgroundColor: '#222',
  },
  emptyAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    borderStyle: 'dashed',
  },
  plusBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 15,
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  breakdownList: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.05)',
    paddingTop: 15,
  },
  mealRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.02)',
  },
  mealThumb: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#222',
  },
  mealInfo: {
    flex: 1,
    marginLeft: 12,
    marginRight: 10,
  },
  mealHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  mealType: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mealTime: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 8,
    marginLeft: 6,
    fontWeight: '600',
  },
  mealName: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  mealMacros: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 10,
    fontWeight: '600',
  },
  mealCal: {
    color: '#FFF',
    fontSize: 13,
    fontWeight: 'bold',
  },
  emptyBreakdown: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.3)',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default DietLogs;
