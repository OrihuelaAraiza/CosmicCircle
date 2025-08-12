// src/components/AddFab.tsx
import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export const AddFab = ({ onPress }: { onPress: () => void }) => {
  const insets = useSafeAreaInsets();
  return (
    <Pressable onPress={onPress} style={[styles.fab, { bottom: 16 + Math.max(insets.bottom, 8) }]}>
      <Ionicons name="add" size={28} color="#000" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute', right: 20,
    backgroundColor: Colors.cyan,
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.4, shadowRadius: 10, elevation: 8
  }
});