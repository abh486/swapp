import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useResponsiveMetrics } from '../../../../utils/responsive';

const DietMacros = ({ dailySummary, selectedDate, handleTrackWithCamera, handlePlusButtonPress, navigation }) => {
  const { sp, fs, ms } = useResponsiveMetrics();
  const summary = dailySummary?.summary || {};
  const targets = dailySummary?.targets || {};

  const targetCals = targets.calories || 0;

  const targetProt = targets.protein || 0;
  const consumedProt = summary.protein || 0;
  const protPct = targetProt > 0 ? Math.round(Math.min(100, (consumedProt / targetProt) * 100)) : 0;

  const targetFats = targets.fats || targets.fat || 0;
  const consumedFats = summary.fats || summary.fat || 0;
  const fatsPct = targetFats > 0 ? Math.round(Math.min(100, (consumedFats / targetFats) * 100)) : 0;

  const targetCarbs = targets.carbs || 0;
  const consumedCarbs = summary.carbs || 0;
  const carbsPct = targetCarbs > 0 ? Math.round(Math.min(100, (consumedCarbs / targetCarbs) * 100)) : 0;

  const targetFibre = targets.fibre || targets.fiber || 0;
  const consumedFibre = summary.fibre || summary.fiber || 0;
  const fibrePct = targetFibre > 0 ? Math.round(Math.min(100, (consumedFibre / targetFibre) * 100)) : 0;

  const handlePress = () => {
    navigation?.navigate('MacronutrientDetails', { dailySummary, selectedDate: selectedDate || new Date() });
  };

  return (
    <View style={[styles.container, { paddingHorizontal: sp(20), paddingVertical: sp(15) }]}>
      {/* Track Food Header Row */}
      <View style={[styles.trackFoodHeader, { marginBottom: sp(16) }]}>
        <TouchableOpacity 
          style={styles.titleCol} 
          onPress={() => navigation?.navigate('DietAllLogs')}
          activeOpacity={0.7}
        >
          <Text style={[styles.trackFoodTitle, { fontSize: fs(22) }]}>Track Food</Text>
          <Text style={[styles.trackFoodSubtitle, { fontSize: fs(12) }]}>
            {targetCals > 0 ? `Eat ${targetCals.toLocaleString()} Cal` : 'Daily Target'}
          </Text>
        </TouchableOpacity>
        <View style={styles.trackFoodActions}>
          <TouchableOpacity 
            style={[styles.actionBtn, { width: ms(36), height: ms(36), borderRadius: ms(18) }]} 
            onPress={handleTrackWithCamera} 
            activeOpacity={0.7}
          >
            <Icon name="camera" size={ms(18)} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.actionBtn, { width: ms(36), height: ms(36), borderRadius: ms(18) }]} 
            onPress={handlePlusButtonPress} 
            activeOpacity={0.7}
          >
            <Icon name="add" size={ms(20)} color="#FFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Macros Grid */}
      <View style={[styles.gridRow, { marginBottom: sp(16) }]}>
        {/* Protein */}
        <TouchableOpacity style={styles.macroCol} onPress={handlePress} activeOpacity={0.7}>
          <View style={styles.labelRow}>
            <Text style={[styles.macroLabel, { fontSize: fs(15) }]}>Protein:</Text>
            <Text style={[styles.macroValue, { fontSize: fs(15) }]}>{protPct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${protPct}%` }]} />
          </View>
        </TouchableOpacity>

        {/* Fat */}
        <TouchableOpacity style={styles.macroCol} onPress={handlePress} activeOpacity={0.7}>
          <View style={styles.labelRow}>
            <Text style={[styles.macroLabel, { fontSize: fs(15) }]}>Fat:</Text>
            <Text style={[styles.macroValue, { fontSize: fs(15) }]}>{fatsPct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${fatsPct}%` }]} />
          </View>
        </TouchableOpacity>
      </View>

      <View style={[styles.gridRow, { marginBottom: sp(16) }]}>
        {/* Carbs */}
        <TouchableOpacity style={styles.macroCol} onPress={handlePress} activeOpacity={0.7}>
          <View style={styles.labelRow}>
            <Text style={[styles.macroLabel, { fontSize: fs(15) }]}>Carbs:</Text>
            <Text style={[styles.macroValue, { fontSize: fs(15) }]}>{carbsPct}%</Text>
          </View>
          <View style={styles.track}>
            <View style={[styles.bar, { width: `${carbsPct}%` }]} />
          </View>
        </TouchableOpacity>

        {/* Fibre */}
        <TouchableOpacity style={styles.macroCol} onPress={handlePress} activeOpacity={0.7}>
          <View style={styles.labelRow}>
            <Text style={[styles.macroLabel, { fontSize: fs(15) }]}>Fibre:</Text>
            <Text style={[styles.macroValue, { fontSize: fs(15) }]}>{fibrePct}%</Text>
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
