// src/components/GalaxyCard.tsx
import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View, NativeSyntheticEvent, TextLayoutEventData } from 'react-native';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';
import { GalaxyCardVariant } from '../store/prefs';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  title: string | undefined;
  color?: string | null;
  icon?: string | null;
  count?: number;
  onPress?: () => void;
  variant?: GalaxyCardVariant;
  rightAccessory?: React.ReactNode;
};

export function GalaxyCard({
  title, color, icon, count, onPress,
  rightAccessory, variant='tile'
}: Props) {
  const safeTitle = (title?.trim()?.length ? title! : '(Sin nombre)');
  const accent = color ?? '#7C3AED';

  // opcional: saber cuántas líneas tiene el título (por si quieres condicionar estilos)
  const [lineCount, setLineCount] = useState(1);
  const onTitleLayout = (e: NativeSyntheticEvent<TextLayoutEventData>) => {
    const n = e.nativeEvent.lines?.length ?? 1;
    if (n !== lineCount) setLineCount(n);
  };

  return (
    <Pressable onPress={onPress} style={[styles.card, variantStyles[variant].card]}>
      {/* Fondo (no intercepta toques) */}
      {variant === 'tile' && (
        <LinearGradient
          pointerEvents="none"
          colors={[accent + '40', '#0e1632']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[StyleSheet.absoluteFillObject, { borderRadius: 16, zIndex: 0 }]}
        />
      )}
      {variant === 'orbit' && <View pointerEvents="none" style={[styles.orbit, { borderColor: accent }]} />}
      {variant === 'minimal' && <View pointerEvents="none" style={styles.minimalBorder} />}

      {/* Contenido (la altura de la card será la altura del contenido) */}
      <View style={styles.content}>
        <View style={[styles.headerRow]}>
          <View style={[styles.iconWrap, { backgroundColor: accent + '33', borderColor: accent }]}>
            <Text style={{ fontSize: 18 }}>{icon ?? '🪐'}</Text>
          </View>
          {rightAccessory && <View style={styles.menu}>{rightAccessory}</View>}
        </View>

        {/* TÍTULO: sin numberOfLines ->∞, envuelve donde haya espacio */}
        <Text
          onTextLayout={onTitleLayout}
          style={styles.title}
          // sin numberOfLines ni adjustsFontSizeToFit: se parte en todas las líneas necesarias
        >
          {safeTitle}
        </Text>

        {!!count && <Text style={styles.count}>{count} sistemas</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    borderRadius: 16,
    padding: S.lg,
    overflow: 'hidden',
    flex: 1,
    backgroundColor: Colors.surface,
    // OJO: sin minHeight -> la card crece según el texto
  },
  content: {
    position: 'relative',
    zIndex: 2,
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,   // líneas altas para legibilidad
    width: '100%',
    flexShrink: 1,
  },
  count: { color: Colors.textDim, marginTop: 2, fontSize: 12 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    alignItems:'center', justifyContent:'center',
    borderWidth: 1,
  },
  orbit: {
    position: 'absolute',
    width: 160, height: 160, borderRadius: 80,
    borderWidth: 2, opacity: 0.26, right: -28, top: -28, zIndex: 0
  },
  minimalBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1, borderColor: '#24304f', borderRadius: 16, zIndex: 0
  },
  menu: { marginLeft: 8 }, // ya no es absolute; el layout se adapta
});

const variantStyles = {
  orbit:   { card: {} },
  tile:    { card: {} },
  minimal: { card: { backgroundColor: Colors.bg } },
} as const;