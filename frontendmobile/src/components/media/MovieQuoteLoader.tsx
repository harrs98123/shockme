import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { IOSPressable } from '@/components/ios/IOSPressable';
import { colors, fonts } from '@/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface MovieQuote {
  quote: string;
  movie: string;
  year?: string;
}

export const MOVIE_QUOTES: MovieQuote[] = [
  { quote: 'This is a new day, a new beginning.', movie: 'Star Wars' },
  { quote: 'May the Force be with you.', movie: 'Star Wars' },
  { quote: 'Why so serious?', movie: 'The Dark Knight' },
  { quote: "I'm going to make him an offer he can't refuse.", movie: 'The Godfather' },
  { quote: 'To infinity and beyond!', movie: 'Toy Story' },
  { quote: 'Life is like a box of chocolates. You never know what you\'re gonna get.', movie: 'Forrest Gump' },
  { quote: 'Just keep swimming.', movie: 'Finding Nemo' },
  { quote: 'Here\'s looking at you, kid.', movie: 'Casablanca' },
  { quote: 'Hope is a good thing, maybe the best of things, and no good thing ever dies.', movie: 'The Shawshank Redemption' },
  { quote: 'It\'s not who I am underneath, but what I do that defines me.', movie: 'Batman Begins' },
  { quote: 'I am Iron Man.', movie: 'Avengers: Endgame' },
  { quote: 'Carpe diem. Seize the day, boys. Make your lives extraordinary.', movie: 'Dead Poets Society' },
  { quote: 'There\'s no place like home.', movie: 'The Wizard of Oz' },
  { quote: 'You talking to me?', movie: 'Taxi Driver' },
  { quote: 'Keep your friends close, but your enemies closer.', movie: 'The Godfather Part II' },
  { quote: 'Great Scott!', movie: 'Back to the Future' },
  { quote: 'After all, tomorrow is another day!', movie: 'Gone with the Wind' },
  { quote: 'I\'ll be back.', movie: 'The Terminator' },
  { quote: 'Every man dies, not every man really lives.', movie: 'Braveheart' },
  { quote: 'Picture abhi baaki hai mere dost!', movie: 'Om Shanti Om' },
  { quote: 'Mogambo khush hua!', movie: 'Mr. India' },
  { quote: 'Babu Moshai, zindagi badi honi chahiye, lambi nahi.', movie: 'Anand' },
  { quote: 'All those moments will be lost in time, like tears in rain.', movie: 'Blade Runner' },
  { quote: 'I\'m the king of the world!', movie: 'Titanic' },
  { quote: 'Hasta la vista, baby.', movie: 'Terminator 2' },
];

interface MovieQuoteLoaderProps {
  onBack?: () => void;
  customQuotes?: MovieQuote[];
}

export function MovieQuoteLoader({ onBack, customQuotes }: MovieQuoteLoaderProps) {
  const insets = useSafeAreaInsets();
  const quotes = customQuotes && customQuotes.length > 0 ? customQuotes : MOVIE_QUOTES;

  // Pick random start quote
  const [quoteIndex, setQuoteIndex] = useState(() =>
    Math.floor(Math.random() * quotes.length)
  );
  const [progress, setProgress] = useState(18);

  const rotation = useSharedValue(0);

  // Rotate quotes every 2.8 seconds
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
    }, 2800);

    return () => clearInterval(quoteInterval);
  }, [quotes.length]);

  // Simulate smooth progressive loading counter
  useEffect(() => {
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 95) return 96;
        const jump = Math.floor(Math.random() * 9) + 4;
        return Math.min(prev + jump, 96);
      });
    }, 380);

    return () => clearInterval(progressInterval);
  }, []);

  // Continuous smooth spin for circular progress
  useEffect(() => {
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 1400,
        easing: Easing.linear,
      }),
      -1,
      false
    );
  }, [rotation]);

  const spinStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const currentQuote = quotes[quoteIndex] || quotes[0];
  const headerTopOffset = Math.max(insets.top, Platform.OS === 'android' ? 12 : 8) + 6;

  // SVG Circle measurements
  const size = 76;
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Draw ~65% arc for open ring look
  const strokeDashoffset = circumference * 0.35;

  return (
    <View style={styles.container}>
      {/* Top Floating Back Button */}
      <View style={[styles.topBar, { top: headerTopOffset }]}>
        <IOSPressable
          style={styles.circleBtn}
          onPress={onBack || (() => router.back())}
          hitSlop={12}
          activeScale={0.9}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <ChevronLeft size={22} color="#FFFFFF" strokeWidth={2.4} />
        </IOSPressable>
      </View>

      {/* Center Cinematic Dialogue Card */}
      <View style={styles.centerContent}>
        <Animated.View
          key={quoteIndex}
          entering={FadeIn.duration(450)}
          exiting={FadeOut.duration(300)}
          style={styles.quoteCard}
        >
          <Text style={styles.quoteText}>"{currentQuote.quote}"</Text>

          {/* Subtle Horizontal Divider */}
          <View style={styles.dividerBar} />

          {/* Movie Title */}
          <Text style={styles.movieTitleText}>{currentQuote.movie}</Text>
        </Animated.View>

        {/* Circular Progress Indicator with Percentage */}
        <View style={styles.loaderArea}>
          <View style={styles.spinnerWrapper}>
            {/* Spinning Arc */}
            <Animated.View style={[styles.svgSpinner, spinStyle]}>
              <Svg width={size} height={size}>
                {/* Background Track Circle */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="rgba(255, 255, 255, 0.12)"
                  strokeWidth={strokeWidth}
                  fill="none"
                />
                {/* Glowing Progress Arc */}
                <Circle
                  cx={size / 2}
                  cy={size / 2}
                  r={radius}
                  stroke="#E2E8F0"
                  strokeWidth={strokeWidth}
                  strokeDasharray={`${circumference}`}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="none"
                />
              </Svg>
            </Animated.View>

            {/* Centered Percentage */}
            <View style={styles.percentageBox}>
              <Text style={styles.percentageText}>{progress}%</Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#07070D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  topBar: {
    position: 'absolute',
    left: 16,
    zIndex: 50,
  },
  circleBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    width: SCREEN_WIDTH - 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  quoteCard: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 140,
    marginBottom: 44,
  },
  quoteText: {
    fontFamily: fonts.headingSemi,
    fontSize: 22,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 32,
    letterSpacing: -0.2,
  },
  dividerBar: {
    width: 28,
    height: 2.5,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 14,
  },
  movieTitleText: {
    fontFamily: fonts.heading,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    letterSpacing: 0.4,
  },
  loaderArea: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  spinnerWrapper: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  svgSpinner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  percentageBox: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentageText: {
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.2,
  },
});
