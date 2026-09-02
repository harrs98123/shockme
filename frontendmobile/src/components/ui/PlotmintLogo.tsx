import React from 'react';
import { View, Text, StyleSheet, StyleProp, ViewStyle } from 'react-native';

interface Props {
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function PlotmintLogo({ size = 20, style }: Props) {
  return (
    <View style={[styles.root, style]}>
      <Text style={[styles.text, { fontSize: size }]}>
        plot<Text style={styles.mint}>mint</Text>
        <Text style={[styles.star, { fontSize: Math.max(12, Math.round(size * 0.7)) }]}>✦</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontFamily: 'Poppins_700Bold',
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  mint: {
    color: '#10B981',
  },
  star: {
    color: '#10B981',
    marginLeft: 2,
  },
});
