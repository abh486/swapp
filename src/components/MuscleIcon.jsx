import React, { useState } from 'react';
import { Image, View, StyleSheet } from 'react-native';
import Svg, { Circle, Rect, Path, Ellipse, Line } from 'react-native-svg';
import { getMuscleImageUrl } from '../utils/workoutIcons';

const localMuscleImages = {
  abdominals: require('../assets/muscles/abdominals.png'),
  abs: require('../assets/muscles/abdominals.png'),

  abductors: require('../assets/muscles/abductors.png'),

  biceps: require('../assets/muscles/biceps.png'),

  chest: require('../assets/muscles/chest.png'),

  forearms: require('../assets/muscles/forearms.png'),
  forearm: require('../assets/muscles/forearms.png'),

  lats: require('../assets/muscles/lats.png'),

  'lower back': require('../assets/muscles/lower_back.png'),
  lower_back: require('../assets/muscles/lower_back.png'),

  neck: require('../assets/muscles/neck.png'),

  shoulders: require('../assets/muscles/shoulders.png'),
  deltoids: require('../assets/muscles/shoulders.png'),

  traps: require('../assets/muscles/traps.png'),
  trapezius: require('../assets/muscles/traps.png'),

  triceps: require('../assets/muscles/triceps.png'),

  'upper back': require('../assets/muscles/upper_back.png'),
  upper_back: require('../assets/muscles/upper_back.png'),
};

export const MuscleIcon = ({ name, size = 34 }) => {
  const [imageError, setImageError] = useState(false);
  const normName = (name || '').toLowerCase().trim();

  // Primary: Check local Gemini-generated muscle image asset first
  if (localMuscleImages[normName]) {
    return (
      <Image
        source={localMuscleImages[normName]}
        style={{ width: size, height: size }}
        resizeMode="contain"
      />
    );
  }

  // Secondary: Try remote high-res API image
  if (!imageError) {
    return (
      <Image
        source={{
          uri: getMuscleImageUrl(normName),
          headers: { 'x-api-key': '327a86f1-6475-4c3c-9827-76a85cb04743' },
        }}
        style={{ width: size, height: size }}
        resizeMode="contain"
        onError={() => setImageError(true)}
      />
    );
  }

  // Fallback: Crisp 3D SVG muscle target figures with electric blue highlighted areas (#0A84FF)
  const renderFallbackSvg = () => {
    const BLUE = '#0A84FF';
    const BODY_DARK = '#2C2C2E';
    const BODY_LIGHT = '#48484A';

    switch (normName) {
      case 'abdominals':
      case 'abs':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M30 34 C30 30, 70 30, 70 34 L64 64 L36 64 Z" fill={BODY_DARK} />
            <Rect x="42" y="38" width="7" height="7" rx="1.5" fill={BLUE} />
            <Rect x="51" y="38" width="7" height="7" rx="1.5" fill={BLUE} />
            <Rect x="42" y="47" width="7" height="7" rx="1.5" fill={BLUE} />
            <Rect x="51" y="47" width="7" height="7" rx="1.5" fill={BLUE} />
            <Rect x="42" y="56" width="7" height="7" rx="1.5" fill={BLUE} />
            <Rect x="51" y="56" width="7" height="7" rx="1.5" fill={BLUE} />
            <Path d="M36 64 L33 92 L46 92 L47 64 Z" fill={BODY_DARK} />
            <Path d="M64 64 L67 92 L54 92 L53 64 Z" fill={BODY_DARK} />
          </Svg>
        );

      case 'biceps':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M34 32 C34 28, 66 28, 66 32 L62 64 L38 64 Z" fill={BODY_DARK} />
            <Ellipse cx="26" cy="42" rx="5" ry="9" fill={BLUE} />
            <Ellipse cx="74" cy="42" rx="5" ry="9" fill={BLUE} />
            <Path d="M26 32 L22 52 L31 52 L34 32 Z" fill={BODY_DARK} />
            <Path d="M74 32 L78 52 L69 52 L66 32 Z" fill={BODY_DARK} />
          </Svg>
        );

      case 'chest':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M30 32 L70 32 L64 68 L36 68 Z" fill={BODY_DARK} />
            <Path d="M33 34 C33 34, 48 34, 48 48 C40 50, 34 46, 33 34 Z" fill={BLUE} />
            <Path d="M67 34 C67 34, 52 34, 52 48 C60 50, 66 46, 67 34 Z" fill={BLUE} />
          </Svg>
        );

      case 'forearms':
      case 'forearm':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M34 32 L66 32 L62 64 L38 64 Z" fill={BODY_DARK} />
            <Path d="M21 48 L17 68 C17 70, 24 71, 26 68 L28 48 Z" fill={BLUE} />
            <Path d="M79 48 L83 68 C83 70, 76 71, 74 68 L72 48 Z" fill={BLUE} />
          </Svg>
        );

      case 'lats':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M34 32 L66 32 L62 64 L38 64 Z" fill={BODY_DARK} />
            <Path d="M34 36 C28 42, 32 58, 42 60 C38 52, 36 44, 34 36 Z" fill={BLUE} />
            <Path d="M66 36 C72 42, 68 58, 58 60 C62 52, 64 44, 66 36 Z" fill={BLUE} />
          </Svg>
        );

      case 'lower back':
      case 'lower_back':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M34 32 L66 32 L62 64 L38 64 Z" fill={BODY_DARK} />
            <Path d="M42 50 L58 50 L56 63 L44 63 Z" fill={BLUE} />
          </Svg>
        );

      case 'neck':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M34 34 L66 34 L62 64 L38 64 Z" fill={BODY_DARK} />
            <Path d="M44 25 L56 25 L60 34 L40 34 Z" fill={BLUE} />
          </Svg>
        );

      case 'shoulders':
      case 'deltoids':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M34 34 L66 34 L62 64 L38 64 Z" fill={BODY_DARK} />
            <Ellipse cx="28" cy="34" rx="7" ry="6" fill={BLUE} />
            <Ellipse cx="72" cy="34" rx="7" ry="6" fill={BLUE} />
          </Svg>
        );

      case 'traps':
      case 'trapezius':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M34 34 L66 34 L62 64 L38 64 Z" fill={BODY_DARK} />
            <Path d="M50 27 L64 36 L36 36 Z" fill={BLUE} />
          </Svg>
        );

      case 'triceps':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M34 32 L66 32 L62 64 L38 64 Z" fill={BODY_DARK} />
            <Path d="M26 34 L21 50 L28 50 L31 34 Z" fill={BLUE} />
            <Path d="M79 34 L79 50 L72 50 L69 34 Z" fill={BLUE} />
          </Svg>
        );

      case 'upper back':
      case 'upper_back':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BODY_DARK} />
            <Path d="M34 32 L66 32 L62 64 L38 64 Z" fill={BODY_DARK} />
            <Path d="M38 36 L62 36 L58 52 L42 52 Z" fill={BLUE} />
          </Svg>
        );

      case 'abductors':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Path d="M36 40 L46 40 L42 80 L32 80 Z" fill={BODY_DARK} />
            <Path d="M64 40 L54 40 L58 80 L68 80 Z" fill={BODY_DARK} />
            <Path d="M32 44 C30 52, 32 64, 34 68 L38 68 C36 60, 36 48, 36 44 Z" fill={BLUE} />
            <Path d="M68 44 C70 52, 68 64, 66 68 L62 68 C64 60, 64 48, 64 44 Z" fill={BLUE} />
          </Svg>
        );

      case 'adductors':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Path d="M36 40 L46 40 L42 80 L32 80 Z" fill={BODY_DARK} />
            <Path d="M64 40 L54 40 L58 80 L68 80 Z" fill={BODY_DARK} />
            <Path d="M44 42 C46 50, 44 60, 42 66 L46 66 L46 42 Z" fill={BLUE} />
            <Path d="M56 42 C54 50, 56 60, 58 66 L54 66 L54 42 Z" fill={BLUE} />
          </Svg>
        );

      case 'calves':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Path d="M36 30 L44 30 L40 88 L32 88 Z" fill={BODY_DARK} />
            <Path d="M64 30 L56 30 L60 88 L68 88 Z" fill={BODY_DARK} />
            <Ellipse cx="37" cy="54" rx="5" ry="12" fill={BLUE} />
            <Ellipse cx="63" cy="54" rx="5" ry="12" fill={BLUE} />
          </Svg>
        );

      case 'glutes':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Path d="M36 24 L64 24 L62 40 L38 40 Z" fill={BODY_DARK} />
            <Path d="M36 60 L42 90 L32 90 Z" fill={BODY_DARK} />
            <Path d="M64 60 L58 90 L68 90 Z" fill={BODY_DARK} />
            <Circle cx="41" cy="48" r="11" fill={BLUE} />
            <Circle cx="59" cy="48" r="11" fill={BLUE} />
          </Svg>
        );

      case 'hamstrings':
      case 'hamstring':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Path d="M36 24 L46 24 L42 84 L32 84 Z" fill={BODY_DARK} />
            <Path d="M64 24 L54 24 L58 84 L68 84 Z" fill={BODY_DARK} />
            <Path d="M36 36 L45 36 L43 68 L34 68 Z" fill={BLUE} />
            <Path d="M64 36 L55 36 L57 68 L66 68 Z" fill={BLUE} />
          </Svg>
        );

      case 'quadriceps':
      case 'quads':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Path d="M34 24 L46 24 L42 84 L32 84 Z" fill={BODY_DARK} />
            <Path d="M66 24 L54 24 L58 84 L68 84 Z" fill={BODY_DARK} />
            <Path d="M34 32 L46 32 L43 66 L34 66 Z" fill={BLUE} />
            <Path d="M66 32 L54 32 L57 66 L66 66 Z" fill={BLUE} />
          </Svg>
        );

      case 'cardio':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="62" cy="20" r="8" fill={BODY_DARK} />
            <Path d="M46 32 L60 30 L52 50 L34 54" stroke={BODY_DARK} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M52 50 L64 70 L78 76" stroke={BLUE} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
            <Path d="M52 50 L38 66 L24 82" stroke={BLUE} strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
          </Svg>
        );

      case 'full body':
      case 'full_body':
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="50" cy="18" r="9" fill={BLUE} />
            <Path d="M34 32 L66 32 L62 64 L38 64 Z" fill={BLUE} />
            <Path d="M38 64 L34 94 L46 94 L48 64 Z" fill={BLUE} />
            <Path d="M62 64 L66 94 L54 94 L52 64 Z" fill={BLUE} />
          </Svg>
        );

      case 'other':
      default:
        return (
          <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
            <Circle cx="26" cy="50" r="7" fill="#666666" />
            <Circle cx="50" cy="50" r="7" fill="#666666" />
            <Circle cx="74" cy="50" r="7" fill="#666666" />
          </Svg>
        );
    }
  };

  return renderFallbackSvg();
};

