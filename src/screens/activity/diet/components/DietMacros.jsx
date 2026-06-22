import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';

const DietMacros = ({ handleTrackWithCamera, handlePlusButtonPress, dailySummary }) => {
  const summary = dailySummary?.summary || {};
  const targets = dailySummary?.targets || {};

  const targetProt = targets.protein || 120;
  const consumedProt = summary.protein || 0;
  const protPct = Math.round(Math.min(100, (consumedProt / targetProt) * 100));

  const targetFats = targets.fats || 65;
  const consumedFats = summary.fats || 0;
  const fatsPct = Math.round(Math.min(100, (consumedFats / targetFats) * 100));

  const targetCarbs = targets.carbs || 220;
  const consumedCarbs = summary.carbs || 0;
  const carbsPct = Math.round(Math.min(100, (consumedCarbs / targetCarbs) * 100));

  const targetFibre = 30;
  const consumedFibre = summary.fibre || 0;
  const fibrePct = Math.round(Math.min(100, (consumedFibre / targetFibre) * 100));

  return (
    <View style={styles.bottomSection}>
      <View style={styles.trackFoodHeader}>
        <View>
          <Text style={styles.trackFoodTitle}>Track Food</Text>
          <Text style={styles.trackFoodSubtitle}>Target: {targets.calories || 2000} kcal</Text>
        </View>
        <View style={styles.trackFoodActions}>
          <TouchableOpacity style={styles.iconButton} onPress={handleTrackWithCamera}>
            <Icon name="camera" size={20} color="#FFF" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButtonDark} onPress={handlePlusButtonPress}>
            <Icon name="add" size={20} color="#000" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Macros Grid */}
      <View style={styles.macrosGrid}>
        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>{consumedProt}g / {targetProt}g</Text>
          </View>
          <View style={styles.macroBarTrack}>
            <View style={[styles.macroBar, { width: `${protPct}%`, backgroundColor: '#FF5252' }]} />
          </View>
        </View>

        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>Fats</Text>
            <Text style={styles.macroValue}>{consumedFats}g / {targetFats}g</Text>
          </View>
          <View style={styles.macroBarTrack}>
            <View style={[styles.macroBar, { width: `${fatsPct}%`, backgroundColor: '#FFD700' }]} />
          </View>
        </View>

        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>{consumedCarbs}g / {targetCarbs}g</Text>
          </View>
          <View style={styles.macroBarTrack}>
            <View style={[styles.macroBar, { width: `${carbsPct}%`, backgroundColor: '#00E676' }]} />
          </View>
        </View>

        <View style={styles.macroCol}>
          <View style={styles.macroHeader}>
            <Text style={styles.macroLabel}>Fibre</Text>
            <Text style={styles.macroValue}>{consumedFibre}g / {targetFibre}g</Text>
          </View>
          <View style={styles.macroBarTrack}>
            <View style={[styles.macroBar, { width: `${fibrePct}%`, backgroundColor: '#00E5FF' }]} />
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomSection: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    backgroundColor: '#050505',
  },
  trackFoodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  trackFoodTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFF',
  },
  trackFoodSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 4,
  },
  trackFoodActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  iconButtonDark: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  macroCol: {
    width: '47%',
    marginBottom: 20,
  },
  macroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 8,
  },
  macroLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '700',
  },
  macroValue: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  macroBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  macroBar: {
    height: '100%',
    borderRadius: 3,
  },
});

export default DietMacros;
