import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface Props {
  size?: number;
}

export function PlotmintLogo({ size = 20 }: Props) {
  return (
    <View style={styles.root}>
      <Text style={[styles.text, { fontSize: size }]}>
        plotmint
        <Text style={styles.star}>✦</Text>
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
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  star: {
    color: '#06B6D4',
    fontSize: 16,
  },
});
