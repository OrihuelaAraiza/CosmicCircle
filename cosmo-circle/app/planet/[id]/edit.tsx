import React, { useEffect, useMemo, useState } from 'react';
import Screen from '../../../src/components/Screen';
import PlanetForm from '../../../src/components/PlanetForm';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useDB } from '../../../src/store/useDB';
import { Colors } from '../../../src/theme/colors';
import { Text } from 'react-native';
import { toast } from '../../../src/utils/toast';

export default function EditPlanetScreen() {
  const { id } = useLocalSearchParams<{id:string}>();
  const router = useRouter();
  const planets = useDB(s => s.planets);
  const groups = useDB(s => s.groups);
  const updatePlanet = useDB(s => s.updatePlanet);
  const getGroupsByPlanet = useDB(s => s.getGroupsByPlanet);

  const p = useMemo(()=> planets.find(x => x.id===id), [id, planets]);
  const galaxies = useMemo(()=> groups.filter(g=>g.type==='galaxy'), [groups]);
  const systems = useMemo(()=> groups.filter(g=>g.type==='system'), [groups]);

  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  useEffect(()=>{ (async()=>{
    if (id) {
      const gs = await getGroupsByPlanet(id);
      setSelectedGroups(gs.map(g=>g.id));
    }
  })() }, [id]);

  if (!p) return <Screen><Text style={{color: Colors.text}}>Planeta no encontrado.</Text></Screen>;

  const onSubmit = async (values:any) => {
    await updatePlanet({ ...p, ...values, updatedAt: Date.now() }, selectedGroups);
    toast.success('Cambios guardados', values.fullName ?? p.fullName);
    router.back();
  };

  return (
    <Screen>
      <PlanetForm
        mode="edit"
        initial={p}
        galaxies={galaxies}
        systems={systems}
        selectedGroupIds={selectedGroups}
        onChangeGroups={setSelectedGroups}
        onSubmit={onSubmit}
      />
    </Screen>
  );
} 