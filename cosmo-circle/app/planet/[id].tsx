// app/planet/[id].tsx
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { S } from '../../src/theme/spacing';
import { T } from '../../src/theme/typography';
import { useDB } from '../../src/store/useDB';
import PlanetDetailCard, { PlanetDetail } from '../../src/components/PlanetDetailCard';
import { toast } from '../../src/utils/toast';

export default function PlanetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const groups = useDB(s => s.groups);
  const planets = useDB(s => s.planets);
  const updatePlanet = useDB(s => s.updatePlanet);
  const deletePlanet  = useDB(s => s.deletePlanet);
  const getGroupsByPlanet = useDB(s => s.getGroupsByPlanet);

  const planetRow = useMemo(() => planets.find(p => p.id === id), [planets, id]);
  const [planetGroups, setPlanetGroups] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const gs = await getGroupsByPlanet(id);
      setPlanetGroups(gs);
    })();
  }, [id, getGroupsByPlanet]);

  if (!planetRow) {
    return (
      <Screen>
        <Text style={[T.h1, { color: Colors.text }]}>Planeta no encontrado</Text>
      </Screen>
    );
  }

  const allGroups = groups.map(g => ({ id: g.id, name: g.name, color: g.color, type: g.type }));

  const planetDetail: PlanetDetail = {
    id: planetRow.id,
    fullName: planetRow.fullName,
    jobTitle: planetRow.jobTitle ?? null,
    company: planetRow.company ?? null,
    phone: planetRow.phone ?? null,
    email: planetRow.email ?? null,
    howWeMet: planetRow.howWeMet ?? null,
    commonGround: planetRow.commonGround ?? null,
    notes: Array.isArray(planetRow.notes) ? planetRow.notes : [],
    emoji: '🪐', // sólo UI
    groups: planetGroups.map(g => ({ id: g.id, name: g.name, color: g.color, type: g.type })),
  };

  const onSave = async (p: PlanetDetail, groupIds: string[]) => {
    // Construimos un objeto compatible con tu modelo Planet (sin emoji)
    await updatePlanet(
      {
        id: p.id,
        fullName: p.fullName,
        jobTitle: p.jobTitle ?? null,
        company: p.company ?? null,
        phone: p.phone ?? null,
        email: p.email ?? null,
        howWeMet: p.howWeMet ?? null,
        commonGround: p.commonGround ?? null,
        notes: p.notes ?? [],
        keywords: [],       // deja como está si usas keywords
        socials: [],        // idem
        createdAt: planetRow.createdAt,
        updatedAt: Date.now(),
      } as any,
      groupIds
    );
    toast.success('Planeta actualizado', p.fullName);
  };

  const onDelete = () => {
    Alert.alert('Eliminar planeta', `¿Eliminar a "${planetRow.fullName}"?`, [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Eliminar', style: 'destructive', onPress: async () => {
          await deletePlanet(planetRow.id);
          toast.success('Planeta eliminado', planetRow.fullName);
          router.back();
        }
      }
    ]);
  };

  return (
    <Screen scroll>
      <Text style={[T.h1, { color: Colors.text, marginBottom: S.sm }]}>{planetRow.fullName}</Text>
      <PlanetDetailCard
        planet={planetDetail}
        allGroups={allGroups}
        onSave={onSave}
        onDelete={onDelete}
      />
    </Screen>
  );
}