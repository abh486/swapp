import React from 'react';
import { View, StyleSheet, Image, Dimensions, StatusBar } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const StoreComingSoon = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Background/Ambient Glow behind the grid */}
      <View style={styles.bgGlow} />

      {/* Rotated Grid Container */}
      <View style={styles.gridWrapper}>
        <View style={styles.gridContainer}>
          {/* Column 1 */}
          <View style={[styles.column, styles.column1]}>
            <View style={[styles.card, styles.cardTall]}>
              <Image
                source={require('../../assets/image/coming5.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, styles.cardMedium]}>
              <Image
                source={require('../../assets/image/coming4.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, styles.cardTall]}>
              <Image
                source={require('../../assets/image/coming7.png')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Column 2 */}
          <View style={[styles.column, styles.column2]}>
            <View style={[styles.card, styles.cardMedium]}>
              <Image
                source={require('../../assets/image/coming2.png')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, styles.cardTall]}>
              <Image
                source={require('../../assets/image/coming1.png')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, styles.cardMedium]}>
              <Image
                source={require('../../assets/image/coming8.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Column 3 */}
          <View style={[styles.column, styles.column3]}>
            <View style={[styles.card, styles.cardTall]}>
              <Image
                source={require('../../assets/image/coming3.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, styles.cardMedium]}>
              <Image
                source={require('../../assets/image/coming6.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, styles.cardTall]}>
              <Image
                source={require('../../assets/image/coming9.png')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Spotlight and Coming Soon Text at Bottom */}
      <View style={styles.bottomContainer}>
        {/* Coming Soon Logo/Text */}
        <Image
          source={require('../../assets/image/comingsoon.png')}
          style={styles.comingSoonText}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

const CARD_WIDTH = SCREEN_WIDTH * 0.38;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  bgGlow: {
    position: 'absolute',
    top: '25%',
    left: '15%',
    width: SCREEN_WIDTH * 0.7,
    height: SCREEN_WIDTH * 0.7,
    borderRadius: (SCREEN_WIDTH * 0.7) / 2,
    backgroundColor: 'rgba(74, 17, 104, 0.2)', // subtle deep purple background glow
    shadowColor: '#4A1168',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
    elevation: 10,
  },
  gridWrapper: {
    position: 'absolute',
    top: -SCREEN_HEIGHT * 0.15,
    left: -SCREEN_WIDTH * 0.22,
    width: SCREEN_WIDTH * 1.5,
    height: SCREEN_HEIGHT * 0.9,
    transform: [{ rotate: '-35deg' }],
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  column: {
    flexDirection: 'column',
    marginHorizontal: 8,
  },
  column1: {
    transform: [{ translateY: -40 }],
  },
  column2: {
    transform: [{ translateY: 40 }],
  },
  column3: {
    transform: [{ translateY: -100 }],
  },
  card: {
    width: CARD_WIDTH,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#161616',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  cardTall: {
    height: CARD_WIDTH * 1.35,
  },
  cardMedium: {
    height: CARD_WIDTH,
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SCREEN_HEIGHT * 0.28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  comingSoonText: {
    width: SCREEN_WIDTH * 0.88,
    height: 110,
    zIndex: 10,
  },
});

export default StoreComingSoon;
