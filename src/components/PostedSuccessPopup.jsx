import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width } = Dimensions.get('window');

/**
 * PostedSuccessPopup
 * Sleek, celebratory pop-up that appears after posting anything and
 * automatically vanishes after 3 seconds (or instantly on tap).
 *
 * @param {boolean} visible - Controls visibility
 * @param {string} title - Main title (default: 'Posted Successfully! 🎉')
 * @param {string} message - Optional subtitle/detail
 * @param {string} emoji - Main celebratory emoji (default: '🎉')
 * @param {number} duration - Auto-vanish timeout in ms (default: 3000)
 * @param {function} onDismiss - Callback invoked when the pop-up vanishes
 */
const PostedSuccessPopup = ({
  visible = false,
  title = 'Posted Successfully! 🎉',
  message,
  emoji = '🎉',
  duration = 3000,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef(null);
  const isDismissingRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isDismissingRef.current = false;
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 6,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Automatically vanish after specified duration (default: 3 seconds)
      timerRef.current = setTimeout(() => {
        handleDismiss();
      }, duration);
    } else {
      scaleAnim.setValue(0.8);
      opacityAnim.setValue(0);
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [visible, duration]);

  const handleDismiss = () => {
    if (isDismissingRef.current) return;
    isDismissingRef.current = true;

    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 0.85,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (typeof onDismiss === 'function') {
        onDismiss();
      }
    });
  };

  if (!visible) return null;

  return (
    <View style={styles.absoluteContainer} pointerEvents="box-none">
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={handleDismiss}>
            <Animated.View
              style={[
                styles.popupCard,
                {
                  opacity: opacityAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Subtle top gradient accent glow */}
              <LinearGradient
                colors={['#EE822A', '#8F5D98', '#2E4D9F']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.gradientTopBar}
              />

              <View style={styles.contentContainer}>
                {/* Emoji Circle */}
                <View style={styles.emojiCircle}>
                  <Text style={styles.emojiText}>{emoji}</Text>
                </View>

                {/* Title */}
                <Text style={styles.titleText}>{title}</Text>

                {/* Optional Message */}
                {!!message && <Text style={styles.messageText}>{message}</Text>}

                {/* Subtext indicator */}
                <Text style={styles.tapToDismissText}>Tap to dismiss</Text>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const styles = StyleSheet.create({
  absoluteContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999999,
    elevation: 999999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  popupCard: {
    width: Math.min(width * 0.82, 320),
    backgroundColor: '#1C1C1E',
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#EE822A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 18,
    elevation: 12,
  },
  gradientTopBar: {
    height: 4,
    width: '100%',
  },
  contentContainer: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  emojiCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2A2A2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: 'rgba(238, 130, 42, 0.5)',
  },
  emojiText: {
    fontSize: 32,
  },
  titleText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'BRLNSR',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  messageText: {
    color: 'rgba(255, 255, 255, 0.72)',
    fontSize: 13,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 18,
  },
  tapToDismissText: {
    color: 'rgba(255, 255, 255, 0.35)',
    fontSize: 11,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 14,
    letterSpacing: 0.2,
  },
});

export default PostedSuccessPopup;
