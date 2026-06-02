import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import * as Clarity from '@microsoft/react-native-clarity';

const OPTION_FIELDS = {
  gender: ['Male', 'Female', 'Other'],
  foodPreference: ['veg', 'non-veg', 'vegan'],
  fitnessLevel: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
};

const getValue = (profile, keys, fallback = '') => {
  for (const key of keys) {
    const value = profile?.[key];
    if (value !== undefined && value !== null && value !== '') {
      return String(value);
    }
  }
  return fallback;
};

const getMetricValue = (profile, key, fallback = '') => {
  const value = profile?.[key];
  if (value && typeof value === 'object' && value.value !== undefined) {
    return String(value.value);
  }
  return getValue(profile, [key], fallback);
};

const EditPersonalInfoScreen = ({ navigation }) => {
  const { user, refreshAuthStatus } = useAuth();
  const profile = useMemo(() => user?.userProfile || user?.memberProfile || user || {}, [user]);
  const [saving, setSaving] = useState(false);
  const [pickerField, setPickerField] = useState(null);
  const [form, setForm] = useState({
    name: getValue(profile, ['name', 'firstName'], ''),
    bio: getValue(profile, ['bio', 'about'], ''),
    gender: getValue(profile, ['gender'], 'Male'),
    dateOfBirth: getValue(profile, ['dateOfBirth', 'dob', 'birthDate'], ''),
    height: getMetricValue(profile, 'height', ''),
    weight: getMetricValue(profile, 'weight', ''),
    targetWeight: getMetricValue(profile, 'targetWeight', ''),
    fatPercentage: getValue(profile, ['fatPercentage', 'bodyFatPercentage'], ''),
    foodPreference: getValue(profile, ['foodPreference', 'dietPreference'], 'non-veg'),
    fitnessLevel: getValue(profile, ['fitnessLevel', 'level'], 'Professional'),
    countryCode: getValue(profile, ['countryCode'], '+91'),
    phone: getValue(profile, ['phone', 'phoneNumber', 'mobile'], ''),
    email: getValue(profile, ['email'], user?.email || ''),
    country: getValue(profile, ['country'], 'India'),
  });

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const buildPayload = () => ({
    name: form.name.trim(),
    bio: form.bio.trim(),
    gender: form.gender,
    dateOfBirth: form.dateOfBirth.trim(),
    height: form.height ? { value: Number(form.height), unit: 'CM' } : undefined,
    weight: form.weight ? { value: Number(form.weight), unit: 'KG' } : undefined,
    targetWeight: form.targetWeight ? { value: Number(form.targetWeight), unit: 'KG' } : undefined,
    fatPercentage: form.fatPercentage ? Number(form.fatPercentage) : 0,
    foodPreference: form.foodPreference,
    fitnessLevel: form.fitnessLevel,
    countryCode: form.countryCode.trim(),
    phone: form.phone.trim(),
    phoneNumber: form.phone.trim(),
    email: form.email.trim(),
    country: form.country.trim(),
  });

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    setSaving(true);
    const payload = buildPayload();
    const endpoints = [
      { method: 'put', url: '/v1/auth/update-user-profile' },
      { method: 'patch', url: '/v1/auth/user-profile' },
      { method: 'put', url: '/v1/auth/user-profile' },
    ];

    try {
      let saved = false;
      let lastError;

      for (const endpoint of endpoints) {
        try {
          await apiClient[endpoint.method](endpoint.url, payload);
          saved = true;
          break;
        } catch (error) {
          lastError = error;
          const status = error.response?.status;
          if (status && status !== 404 && status !== 405) {
            throw error;
          }
        }
      }

      if (!saved) {
        throw lastError || new Error('Profile update endpoint not found.');
      }

      await refreshAuthStatus();
      console.log('[Clarity] Profile updated');
      try {
        Clarity.sendCustomEvent('profile_updated');
      } catch (e) {
        console.error('[Clarity] Failed to send profile_updated:', e);
      }
      Alert.alert('Saved', 'Your personal info has been updated.', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Profile update failed:', error.response?.data || error.message);
      Alert.alert(
        'Could not save',
        error.response?.data?.message || 'Please check the update profile API endpoint and try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const pickerOptions = pickerField ? OPTION_FIELDS[pickerField] || [] : [];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={26} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Personal info</Text>
          <TouchableOpacity style={styles.iconButton} onPress={handleSave} disabled={saving}>
            {saving ? (
              <GlobalLoader size={30} />
            ) : (
              <Icon name="settings-sharp" size={24} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >
          <Field label="Name" value={form.name} onChangeText={value => updateField('name', value)} />
          <Field
            label="Bio"
            value={form.bio}
            placeholder="Add a short bio..."
            multiline
            onChangeText={value => updateField('bio', value)}
          />

          <View style={styles.twoColumnRow}>
            <SelectField label="Gender" value={form.gender} onPress={() => setPickerField('gender')} />
            <Field label="Date of Birth" value={form.dateOfBirth} placeholder="01-Jan-1995" onChangeText={value => updateField('dateOfBirth', value)} />
          </View>

          <View style={styles.twoColumnRow}>
            <Field label="Height (cm)" value={form.height} keyboardType="numeric" onChangeText={value => updateField('height', value)} />
            <Field label="Weight (kg)" value={form.weight} keyboardType="numeric" onChangeText={value => updateField('weight', value)} />
          </View>

          <View style={styles.twoColumnRow}>
            <Field label="Target Weight (kg)" value={form.targetWeight} keyboardType="numeric" onChangeText={value => updateField('targetWeight', value)} />
            <Field label="Fat Percentage (%)" value={form.fatPercentage} keyboardType="numeric" onChangeText={value => updateField('fatPercentage', value)} />
          </View>

          <SelectField label="Food Preference" value={form.foodPreference} onPress={() => setPickerField('foodPreference')} />
          <SelectField label="Fitness Level" value={form.fitnessLevel} onPress={() => setPickerField('fitnessLevel')} />

          <Text style={styles.sectionLabel}>Contact Info</Text>
          <View style={styles.phoneRow}>
            <TextInput
              style={[styles.underlineInput, styles.countryCodeInput]}
              value={form.countryCode}
              onChangeText={value => updateField('countryCode', value)}
              placeholder="+91"
              placeholderTextColor="#8A8496"
            />
            <TextInput
              style={[styles.underlineInput, styles.phoneInput]}
              value={form.phone}
              onChangeText={value => updateField('phone', value)}
              keyboardType="phone-pad"
              placeholder="9876543212"
              placeholderTextColor="#8A8496"
            />
          </View>

          <UnderlineField label="Email" value={form.email} keyboardType="email-address" onChangeText={value => updateField('email', value)} />
          <UnderlineField label="Country" value={form.country} onChangeText={value => updateField('country', value)} />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <GlobalLoader size={50} /> : <Text style={styles.saveText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={Boolean(pickerField)} transparent animationType="fade">
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerField(null)}>
          <View style={styles.optionSheet}>
            {pickerOptions.map(option => (
              <TouchableOpacity
                key={option}
                style={styles.optionRow}
                onPress={() => {
                  updateField(pickerField, option);
                  setPickerField(null);
                }}
              >
                <Text style={styles.optionText}>{option}</Text>
                {form[pickerField] === option && <Icon name="checkmark" size={20} color="#FFF" />}
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
};

const Field = ({ label, multiline, style, ...props }) => (
  <View style={[styles.fieldWrap, style]}>
    <Text style={styles.label}>{label}</Text>
    <TextInput
      {...props}
      style={[styles.input, multiline && styles.bioInput]}
      placeholderTextColor="#8A8496"
      multiline={multiline}
    />
  </View>
);

const SelectField = ({ label, value, onPress }) => (
  <View style={styles.fieldWrap}>
    <Text style={styles.label}>{label}</Text>
    <TouchableOpacity style={styles.input} onPress={onPress} activeOpacity={0.8}>
      <Text style={[styles.inputText, !value && styles.placeholderText]}>{value || 'Select'}</Text>
      <Icon name="chevron-down" size={18} color="#8A8496" />
    </TouchableOpacity>
  </View>
);

const UnderlineField = ({ label, ...props }) => (
  <View style={styles.underlineWrap}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <TextInput {...props} style={styles.underlineInput} placeholderTextColor="#8A8496" />
  </View>
);

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 0,
    paddingTop: 10,
    paddingBottom: 18,
  },
  iconButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  },
  content: {
    paddingHorizontal: 36,
    paddingBottom: 34,
  },
  fieldWrap: {
    flex: 1,
    marginBottom: 22,
  },
  label: {
    color: '#C8C1D4',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 9,
  },
  input: {
    minHeight: 54,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#34313A',
    backgroundColor: '#08080A',
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bioInput: {
    height: 102,
    textAlignVertical: 'top',
    paddingTop: 16,
  },
  inputText: {
    color: '#FFF',
    fontSize: 16,
  },
  placeholderText: {
    color: '#8A8496',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 16,
  },
  sectionLabel: {
    color: '#C8C1D4',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 12,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  underlineWrap: {
    marginBottom: 24,
  },
  underlineInput: {
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: '#DADADA',
    color: '#FFF',
    fontSize: 16,
    paddingHorizontal: 4,
  },
  countryCodeInput: {
    width: 48,
    textAlign: 'center',
  },
  phoneInput: {
    flex: 1,
  },
  saveButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  saveText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.72)',
    justifyContent: 'flex-end',
  },
  optionSheet: {
    backgroundColor: '#101014',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: 1,
    borderColor: '#2C2832',
    paddingBottom: 28,
  },
  optionRow: {
    minHeight: 56,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  optionText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default EditPersonalInfoScreen;
