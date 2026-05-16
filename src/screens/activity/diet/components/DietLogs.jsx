import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DietLogs = ({ trackedMealImage, handleTrackFood }) => {
  return (
    <View style={styles.logsSection}>
      <Text style={styles.logsTitle}>TODAY'S LOGS</Text>
      
      {trackedMealImage ? (
        <View style={styles.logsCardPopulated}>
          {/* Breakfast Empty Card */}
          <View style={styles.trackedLogCard}>
            <View style={styles.mealTypePill}>
              <Text style={styles.mealTypeText}>Breakfast</Text>
            </View>
            <Text style={styles.emptyMealText}>empty</Text>
            <View style={styles.emptyImageCircle}>
              <Icon name="camera" size={24} color="#000" />
            </View>
          </View>

          {/* Lunch Tracked Card */}
          <View style={styles.trackedLogCard}>
            <View style={styles.lunchHeaderRow}>
              <View style={styles.mealTypePill}>
                <Text style={styles.mealTypeText}>Lunch</Text>
              </View>
              <Text style={styles.mealTimeText}>7:30 AM</Text>
            </View>

            <View style={styles.mealItemList}>
              <View style={styles.mealItemRow}>
                <Text style={styles.mealItemName}>oe</Text>
                <Text style={styles.mealItemCals}>425</Text>
              </View>
              <View style={styles.mealItemRow}>
                <Text style={styles.mealItemName}>egg omlat</Text>
                <Text style={styles.mealItemCals}>425</Text>
              </View>
              <View style={styles.mealItemRow}>
                <Text style={styles.mealItemName}>Sory breakfast</Text>
                <Text style={styles.mealItemCals}>425</Text>
              </View>
            </View>

            <View style={styles.mealMacrosLine} />
            
            <View style={styles.mealMacrosRow}>
              <Text style={styles.mealMacroVal}>425</Text>
              <Text style={styles.mealMacroVal}>15g</Text>
              <Text style={styles.mealMacroVal}>9g</Text>
              <Text style={styles.mealMacroVal}>74g</Text>
              <Text style={styles.mealMacroVal}>6g</Text>
            </View>
            
            <Text style={styles.viewDetailsText}>View Details</Text>
            <Image source={{ uri: trackedMealImage }} style={styles.trackedMealImage} />
          </View>
        </View>
      ) : (
        <View style={styles.logsCardEmpty}>
          <Text style={styles.logsEmptyText}>NOTHING TRACKED YET !</Text>
          <TouchableOpacity style={styles.logsTrackButton} onPress={handleTrackFood}>
            <Text style={styles.logsTrackButtonText}>TRACK NOW</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logsSection: {
    paddingHorizontal: 16,
    marginTop: 35,
    marginBottom: 50,
  },
  logsTitle: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 16,
    marginLeft: 4,
  },
  logsCardEmpty: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0'
  },
  logsEmptyText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  logsTrackButton: {
    backgroundColor: '#000',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
  },
  logsTrackButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  logsCardPopulated: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  trackedLogCard: {
    width: '100%',
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#A5D6A7',
    marginBottom: 15,
    padding: 15,
    minHeight: 110,
    position: 'relative',
    overflow: 'visible',
  },
  mealTypePill: {
    backgroundColor: '#A5D6A7',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
  },
  mealTypeText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  lunchHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
    paddingRight: 60,
  },
  mealTimeText: {
    color: '#888',
    fontSize: 10,
  },
  mealItemList: {
    marginBottom: 10,
    width: '60%',
  },
  mealItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  mealItemName: {
    color: '#000',
    fontSize: 10,
    fontWeight: '500',
  },
  mealItemCals: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
  },
  mealMacrosLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    width: '75%',
    marginBottom: 8,
  },
  mealMacrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '75%',
    marginBottom: 10,
  },
  mealMacroVal: {
    color: '#000',
    fontSize: 10,
    fontWeight: '600',
  },
  viewDetailsText: {
    color: '#000',
    fontSize: 10,
    fontWeight: 'bold',
    position: 'absolute',
    bottom: 15,
    right: 25,
  },
  trackedMealImage: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 10,
  },
  emptyMealText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 10,
  },
  emptyImageCircle: {
    position: 'absolute',
    right: -15,
    top: '50%',
    marginTop: -45,
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F9F9F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    zIndex: 10,
  },
});

export default DietLogs;
