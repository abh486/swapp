import * as RNLocalize from 'react-native-localize';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { GlobalLoader } from '../../components/GlobalLoader';
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { Alert, Animated, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, TextInput, TouchableOpacity, View, Image } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import apiClient from '../../api/apiClient';
import { useAuth } from '../../context/AuthContext';
import { uploadToCloudinary } from '../../utils/uploadToCloudinary';
import * as Clarity from '../../utils/clarity';

const OPTION_FIELDS = {
  gender: ['Male', 'Female', 'Other'],
  foodPreference: ['veg', 'non-veg', 'vegan'],
  fitnessLevel: ['Beginner', 'Intermediate', 'Advanced', 'Professional'],
};

const COUNTRY_CODES = [
  { label: '🇮🇳 +91 (India)', code: '+91' },
  { label: '🇺🇸 +1 (United States)', code: '+1' },
  { label: '🇬🇧 +44 (United Kingdom)', code: '+44' },
  { label: '🇦🇪 +971 (United Arab Emirates)', code: '+971' },
  { label: '🇸🇦 +966 (Saudi Arabia)', code: '+966' },
  { label: '🇨🇦 +1 (Canada)', code: '+1' },
  { label: '🇦🇺 +61 (Australia)', code: '+61' },
  { label: '🇸🇬 +65 (Singapore)', code: '+65' },
  { label: '🇩🇪 +49 (Germany)', code: '+49' },
  { label: '🇫🇷 +33 (France)', code: '+33' },
  { label: '🇯🇵 +81 (Japan)', code: '+81' },
  { label: '🇦🇫 +93 (Afghanistan)', code: '+93' },
  { label: '🇦🇱 +355 (Albania)', code: '+355' },
  { label: '🇩🇿 +213 (Algeria)', code: '+213' },
  { label: '🇦🇩 +376 (Andorra)', code: '+376' },
  { label: '🇦🇴 +244 (Angola)', code: '+244' },
  { label: '🇦🇷 +54 (Argentina)', code: '+54' },
  { label: '🇦🇲 +374 (Armenia)', code: '+374' },
  { label: '🇦🇹 +43 (Austria)', code: '+43' },
  { label: '🇦🇿 +994 (Azerbaijan)', code: '+994' },
  { label: '🇧🇭 +973 (Bahrain)', code: '+973' },
  { label: '🇧🇩 +880 (Bangladesh)', code: '+880' },
  { label: '🇧🇾 +375 (Belarus)', code: '+375' },
  { label: '🇧🇪 +32 (Belgium)', code: '+32' },
  { label: '🇧🇿 +501 (Belize)', code: '+501' },
  { label: '🇧🇯 +229 (Benin)', code: '+229' },
  { label: '🇧🇹 +975 (Bhutan)', code: '+975' },
  { label: '🇧🇴 +591 (Bolivia)', code: '+591' },
  { label: '🇧🇦 +387 (Bosnia & Herzegovina)', code: '+387' },
  { label: '🇧🇼 +267 (Botswana)', code: '+267' },
  { label: '🇧🇷 +55 (Brazil)', code: '+55' },
  { label: '🇧🇳 +673 (Brunei)', code: '+673' },
  { label: '🇧🇬 +359 (Bulgaria)', code: '+359' },
  { label: '🇰🇭 +855 (Cambodia)', code: '+855' },
  { label: '🇨🇲 +237 (Cameroon)', code: '+237' },
  { label: '🇨🇱 +56 (Chile)', code: '+56' },
  { label: '🇨🇳 +86 (China)', code: '+86' },
  { label: '🇨🇴 +57 (Colombia)', code: '+57' },
  { label: '🇨🇷 +506 (Costa Rica)', code: '+506' },
  { label: '🇭🇷 +385 (Croatia)', code: '+385' },
  { label: '🇨🇺 +53 (Cuba)', code: '+53' },
  { label: '🇨🇾 +357 (Cyprus)', code: '+357' },
  { label: '🇨🇿 +420 (Czech Republic)', code: '+420' },
  { label: '🇩🇰 +45 (Denmark)', code: '+45' },
  { label: '🇩🇴 +1 (Dominican Republic)', code: '+1' },
  { label: '🇪🇨 +593 (Ecuador)', code: '+593' },
  { label: '🇪🇬 +20 (Egypt)', code: '+20' },
  { label: '🇸🇻 +503 (El Salvador)', code: '+503' },
  { label: '🇪🇪 +372 (Estonia)', code: '+372' },
  { label: '🇪🇹 +251 (Ethiopia)', code: '+251' },
  { label: '🇫🇮 +358 (Finland)', code: '+358' },
  { label: '🇬🇪 +995 (Georgia)', code: '+995' },
  { label: '🇬🇭 +233 (Ghana)', code: '+233' },
  { label: '🇬🇷 +30 (Greece)', code: '+30' },
  { label: '🇬🇹 +502 (Guatemala)', code: '+502' },
  { label: '🇭🇳 +504 (Honduras)', code: '+504' },
  { label: '🇭🇰 +852 (Hong Kong)', code: '+852' },
  { label: '🇭🇺 +36 (Hungary)', code: '+36' },
  { label: '🇮🇸 +354 (Iceland)', code: '+354' },
  { label: '🇮🇩 +62 (Indonesia)', code: '+62' },
  { label: '🇮🇷 +98 (Iran)', code: '+98' },
  { label: '🇮🇶 +964 (Iraq)', code: '+964' },
  { label: '🇮🇪 +353 (Ireland)', code: '+353' },
  { label: '🇮🇱 +972 (Israel)', code: '+972' },
  { label: '🇮🇹 +39 (Italy)', code: '+39' },
  { label: '🇯🇲 +1 (Jamaica)', code: '+1' },
  { label: '🇯🇴 +962 (Jordan)', code: '+962' },
  { label: '🇰🇿 +7 (Kazakhstan)', code: '+7' },
  { label: '🇰🇪 +254 (Kenya)', code: '+254' },
  { label: '🇰🇼 +965 (Kuwait)', code: '+965' },
  { label: '🇰🇬 +996 (Kyrgyzstan)', code: '+996' },
  { label: '🇱🇦 +856 (Laos)', code: '+856' },
  { label: '🇱🇻 +371 (Latvia)', code: '+371' },
  { label: '🇱🇧 +961 (Lebanon)', code: '+961' },
  { label: '🇱🇾 +218 (Libya)', code: '+218' },
  { label: '🇱🇹 +370 (Lithuania)', code: '+370' },
  { label: '🇱🇺 +352 (Luxembourg)', code: '+352' },
  { label: '🇲🇴 +853 (Macau)', code: '+853' },
  { label: '🇲🇾 +60 (Malaysia)', code: '+60' },
  { label: '🇲🇻 +960 (Maldives)', code: '+960' },
  { label: '🇲🇹 +356 (Malta)', code: '+356' },
  { label: '🇲🇽 +52 (Mexico)', code: '+52' },
  { label: '🇲🇩 +373 (Moldova)', code: '+373' },
  { label: '🇲🇨 +377 (Monaco)', code: '+377' },
  { label: '🇲🇳 +976 (Mongolia)', code: '+976' },
  { label: '🇲🇪 +382 (Montenegro)', code: '+382' },
  { label: '🇲🇦 +212 (Morocco)', code: '+212' },
  { label: '🇲🇲 +95 (Myanmar)', code: '+95' },
  { label: '🇳🇵 +977 (Nepal)', code: '+977' },
  { label: '🇳🇱 +31 (Netherlands)', code: '+31' },
  { label: '🇳🇿 +64 (New Zealand)', code: '+64' },
  { label: '🇳🇮 +505 (Nicaragua)', code: '+505' },
  { label: '🇳🇬 +234 (Nigeria)', code: '+234' },
  { label: '🇳🇴 +47 (Norway)', code: '+47' },
  { label: '🇴🇲 +968 (Oman)', code: '+968' },
  { label: '🇵🇰 +92 (Pakistan)', code: '+92' },
  { label: '🇵🇸 +970 (Palestine)', code: '+970' },
  { label: '🇵🇦 +507 (Panama)', code: '+507' },
  { label: '🇵🇾 +595 (Paraguay)', code: '+595' },
  { label: '🇵🇪 +51 (Peru)', code: '+51' },
  { label: '🇵🇭 +63 (Philippines)', code: '+63' },
  { label: '🇵🇱 +48 (Poland)', code: '+48' },
  { label: '🇵🇹 +351 (Portugal)', code: '+351' },
  { label: '🇶🇦 +974 (Qatar)', code: '+974' },
  { label: '🇷🇴 +40 (Romania)', code: '+40' },
  { label: '🇷🇺 +7 (Russia)', code: '+7' },
  { label: '🇷🇼 +250 (Rwanda)', code: '+250' },
  { label: '🇸🇲 +378 (San Marino)', code: '+378' },
  { label: '🇸🇳 +221 (Senegal)', code: '+221' },
  { label: '🇷🇸 +381 (Serbia)', code: '+381' },
  { label: '🇸🇱 +232 (Sierra Leone)', code: '+232' },
  { label: '🇸🇰 +421 (Slovakia)', code: '+421' },
  { label: '🇸🇮 +386 (Slovenia)', code: '+386' },
  { label: '🇿🇦 +27 (South Africa)', code: '+27' },
  { label: '🇰🇷 +82 (South Korea)', code: '+82' },
  { label: '🇪🇸 +34 (Spain)', code: '+34' },
  { label: '🇱🇰 +94 (Sri Lanka)', code: '+94' },
  { label: '🇸🇩 +249 (Sudan)', code: '+249' },
  { label: '🇸🇪 +46 (Sweden)', code: '+46' },
  { label: '🇨🇭 +41 (Switzerland)', code: '+41' },
  { label: '🇸🇾 +963 (Syria)', code: '+963' },
  { label: '🇹🇼 +886 (Taiwan)', code: '+886' },
  { label: '🇹🇯 +992 (Tajikistan)', code: '+992' },
  { label: '🇹🇿 +255 (Tanzania)', code: '+255' },
  { label: '🇹🇭 +66 (Thailand)', code: '+66' },
  { label: '🇹🇳 +216 (Tunisia)', code: '+216' },
  { label: '🇹🇷 +90 (Turkey)', code: '+90' },
  { label: '🇹🇲 +993 (Turkmenistan)', code: '+993' },
  { label: '🇺🇬 +256 (Uganda)', code: '+256' },
  { label: '🇺🇦 +380 (Ukraine)', code: '+380' },
  { label: '🇺🇾 +598 (Uruguay)', code: '+598' },
  { label: '🇺🇿 +998 (Uzbekistan)', code: '+998' },
  { label: '🇻🇪 +58 (Venezuela)', code: '+58' },
  { label: '🇻🇳 +84 (Vietnam)', code: '+84' },
  { label: '🇾🇪 +967 (Yemen)', code: '+967' },
  { label: '🇿🇲 +260 (Zambia)', code: '+260' },
  { label: '🇿🇼 +263 (Zimbabwe)', code: '+263' },
];

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

const calculateAge = (dobString) => {
  if (!dobString) return undefined;
  try {
    const parts = dobString.split(/[-/]/);
    if (parts.length === 3) {
      let day, monthStr, year;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        monthStr = parts[1];
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        monthStr = parts[1];
        year = parseInt(parts[2], 10);
        if (year < 100) {
          year += (year <= 30 ? 2000 : 1900);
        }
      }
      const months = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      let month = parseInt(monthStr, 10) - 1;
      if (isNaN(month)) {
        month = months[monthStr.toLowerCase().substring(0, 3)] || 0;
      }
      const birthDate = new Date(year, month, day);
      if (!isNaN(birthDate.getTime())) {
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
          age--;
        }
        return age;
      }
    }
  } catch (e) {
    console.log('Error calculating age:', e);
  }
  return undefined;
};

const formatDateToISO = (dateStr) => {
  if (!dateStr) return undefined;
  try {
    const parts = dateStr.split(/[-/]/);
    if (parts.length === 3) {
      let day, monthStr, year;
      if (parts[0].length === 4) {
        year = parseInt(parts[0], 10);
        monthStr = parts[1];
        day = parseInt(parts[2], 10);
      } else {
        day = parseInt(parts[0], 10);
        monthStr = parts[1];
        year = parseInt(parts[2], 10);
        if (year < 100) {
          year += (year <= 30 ? 2000 : 1900);
        }
      }
      const months = {
        jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
        jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
      };
      let month = parseInt(monthStr, 10) - 1;
      if (isNaN(month)) {
        month = months[monthStr.toLowerCase().substring(0, 3)] || 0;
      }
      const dateObj = new Date(year, month, day);
      if (!isNaN(dateObj.getTime())) {
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
      }
    }
  } catch (e) {
    console.log('Error converting to ISO:', e);
  }
  return dateStr;
};

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return '';
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }
  try {
    const dateObj = new Date(dateStr);
    if (!isNaN(dateObj.getTime())) {
      const day = String(dateObj.getDate()).padStart(2, '0');
      const month = String(dateObj.getMonth() + 1).padStart(2, '0');
      const year = dateObj.getFullYear();
      return `${day}-${month}-${year}`;
    }
  } catch (e) {
    console.log('Error formatting date for display:', e);
  }
  return dateStr;
};

const parsePhoneAndCountryCode = (profile) => {
  const rawPhone = getValue(profile, ['phone', 'phoneNumber', 'mobile'], '');
  const countryCode = getValue(profile, ['countryCode'], '+91');
  if (rawPhone.startsWith('+')) {
    if (rawPhone.startsWith(countryCode)) {
      return {
        countryCode,
        phone: rawPhone.substring(countryCode.length),
      };
    }
    if (rawPhone.length > 3) {
      return {
        countryCode: rawPhone.substring(0, 3),
        phone: rawPhone.substring(3),
      };
    }
  }
  return {
    countryCode,
    phone: rawPhone,
  };
};

const filterApplePrivateRelayEmail = (emailStr) => {
  if (!emailStr || typeof emailStr !== 'string') return '';
  const lower = emailStr.toLowerCase().trim();
  if (lower.includes('privaterelay.appleid.com') || lower.includes('appleid.com')) {
    return '';
  }
  return emailStr;
};

const isCustomAvatar = (url) => {
  if (!url || typeof url !== 'string') return false;
  const str = url.trim().toLowerCase();
  if (!str) return false;
  if (str.includes('cdn.auth0.com') || str.includes('gravatar.com') || str.includes('default-avatar') || str.includes('avatar-placeholder')) {
    return false;
  }
  return true;
};

const getCountryPhoneDigitLimit = (countryCode) => {
  const code = (countryCode || '+91').trim();
  const limits = {
    '+91': 10,  // India
    '+1': 10,   // US / Canada
    '+44': 10,  // UK
    '+971': 9,  // UAE
    '+966': 9,  // Saudi Arabia
    '+61': 9,   // Australia
    '+65': 8,   // Singapore
    '+49': 11,  // Germany
    '+33': 9,   // France
    '+81': 10,  // Japan
    '+86': 11,  // China
    '+880': 10, // Bangladesh
    '+92': 10,  // Pakistan
    '+974': 8,  // Qatar
    '+965': 8,  // Kuwait
    '+968': 8,  // Oman
    '+973': 8,  // Bahrain
    '+977': 10, // Nepal
    '+94': 9,   // Sri Lanka
    '+82': 10,  // South Korea
    '+55': 11,  // Brazil
    '+52': 10,  // Mexico
    '+7': 10,   // Russia / Kazakhstan
    '+39': 10,  // Italy
    '+34': 9,   // Spain
    '+31': 9,   // Netherlands
    '+63': 10,  // Philippines
    '+62': 11,  // Indonesia
    '+60': 10,  // Malaysia
    '+66': 9,   // Thailand
    '+84': 9,   // Vietnam
    '+90': 10,  // Turkey
    '+27': 9,   // South Africa
    '+234': 10, // Nigeria
    '+20': 10,  // Egypt
  };
  return limits[code] || 10;
};

const COUNTRY_ISO_MAP = {
  IN: { code: '+91', countryName: 'India' },
  US: { code: '+1', countryName: 'United States' },
  GB: { code: '+44', countryName: 'United Kingdom' },
  AE: { code: '+971', countryName: 'United Arab Emirates' },
  SA: { code: '+966', countryName: 'Saudi Arabia' },
  CA: { code: '+1', countryName: 'Canada' },
  AU: { code: '+61', countryName: 'Australia' },
  SG: { code: '+65', countryName: 'Singapore' },
  DE: { code: '+49', countryName: 'Germany' },
  FR: { code: '+33', countryName: 'France' },
  JP: { code: '+81', countryName: 'Japan' },
  BD: { code: '+880', countryName: 'Bangladesh' },
  PK: { code: '+92', countryName: 'Pakistan' },
  NP: { code: '+977', countryName: 'Nepal' },
  LK: { code: '+94', countryName: 'Sri Lanka' },
  QA: { code: '+974', countryName: 'Qatar' },
  KW: { code: '+965', countryName: 'Kuwait' },
  OM: { code: '+968', countryName: 'Oman' },
  BH: { code: '+973', countryName: 'Bahrain' },
  KR: { code: '+82', countryName: 'South Korea' },
  CN: { code: '+86', countryName: 'China' },
  BR: { code: '+55', countryName: 'Brazil' },
  MX: { code: '+52', countryName: 'Mexico' },
  RU: { code: '+7', countryName: 'Russia' },
  IT: { code: '+39', countryName: 'Italy' },
  ES: { code: '+34', countryName: 'Spain' },
  NL: { code: '+31', countryName: 'Netherlands' },
  PH: { code: '+63', countryName: 'Philippines' },
  ID: { code: '+62', countryName: 'Indonesia' },
  MY: { code: '+60', countryName: 'Malaysia' },
  TH: { code: '+66', countryName: 'Thailand' },
  VN: { code: '+84', countryName: 'Vietnam' },
  TR: { code: '+90', countryName: 'Turkey' },
  ZA: { code: '+27', countryName: 'South Africa' },
  NG: { code: '+234', countryName: 'Nigeria' },
  EG: { code: '+20', countryName: 'Egypt' },
};

const detectUserLocationCountry = () => {
  try {
    const countryIso = RNLocalize.getCountry();
    if (countryIso && COUNTRY_ISO_MAP[countryIso.toUpperCase()]) {
      return COUNTRY_ISO_MAP[countryIso.toUpperCase()];
    }
  } catch (e) {
    console.log('[EditPersonalInfoScreen] RNLocalize error:', e.message);
  }

  try {
    const timeZone = Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || '';
    if (timeZone.includes('Kolkata') || timeZone.includes('India')) return { code: '+91', countryName: 'India' };
    if (timeZone.includes('Dubai')) return { code: '+971', countryName: 'United Arab Emirates' };
    if (timeZone.includes('Riyadh')) return { code: '+966', countryName: 'Saudi Arabia' };
    if (timeZone.includes('London')) return { code: '+44', countryName: 'United Kingdom' };
    if (timeZone.includes('New_York') || timeZone.includes('Los_Angeles') || timeZone.includes('Chicago')) return { code: '+1', countryName: 'United States' };
  } catch (e) {
    console.log('[EditPersonalInfoScreen] TimeZone error:', e.message);
  }

  return { code: '+91', countryName: 'India' };
};

const EditPersonalInfoScreen = ({ navigation }) => {
  const { user, refreshAuthStatus } = useAuth();
  const profile = useMemo(() => user?.userProfile || user?.memberProfile || user || {}, [user]);

  console.log('[DEBUG] EditPersonalInfoScreen - user:', JSON.stringify(user));
  console.log('[DEBUG] EditPersonalInfoScreen - profile:', JSON.stringify(profile));

  const [saving, setSaving] = useState(false);
  const [pickerField, setPickerField] = useState(null);

  const toastAnim = useRef(new Animated.Value(-100)).current;
  const [toastState, setToastState] = useState({
    visible: false,
    message: '',
    isComplete: false,
  });

  const showNavbarToast = (message, isComplete = false) => {
    setToastState({ visible: true, message, isComplete });
    Animated.spring(toastAnim, {
      toValue: 0,
      useNativeDriver: true,
      friction: 7,
      tension: 40,
    }).start();
  };

  const dismissToast = () => {
    Animated.timing(toastAnim, {
      toValue: -100,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setToastState(prev => ({ ...prev, visible: false }));
    });
  };

  const parsedPhone = useMemo(() => {
    const phoneVal = getValue(profile, ['phone', 'phoneNumber', 'mobile', 'mobileNumber'], '') ||
      getValue(user, ['phone', 'phoneNumber', 'mobile', 'mobileNumber'], '');
    const countryCodeVal = getValue(profile, ['countryCode'], '') ||
      getValue(user, ['countryCode'], '+91');
    return parsePhoneAndCountryCode({ phone: phoneVal, countryCode: countryCodeVal });
  }, [profile, user]);

  const rawInitialEmail = user?.email || user?.user?.email || getValue(profile, ['email', 'emailAddress'], user?.userProfile?.email || user?.memberProfile?.email || '');
  const initialEmail = filterApplePrivateRelayEmail(rawInitialEmail);

  const [form, setForm] = useState({
    name: getValue(profile, ['name', 'firstName'], '') || getValue(user, ['name', 'firstName'], ''),
    username: getValue(profile, ['username'], user?.username || user?.userProfile?.username || user?.memberProfile?.username || ''),
    bio: getValue(profile, ['bio', 'about', 'otherInfo'], '') || getValue(user, ['bio', 'about', 'otherInfo'], ''),
    gender: getValue(profile, ['gender'], user?.gender || ''),
    dateOfBirth: formatDateForDisplay(
      getValue(profile, ['dateOfBirth', 'dob', 'birthDate'], '') ||
      getValue(user, ['dateOfBirth', 'dob', 'birthDate'], '')
    ),
    foodPreference: getValue(profile, ['foodPreference', 'dietPreference'], '') || getValue(user, ['foodPreference', 'dietPreference'], ''),
    fitnessLevel: getValue(profile, ['fitnessLevel', 'level', 'activityLevel'], '') || getValue(user, ['fitnessLevel', 'level', 'activityLevel'], ''),
    countryCode: parsedPhone.countryCode,
    phone: parsedPhone.phone,
    email: initialEmail,
    country: getValue(profile, ['country', 'countryOfResidence'], '') || getValue(user, ['country', 'countryOfResidence'], ''),
  });

  const phoneMaxLength = useMemo(() => getCountryPhoneDigitLimit(form.countryCode), [form.countryCode]);

  const completionInfo = useMemo(() => {
    const fields = [
      { label: 'Profile Photo', isFilled: isCustomAvatar(profileImage || profile.profileImage || user?.profileImage) },
      { label: 'Name', isFilled: Boolean(form.name && form.name.trim().length > 0) },
      { label: 'Username', isFilled: Boolean(form.username && form.username.trim().length > 0) },
      { label: 'Bio', isFilled: Boolean(form.bio && form.bio.trim().length > 0) },
      { label: 'Gender', isFilled: Boolean(form.gender && form.gender.trim().length > 0) },
      { label: 'Date of Birth', isFilled: Boolean(form.dateOfBirth && form.dateOfBirth.trim().length > 0) },
      { label: 'Food Preference', isFilled: Boolean(form.foodPreference && form.foodPreference.trim().length > 0) },
      { label: 'Fitness Level', isFilled: Boolean(form.fitnessLevel && form.fitnessLevel.trim().length > 0) },
      { label: 'Phone Number', isFilled: Boolean(form.phone && form.phone.trim().length >= (phoneMaxLength || 10)) },
      { label: 'Gmail', isFilled: Boolean(filterApplePrivateRelayEmail(form.email).trim().length > 0) },
      { label: 'Country', isFilled: Boolean(form.country && form.country.trim().length > 0) },
    ];

    const filledCount = fields.filter(f => f.isFilled).length;
    const totalCount = fields.length;
    const percentage = Math.round((filledCount / totalCount) * 100);
    const pendingList = fields.filter(f => !f.isFilled).map(f => f.label);

    return {
      percentage,
      filledCount,
      totalCount,
      pendingCount: pendingList.length,
      pendingList,
      isComplete: percentage === 100,
    };
  }, [form, profileImage, profile, user]);

  useEffect(() => {
    const resolveEmail = async () => {
      const rawActiveEmail = user?.email || user?.user?.email || user?.userProfile?.email || user?.memberProfile?.email;
      const activeEmail = filterApplePrivateRelayEmail(rawActiveEmail);
      if (activeEmail && activeEmail !== form.email) {
        setForm(prev => ({ ...prev, email: activeEmail }));
        return;
      }
      if (!form.email) {
        try {
          const userStr = await AsyncStorage.getItem('userProfile');
          if (userStr) {
            const parsed = JSON.parse(userStr);
            const rawSavedEmail = parsed?.email || parsed?.user?.email || parsed?.userProfile?.email || parsed?.memberProfile?.email;
            const savedEmail = filterApplePrivateRelayEmail(rawSavedEmail);
            if (savedEmail) {
              setForm(prev => ({ ...prev, email: savedEmail }));
            }
          }
        } catch (e) {
          console.log('[EditPersonalInfoScreen] Error loading email from AsyncStorage:', e);
        }
      }
    };
    resolveEmail();
  }, [user]);

  useEffect(() => {
    const detected = detectUserLocationCountry();
    setForm(prev => {
      const hasSavedCountry = Boolean(profile.country || user.country);
      if (!hasSavedCountry) {
        return {
          ...prev,
          countryCode: prev.countryCode || detected.code,
          country: prev.country || detected.countryName,
        };
      }
      return prev;
    });
  }, [profile, user]);

  const [profileImage, setProfileImage] = useState(
    profile.profileImage || profile.profilePicture || profile.profilePhoto || profile.avatar || user?.profileImage || user?.avatar || user?.picture || ''
  );
  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePickImage = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 600,
        maxWidth: 600,
        quality: 0.8,
        selectionLimit: 1,
      },
      async (response) => {
        if (response.didCancel) return;
        if (response.errorCode) {
          Alert.alert('Image Error', response.errorMessage || 'Could not pick image.');
          return;
        }
        if (response.assets && response.assets.length > 0) {
          const selectedImage = response.assets[0];
          setUploadingImage(true);
          try {
            const uploadedUrl = await uploadToCloudinary(selectedImage);
            setProfileImage(uploadedUrl);
          } catch (error) {
            Alert.alert('Upload Failed', 'Failed to upload the image. Please try again.');
          } finally {
            setUploadingImage(false);
          }
        }
      }
    );
  };

  const updateField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleDateChange = (text) => {
    const isDeleting = text.length < form.dateOfBirth.length;
    if (isDeleting) {
      updateField('dateOfBirth', text);
      return;
    }

    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = '';

    if (cleaned.length <= 2) {
      formatted = cleaned;
    } else if (cleaned.length <= 4) {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2)}`;
    } else {
      formatted = `${cleaned.slice(0, 2)}-${cleaned.slice(2, 4)}-${cleaned.slice(4, 8)}`;
    }

    updateField('dateOfBirth', formatted);
  };

  const buildPayload = () => {
    const combinedPhone = `${form.countryCode.trim()}${form.phone.trim()}`;
    const isoDate = formatDateToISO(form.dateOfBirth.trim());
    const calculatedAge = calculateAge(form.dateOfBirth.trim());

    const data = {
      name: form.name.trim(),
      username: form.username.trim().toLowerCase(),
      bio: form.bio.trim(),
      otherInfo: form.bio.trim(),
      gender: form.gender,
      dateOfBirth: isoDate || form.dateOfBirth.trim(),
      dob: isoDate || form.dateOfBirth.trim(),
      birthDate: isoDate || form.dateOfBirth.trim(),
      age: calculatedAge,
      foodPreference: form.foodPreference,
      dietPreference: form.foodPreference,
      fitnessLevel: form.fitnessLevel,
      activityLevel: form.fitnessLevel,
      countryCode: form.countryCode.trim(),
      phone: form.phone.trim(),
      phoneNumber: form.phone.trim(),
      mobile: form.phone.trim(),
      fullPhone: combinedPhone,
      fullPhoneNumber: combinedPhone,
      formattedPhoneNumber: combinedPhone,
      email: form.email.trim(),
      country: form.country.trim(),
      profileImage: profileImage || undefined,
      profilePicture: profileImage || undefined,
    };

    return {
      ...data,
      userProfile: data,
      memberProfile: data,
      user: data,
    };
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }

    if (form.dateOfBirth.trim()) {
      const parts = form.dateOfBirth.trim().split(/[-/]/);
      if (parts.length !== 3 || parts[2].length !== 4) {
        Alert.alert('Invalid Date of Birth', 'Please enter your date of birth in DD-MM-YYYY format (e.g., 24-05-1995).');
        return;
      }

      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10);
      const year = parseInt(parts[2], 10);

      if (isNaN(day) || isNaN(month) || isNaN(year) || month < 1 || month > 12 || day < 1 || day > 31 || year < 1900 || year > new Date().getFullYear()) {
        Alert.alert('Invalid Date of Birth', 'Please enter a valid date of birth.');
        return;
      }
    }

    setSaving(true);
    const payload = buildPayload();
    const endpoints = [
      { method: 'put', url: '/users/profile' },
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
          break; // Exit loop as soon as saving succeeds
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
      if (completionInfo.isComplete) {
        showNavbarToast('Profile 100% completed', true);
        setTimeout(() => {
          navigation.goBack();
        }, 1600);
      } else {
        showNavbarToast(`Saved! Profile is ${completionInfo.percentage}% complete`, false);
        setTimeout(() => {
          navigation.goBack();
        }, 1400);
      }
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

  const pickerOptions = pickerField ? (pickerField === 'countryCode' ? COUNTRY_CODES : OPTION_FIELDS[pickerField] || []) : [];

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

        {/* SMALL NAVBAR RECORD POPUP TOAST */}
        {toastState.visible && (
          <Animated.View
            style={[
              styles.navbarToastContainer,
              { transform: [{ translateY: toastAnim }] }
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={dismissToast}
              style={styles.navbarToastContent}
            >
              <LinearGradient
                colors={toastState.isComplete ? ['#10B981', '#059669'] : ['#0055FF', '#2563EB']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <Icon
                name={toastState.isComplete ? "checkmark-circle" : "trophy"}
                size={20}
                color="#FFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.navbarToastText} numberOfLines={1}>
                {toastState.message}
              </Text>
              <Icon name="close" size={16} color="#FFF" style={{ marginLeft: 8 }} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        >

          {/* Circular avatar uploader at the top of the form */}
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handlePickImage} activeOpacity={0.85}>
              <View style={styles.avatarCircle}>
                {uploadingImage ? (
                  <GlobalLoader size={30} />
                ) : profileImage ? (
                  <Image
                    source={{ uri: profileImage }}
                    style={styles.avatarImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Icon name="person" size={40} color="rgba(255, 255, 255, 0.4)" />
                  </View>
                )}
              </View>
              {/* Camera Icon edit badge overlay */}
              <View style={styles.editBadge}>
                <Icon name="camera" size={16} color="#0055FF" />
              </View>
            </TouchableOpacity>
          </View>

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
            <Field
              label="Date of Birth"
              value={form.dateOfBirth}
              placeholder="DD-MM-YYYY"
              keyboardType="numeric"
              maxLength={10}
              onChangeText={handleDateChange}
            />
          </View>


          <SelectField label="Food Preference" value={form.foodPreference} onPress={() => setPickerField('foodPreference')} />
          <SelectField label="Fitness Level" value={form.fitnessLevel} onPress={() => setPickerField('fitnessLevel')} />

          <Text style={styles.sectionLabel}>Contact Info</Text>
          <View style={styles.phoneRow}>
            <TouchableOpacity
              style={styles.countryCodePickerBtn}
              onPress={() => setPickerField('countryCode')}
              activeOpacity={0.8}
            >
              <Text style={styles.countryCodeText}>{form.countryCode || '+91'}</Text>
              <Icon name="chevron-down" size={14} color="#8A8496" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
            <TextInput
              style={[styles.underlineInput, styles.phoneInput]}
              value={form.phone}
              onChangeText={value => {
                const digitsOnly = value.replace(/[^0-9]/g, '');
                updateField('phone', digitsOnly.slice(0, phoneMaxLength));
              }}
              keyboardType="phone-pad"
              maxLength={phoneMaxLength}
              placeholder={`Enter ${phoneMaxLength}-digit phone number`}
              placeholderTextColor="#8A8496"
            />
          </View>

          <UnderlineField
            label="Gmail"
            value={form.email}
            placeholder="Enter your Gmail"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={value => updateField('email', value.toLowerCase())}
          />
          <UnderlineField
            label="Username"
            value={form.username}
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={value => {
              const sanitized = value.replace(/[^a-zA-Z0-9_]/g, '');
              updateField('username', sanitized);
            }}
          />
          <UnderlineField label="Country" value={form.country} onChangeText={value => updateField('country', value)} />

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={saving}>
            {saving ? <GlobalLoader size={50} /> : <Text style={styles.saveText}>Save Changes</Text>}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={Boolean(pickerField)} transparent animationType="slide">
        <Pressable style={styles.modalBackdrop} onPress={() => setPickerField(null)}>
          <View style={styles.optionSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalGrabHandle} />
            <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={true} keyboardShouldPersistTaps="handled">
              {pickerOptions.map(option => {
                const isObj = typeof option === 'object';
                const label = isObj ? option.label : option;
                const val = isObj ? option.code : option;
                const isSelected = form[pickerField] === val;

                return (
                  <TouchableOpacity
                    key={label}
                    style={styles.optionRow}
                    onPress={() => {
                      updateField(pickerField, val);
                      if (pickerField === 'countryCode') {
                        const limit = getCountryPhoneDigitLimit(val);
                        if (form.phone && form.phone.length > limit) {
                          updateField('phone', form.phone.slice(0, limit));
                        }
                      }
                      setPickerField(null);
                    }}
                  >
                    <Text style={styles.optionText}>{label}</Text>
                    {isSelected && <Icon name="checkmark" size={20} color="#0055FF" />}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
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

const UnderlineField = ({ label, style, ...props }) => (
  <View style={styles.underlineWrap}>
    <Text style={styles.sectionLabel}>{label}</Text>
    <TextInput {...props} style={[styles.underlineInput, style]} placeholderTextColor="#8A8496" />
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
  navbarToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 44,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: 'center',
  },
  navbarToastContent: {
    height: 44,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navbarToastEmoji: {
    fontSize: 18,
    marginRight: 8,
  },
  navbarToastText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  recordModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  recordModalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#16161E',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 85, 255, 0.3)',
    shadowColor: '#0055FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  recordModalCloseBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    padding: 4,
    zIndex: 10,
  },
  recordModalIconWrap: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(0, 85, 255, 0.15)',
    borderWidth: 1.5,
    borderColor: 'rgba(0, 85, 255, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  recordModalTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  recordModalSubText: {
    color: '#A0A0B2',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  recordStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: '100%',
    backgroundColor: '#0D0D12',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#262632',
    marginBottom: 20,
  },
  recordStatBox: {
    alignItems: 'center',
    flex: 1,
  },
  recordStatVal: {
    color: '#10B981',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  recordStatLbl: {
    color: '#8A8496',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  recordStatDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#262632',
  },
  recordModalBtn: {
    height: 50,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  recordModalBtnText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '800',
  },
  recordAlertCardPending: {
    backgroundColor: 'rgba(255, 184, 0, 0.08)',
    borderColor: 'rgba(255, 184, 0, 0.3)',
  },
  recordAlertCardComplete: {
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  recordAlertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  recordAlertTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  recordAlertTitle: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginLeft: 8,
  },
  recordAlertBadgeText: {
    fontSize: 15,
    fontWeight: '800',
  },
  recordProgressBarBg: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  recordProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  recordAlertPendingText: {
    color: '#9CA3AF',
    fontSize: 12,
    lineHeight: 16,
  },
  recordAlertSuccessText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
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
  fieldNote: {
    color: 'rgba(255, 255, 255, 0.4)',
    fontSize: 11,
    marginTop: -16,
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
  countryCodePickerBtn: {
    minHeight: 42,
    borderBottomWidth: 1,
    borderBottomColor: '#DADADA',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    marginRight: 6,
  },
  countryCodeText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
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
  modalGrabHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#383842',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 8,
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
    marginTop: 10,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    overflow: 'hidden',
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FFF',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    borderWidth: 1.5,
    borderColor: '#000',
  },
});

export default EditPersonalInfoScreen;
