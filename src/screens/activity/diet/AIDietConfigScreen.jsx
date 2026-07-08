import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Animated,
  Easing,
  StatusBar,
  Alert,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchWeeklyPlan, saveDietPreferences } from '../../../api/dietAiApi';

const { width } = Dimensions.get('window');

// ─── Options ──────────────────────────────────────────────────────────────────
const DIET_PREFERENCES = [
  { label: 'Vegetarian', icon: 'leaf-outline' },
  { label: 'Vegan', icon: 'flower-outline' },
  { label: 'Selective Non-Veg', icon: 'fish-outline' },
  { label: 'Non-Vegetarian', icon: 'restaurant-outline' },
  { label: 'Keto', icon: 'flame-outline' },
  { label: 'Mediterranean', icon: 'sunny-outline' },
];

const GOALS = [
  { label: 'Weight Loss', icon: 'trending-down-outline', color: '#FF6B6B' },
  { label: 'Muscle Gain', icon: 'barbell-outline', color: '#6BCB77' },
  { label: 'Maintenance', icon: 'resize-outline', color: '#4D96FF' },
  { label: 'Recomposition', icon: 'swap-horizontal-outline', color: '#FFD93D' },
];

const MEAL_OPTIONS = ['Breakfast', 'Lunch', 'Snack', 'Dinner'];

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const ALLERGY_OPTIONS = [
  'No Known Allergies',
  'Gluten',
  'Dairy',
  'Nuts',
  'Eggs',
  'Shellfish',
  'Soy',
  'Fish',
];

const CUISINE_OPTIONS = [
  'South Indian',
  'North Indian',
  'USA Food',
  'Mediterranean',
  'Chinese',
  'Continental',
  'Japanese',
  'Mexican',
];

// ─── Chip Component ───────────────────────────────────────────────────────────
const Chip = ({ label, selected, onPress, color = '#A3D9C9', small = false }) => (
  <TouchableOpacity
    style={[
      styles.chip,
      small && styles.chipSmall,
      selected && { backgroundColor: color + '22', borderColor: color },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.chipText, small && styles.chipTextSmall, selected && { color }]}>
      {label}
    </Text>
  </TouchableOpacity>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon, title, subtitle }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionIconWrapper}>
      <Icon name={icon} size={18} color="#A3D9C9" />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  </View>
);

// ─── Generating Animation ─────────────────────────────────────────────────────
const GeneratingAnimation = () => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const dotAnim = (anim, delay) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 400, useNativeDriver: true }),
          Animated.delay(800 - delay),
        ])
      );

    const glowAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );

    dotAnim(dot1, 0).start();
    dotAnim(dot2, 200).start();
    dotAnim(dot3, 400).start();
    glowAnim.start();

    return () => {
      dot1.stopAnimation();
      dot2.stopAnimation();
      dot3.stopAnimation();
      glow.stopAnimation();
    };
  }, []);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });

  return (
    <View style={styles.generatingContainer}>
      <Animated.View style={[styles.generatingOrb, { opacity: glowOpacity }]}>
        <MaterialCommunityIcons name="brain" size={48} color="#A3D9C9" />
      </Animated.View>
      <Text style={styles.generatingTitle}>Crafting Your AI Plan</Text>
      <Text style={styles.generatingSubtitle}>Analyzing your profile, goals & preferences...</Text>
      <View style={styles.dotsRow}>
        {[dot1, dot2, dot3].map((d, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { opacity: d, transform: [{ scale: d.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.2] }) }] }]}
          />
        ))}
      </View>
      <Text style={styles.generatingHint}>This may take 15–30 seconds on first generation</Text>
    </View>
  );
};

// ─── Main Screen ──────────────────────────────────────────────────────────────
const AIDietConfigScreen = ({ navigation }) => {
  // State
  const [preference, setPreference] = useState('Selective Non-Veg');
  const [goal, setGoal] = useState('Weight Loss');
  const [selectedMeals, setSelectedMeals] = useState(['Breakfast', 'Lunch', 'Dinner']);
  const [skipDays, setSkipDays] = useState([]);
  const [allergies, setAllergies] = useState(['No Known Allergies']);
  const [cuisines, setCuisines] = useState(['South Indian']);
  const [otherInfo, setOtherInfo] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  // Scroll progress for header fade
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = scrollY.interpolate({ inputRange: [0, 60], outputRange: [0, 1], extrapolate: 'clamp' });

  // Load saved preferences on mount
  useEffect(() => {
    const load = async () => {
      try {
        const [p, sk, m, al, cu, oi] = await Promise.all([
          AsyncStorage.getItem('diet_preference'),
          AsyncStorage.getItem('diet_skip_days'),
          AsyncStorage.getItem('diet_meals'),
          AsyncStorage.getItem('diet_allergies'),
          AsyncStorage.getItem('diet_cuisines'),
          AsyncStorage.getItem('diet_other_info'),
        ]);
        if (p) setPreference(p);
        if (sk) setSkipDays(JSON.parse(sk));
        if (m) setSelectedMeals(JSON.parse(m));
        if (al) setAllergies(JSON.parse(al));
        if (cu) setCuisines(JSON.parse(cu));
        if (oi) setOtherInfo(oi);
      } catch (_) {}
    };
    load();
  }, []);

  const toggleItem = useCallback((item, list, setList) => {
    setList(prev =>
      prev.includes(item) ? prev.filter(x => x !== item) : [...prev, item]
    );
  }, []);

  const handleGenerate = async () => {
    if (selectedMeals.length === 0) {
      Alert.alert('Missing Meals', 'Please select at least one meal type.');
      return;
    }

    setIsGenerating(true);

    try {
      // Persist preferences first
      await saveDietPreferences({
        preference,
        skipDays,
        meals: selectedMeals,
        allergies,
        cuisines,
        otherInfo: otherInfo || `Goal: ${goal}`,
      });

      // Generate the plan
      const planData = await fetchWeeklyPlan({
        generate: 'true',
        dietPreference: preference,
        skipDays: skipDays,
        meals: selectedMeals,
        allergies: allergies,
        cuisines: cuisines,
        otherInfo: otherInfo || `Goal: ${goal}, Love extra protein`,
      });

      navigation.replace('WeeklyDietPlan', { recommendation: planData });
    } catch (err) {
      console.warn('[AIDietConfig] Generation failed:', err.message);
      Alert.alert(
        'Generation Failed',
        'Could not generate your plan. Please check your connection and try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsGenerating(false);
    }
  };

  if (isGenerating) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <GeneratingAnimation />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {/* Sticky header on scroll */}
      <Animated.View style={[styles.stickyHeader, { opacity: headerOpacity }]}>
        <Text style={styles.stickyHeaderTitle}>AI Diet Config</Text>
      </Animated.View>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} activeOpacity={0.7}>
        <Icon name="arrow-back" size={22} color="#FFF" />
      </TouchableOpacity>

      <Animated.ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        {/* Hero */}
        <LinearGradient
          colors={['#0D2B26', '#050505']}
          style={styles.heroSection}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <View style={styles.heroBadge}>
            <MaterialCommunityIcons name="brain" size={16} color="#A3D9C9" />
            <Text style={styles.heroBadgeText}>Powered by Ollama AI</Text>
          </View>
          <Text style={styles.heroTitle}>Build Your{'\n'}Perfect Diet Plan</Text>
          <Text style={styles.heroSubtitle}>
            Configure your preferences and let AI craft a personalized 7-day meal plan tailored to your body and goals.
          </Text>
        </LinearGradient>

        {/* ── Diet Preference ── */}
        <View style={styles.section}>
          <SectionHeader icon="nutrition-outline" title="Diet Type" subtitle="What best describes your eating style?" />
          <View style={styles.chipGrid}>
            {DIET_PREFERENCES.map(({ label, icon }) => (
              <TouchableOpacity
                key={label}
                style={[styles.prefCard, preference === label && styles.prefCardActive]}
                onPress={() => setPreference(label)}
                activeOpacity={0.7}
              >
                <Icon name={icon} size={22} color={preference === label ? '#A3D9C9' : 'rgba(255,255,255,0.4)'} />
                <Text style={[styles.prefCardText, preference === label && styles.prefCardTextActive]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Goal ── */}
        <View style={styles.section}>
          <SectionHeader icon="fitness-outline" title="Fitness Goal" subtitle="What are you working towards?" />
          <View style={styles.goalRow}>
            {GOALS.map(({ label, icon, color }) => (
              <TouchableOpacity
                key={label}
                style={[styles.goalCard, goal === label && { borderColor: color, backgroundColor: color + '18' }]}
                onPress={() => setGoal(label)}
                activeOpacity={0.7}
              >
                <Icon name={icon} size={20} color={goal === label ? color : 'rgba(255,255,255,0.35)'} />
                <Text style={[styles.goalCardText, goal === label && { color }]}>{label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Meals to include ── */}
        <View style={styles.section}>
          <SectionHeader icon="cafe-outline" title="Meals to Plan" subtitle="Which meals should AI include?" />
          <View style={styles.chipsRow}>
            {MEAL_OPTIONS.map(m => (
              <Chip
                key={m}
                label={m}
                selected={selectedMeals.includes(m)}
                onPress={() => toggleItem(m, selectedMeals, setSelectedMeals)}
              />
            ))}
          </View>
        </View>

        {/* ── Skip Days ── */}
        <View style={styles.section}>
          <SectionHeader icon="calendar-outline" title="Rest / Skip Days" subtitle="Days with no meal recommendations" />
          <View style={styles.chipsRow}>
            {DAYS_OF_WEEK.map(d => (
              <Chip
                key={d}
                label={d.slice(0, 3)}
                selected={skipDays.includes(d)}
                onPress={() => toggleItem(d, skipDays, setSkipDays)}
                color="#FF6B6B"
                small
              />
            ))}
          </View>
        </View>

        {/* ── Allergies ── */}
        <View style={styles.section}>
          <SectionHeader icon="warning-outline" title="Allergies & Restrictions" />
          <View style={styles.chipsRow}>
            {ALLERGY_OPTIONS.map(a => (
              <Chip
                key={a}
                label={a}
                selected={allergies.includes(a)}
                onPress={() => {
                  if (a === 'No Known Allergies') {
                    setAllergies(['No Known Allergies']);
                  } else {
                    toggleItem(a, allergies, al => setAllergies(al.filter(x => x !== 'No Known Allergies')));
                    setAllergies(prev => {
                      const without = prev.filter(x => x !== 'No Known Allergies');
                      return without.includes(a) ? without.filter(x => x !== a) : [...without, a];
                    });
                  }
                }}
                color="#FFD93D"
                small
              />
            ))}
          </View>
        </View>

        {/* ── Cuisines ── */}
        <View style={styles.section}>
          <SectionHeader icon="globe-outline" title="Cuisine Preferences" subtitle="Pick your favourite food cultures" />
          <View style={styles.chipsRow}>
            {CUISINE_OPTIONS.map(c => (
              <Chip
                key={c}
                label={c}
                selected={cuisines.includes(c)}
                onPress={() => toggleItem(c, cuisines, setCuisines)}
                color="#6BCB77"
                small
              />
            ))}
          </View>
        </View>

        {/* ── Other Info ── */}
        <View style={styles.section}>
          <SectionHeader icon="chatbubble-ellipses-outline" title="Additional Notes" subtitle="Anything else AI should know?" />
          <TextInput
            style={styles.textArea}
            value={otherInfo}
            onChangeText={setOtherInfo}
            placeholder="e.g. Love extra protein, avoid fried foods, prefer light dinners..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* ── Summary Preview ── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Plan Summary</Text>
          <View style={styles.summaryRow}>
            <Icon name="restaurant-outline" size={14} color="#A3D9C9" />
            <Text style={styles.summaryText}>{preference} · {goal}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Icon name="cafe-outline" size={14} color="#A3D9C9" />
            <Text style={styles.summaryText}>{selectedMeals.join(', ') || 'No meals selected'}</Text>
          </View>
          {cuisines.length > 0 && (
            <View style={styles.summaryRow}>
              <Icon name="globe-outline" size={14} color="#A3D9C9" />
              <Text style={styles.summaryText}>{cuisines.join(', ')}</Text>
            </View>
          )}
        </View>

        {/* ── Generate Button ── */}
        <TouchableOpacity
          style={styles.generateBtn}
          onPress={handleGenerate}
          activeOpacity={0.85}
        >
          <LinearGradient
            colors={['#1E8B72', '#0F5C4A']}
            style={styles.generateBtnGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <MaterialCommunityIcons name="brain" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.generateBtnText}>Generate AI Plan</Text>
            <Icon name="arrow-forward" size={18} color="#FFF" style={{ marginLeft: 8 }} />
          </LinearGradient>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Plan generated using local AI (Ollama). Your data stays on-device and is never shared.
        </Text>

        <View style={{ height: 40 }} />
      </Animated.ScrollView>
    </View>
  );
};

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050505',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 50,
    paddingBottom: 14,
    paddingHorizontal: 20,
    backgroundColor: '#050505',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  stickyHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
  },
  backBtn: {
    position: 'absolute',
    top: 52,
    left: 16,
    zIndex: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    paddingTop: 0,
  },

  // Hero
  heroSection: {
    paddingTop: 90,
    paddingBottom: 32,
    paddingHorizontal: 20,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(163, 217, 201, 0.12)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(163, 217, 201, 0.25)',
  },
  heroBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A3D9C9',
    marginLeft: 6,
    letterSpacing: 0.4,
  },
  heroTitle: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 40,
    marginBottom: 12,
  },
  heroSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.55)',
    lineHeight: 21,
    fontWeight: '500',
  },

  // Section
  section: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 10,
  },
  sectionIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: 'rgba(163, 217, 201, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(163, 217, 201, 0.2)',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFF',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    marginTop: 2,
    fontWeight: '500',
  },

  // Preference cards grid
  chipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  prefCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 7,
    minWidth: (width - 62) / 2,
  },
  prefCardActive: {
    borderColor: '#A3D9C9',
    backgroundColor: 'rgba(163, 217, 201, 0.1)',
  },
  prefCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },
  prefCardTextActive: {
    color: '#A3D9C9',
  },

  // Goal cards
  goalRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.04)',
    gap: 7,
    minWidth: (width - 62) / 2,
  },
  goalCardText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.45)',
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  chipSmall: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
  },
  chipTextSmall: {
    fontSize: 12,
  },

  // Text area
  textArea: {
    backgroundColor: '#0E1A17',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(163, 217, 201, 0.15)',
    color: '#FFF',
    fontSize: 14,
    fontWeight: '500',
    padding: 14,
    minHeight: 90,
  },

  // Summary
  summaryCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: '#0B1C18',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(163, 217, 201, 0.12)',
    gap: 8,
  },
  summaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A3D9C9',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  summaryText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.65)',
    fontWeight: '500',
    flex: 1,
  },

  // Generate button
  generateBtn: {
    marginHorizontal: 16,
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: 12,
    shadowColor: '#1E8B72',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  generateBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 17,
    paddingHorizontal: 24,
  },
  generateBtnText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
    letterSpacing: 0.3,
  },

  disclaimer: {
    textAlign: 'center',
    fontSize: 11,
    color: 'rgba(255,255,255,0.25)',
    marginHorizontal: 30,
    lineHeight: 17,
  },

  // ── Generating animation ──
  generatingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  generatingOrb: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(163, 217, 201, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: 'rgba(163, 217, 201, 0.25)',
  },
  generatingTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 10,
  },
  generatingSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  dotsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 24,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#A3D9C9',
  },
  generatingHint: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.3)',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default AIDietConfigScreen;
