import React from 'react';
import Svg, { Circle, Rect, Path, G, Ellipse, Line } from 'react-native-svg';

export const EquipmentIcon = ({ name, size = 34 }) => {
  const normName = (name || '').toLowerCase().trim();

  switch (normName) {
    case 'none':
    case 'body weight':
    case 'bodyweight':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Head */}
          <Circle cx="50" cy="18" r="10" fill="#1C1C1E" />
          {/* Neck */}
          <Rect x="46" y="27" width="8" height="6" rx="2" fill="#1C1C1E" />
          {/* Shoulders & Torso */}
          <Path
            d="M26 38 C26 33, 34 32, 50 32 C66 32, 74 33, 74 38 L68 62 C67 66, 62 68, 58 68 L42 68 C38 68, 33 66, 32 62 Z"
            fill="#1C1C1E"
          />
          {/* Chest & Abs lines */}
          <Path d="M50 34 L50 66" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
          <Path d="M38 44 C44 46, 56 46, 62 44" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <Path d="M40 54 C45 56, 55 56, 60 54" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          {/* Legs */}
          <Path d="M35 68 L32 94 C31 97, 41 98, 43 94 L47 68 Z" fill="#1C1C1E" />
          <Path d="M65 68 L68 94 C69 97, 59 98, 57 94 L53 68 Z" fill="#1C1C1E" />
          {/* Arms */}
          <Path d="M26 38 L16 64 C14 68, 20 70, 23 66 L30 46 Z" fill="#1C1C1E" />
          <Path d="M74 38 L84 64 C86 68, 80 70, 77 66 L70 46 Z" fill="#1C1C1E" />
        </Svg>
      );

    case 'barbell':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Main Bar */}
          <Rect x="8" y="47" width="84" height="6" rx="3" fill="#555555" />
          {/* Inner Collars */}
          <Rect x="24" y="38" width="5" height="24" rx="2" fill="#333333" />
          <Rect x="71" y="38" width="5" height="24" rx="2" fill="#333333" />
          {/* Inner Plates */}
          <Rect x="16" y="24" width="8" height="52" rx="3" fill="#1C1C1E" />
          <Rect x="76" y="24" width="8" height="52" rx="3" fill="#1C1C1E" />
          {/* Outer Plates */}
          <Rect x="10" y="30" width="6" height="40" rx="2" fill="#3A3A3C" />
          <Rect x="84" y="30" width="6" height="40" rx="2" fill="#3A3A3C" />
          {/* Highlights */}
          <Rect x="18" y="26" width="2" height="48" fill="#555555" opacity="0.4" />
          <Rect x="78" y="26" width="2" height="48" fill="#555555" opacity="0.4" />
        </Svg>
      );

    case 'dumbbell':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Handle */}
          <Rect x="28" y="45" width="44" height="10" rx="5" fill="#666666" />
          <Rect x="36" y="46" width="28" height="8" rx="2" fill="#888888" />
          {/* Inner Hex Weights */}
          <Path d="M 28 26 L 36 34 L 36 66 L 28 74 L 20 66 L 20 34 Z" fill="#1C1C1E" />
          <Path d="M 72 26 L 80 34 L 80 66 L 72 74 L 64 66 L 64 34 Z" fill="#1C1C1E" />
          {/* Outer Hex Weights */}
          <Path d="M 20 30 L 26 36 L 26 64 L 20 70 L 14 64 L 14 36 Z" fill="#3A3A3C" />
          <Path d="M 80 30 L 86 36 L 86 64 L 80 70 L 74 64 L 74 36 Z" fill="#3A3A3C" />
        </Svg>
      );

    case 'kettlebell':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Handle Arch */}
          <Path
            d="M 32 45 C 32 20, 68 20, 68 45"
            stroke="#1C1C1E"
            strokeWidth="11"
            strokeLinecap="round"
            fill="none"
          />
          <Path
            d="M 38 45 C 38 30, 62 30, 62 45"
            stroke="#FFFFFF"
            strokeWidth="7"
            strokeLinecap="round"
            fill="none"
          />
          {/* Main Bell Body */}
          <Circle cx="50" cy="62" r="28" fill="#1C1C1E" />
          {/* Metallic / Texture Highlight */}
          <Circle cx="44" cy="54" r="20" fill="#3A3A3C" opacity="0.5" />
          {/* Weight label flat surface */}
          <Ellipse cx="50" cy="64" rx="10" ry="7" fill="#2C2C2E" />
        </Svg>
      );

    case 'machine':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Frame Base & Tower */}
          <Rect x="20" y="82" width="60" height="6" rx="3" fill="#333333" />
          <Rect x="24" y="16" width="6" height="68" rx="2" fill="#333333" />
          <Rect x="70" y="16" width="6" height="68" rx="2" fill="#333333" />
          <Rect x="22" y="14" width="56" height="6" rx="2" fill="#333333" />
          {/* Weight Stack */}
          <Rect x="32" y="30" width="16" height="48" rx="3" fill="#1C1C1E" />
          <Line x1="32" y1="38" x2="48" y2="38" stroke="#555555" strokeWidth="1.5" />
          <Line x1="32" y1="46" x2="48" y2="46" stroke="#555555" strokeWidth="1.5" />
          <Line x1="32" y1="54" x2="48" y2="54" stroke="#555555" strokeWidth="1.5" />
          <Line x1="32" y1="62" x2="48" y2="62" stroke="#555555" strokeWidth="1.5" />
          <Line x1="32" y1="70" x2="48" y2="70" stroke="#555555" strokeWidth="1.5" />
          {/* Seat */}
          <Rect x="54" y="56" width="18" height="6" rx="2" fill="#1C1C1E" />
          <Rect x="64" y="40" width="6" height="20" rx="2" fill="#1C1C1E" />
          {/* Pulley / Cable */}
          <Circle cx="40" cy="18" r="4" fill="#666666" />
          <Path d="M40 22 L40 30" stroke="#777777" strokeWidth="2" />
        </Svg>
      );

    case 'plate':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Outer Rim */}
          <Circle cx="50" cy="50" r="42" fill="#1C1C1E" />
          <Circle cx="50" cy="50" r="36" fill="#2C2C2E" />
          {/* Inner Groove */}
          <Circle cx="50" cy="50" r="26" fill="#1C1C1E" />
          {/* Center Hub */}
          <Circle cx="50" cy="50" r="14" fill="#3A3A3C" />
          {/* Center Hole */}
          <Circle cx="50" cy="50" r="8" fill="#FFFFFF" />
          {/* Grip Hand-holes */}
          <Ellipse cx="50" cy="22" rx="7" ry="3" fill="#111111" />
          <Ellipse cx="50" cy="78" rx="7" ry="3" fill="#111111" />
          <Ellipse cx="22" cy="50" rx="3" ry="7" fill="#111111" />
          <Ellipse cx="78" cy="50" rx="3" ry="7" fill="#111111" />
        </Svg>
      );

    case 'resistance band':
    case 'resistance_band':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Bright Blue Resistance Band */}
          <Path
            d="M 16 35 C 30 20, 70 20, 84 35 C 90 42, 80 65, 68 75 C 50 90, 20 80, 16 65 C 12 50, 10 40, 16 35 Z"
            fill="#0A84FF"
          />
          {/* Band Fold Detail */}
          <Path
            d="M 22 40 C 35 28, 65 28, 78 40 C 82 46, 74 60, 64 68 C 48 80, 25 72, 22 60 Z"
            fill="#0066CC"
          />
          <Path
            d="M 28 45 C 38 36, 60 36, 70 45"
            stroke="#66B2FF"
            strokeWidth="3"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      );

    case 'suspension band':
    case 'suspension_band':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Top Anchor Ring */}
          <Circle cx="50" cy="14" r="6" stroke="#555555" strokeWidth="4" fill="none" />
          {/* Straps */}
          <Path d="M 47 18 L 26 62" stroke="#1C1C1E" strokeWidth="5" strokeLinecap="round" />
          <Path d="M 53 18 L 74 62" stroke="#1C1C1E" strokeWidth="5" strokeLinecap="round" />
          {/* Adjuster Buckles */}
          <Rect x="31" y="40" width="8" height="6" rx="1" fill="#666666" />
          <Rect x="61" y="40" width="8" height="6" rx="1" fill="#666666" />
          {/* Triangle Handle Frames */}
          <Path d="M 18 64 L 34 64 L 26 78 Z" stroke="#1C1C1E" strokeWidth="3" fill="none" />
          <Path d="M 66 64 L 82 64 L 74 78 Z" stroke="#1C1C1E" strokeWidth="3" fill="none" />
          {/* Padded Foam Handles */}
          <Rect x="14" y="78" width="24" height="8" rx="4" fill="#3A3A3C" />
          <Rect x="62" y="78" width="24" height="8" rx="4" fill="#3A3A3C" />
        </Svg>
      );

    case 'other':
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          <Circle cx="26" cy="50" r="7" fill="#666666" />
          <Circle cx="50" cy="50" r="7" fill="#666666" />
          <Circle cx="74" cy="50" r="7" fill="#666666" />
        </Svg>
      );

    case 'all equipment':
    case 'all equipement':
    case 'all':
    default:
      return (
        <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
          {/* Dumbbell & Barbell Combined Icon */}
          <Rect x="15" y="46" width="70" height="8" rx="4" fill="#333333" />
          <Circle cx="26" cy="50" r="14" fill="#1C1C1E" />
          <Circle cx="74" cy="50" r="14" fill="#1C1C1E" />
          <Circle cx="26" cy="50" r="6" fill="#FFFFFF" />
          <Circle cx="74" cy="50" r="6" fill="#FFFFFF" />
        </Svg>
      );
  }
};
