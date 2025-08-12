import React, { useEffect, useMemo, useState } from 'react';
import { Text, Linking, Pressable, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { S } from '../../src/theme/spacing';
import { T } from '../../src/theme/typography';
import { useDB } from '../../src/store/useDB';
import { toast } from '../../src/utils/toast';

export default function PlanetScreen() {
  const { id } = useLocalSearchParams<{id:string}>();
  const router = useRouter();
  const planets = useDB(s => s.planets);
  const p = useMemo(()=> planets.find(x => x.id===id), [id, planets]);

  const getGroupsByPlanet = useDB(s => s.getGroupsByPlanet);
  const unlink = useDB(s => s.unlinkPlanetFromGroup);
  const [groups, setGroups] = useState<any[]>([]);

  useEffect(()=>{ (async()=> setGroups(id ? await getGroupsByPlanet(id) : []) )() }, [id, planets.length]);

  if (!p) return null;

  // helpers locales para normalizar arrays
  const toArray = (val: unknown) => {
    if (Array.isArray(val)) return val as any[];
    if (typeof val === 'string') {
      try { return JSON.parse(val) as any[]; } catch { return []; }
    }
    return [];
  };

  const socials: Array<{ type: string; url: string }> = toArray(p?.socials);
  const notesArr: string[] = toArray(p?.notes);

  return (
    <Screen>
      <Text style={[T.h1, { color: Colors.text }]}>{p.fullName}</Text>
      <Text style={{ color: Colors.textDim }}>{[p.jobTitle, p.company].filter(Boolean).join(' @ ') || '—'}</Text>

      {/* Acciones rápidas */}
      <View style={{ flexDirection:'row', gap: 10, marginTop: S.sm }}>
        {!!p.phone && <Action text="Llamar" onPress={() => Linking.openURL(`tel:${p.phone}`)} />}
        {!!p.email && <Action text="Email" onPress={() => Linking.openURL(`mailto:${p.email}`)} />}
        <Action text="Editar" onPress={() => router.push(`/planet/${p.id}/edit`)} />
      </View>

      {/* Redes */}
      {!!socials.length && (
        <>
          <Section title="Redes" />
          {socials.map((s, i) => (
            <Action key={i} text={s.type} onPress={() => Linking.openURL(s.url)} />
          ))}
        </>
      )}

      {/* Cómo nos conocimos / En común */}
      {!!p.howWeMet && <>
        <Section title="Cómo nos conocimos" />
        <Text style={{color: Colors.text}}>{p.howWeMet}</Text>
      </>}
      {!!p.commonGround && <>
        <Section title="En común" />
        <Text style={{color: Colors.text}}>{p.commonGround}</Text>
      </>}

      {/* Notas */}
      {!!notesArr.length && (
        <>
          <Section title="Notas" />
          {notesArr.map((n,i)=><Text key={i} style={{color: Colors.text}}>{`• ${n}`}</Text>)}
        </>
      )}

      {/* Grupos a los que pertenece */}
      <Section title="Grupos" />
      <View style={{ flexDirection:'row', flexWrap:'wrap', gap: 8 }}>
        {groups.map(g => (
          <View key={g.id} style={{ flexDirection:'row', alignItems:'center', gap:6, backgroundColor: Colors.surface, paddingVertical:6, paddingHorizontal:10, borderRadius: 16 }}>
            <Text style={{ color: Colors.text }}>{g.name}</Text>
            <Pressable
              onPress={async ()=>{ await unlink(p.id, g.id); setGroups(await getGroupsByPlanet(p.id)); toast.success('Quitado de grupo', g.name); }}
              style={{ width:18, height:18, borderRadius:9, backgroundColor: Colors.error, alignItems:'center', justifyContent:'center' }}
            >
              <Text style={{ color:'#000', fontWeight:'900', marginTop:-1 }}>×</Text>
            </Pressable>
          </View>
        ))}
        {!groups.length && <Text style={{color: Colors.textDim}}>Sin grupos asignados.</Text>}
      </View>
    </Screen>
  );
}

function Section({title}:{title:string}) {
  return <Text style={[T.h3, {color: Colors.cyan, marginTop: S.lg, marginBottom: 6}]}>{title}</Text>;
}
function Action({text, onPress}:{text:string; onPress:()=>void}) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: Colors.surface, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 12 }}>
      <Text style={{color: Colors.text, fontWeight:'700'}}>{text}</Text>
    </Pressable>
  );
}