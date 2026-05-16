import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DietMacros = ({ handleTrackWithCamera }) => {
  return (
    <View style={styles.bottomSection}>
      <View style={styles.trackFoodHeader}>
        <View>
          <Text style={styles.trackFoodTitle}>Track Food</Text>
          <Text style={styles.trackFoodSubtitle}>Eat 1,000 Cal</Text>
        </View>
        <View style={styles.trackFoodActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleTrackWithCamera}>
            <Icon name="camera" size={28} color="#000" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButtonDark}>
            <Icon name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Macros Grid */}
      <View style={styles.macrosGrid}>
        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>Protein:</Text>
            <Text style={styles.macroValue}>0%</Text>
          </View>
          <View style={styles.macroBar} />
        </View>
        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>Fats:</Text>
            <Text style={styles.macroValue}>0%</Text>
          </View>
          <View style={styles.macroBar} />
        </View>
        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>Carbs:</Text>
            <Text style={styles.macroValue}>0%</Text>
          </View>
          <View style={styles.macroBar} />
        </View>
        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>Fibre:</Text>
            <Text style={styles.macroValue}>0%</Text>
          </View>
          <View style={styles.macroBar} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSection: {
    paddingTop: 30,
    paddingBottom: 30,
    paddingHorizontal: 20,
    backgroundColor: '#FFF',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  trackFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 25,
  },
  trackFoodTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#000',
  },
  trackFoodSubtitle: {
    fontSize: 13,
    color: '#888',
    marginTop: 2,
  },
  trackFoodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconButtonDark: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroCol: {
    width: '45%',
    marginBottom: 24,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 15,
    color: '#000',
    fontWeight: '500',
  },
  macroValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#000',
  },
  macroBar: {
    height: 6,
    backgroundColor: '#000',
    borderRadius: 3,
    width: '100%',
  },
});

export default DietMacros;
