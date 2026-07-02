import React, { useRef } from 'react';
import {
  SafeAreaView,
  StatusBar,
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');
const PLAN_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const WeeklyDietPlanScreen = ({ navigation, route }) => {
  const { recommendation } = route.params || {};
  const weeklyPlanScrollViewRef = useRef(null);

  if (!recommendation || !recommendation.weeklyPlan) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>WEEKLY DIET PLAN</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Icon name="restaurant-outline" size={48} color="#e74c3c" />
          <Text style={styles.emptyText}>No diet plan data available.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const days = PLAN_DAY_NAMES;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>AI WEEKLY DIET PLAN</Text>
          <Text style={styles.headerSubtitle}>Customized nutritional program for your goal</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.weeklyPlanSection}>
          <LinearGradient
            colors={['#1a1c23', '#0f1013']}
            style={styles.weeklyPlanCard}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={{ paddingVertical: 20, width: '100%' }}>
              <ScrollView
                ref={weeklyPlanScrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.weeklyPlanScrollWrapper}
                snapToInterval={width * 0.82 + 12}
                decelerationRate="fast"
                bounces={true}
              >
                {days.map((day) => {
                  const dayDataKey = Object.keys(recommendation.weeklyPlan).find(
                    key => key.toLowerCase() === day.toLowerCase()
                  );
                  const meals = dayDataKey ? recommendation.weeklyPlan[dayDataKey] : [];
                  const totalCals = meals ? meals.reduce((sum, m) => sum + (m.calories || 0), 0) : 0;
                  
                  return (
                    <View key={day} style={styles.dayPlanColumn}>
                      <View style={styles.dayColumnHeader}>
                        <Text style={styles.dayColumnTitle}>{day.toUpperCase()}</Text>
                        <View style={styles.dayColumnBadge}>
                          <Text style={styles.dayColumnBadgeText}>{totalCals} kcal</Text>
                        </View>
                      </View>
                      
                      <View style={styles.dayMealsList}>
                        {meals && meals.length > 0 ? (
                          meals.map((meal, index) => {
                            let iconName = 'restaurant-outline';
                            let iconColor = '#FF7A00';
                            const typeLower = (meal.mealType || meal.type || '').toLowerCase();
                            if (typeLower.includes('breakfast')) {
                              iconName = 'cafe-outline';
                              iconColor = '#00E676';
                            } else if (typeLower.includes('snack')) {
                              iconName = 'nutrition-outline';
                              iconColor = '#7C4DFF';
                            } else if (typeLower.includes('lunch')) {
                              iconName = 'restaurant-outline';
                              iconColor = '#FF7A00';
                            } else if (typeLower.includes('dinner')) {
                              iconName = 'sunny-outline';
                              iconColor = '#FF5252';
                            }

                            return (
                              <View key={index} style={styles.weeklyMealCard}>
                                <View style={[styles.weeklyMealIconWrapper, { backgroundColor: 'rgba(255, 255, 255, 0.03)' }]}>
                                  <Icon name={iconName} size={18} color={iconColor} />
                                </View>
                                <View style={styles.weeklyMealDetails}>
                                  <View style={styles.weeklyMealTypeRow}>
                                    <Text style={[styles.weeklyMealTypeText, { color: iconColor }]}>
                                      {(meal.mealType || meal.type || 'Meal').toUpperCase()}
                                    </Text>
                                    <Text style={styles.weeklyMealCaloriesText}>
                                      {meal.calories || 0} kcal
                                    </Text>
                                  </View>
                                  <Text style={styles.weeklyMealDescriptionText}>
                                    {meal.name || meal.description || 'Custom Meal'}
                                  </Text>
                                  {meal.protein || meal.carbs || meal.fat ? (
                                    <Text style={styles.weeklyMealMacrosText}>
                                      P: {meal.protein || 0}g  C: {meal.carbs || 0}g  F: {meal.fat || 0}g
                                    </Text>
                                  ) : null}
                                </View>
                              </View>
                            );
                          })
                        ) : (
                          <View style={styles.emptyDayContainer}>
                            <Text style={styles.emptyDayText}>Rest Day or No Meals Scheduled</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  backButton: {
    padding: 6,
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 11,
    marginTop: 2,
  },
  scrollContainer: {
    paddingVertical: 10,
  },
  weeklyPlanSection: {
    paddingHorizontal: 16,
    marginTop: 10,
    marginBottom: 20,
  },
  weeklyPlanCard: {
    flexDirection: 'column',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignSelf: 'stretch',
    overflow: 'hidden',
  },
  weeklyPlanScrollWrapper: {
    paddingHorizontal: 10,
    paddingBottom: 8,
  },
  dayPlanColumn: {
    width: width * 0.82,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    marginHorizontal: 6,
    alignSelf: 'flex-start',
  },
  dayColumnHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 10,
  },
  dayColumnTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  dayColumnBadge: {
    backgroundColor: 'rgba(231, 76, 60, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  dayColumnBadgeText: {
    color: '#e74c3c',
    fontSize: 11,
    fontWeight: 'bold',
  },
  dayMealsList: {
    minHeight: 100,
  },
  weeklyMealCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.015)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.03)',
  },
  weeklyMealIconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  weeklyMealDetails: {
    flex: 1,
  },
  weeklyMealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyMealTypeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  weeklyMealCaloriesText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  weeklyMealDescriptionText: {
    fontSize: 13,
    color: '#FFF',
    fontWeight: '500',
    marginTop: 4,
  },
  weeklyMealMacrosText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
    marginTop: 4,
  },
  emptyDayContainer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  emptyDayText: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 14,
    marginTop: 10,
  },
});

export default WeeklyDietPlanScreen;
