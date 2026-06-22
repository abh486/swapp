import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DietMealSelectionModal = ({
  visible,
  onClose,
  dailySummary,
  logs = [],
  onSelectMeal,
}) => {
  const targetCals = dailySummary?.targets?.calories || 2000;

  // Meal configurations matching the breakdown proportions from screenshot:
  // Breakfast: 30%, Morning Snack: 15%, Lunch: 30%, Evening Snack: 15%, Dinner: 30%
  const mealsConfig = [
    { type: 'Breakfast', ratio: 0.3, label: 'Breakfast' },
    { type: 'Morning Snack', ratio: 0.15, label: 'Morning Snack' },
    { type: 'Lunch', ratio: 0.3, label: 'Lunch' },
    { type: 'Evening Snack', ratio: 0.15, label: 'Evening Snack' },
    { type: 'Dinner', ratio: 0.3, label: 'Dinner' },
  ];

  const getConsumedCalories = (mealType) => {
    return logs
      .filter((log) => log.mealType && log.mealType.toLowerCase() === mealType.toLowerCase())
      .reduce((sum, log) => sum + (log.calories || 0), 0);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.sheetContainer}>
              {/* Drag Handle */}
              <View style={styles.dragHandle} />

              <Text style={styles.sheetTitle}>Select a Meal You Would Like to Track</Text>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
                {mealsConfig.map((meal) => {
                  const target = Math.round(targetCals * meal.ratio);
                  const consumed = getConsumedCalories(meal.type);

                  return (
                    <View key={meal.type} style={styles.mealRow}>
                      <Text style={styles.mealLabel}>{meal.label}</Text>
                      <View style={styles.rightContainer}>
                        <Text style={styles.calText}>
                          {consumed}/{target} Cal
                        </Text>
                        <TouchableOpacity
                          style={styles.orangePlusButton}
                          onPress={() => onSelectMeal(meal.type)}
                          activeOpacity={0.8}
                        >
                          <Icon name="add" size={18} color="#FFF" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>
              <SafeAreaView />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#111115',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    maxHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 20,
    marginTop: 4,
  },
  listContainer: {
    paddingBottom: 20,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  mealLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  rightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  calText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    marginRight: 16,
    fontWeight: '400',
  },
  orangePlusButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FF6F00',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default DietMealSelectionModal;
