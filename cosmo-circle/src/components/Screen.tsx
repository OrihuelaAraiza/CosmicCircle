// src/components/Screen.tsx
import React from 'react';
import { View, ScrollView, StyleSheet, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CosmicBackground from './CosmicBackground';
import { S } from '../theme/spacing';

type Props = {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: ViewStyle;
  pad?: boolean; // agrega paddings horizontales
};

/**
 * Contenedor base de pantallas con fondo cósmico y safe area.
 * - Asegura separación suficiente del notch para que los títulos NO queden pegados.
 * - En modo scroll, usa contentContainerStyle para paddings correctos.
 */
export default function Screen({ children, scroll, contentStyle, pad = true }: Props) {
  const insets = useSafeAreaInsets();
  const Container: any = scroll ? ScrollView : View;

  const topPad = Math.max(insets.top, 18);     // 👈 más aire para que el h1 se vea
  const bottomPad = Math.max(insets.bottom, 16) + 80; // espacio extra por la tab bar/FAB

  return (
    <View style={styles.fill}>
      <CosmicBackground>
        <Container
          style={[styles.fill]}
          {...(scroll
            ? {
                keyboardShouldPersistTaps: 'handled',
                contentContainerStyle: [
                  { paddingTop: topPad, paddingBottom: bottomPad },
                  pad && styles.pad,
                  contentStyle,
                ],
              }
            : {})}
        >
          {!scroll ? (
            <View style={[pad && styles.pad, { paddingTop: topPad, paddingBottom: bottomPad }, contentStyle]}>
              {children}
            </View>
          ) : (
            // En modo scroll ya usamos contentContainerStyle arriba
            children
          )}
        </Container>
      </CosmicBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  pad: { paddingHorizontal: S.lg },
});