// WorkoutStats.js — Updated with Config
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Dimensions,
  Image,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Strings } from '../../../config/config'; // Import Config

const screenWidth = Dimensions.get("window").width;

const WorkoutStats = () => {
  const [activeTab, setActiveTab] = useState("Week");

  // Config Objects
  const { header, googleFit, heartRate, stats, progress, tabs, recent, chartLabels } = Strings.WorkoutStats;

  // Data
  const weekData = [320, 280, 400, 500, 350, 600, 450];
  const monthData = [1200, 1500, 1800, 1600];
  const allTimeData = [10000, 12000, 15000, 20000];

  const recentWorkouts = [
    { id: 1, date: "10 Sep", type: "Cardio", duration: "45 min", calories: 320 },
    { id: 2, date: "09 Sep", type: "Strength", duration: "1 hr", calories: 500 },
    { id: 3, date: "08 Sep", type: "Yoga", duration: "30 min", calories: 150 },
    { id: 4, date: "07 Sep", type: "HIIT", duration: "25 min", calories: 400 },
  ];

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(69, 40, 41, ${opacity})`, 
    labelColor: (opacity = 1) => `rgba(87, 89, 91, ${opacity})`, 
    barPercentage: 0.6,
    propsForBackgroundLines: { stroke: "#f0f0f0" },
  };

  const getData = () => {
    switch (activeTab) {
      case "Week":
        return weekData;
      case "Month":
        return monthData;
      default:
        return allTimeData;
    }
  };

  const getLabels = () => {
    switch (activeTab) {
      case "Week":
        return chartLabels.week;
      case "Month":
        return chartLabels.month;
      default:
        return chartLabels.allTime;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{header.title}</Text>
        <Image 
          source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDRpIaufTRtjjrW03DJOQ6j3bR4ash0kkfDlnZKxCJvUfyLV41YBjL1nUI1djOz-cj2jRtxtkNHU3MmJVaS9XSUbZt8i-Nbe_Jg--lPCwhyBEdb2e64rrLG1G1tbmne-onfjv0ADdnBgDRT_LtMHeELcRlu5VdlCNcmH8LfNzmB2A93PwOU8sy5uWryRH9GmxOc9jVRfCTCWvrV3I89iRekJ8vnVInm-1jsG4PRTi2ENLmRUzZlTeJKyb0nC-ZWU8d1PlQxtD-CwVA' }}
          style={styles.avatar}
        />
      </View>

      {/* Main Content */}
      <ScrollView
        style={styles.mainContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Google Fit Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <View style={styles.cardHeaderText}>
              <Text style={styles.cardTitle}>{googleFit.title}</Text>
              <Text style={styles.cardSubtitle}>{googleFit.connected}</Text>
            </View>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2alfVFa6t23JeTepxZF9iQcjZ_muMPxyT5AmEsUp-DxCDSGT6UE4QajflcHcG72kwzQTm8-QTksL-_bjP5Uqft1RQ7kyQXiMi5v3KTAPWFSdZoyId11FK4EUZG3t9TVQDw44kbJi-pEmpIcDCgSCvc9PASMGbpinU_aHSdfQB77IVCShfg2e9SrhXaK-Qr8gCzM7pRm_03_ID_lemZVlfPtXkCJYqv6CttLUNmkR4sS9tQITaYKj6Hb7WVqFeEzeddKSaGc_pcVA' }}
              style={styles.cardLogo}
            />
          </View>
          <TouchableOpacity style={styles.syncButton}>
            <Text style={styles.syncButtonText}>{googleFit.syncButton}</Text>
          </TouchableOpacity>
        </View>

        {/* Heart Rate Card */}
        <View style={[styles.card, styles.darkCard]}>
          <Text style={[styles.cardTitle, { color: '#ffffff' }]}>{heartRate.title}</Text>
          <View style={styles.heartRateContent}>
            <View style={styles.heartRateCircle}>
              <View style={styles.heartRateCircleInner}>
                <Text style={styles.heartRateValue}>72</Text>
                <Text style={styles.heartRateUnit}>{heartRate.bpm}</Text>
              </View>
            </View>
            <View style={styles.heartRateDetails}>
              <View style={styles.heartRateDetail}>
                <View style={styles.heartRateIcon}>
                  <Text style={styles.heartRateIconText}>{heartRate.restingIcon}</Text>
                </View>
                <View>
                  <Text style={styles.heartRateDetailLabel}>{heartRate.resting}</Text>
                  <Text style={styles.heartRateDetailValue}>60 {heartRate.bpm}</Text>
                </View>
              </View>
              <View style={styles.heartRateDetail}>
                <View style={styles.heartRateIcon}>
                  <Text style={styles.heartRateIconText}>{heartRate.maxIcon}</Text>
                </View>
                <View>
                  <Text style={styles.heartRateDetailLabel}>{heartRate.max}</Text>
                  <Text style={styles.heartRateDetailValue}>180 {heartRate.bpm}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>5,200</Text>
            <Text style={styles.statLabel}>{stats.calories}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>{stats.workouts}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>7</Text>
            <Text style={styles.statLabel}>{stats.streak}</Text>
          </View>
        </View>

        {/* Progress Section */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{progress.title}</Text>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: "72%" }]} />
          </View>
          <Text style={styles.progressText}>
            72{progress.complete}2,800 {progress.toGo}
          </Text>
        </View>

        {/* Chart Tabs */}
        <View style={styles.tabBar}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.tabButton,
                activeTab === tab && styles.activeTabButton,
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === tab && styles.activeTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Chart */}
        <View style={[styles.card, { padding: 16 }]}>
          <BarChart
            data={{
              labels: getLabels(),
              datasets: [{ data: getData() }],
            }}
            width={screenWidth - 48}
            height={200}
            yAxisSuffix={` ${recent.unitCal}`}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars={false}
          />
        </View>

        {/* Recent Workouts */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{recent.title}</Text>
          <FlatList
            data={recentWorkouts}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.workoutRow}>
                <View style={styles.workoutInfo}>
                  <Text style={styles.workoutDate}>{item.date}</Text>
                  <Text style={styles.workoutName}>{item.type}</Text>
                </View>
                <View style={styles.workoutMeta}>
                  <Text style={styles.workoutCalories}>{item.calories} {recent.unitCal}</Text>
                  <Text style={styles.workoutDuration}>{item.duration}</Text>
                </View>
              </View>
            )}
          />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabIcon}>{Strings.WorkoutStats.fabIcon}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    height: 64,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#000000",
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  mainContent: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 12,
    padding: 24,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  darkCard: {
    backgroundColor: "#1C1C1E",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  cardHeaderText: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#57595B",
  },
  cardLogo: {
    width: 64,
    height: 64,
  },
  syncButton: {
    backgroundColor: "#452829", 
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
  },
  syncButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "500",
  },
  heartRateContent: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    gap: 24,
  },
  heartRateCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 8,
    borderColor: "#333333",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heartRateCircleInner: {
    alignItems: "center",
  },
  heartRateValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#ffffff",
  },
  heartRateUnit: {
    fontSize: 16,
    color: "#999999",
  },
  heartRateDetails: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
  },
  heartRateDetail: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heartRateIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  heartRateIconText: {
    fontSize: 16,
  },
  heartRateDetailLabel: {
    fontSize: 14,
    color: "#999999",
  },
  heartRateDetailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#ffffff",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    marginHorizontal: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "800",
    color: "#452829", 
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#57595B",
    textAlign: "center",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#452829", 
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    color: "#57595B",
    textAlign: "center",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 6,
  },
  activeTabButton: {
    backgroundColor: "#452829", 
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#57595B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activeTabText: {
    color: "#ffffff",
    fontWeight: "700",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
  },
  workoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  workoutInfo: {
    flex: 1,
  },
  workoutDate: {
    fontSize: 12,
    color: "#57595B",
    marginBottom: 2,
  },
  workoutName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
  },
  workoutMeta: {
    alignItems: "flex-end",
  },
  workoutCalories: {
    fontSize: 14,
    fontWeight: "600",
    color: "#452829", 
  },
  workoutDuration: {
    fontSize: 12,
    color: "#57595B",
    marginTop: 2,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#452829', 
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  fabIcon: {
    fontSize: 24,
  },
});

export default WorkoutStats;