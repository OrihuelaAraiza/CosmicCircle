import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, Pressable, FlatList, ListRenderItem } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { S } from '../../src/theme/spacing';
import { T } from '../../src/theme/typography';
import { useDB } from '../../src/store/useDB';
import PlanetCard, { PlanetCardGroup } from '../../src/components/PlanetCard';
import SwipeRow from '../../src/components/SwipeRow';
import { toast } from '../../src/utils/toast';
import Divider from '../../src/components/Divider';
import TypePill from '../../src/components/TypePill';

type PRow = any;

export default function SystemScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const router = useRouter();

  // Aseguramos string plano
  const systemId = Array.isArray(params.id) ? params.id[0] : params.id;

  const groups = useDB(s => s.groups);
  const deleteGroup = useDB(s => s.deleteGroup);
  const deletePlanet = useDB(s => s.deletePlanet);
  const getPlanetsByGroup = useDB(s => s.getPlanetsByGroup);

  const system = useMemo(() => groups.find(g => g.id === systemId), [groups, systemId]);

  const [planets, setPlanets] = useState<PRow[]>([]);
  const [loading, setLoading] = useState(false);

  const loadPlanets = useCallback(async () => {
    if (!systemId) return;
    setLoading(true);
    try {
      const list = await getPlanetsByGroup(systemId);
      setPlanets(list);
    } finally {
      setLoading(false);
    }
  }, [systemId, getPlanetsByGroup]);

  // cargar al montar
  useEffect(() => {
    loadPlanets();
  }, [loadPlanets]);

  // recargar al volver con foco (por si editaste/añadiste)
  useFocusEffect(
    useCallback(() => {
      loadPlanets();
    }, [loadPlanets])
  );

  const onDeleteSystem = () => {
    Alert.alert(
      'Eliminar sistema',
      'Se borrará este sistema y se desvincularán los planetas que pertenecen a él. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            await deleteGroup(systemId as string);
            toast.success('Sistema eliminado');
            router.back();
          },
        },
      ],
    );
  };

  if (!system) {
    return (
      <Screen>
        <Text style={[T.h1, { color: Colors.text }]}>Sistema no encontrado</Text>
      </Screen>
    );
  }

  const renderPlanet: ListRenderItem<PRow> = ({ item, index }) => {
    let notesCount = 0;
    try {
      const n = Array.isArray(item.notes) ? item.notes : JSON.parse(item.notes ?? '[]');
      if (Array.isArray(n)) notesCount = n.length;
    } catch {}

    const planetGroups: PlanetCardGroup[] = (item.groupIds ?? [])
      .map((gid: string) => groups.find(g => g.id === gid))
      .filter(Boolean)
      .map((g: any) => ({ id: g.id, name: g.name, color: g.color }));

    const askDeletePlanet = () => {
      Alert.alert(
        'Eliminar planeta',
        `Borrar "${item.fullName}" y sus vínculos.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              await deletePlanet(item.id);
              setPlanets(prev => prev.filter(x => x.id !== item.id));
              toast.success('Planeta eliminado', item.fullName);
            },
          },
        ],
      );
    };

    return (
      <SwipeRow onDelete={askDeletePlanet}>
        <PlanetCard
          id={item.id}
          index={index}
          name={item.fullName}
          company={item.company}
          notesCount={notesCount}
          emoji={item.emoji}
          groups={planetGroups}
          onPress={(pid) => router.push(`/planet/${pid}`)}
          onView={(pid) => router.push(`/planet/${pid}`)}
          onEdit={(pid) => router.push({ pathname: '/planet/[id]', params: { id: pid, edit: '1' } })}
          onDelete={askDeletePlanet}
        />
      </SwipeRow>
    );
  };

  return (
    <Screen scroll>
      <Text style={[T.h1, { color: Colors.text }]}>{system.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.sm }}>
        <Text style={[T.p, { color: Colors.textDim }]}>
          Sistema · {loading ? 'cargando…' : `${planets.length} planeta${planets.length === 1 ? '' : 's'}`}
        </Text>
        <TypePill type="system" />
      </View>

      <Divider />

      {planets.length > 0 ? (
        <FlatList
          data={planets}
          keyExtractor={(it) => it.id}
          renderItem={renderPlanet}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: S.sm }} />}
          contentContainerStyle={{ paddingBottom: S.lg }}
        />
      ) : (
        <Text style={[T.p, { color: Colors.textDim, marginTop: S.lg }]}>
          {loading ? 'Cargando planetas…' : 'No hay planetas en este sistema.'}
        </Text>
      )}

      <Pressable
        onPress={onDeleteSystem}
        style={{
          marginTop: S.xl,
          padding: S.md,
          borderRadius: 12,
          backgroundColor: Colors.error || '#ff4444',
        }}
      >
        <Text style={{ color: '#000', textAlign: 'center', fontWeight: '800' }}>
          Eliminar Sistema
        </Text>
      </Pressable>
    </Screen>
  );
}