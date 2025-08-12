// app/system/[id].tsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { S } from '../../src/theme/spacing';
import { T } from '../../src/theme/typography';
import { useDB } from '../../src/store/useDB';
import PlanetCard, { PlanetCardGroup } from '../../src/components/PlanetCard';
import SwipeRow from '../../src/components/SwipeRow';
import { toast } from '../../src/utils/toast';

export default function SystemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const groups = useDB(s => s.groups);
  const deleteGroup = useDB(s => s.deleteGroup);
  const deletePlanet = useDB(s => s.deletePlanet);
  const getPlanetsByGroup = useDB(s => s.getPlanetsByGroup);

  const system = useMemo(() => groups.find(g => g.id === id), [groups, id]);

  const [planets, setPlanets] = useState<any[]>([]);
  const loadPlanets = useCallback(async () => {
    if (!id) return;
    const list = await getPlanetsByGroup(id);
    setPlanets(list);
  }, [id, getPlanetsByGroup]);

  useEffect(() => {
    loadPlanets();
  }, [loadPlanets]);

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
            await deleteGroup(id as string);
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

  return (
    <Screen>
      <Text style={[T.h1, { color: Colors.text }]}>{system.name}</Text>
      <Text style={[T.p, { color: Colors.textDim, marginTop: S.sm }]}>
        Sistema · {planets.length} planeta{planets.length === 1 ? '' : 's'}
      </Text>

      {planets.length > 0 ? (
        <>
          <Text style={[T.h3, { color: Colors.cyan, marginTop: S.lg, marginBottom: S.sm }]}>
            Planetas en este sistema
          </Text>

          {planets.map((p, idx) => {
            // notas: puede ser array o JSON string
            let notesCount = 0;
            try {
              const n = Array.isArray(p.notes) ? p.notes : JSON.parse(p.notes ?? '[]');
              if (Array.isArray(n)) notesCount = n.length;
            } catch {}

            // chips de grupos
            const planetGroups: PlanetCardGroup[] = (p.groupIds ?? [])
              .map((gid: string) => groups.find(g => g.id === gid))
              .filter(Boolean)
              .map((g: any) => ({ id: g.id, name: g.name, color: g.color }));

            const askDeletePlanet = () => {
              Alert.alert(
                'Eliminar planeta',
                `Borrar "${p.fullName}" y sus vínculos.`,
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                      await deletePlanet(p.id);
                      setPlanets(prev => prev.filter(x => x.id !== p.id));
                      toast.success('Planeta eliminado', p.fullName);
                    },
                  },
                ],
              );
            };

            return (
              <SwipeRow key={p.id} onDelete={askDeletePlanet} style={{ flex: 1 }}>
                <View style={{ flex: 1 }}>
                  <PlanetCard
                    id={p.id}
                    index={idx}
                    name={p.fullName}
                    company={p.company}
                    notesCount={notesCount}
                    emoji={p.emoji}
                    groups={planetGroups}
                    onPress={(pid) => router.push(`/planet/${pid}`)}
                    onView={(pid) => router.push(`/planet/${pid}`)}
                    onEdit={(pid) => router.push({ pathname: '/planet/[id]', params: { id: pid, edit: '1' } })}
                    onDelete={askDeletePlanet}
                  />
                </View>
              </SwipeRow>
            );
          })}
        </>
      ) : (
        <Text style={[T.p, { color: Colors.textDim, marginTop: S.lg }]}>
          No hay planetas en este sistema.
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