import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
// Si luego activas swipe real, puedes usar Swipeable aquí.
// Por ahora mantengamos un contenedor neutro que NO fuerce tamaños.

export default function SwipeRow({
  children,
  onDelete, // reservado para cuando uses acciones
  style,
}: {
  children: React.ReactNode;
  onDelete?: () => void;
  style?: ViewStyle;
}) {
  return <View style={[styles.wrap, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  wrap: {
    // Nada de flex:1 aquí. Deja que el hijo defina su alto.
    width: '100%',
  },
});