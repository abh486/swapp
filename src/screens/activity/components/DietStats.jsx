// DietStats.js — Updated with Config
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  FlatList,
} from "react-native";
import { BarChart } from "react-native-chart-kit";
import { Strings } from '../../../config/config'; // Import Config

const screenWidth = Dimensions.get("window").width;

const DietStats = () => {
  const [activeTab, setActiveTab] = useState("Today");
  const [expandedMeal, setExpandedMeal] = useState(null);

  // Config Data
  const { summary, macros, tabs, chart, header } = Strings.DietStats;

  // ✅ Fixed data
  const weeklyCalories = [1800, 2100, 1600, 2300, 1900, 2500, 1700];

  const todayMeals = [
    {
      id: 1,
      type: "Breakfast",
      name: "Oatmeal + Berries + Almonds",
      calories: 450,
      protein: 12,
      carbs: 65,
      fat: 14,
    },
    {
      id: 2,
      type: "Lunch",
      name: "Grilled Chicken Bowl",
      calories: 620,
      protein: 38,
      carbs: 52,
      fat: 22,
    },
    {
      id: 3,
      type: "Dinner",
      name: "Salmon + Quinoa + Veggies",
      calories: 580,
      protein: 34,
      carbs: 48,
      fat: 26,
    },
    {
      id: 4,
      type: "Snack",
      name: "Greek Yogurt + Honey",
      calories: 220,
      protein: 18,
      carbs: 22,
      fat: 6,
    },
  ];

  // Generating summary array dynamically from config for cleaner code
  const dailySummary = [
    { label: summary.calories, value: "1,870", goal: "2,200", unit: summary.unitCal },
    { label: summary.protein, value: "102", goal: "120", unit: summary.unitGram },
    { label: summary.carbs, value: "187", goal: "250", unit: summary.unitGram },
    { label: summary.fat, value: "68", goal: "75", unit: summary.unitGram },
  ];

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(69, 40, 41, ${opacity})`, 
    labelColor: (opacity = 1) => `rgba(87, 89, 91, ${opacity})`, 
    barPercentage: 0.5,
    propsForBackgroundLines: { stroke: "#f0f0f0" },
  };

  const toggleExpand = (id) => {
    setExpandedMeal(expandedMeal === id ? null : id);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{header.title}</Text>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarIcon}>👤</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        {/* Summary Pills */}
        <View style={styles.summaryRow}>
          {dailySummary.map((item, index) => (
            <View key={index} style={styles.summaryPill}>
              <Text style={styles.pillLabel}>{item.label}</Text>
              <Text style={[styles.pillValue, { color: "#452829" }]}>
                {item.value}{item.unit}
              </Text>
              <Text style={styles.pillGoal}>{item.goal}{item.unit} {summary.goal}</Text>
            </View>
          ))}
        </View>

        {/* Tabs */}
        <View style={styles.mealTabs}>
          {tabs.map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[
                styles.mealTabButton,
                activeTab === tab && styles.activeMealTab,
              ]}
            >
              <Text
                style={[
                  styles.mealTabText,
                  activeTab === tab && styles.activeMealTabText,
                ]}
              >
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meals List */}
        <View style={styles.mealsContainer}>
          <FlatList
            data={todayMeals}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            renderItem={({ item }) => (
              <View style={styles.mealCard}>
                <TouchableOpacity onPress={() => toggleExpand(item.id)}>
                  <View
                    style={[
                      styles.mealHeader,
                      {
                        borderBottomWidth: expandedMeal === item.id ? 1 : 0,
                        borderBottomColor: "rgba(0,0,0,0.1)",
                      },
                    ]}
                  >
                    <View>
                      <Text style={styles.mealType}>{item.type}</Text>
                      <Text style={styles.mealName} numberOfLines={1}>
                        {item.name}
                      </Text>
                    </View>
                    <Text style={styles.mealCalories}>{item.calories} {summary.unitCal}</Text>
                  </View>
                </TouchableOpacity>

                {expandedMeal === item.id && (
                  <View style={styles.macroDetails}>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroLabel}>{macros.protein}</Text>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${(item.protein / 40) * 100}%`, backgroundColor: "#452829" },
                          ]}
                        />
                      </View>
                      <Text style={styles.macroValue}>{item.protein}{summary.unitGram}</Text>
                    </View>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroLabel}>{macros.carbs}</Text>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${(item.carbs / 60) * 100}%`, backgroundColor: "#452829" },
                          ]}
                        />
                      </View>
                      <Text style={styles.macroValue}>{item.carbs}{summary.unitGram}</Text>
                    </View>
                    <View style={styles.macroRow}>
                      <Text style={styles.macroLabel}>{macros.fat}</Text>
                      <View style={styles.progressBarBg}>
                        <View
                          style={[
                            styles.progressBarFill,
                            { width: `${(item.fat / 25) * 100}%`, backgroundColor: "#452829" },
                          ]}
                        />
                      </View>
                      <Text style={styles.macroValue}>{item.fat}{summary.unitGram}</Text>
                    </View>
                  </View>
                )}
              </View>
            )}
          />
        </View>

        {/* Weekly Chart */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>{chart.title}</Text>
          <BarChart
            data={{
              labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
              datasets: [{ data: weeklyCalories }],
            }}
            width={screenWidth - 48}
            height={200}
            yAxisSuffix={` ${summary.unitCal}`}
            chartConfig={chartConfig}
            style={styles.chart}
            fromZero
            showValuesOnTopOfBars={false}
          />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabIcon}>{Strings.DietStats.fabIcon}</Text>
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
    backgroundColor: "#FFFFFF",
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
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#452829",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarIcon: {
    fontSize: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  summaryPill: {
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    flex: 1,
    minWidth: "45%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  pillLabel: {
    fontSize: 12,
    color: "#57595B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pillValue: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 4,
  },
  pillGoal: {
    fontSize: 10,
    color: "#57595B",
  },
  mealTabs: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 4,
    marginHorizontal: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mealTabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 8,
  },
  activeMealTab: {
    backgroundColor: "#452829",
  },
  mealTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#57595B",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  activeMealTabText: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  mealsContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  mealCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  mealType: {
    fontSize: 12,
    color: "#452829",
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  mealName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#000000",
    maxWidth: 200,
  },
  mealCalories: {
    fontSize: 16,
    fontWeight: "700",
    color: "#452829",
  },
  macroDetails: {
    padding: 16,
    backgroundColor: "#f8f8f8",
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  macroLabel: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
    width: 70,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: "#f0f0f0",
    borderRadius: 4,
    flex: 1,
    marginHorizontal: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  macroValue: {
    fontSize: 14,
    color: "#000000",
    fontWeight: "600",
    width: 50,
    textAlign: "right",
  },
  chartCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 20,
    marginHorizontal: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#000000",
    marginBottom: 16,
    textAlign: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 8,
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

export default DietStats;