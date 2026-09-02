import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions, Image } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { fonts } from '@/theme';

const { width, height } = Dimensions.get('window');

export function NoInternetOverlay() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);

  useEffect(() => {
    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  // Do not render anything if connected or status is unknown
  if (isConnected !== false) {
    return null;
  }

  return (
    <Animated.View 
      entering={FadeIn.duration(400)} 
      exiting={FadeOut.duration(300)} 
      style={styles.container}
    >
      <View style={styles.content}>
        <Image 
          source={require('../../../assets/no-internet.png')} 
          style={styles.image}
          resizeMode="contain"
        />
        <Text style={styles.title}>Whoops!</Text>
        <Text style={styles.subtitle}>
          Please connect to internet.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(7, 7, 13, 0.95)', // Semi-transparent dark background
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 1000,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    width: '100%',
  },
  image: {
    width: width * 0.7,
    height: width * 0.7,
    marginBottom: 32,
  },
  title: {
    fontFamily: fonts.heading,
    fontSize: 28,
    color: '#FFFFFF',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: fonts.body,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    lineHeight: 24,
  },
});
