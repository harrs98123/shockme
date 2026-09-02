import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  runOnJS,
  type SharedValue,
} from 'react-native-reanimated';
import { Star } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';

interface InteractiveStarRatingProps {
  initialRating?: number; // 0 to 5
  onRatingChange?: (rating: number) => void;
  onRatingSubmit?: (rating: number) => void;
  starSize?: number;
  gap?: number;
}

const MAX_STARS = 5;

export function InteractiveStarRating({
  initialRating = 0,
  onRatingChange,
  onRatingSubmit,
  starSize = 36,
  gap = 8,
}: InteractiveStarRatingProps) {
  const currentRating = useSharedValue(initialRating);
  const isDragging = useSharedValue(false);

  const totalWidth = (starSize * MAX_STARS) + (gap * (MAX_STARS - 1));

  const updateRating = (x: number) => {
    'worklet';
    let newRating = (x / totalWidth) * MAX_STARS;
    newRating = Math.max(0, Math.min(newRating, MAX_STARS));
    
    // Snap to nearest 0.5 for logic, but visual can be smooth or snapped
    const snapped = Math.round(newRating * 2) / 2;
    
    if (currentRating.value !== snapped) {
      currentRating.value = snapped;
      
      // Provide light haptic feedback as it crosses thresholds
      runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
      
      if (onRatingChange) {
        runOnJS(onRatingChange)(snapped);
      }
    }
  };

  const pan = Gesture.Pan()
    .onBegin((e) => {
      isDragging.value = true;
      updateRating(e.x);
    })
    .onUpdate((e) => {
      updateRating(e.x);
    })
    .onEnd(() => {
      isDragging.value = false;
      if (onRatingSubmit) {
        runOnJS(onRatingSubmit)(currentRating.value);
      }
    });

  const tap = Gesture.Tap()
    .onEnd((e) => {
      updateRating(e.x);
      if (onRatingSubmit) {
        runOnJS(onRatingSubmit)(currentRating.value);
      }
    });

  const composed = Gesture.Exclusive(pan, tap);

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[styles.container, { gap }]}>
        {Array.from({ length: MAX_STARS }).map((_, index) => {
          return (
            <FractionalStar
              key={index}
              index={index}
              rating={currentRating}
              size={starSize}
              isDragging={isDragging}
            />
          );
        })}
      </Animated.View>
    </GestureDetector>
  );
}

interface FractionalStarProps {
  index: number;
  rating: SharedValue<number>;
  size: number;
  isDragging: SharedValue<boolean>;
}

function FractionalStar({ index, rating, size, isDragging }: FractionalStarProps) {
  const animatedFillStyle = useAnimatedStyle(() => {
    // If rating is 3.5, index 3 gets 0.5, index 2 gets 1.0, index 4 gets 0.0
    const fillAmount = Math.max(0, Math.min(1, rating.value - index));
    const width = fillAmount * size;
    
    return {
      width,
      // Add a slight scale effect when actively manipulating this star
      transform: [
        { scale: isDragging.value && rating.value >= index && rating.value < index + 1 ? withSpring(1.2) : withSpring(1) }
      ]
    };
  });

  return (
    <View style={{ width: size, height: size }}>
      {/* Background Empty Star */}
      <View style={{ position: 'absolute', opacity: 0.2 }}>
        <Star size={size} color="#FFFFFF" strokeWidth={1.5} />
      </View>

      {/* Foreground Filled Star (Clipped) */}
      <Animated.View style={[{ position: 'absolute', overflow: 'hidden', height: size }, animatedFillStyle]}>
        <Star size={size} color="#FFC107" fill="#FFC107" strokeWidth={1.5} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
});
