import { Dimensions, PixelRatio, Platform, useWindowDimensions } from 'react-native';
import {
  scale as rnScale,
  verticalScale as rnVerticalScale,
  moderateScale as rnModerateScale,
} from 'react-native-size-matters';

const { width, height } = Dimensions.get('window');

// Guideline sizes are based on a standard mobile screen (iPhone 11/12/13/14)
const GUIDELINE_BASE_WIDTH = 375;
const GUIDELINE_BASE_HEIGHT = 812;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const scale = size => {
  if (typeof rnScale === 'function') {
    return rnScale(size);
  }
  return (width / GUIDELINE_BASE_WIDTH) * size;
};

export const verticalScale = size => {
  if (typeof rnVerticalScale === 'function') {
    return rnVerticalScale(size);
  }
  return (height / GUIDELINE_BASE_HEIGHT) * size;
};

export const moderateScale = (size, factor = 0.5) => {
  if (typeof rnModerateScale === 'function') {
    return rnModerateScale(size, factor);
  }
  return size + (scale(size) - size) * factor;
};

export const moderateVerticalScale = (size, factor = 0.5) => {
  if (typeof rnVerticalScale === 'function') {
    return size + (verticalScale(size) - size) * factor;
  }
  return size + (verticalScale(size) - size) * factor;
};

export const responsiveFontSize = (size, factor = 0.5) => {
  const newSize = moderateScale(size, factor);
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 1;
};

export const responsiveFont = (size, options = {}) => {
  const {
    width: currentWidth = width,
    factor = 0.35,
    min = size * 0.88,
    max = size * 1.2,
    respectFontScale = true,
  } = options;
  const scaled = size + ((currentWidth / GUIDELINE_BASE_WIDTH) * size - size) * factor;
  const normalized = PixelRatio.roundToNearestPixel(clamp(scaled, min, max));
  const fontScale = respectFontScale ? Math.min(PixelRatio.getFontScale(), 1.2) : 1;
  return Math.round(normalized / fontScale);
};

export const responsiveSpace = (size, currentWidth = width, factor = 0.45) => {
  const scaled = size + ((currentWidth / GUIDELINE_BASE_WIDTH) * size - size) * factor;
  return PixelRatio.roundToNearestPixel(clamp(scaled, size * 0.75, size * 1.35));
};

export const responsiveSize = (size, currentWidth = width, factor = 0.45) => {
  const scaled = size + ((currentWidth / GUIDELINE_BASE_WIDTH) * size - size) * factor;
  return PixelRatio.roundToNearestPixel(clamp(scaled, size * 0.82, size * 1.3));
};

export const responsiveWidth = (percent, currentWidth = width) => (currentWidth * percent) / 100;
export const responsiveHeight = (percent, currentHeight = height) => (currentHeight * percent) / 100;

export const getDeviceClass = (currentWidth, currentHeight) => {
  const shortest = Math.min(currentWidth, currentHeight);
  if (shortest >= 768) return 'tablet';
  if (shortest >= 600) return 'foldable';
  if (shortest <= 340) return 'smallPhone';
  return 'phone';
};

export const useResponsiveMetrics = () => {
  const { width: currentWidth, height: currentHeight, scale: density, fontScale } = useWindowDimensions();
  const shortest = Math.min(currentWidth, currentHeight);
  const longest = Math.max(currentWidth, currentHeight);
  const deviceClass = getDeviceClass(currentWidth, currentHeight);
  const isLandscape = currentWidth > currentHeight;
  const isTabletDevice = deviceClass === 'tablet';
  const maxContentWidth = isTabletDevice ? Math.min(720, currentWidth) : currentWidth;

  return {
    width: currentWidth,
    height: currentHeight,
    shortest,
    longest,
    density,
    fontScale,
    deviceClass,
    isLandscape,
    isTablet: isTabletDevice,
    maxContentWidth,
    wp: percent => (currentWidth * percent) / 100,
    hp: percent => (currentHeight * percent) / 100,
    ms: value => responsiveSize(value, shortest),
    mvs: value => responsiveSize(value, currentHeight),
    sp: value => responsiveSpace(value, shortest),
    fs: (value, options) => responsiveFont(value, { width: shortest, ...options }),
    clamp,
  };
};

export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = width * pixelDensity;
  const adjustedHeight = height * pixelDensity;
  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  }
  if (pixelDensity >= 2 && (adjustedWidth >= 1900 || adjustedHeight >= 1900)) {
    return true;
  }
  return false;
};

export { width as deviceWidth, height as deviceHeight };
