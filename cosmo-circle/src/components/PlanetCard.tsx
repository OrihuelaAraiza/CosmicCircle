import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInUp, useSharedValue, withSpring, useAnimatedStyle } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';

export type PlanetCardGroup = { id: string; name: string; color?: string | null };
export type PlanetCardProps = {
  id: string;
  name: string;
  company?: string | null;
  notesCount?: number;        // cantidad de notas (para el indicador)
  groups: PlanetCardGroup[];  // galaxias/sistemas a los que pertenece
  emoji?: string | null;      // opcional para avatar; si no hay se usan iniciales
  index?: number;             // para stagger de animación (opcional)
  onPress?: (id: string) => void;
  onView?: (id: string) => void;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
};

const getInitials = (full: string) =>
  full
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('');

const Chip = ({ label, color }: { label: string; color?: string | null }) => (
  <View style={[styles.chip, { backgroundColor: (color ?? '#24304f') + '55', borderColor: color ?? '#24304f' }]}>
    <Text style={styles.chipText}>{label}</Text>
  </View>
);

export default function PlanetCard({
  id, name, company, notesCount = 0, groups, emoji, index = 0,
  onPress, onView, onEdit, onDelete
}: PlanetCardProps) {

  // Color dominante para acentos (del primer grupo con color, si existe)
  const accent = useMemo(() => groups.find(g => g.color)?.color ?? Colors.cyan, [groups]);

  // Animación al presionar (scale + halo)
  const pressed = useSharedValue(0);
  const aCard = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(pressed.value ? 0.98 : 1, { stiffness: 400, damping: 18 }) }]
  }));
  const aHalo = useAnimatedStyle(() => ({
    opacity: withSpring(pressed.value ? 1 : 0, { stiffness: 400, damping: 20 })
  }));

  // Acciones de swipe (derecha → acciones)
  const renderRightActions = () => (
    <View style={styles.actionsWrap}>
      <ActionBtn icon="eye" label="Ver" onPress={() => onView?.(id)} />
      <ActionBtn icon="create-outline" label="Editar" onPress={() => onEdit?.(id)} />
      <ActionBtn danger icon="trash-outline" label="Borrar" onPress={() => onDelete?.(id)} />
    </View>
  );

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).springify()} style={[aCard]}>
      <Swipeable overshootRight={false} renderRightActions={renderRightActions}>
        <Pressable
          onPress={() => onPress?.(id)}
          onPressIn={() => (pressed.value = 1)}
          onPressOut={() => (pressed.value = 0)}
          style={styles.press}
        >
          {/* Borde gradiente */}
          <LinearGradient
            colors={[`${accent}99`, '#1a223f']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.border}
          />
          {/* Halo al presionar */}
          <Animated.View style={[styles.halo, aHalo]} />

          {/* Contenido */}
          <View style={styles.card}>
            {/* Header: avatar + indicadores + menú (si quisieras agregar dots) */}
            <View style={styles.headerRow}>
              <View style={[styles.avatar, { borderColor: accent }]}>
                <Text style={styles.avatarEmoji}>
                  {emoji ?? getInitials(name || 'P')}
                </Text>
              </View>

              {/* Indicadores: empresa / notas / #grupos */}
              <View style={styles.indicators}>
                {!!company && <Ionicons name="business-outline" size={16} color={Colors.textDim} />}
                {notesCount > 0 && <Ionicons name="document-text-outline" size={16} color={Colors.textDim} />}
                {groups.length > 0 && <Ionicons name="layers-outline" size={16} color={Colors.textDim} />}
              </View>
            </View>

            {/* Nombre y empresa */}
            <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail">
              {name || '(Sin nombre)'}
            </Text>
            {!!company && (
              <Text style={styles.subtitle} numberOfLines={1} ellipsizeMode="tail">
                {company}
              </Text>
            )}

            {/* Chips de grupos (máx 3 + “+n”) */}
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

function ActionBtn({
  icon, label, onPress, danger
}: { icon: any; label: string; onPress?: () => void; danger?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.actionBtn, danger && { backgroundColor: '#E11D48' }]}>
      <Ionicons name={icon} size={18} color="#fff" />
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
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
    backgroundColor: 'rgba(255,255,255,0.06)',
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
    color: Colors.text,
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 22,
  },
  subtitle: {
    color: Colors.textDim,
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