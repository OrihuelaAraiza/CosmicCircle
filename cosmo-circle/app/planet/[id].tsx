import React, { useEffect, useMemo, useState } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { S } from '../../src/theme/spacing';
import { T } from '../../src/theme/typography';
import { useDB } from '../../src/store/useDB';
import PlanetDetailCard from '../../src/components/PlanetDetailCard';
import { toast } from '../../src/utils/toast';

export default function PlanetScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const planets = useDB(s => s.planets);
  const groups = useDB(s => s.groups);
  const getGroupsByPlanet = useDB(s => s.getGroupsByPlanet);
  const updatePlanet = useDB(s => s.updatePlanet);
  const deletePlanet = useDB(s => s.deletePlanet);

  const planet = useMemo(() => planets.find(p => p.id === id), [planets, id]);
  const [pGroups, setPGroups] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const gs = await getGroupsByPlanet(id);
      setPGroups(gs);
    })();
  }, [id, getGroupsByPlanet]);

  if (!planet) {
    return (
      <Screen>
        <Text style={[T.h1, { color: Colors.text }]}>Planeta no encontrado</Text>
      </Screen>
    );
  }

  const allGroups = groups.map(g => ({ id: g.id, name: g.name, color: g.color, type: g.type }));

  const onSave = async (payload: any, groupIds: string[]) => {
    await updatePlanet(
      {
        ...planet,
        fullName: payload.fullName,
        jobTitle: payload.jobTitle,
        company: payload.company,
        phone: payload.phone,
        email: payload.email,
        howWeMet: payload.howWeMet,
        commonGround: payload.commonGround,
        emoji: payload.emoji,
        notes: payload.notes ?? [],
      },
      groupIds
    );
    toast.success('Cambios guardados');
  };

  const onDelete = async () => {
    await deletePlanet(planet.id);
    toast.success('Planeta eliminado');
    router.back();
  };

  return (
    <Screen scroll>
      <PlanetDetailCard
        planet={{
          id: planet.id,
          fullName: planet.fullName,
          jobTitle: planet.jobTitle,
          company: planet.company,
          phone: planet.phone,
          email: planet.email,
          howWeMet: planet.howWeMet,
          commonGround: planet.commonGround,
          emoji: planet.emoji ?? '🪐',
          notes: planet.notes ?? [],
          groups: pGroups.map(g => ({ id: g.id, name: g.name, color: g.color, type: g.type }))
        }}
        allGroups={allGroups}
        onSave={onSave}
        onDelete={onDelete}
      />

      {/* (Opcional) encabezado simple fuera de la card */}
      <View style={{ marginTop: S.sm }}>
        <Text style={[T.p, { color: Colors.textDim }]}>
          Última actualización: {new Date(planet.updatedAt ?? Date.now()).toLocaleDateString()}
        </Text>
      </View>
    </Screen>
  );
}