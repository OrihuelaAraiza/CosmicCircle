import React, { useMemo, useState } from 'react';
import Screen from '../../src/components/Screen';
import PlanetForm from '../../src/components/PlanetForm';
import { useRouter } from 'expo-router';
import { useDB } from '../../src/store/useDB';
import { toast } from '../../src/utils/toast';

export default function NewPlanetScreen() {
  const router = useRouter();
  const groups = useDB(s => s.groups);
  const createPlanet = useDB(s => s.createPlanet);

  const galaxies = useMemo(()=> groups.filter(g=>g.type==='galaxy'), [groups]);
  const systems = useMemo(()=> groups.filter(g=>g.type==='system'), [groups]);
  const [sel, setSel] = useState<string[]>([]);
  const uuid = () => Math.random().toString(36).slice(2) + '-' + Date.now();

  const onSubmit = async (values:any) => {
    const id = uuid();
    await createPlanet({ id, ...values, createdAt: Date.now(), updatedAt: Date.now() }, sel);
    toast.success('Planeta creado', values.fullName);
    router.replace(`/planet/${id}`);
  };

  return (
    <Screen>
      <PlanetForm
        mode="create"
        galaxies={galaxies}
        systems={systems}
        selectedGroupIds={sel}
        onChangeGroups={setSel}
        onSubmit={onSubmit}
      />
    </Screen>
  );
} 