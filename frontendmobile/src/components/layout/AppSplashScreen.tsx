import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AppSplashScreenProps {
  isReady: boolean;
  onTransitionEnd?: () => void;
  children: React.ReactNode;
}

const SPLASH_IMAGE = require('../../../assets/images/splash-pm.png');

export function AppSplashScreen({ isReady, onTransitionEnd, children }: AppSplashScreenProps) {
  const [splashMounted, setSplashMounted] = useState(true);
  const [showSlowHint, setShowSlowHint] = useState(false);

  const splashOpacity = useSharedValue(1);
  const splashScale = useSharedValue(1);
  const contentScale = useSharedValue(0.96);
  const contentOpacity = useSharedValue(0);

  // Show a gentle hint if network / loading takes longer than 2.5s
  useEffect(() => {
    if (!isReady) {
      const timer = setTimeout(() => {
        setShowSlowHint(true);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isReady]);

  useEffect(() => {
    if (isReady && splashMounted) {
      // Trigger smooth exit transition
      const transitionDuration = 650;
      const easing = Easing.bezier(0.16, 1, 0.3, 1);

      splashOpacity.value = withTiming(0, { duration: transitionDuration, easing }, (finished) => {
        if (finished) {
          runOnJS(setSplashMounted)(false);
          if (onTransitionEnd) {
            runOnJS(onTransitionEnd)();
          }
        }
      });

      splashScale.value = withTiming(1.08, { duration: transitionDuration, easing });
      contentScale.value = withTiming(1, { duration: transitionDuration, easing });
      contentOpacity.value = withTiming(1, { duration: transitionDuration, easing });
    }
  }, [isReady, splashMounted, onTransitionEnd, splashOpacity, splashScale, contentScale, contentOpacity]);

  const animatedSplashStyle = useAnimatedStyle(() => ({
    opacity: splashOpacity.value,
    transform: [{ scale: splashScale.value }],
  }));

  const animatedContentStyle = useAnimatedStyle(() => ({
    flex: 1,
    opacity: isReady ? contentOpacity.value : 0,
    transform: [{ scale: isReady ? contentScale.value : 0.96 }],
  }));

  return (
    <View style={styles.container}>
      {/* App main content */}
      <Animated.View style={animatedContentStyle}>
        {children}
      </Animated.View>

      {/* Branded Splash Screen Overlay */}
      {splashMounted && (
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.splashContainer, animatedSplashStyle]}
          pointerEvents={isReady ? 'none' : 'auto'}
        >
          <Image
            source={SPLASH_IMAGE}
            style={styles.splashImage}
            contentFit="cover"
            priority="high"
            cachePolicy="memory-disk"
          />

          {/* Loading Indicator & Status */}
          <View style={styles.loaderWrapper}>
            <ActivityIndicator size="large" color="#A78BFA" />
            {showSlowHint && !isReady && (
              <Text style={styles.slowText}>Connecting...</Text>
            )}
          </View>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#030308',
  },
  splashContainer: {
    backgroundColor: '#030308',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 99999,
  },
  splashImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loaderWrapper: {
    position: 'absolute',
    bottom: 90,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  slowText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 13,
    letterSpacing: 0.3,
  },
});
