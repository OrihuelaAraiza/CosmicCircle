import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';

export default function CosmicBackground({ children }: { children: React.ReactNode }) {
  return (
    <View style={StyleSheet.absoluteFill}>
      <LinearGradient
        colors={[Colors.bg, '#0b0f29', '#0b0f29']}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}