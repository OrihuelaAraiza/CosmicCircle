// src/components/PlanetCard.tsx
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, type ColorValue } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';
import { typeColors } from './TypePill';

export type PlanetCardGroup = { id: string; name: string; color?: string | null };
export type PlanetCardProps = {
  id: string;
  name: string;
  company?: string | null;
  notesCount?: number;
  groups: PlanetCardGroup[];
  emoji?: string | null;
  index?: number;
  onPress?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEditAvatar?: (id: string) => void;
};

/* ---------- helpers ---------- */
const getInitials = (full: string) =>
  full.trim().split(/\s+/).slice(0, 2).map(s => s[0]?.toUpperCase() ?? '').join('');

/** genera un par (tupla) de colores a partir de un string, para el gradiente del avatar */
const hashToHue = (str: string) => {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 360;
  return h;
};
const avatarGradient = (seed: string): readonly [ColorValue, ColorValue] => {
  const h = hashToHue(seed || 'seed');
  // devolvemos una TUPLA readonly de ColorValue, no string[]
  return [`hsl(${h} 85% 55%)`, `hsl(${(h + 35) % 360} 85% 45%)`] as const;
};

const Chip = ({ label, color }: { label: string; color?: string | null }) => (
  <View style={[styles.chip, { backgroundColor: (color ?? '#24304f') + '55', borderColor: color ?? '#24304f' }]}>
    <Text style={styles.chipText} numberOfLines={1}>{label}</Text>
  </View>
);

/* ---------- component ---------- */
export default function PlanetCard({
  id, name, company, notesCount = 0, groups, emoji, index = 0,
  onPress, onView, onEdit, onDelete, onEditAvatar
}: PlanetCardProps) {

  const accent = useMemo(() => groups.find(g => g.color)?.color ?? Colors.cyan, [groups]);

  // micro-interacciones
  const pressed = useSharedValue(0);
  const aCard = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.985 : 1, { stiffness: 420, damping: 18 }) }],
    shadowOpacity: withSpring(pressed.value ? 0.35 : 0.2),
  }));
  const aHalo = useAnimatedStyle(() => ({
    opacity: withSpring(pressed.value ? 1 : 0, { stiffness: 400, damping: 20 })
  }));

  const renderRightActions = () => (
    <View style={styles.actionsWrap}>
      <ActionBtn icon="eye" label="Ver" onPress={() => onView?.(id)} />
      <ActionBtn icon="create-outline" label="Editar" onPress={() => onEdit?.(id)} />
      <ActionBtn danger icon="trash-outline" label="Borrar" onPress={() => onDelete?.(id)} />
    </View>
  );

  const grad = avatarGradient(name || id); // <- ahora es una tupla compatible

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).springify()} style={[aCard, styles.shadow]}>
      <Swipeable overshootRight={false} renderRightActions={renderRightActions}>
        <Pressable
          onPress={() => onPress?.(id)}
          onLongPress={() => onEdit?.(id)}
          onPressIn={() => (pressed.value = 1)}
          onPressOut={() => (pressed.value = 0)}
          style={styles.press}
        >
          {/* borde gradiente suave */}
          <LinearGradient colors={[`${accent}66`, '#1a223f']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.border} />
          {/* halo on tap */}
          <Animated.View style={[styles.halo, aHalo]} />

          {/* contenido */}
          <View style={styles.card}>
            <View style={styles.headerRow}>
              <Pressable onPress={() => onEditAvatar?.(id)} style={{ borderRadius: 999, overflow: 'hidden' }}>
                <View style={[styles.avatar, { borderColor: accent }]}>
                  <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFillObject} />
                  <Text style={styles.avatarEmoji}>
                    {emoji ?? getInitials(name || 'P')}
                  </Text>
                </View>
              </Pressable>

              <View style={styles.indicators}>
                {!!company && <Ionicons name="business-outline" size={16} color={Colors.textDim} />}
                {notesCount > 0 && <Ionicons name="document-text-outline" size={16} color={Colors.textDim} />}
                {groups.length > 0 && <Ionicons name="layers-outline" size={16} color={Colors.textDim} />}
              </View>
            </View>

            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {name || '(Sin nombre)'}
            </Text>
            {!!company && (
              <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                {company}
              </Text>
            )}

            {groups.length > 0 && (
              <View style={styles.chipsRow}>
                {groups.slice(0, 3).map(g => <Chip key={g.id} label={g.name} color={g.color} />)}
                {groups.length > 3 && (
                  <View style={[styles.chip, { backgroundColor: '#24304f55', borderColor: '#24304f' }]}>
                    <Text style={styles.chipText}>+{groups.length - 3}</Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </Pressable>
      </Swipeable>
    </Animated.View>
  );
}

/* ---------- subcomponents ---------- */
function ActionBtn({ icon, label, onPress, danger }: { icon: any; label: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionBtn, danger && { backgroundColor: '#E11D48' }]}>
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

/* ---------- styles ---------- */
const styles = StyleSheet.create({
  shadow: {
    shadowColor: '#000',
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
  },
  press: {
    borderRadius: 18,
    overflow: 'hidden',
    marginBottom: S.md,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
  },
  halo: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: S.lg,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  avatarEmoji: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  indicators: {
    flexDirection: 'row',
    gap: 8,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  subtitle: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 4,
  },
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    maxWidth: '75%',
  },
  chipText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  actionsWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 6,
    gap: 6,
  },
  actionBtn: {
    height: '88%',
    alignSelf: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
});