import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DietMacros = ({ dailySummary, handleTrackWithCamera, handlePlusButtonPress, navigation }) => {
  const summary = dailySummary?.summary || {};
  const targets = dailySummary?.targets || {};

  const targetCals = targets.calories || 1000;

  const targetProt = targets.protein || 120;
  const consumedProt = summary.protein || 0;
  const protPct = Math.round(Math.min(100, (consumedProt / targetProt) * 100));

  const targetFats = targets.fats || 65;
  const consumedFats = summary.fats || 0;
  const fatsPct = Math.round(Math.min(100, (consumedFats / targetFats) * 100));

  const targetCarbs = targets.carbs || 220;
  const consumedCarbs = summary.carbs || 0;
  const carbsPct = Math.round(Math.min(100, (consumedCarbs / targetCarbs) * 100));

  const targetFibre = targets.fibre || 30;
  const consumedFibre = summary.fibre || 0;
  const fibrePct = Math.round(Math.min(100, (consumedFibre / targetFibre) * 100));

  const handlePress = () => {
    navigation?.navigate('MacronutrientDetails', { dailySummary });
  };

  return (
    <View style={styles.container}>
      {/* Track Food Header Row */}
      <View style={styles.trackFoodHeader}>
        <TouchableOpacity 
          style={styles.titleCol} 
          onPress={() => navigation?.navigate('DietAllLogs')}
          activeOpacity={0.7}
        >
          <Text style={styles.trackFoodTitle}>Track Food</Text>
          <Text style={styles.trackFoodSubtitle}>Eat {targetCals.toLocaleString()} Cal</Text>
        </TouchableOpacity>
        <View style={styles.trackFoodActions}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleTrackWithCamera} activeOpacity={0.7}>
            <Icon name="camera" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={handlePlusButtonPress} activeOpacity={0.7}>
            <Icon name="add" size={20} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Macros Grid */}
      <View style={styles.gridRow}>
        {/* Protein */}
        <TouchableOpacity style={styles.macroCol} onPress={handlePress} activeOpacity={0.7}>
          <View style={styles.labelRow}>
            <Text style={styles.macroLabel}>Protein:</Text>
            <Text style={styles.macroValue}>{protPct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${protPct}%` }]} />
          </View>
        </TouchableOpacity>

        {/* fatss */}
        <TouchableOpacity style={styles.macroCol} onPress={handlePress} activeOpacity={0.7}>
          <View style={styles.labelRow}>
            <Text style={styles.macroLabel}>fatss:</Text>
            <Text style={styles.macroValue}>{fatsPct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${fatsPct}%` }]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.gridRow}>
        {/* carbss */}
        <TouchableOpacity style={styles.macroCol} onPress={handlePress} activeOpacity={0.7}>
          <View style={styles.labelRow}>
            <Text style={styles.macroLabel}>carbss:</Text>
            <Text style={styles.macroValue}>{carbsPct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${carbsPct}%` }]} />
          </View>
        </TouchableOpacity>

        {/* fibre */}
        <TouchableOpacity style={styles.macroCol} onPress={handlePress} activeOpacity={0.7}>
          <View style={styles.labelRow}>
            <Text style={styles.macroLabel}>fibre:</Text>
            <Text style={styles.macroValue}>{fibrePct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${fibrePct}%` }]} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#000',
  },
  trackFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  titleCol: {
    flex: 1,
  },
  trackFoodTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  trackFoodSubtitle: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 12,
    marginTop: 2,
  },
  trackFoodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  macroCol: {
    width: '46%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  macroLabel: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  macroValue: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  track: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#FFF',
    borderRadius: 2,
  },
});

export default DietMacros;
