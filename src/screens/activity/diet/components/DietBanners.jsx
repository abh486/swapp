import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';

import bottleImage from '../../../../assets/image/bottle.png';

const DietBanners = () => {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannersScroll}>
      {/* Card 1: Dark Gray */}
      <View style={styles.bannerDark}>
        <View style={styles.bannerContentWrapper}>
          <View style={styles.bannerTextContainer}>
            <Text style={styles.bannerTitle}>FLAT 25% OFF</Text>
            <Text style={styles.bannerSubtitle}>On Vitamin D3</Text>
            <Text style={styles.bannerCode}>Use code: <Text style={styles.bannerCodeBold}>Swapp20</Text></Text>
            <TouchableOpacity style={styles.bannerButton}>
              <Text style={styles.bannerButtonText}>Shop Now</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.bannerBottleImageContainer}>
             <Image source={bottleImage} style={styles.bannerBottleImage} resizeMode="contain" />
          </View>
        </View>
      </View>
      
      {/* Card 2: Light Gray */}
      <View style={styles.bannerLight}>
        <View style={styles.bannerContentWrapper}>
          <View style={styles.bannerTextContainer}>
            <Text style={[styles.bannerTitle, {color: '#000'}]}>FLAT 25% OFF</Text>
            <Text style={[styles.bannerSubtitle, {color: '#333'}]}>On Vitamin D3</Text>
            <Text style={[styles.bannerCode, {color: '#555'}]}>Use code: <Text style={[styles.bannerCodeBold, {color: '#000'}]}>Swapp20</Text></Text>
            <TouchableOpacity style={[styles.bannerButton, {backgroundColor: '#000'}]}>
              <Text style={[styles.bannerButtonText, {color: '#FFF'}]}>Shop Now</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.bannerBottleImageContainer}>
             <Image source={bottleImage} style={styles.bannerBottleImage} resizeMode="contain" />
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  bannersScroll: {
    paddingHorizontal: 16,
    marginTop: 30,
    paddingBottom: 10,
  },
  bannerDark: {
    width: 280,
    height: 180,
    backgroundColor: '#1F1F1F',
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
  },
  bannerLight: {
    width: 280,
    height: 180,
    backgroundColor: '#E0E0E0',
    borderRadius: 20,
    marginRight: 16,
    overflow: 'hidden',
  },
  bannerContentWrapper: {
    flexDirection: 'row',
    height: '100%',
  },
  bannerTextContainer: {
    flex: 1,
    padding: 15,
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#CCC',
    fontSize: 14,
    marginBottom: 16,
  },
  bannerCode: {
    color: '#888',
    fontSize: 12,
    marginBottom: 16,
  },
  bannerCodeBold: {
    color: '#FFF',
    fontWeight: 'bold',
  },
  bannerButton: {
    backgroundColor: '#FFF',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  bannerButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bannerBottleImageContainer: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerBottleImage: {
    width: 80, 
    height: 130,
  },
});

export default DietBanners;
