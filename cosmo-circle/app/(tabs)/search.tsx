// app/(tabs)/search.tsx
import React, { useState } from 'react';
import { View, Text } from 'react-native';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { S } from '../../src/theme/spacing';
import { T } from '../../src/theme/typography';
import { useDB } from '../../src/store/useDB';
import { SearchBar } from '../../src/components/SearchBar';
import { useRouter } from 'expo-router';
import PlanetCard, { PlanetCardGroup } from '../../src/components/PlanetCard';
import SwipeRow from '../../src/components/SwipeRow';

export default function SearchScreen() {
  const [q, setQ] = useState('');
  const search = useDB(s => s.search);
  const groups = useDB(s => s.groups);
  const [res, setRes] = useState<{planets:any[], groups:any[]}>({ planets:[], groups:[] });
  const router = useRouter();

  const onSearch = async (text: string) => {
    setQ(text);
    if (text.trim().length) setRes(await search(text));
    else setRes({ planets:[], groups:[] });
  };

  return (
    <Screen scroll>
      <Text style={[T.h1, { color: Colors.text }]}>Buscar</Text>
      <View style={{ height: S.sm }} />
      <SearchBar value={q} onChange={onSearch} placeholder='BMW, amigos, UX...' />

      {!!res.planets.length && <>
        <Text style={[T.h3, { color: Colors.cyan, marginVertical: S.sm }]}>Personas</Text>

        {res.planets.map((p, idx) => {
          // chips de grupos
          const planetGroups: PlanetCardGroup[] = (p.groupIds ?? [])
            .map((gid: string) => groups.find(g => g.id === gid))
            .filter(Boolean)
            .map((g: any) => ({ id: g.id, name: g.name, color: g.color }));

          // notas
          let notesCount = 0;
          try {
            const n = Array.isArray(p.notes) ? p.notes : JSON.parse(p.notes ?? '[]');
            if (Array.isArray(n)) notesCount = n.length;
          } catch {}

          return (
            <SwipeRow key={p.id} onDelete={()=>{}} style={{ flex: 1 }}>
              <PlanetCard
                id={p.id}
                index={idx}
                name={p.fullName}
                company={p.company}
                notesCount={notesCount}
                emoji={p.emoji}
                groups={planetGroups}
                onPress={(pid)=>router.push(`/planet/${pid}`)}
                onView={(pid)=>router.push(`/planet/${pid}`)}
                onEdit={(pid)=>router.push({ pathname:'/planet/[id]', params:{ id: pid, edit: '1' } })}
                onDelete={()=>{}}
              />
            </SwipeRow>
          );
        })}
      </>}

      {!!res.groups.length && <>
        <Text style={[T.h3, { color: Colors.text, marginVertical: S.sm }]}>Grupos</Text>
        {res.groups.map(g => (
          <SwipeRow key={g.id} onDelete={()=>{}}>
            <PlanetCard
              id={g.id}
              name={g.name}
              company={g.parentId ? 'Sistema' : 'Galaxia'}
              groups={[]}
              onPress={() => router.push(g.parentId ? `/system/${g.id}` : `/galaxy/${g.id}`)}
            />
          </SwipeRow>
        ))}
      </>}
    </Screen>
  );
}