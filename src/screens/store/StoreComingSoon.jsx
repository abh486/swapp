import React from 'react';
import { View, StyleSheet, Image, StatusBar } from 'react-native';
import { useResponsiveMetrics } from '../../utils/responsive';

const StoreComingSoon = () => {
  const { width, height, wp, hp, ms } = useResponsiveMetrics();

  const cardWidth = Math.min(wp(38), ms(160));
  const cardTallHeight = cardWidth * 1.35;
  const cardMediumHeight = cardWidth;
  const glowSize = wp(70);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Background/Ambient Glow behind the grid */}
      <View
        style={[
          styles.bgGlow,
          {
            width: glowSize,
            height: glowSize,
            borderRadius: glowSize / 2,
          },
        ]}
      />

      {/* Rotated Grid Container */}
      <View
        style={[
          styles.gridWrapper,
          {
            top: -hp(15),
            left: -wp(22),
            width: wp(150),
            height: hp(90),
          },
        ]}
      >
        <View style={styles.gridContainer}>
          {/* Column 1 */}
          <View style={[styles.column, styles.column1]}>
            <View style={[styles.card, { width: cardWidth, height: cardTallHeight }]}>
              <Image
                source={require('../../assets/image/coming5.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, { width: cardWidth, height: cardMediumHeight }]}>
              <Image
                source={require('../../assets/image/coming4.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, { width: cardWidth, height: cardTallHeight }]}>
              <Image
                source={require('../../assets/image/coming7.png')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Column 2 */}
          <View style={[styles.column, styles.column2]}>
            <View style={[styles.card, { width: cardWidth, height: cardMediumHeight }]}>
              <Image
                source={require('../../assets/image/coming2.png')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, { width: cardWidth, height: cardTallHeight }]}>
              <Image
                source={require('../../assets/image/coming1.png')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, { width: cardWidth, height: cardMediumHeight }]}>
              <Image
                source={require('../../assets/image/coming8.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
          </View>

          {/* Column 3 */}
          <View style={[styles.column, styles.column3]}>
            <View style={[styles.card, { width: cardWidth, height: cardTallHeight }]}>
              <Image
                source={require('../../assets/image/coming3.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, { width: cardWidth, height: cardMediumHeight }]}>
              <Image
                source={require('../../assets/image/coming6.jpg')}
                style={styles.cardImage}
                resizeMode="cover"
              />
            </View>
            <View style={[styles.card, { width: cardWidth, height: cardTallHeight }]}>
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
      <View style={[styles.bottomContainer, { height: hp(28) }]}>
        <Image
          source={require('../../assets/image/comingsoon.png')}
          style={[
            styles.comingSoonText,
            {
              width: Math.min(wp(88), ms(380)),
              height: Math.min(ms(110), hp(14)),
            },
          ]}
          resizeMode="contain"
        />
      </View>
    </View>
  );
};

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
    backgroundColor: 'rgba(74, 17, 104, 0.2)',
    shadowColor: '#4A1168',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 100,
    elevation: 10,
  },
  gridWrapper: {
    position: 'absolute',
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
  cardImage: {
    width: '100%',
    height: '100%',
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 40,
  },
  comingSoonText: {
    zIndex: 10,
  },
});

export default StoreComingSoon;
