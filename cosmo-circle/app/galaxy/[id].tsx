import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Alert, Pressable, FlatList, ListRenderItem } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { S } from '../../src/theme/spacing';
import { T } from '../../src/theme/typography';
import { useDB } from '../../src/store/useDB';
import PlanetCard, { PlanetCardGroup } from '../../src/components/PlanetCard';
import SwipeRow from '../../src/components/SwipeRow';
import DotsMenu from '../../src/components/DotsMenu';
import { toast } from '../../src/utils/toast';
import PromptModal from '../../src/components/PromptModal';
import Divider from '../../src/components/Divider';
import TypePill from '../../src/components/TypePill';

type PRow = any;

export default function GalaxyScreen() {
  const { id } = useLocalSearchParams<{id: string}>();
  const router = useRouter();

  const groups = useDB(s => s.groups);
  const deleteGroup = useDB(s => s.deleteGroup);
  const renameGroup = useDB(s => s.renameGroup);
  const getPlanetsInGalaxyDeep = useDB(s => s.getPlanetsInGalaxyDeep);
  const deletePlanet = useDB(s => s.deletePlanet);

  const galaxy = useMemo(() => groups.find(g => g.id === id), [groups, id]);
  const [systems, setSystems] = useState<any[]>([]);
  const [allPlanets, setAllPlanets] = useState<PRow[]>([]);
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{id:string; name:string} | null>(null);

  useEffect(() => {
    if (!id) return;
    setSystems(groups.filter(g => g.parentId === id));
    (async () => {
      const deep = await getPlanetsInGalaxyDeep(id);
      setAllPlanets(deep);
    })();
  }, [id, groups, getPlanetsInGalaxyDeep]);

  const onDeleteGalaxy = () => {
    Alert.alert(
      'Eliminar galaxia',
      'Se borrará esta galaxia y todos sus sistemas. Los planetas NO se eliminarán, pero se desvincularán de estos grupos. ¿Continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: async () => {
            await deleteGroup(id as string);
            router.back();
          }
        }
      ]
    );
  };

  if (!galaxy) {
    return (
      <Screen>
        <Text style={[T.h1, { color: Colors.text }]}>Galaxia no encontrada</Text>
      </Screen>
    );
  }

  const renderSystem = ({ item }: { item: any }) => {
    const askDeleteSystem = () => {
      Alert.alert(
        'Eliminar sistema',
        `Se borrará "${item.name}" y se desvincularán sus planetas.`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: 'Eliminar', style: 'destructive', onPress: async () => {
              await deleteGroup(item.id);
              toast.success('Sistema eliminado', item.name);
            }
          }
        ]
      );
    };
    return (
      <SwipeRow onDelete={askDeleteSystem}>
        <Pressable
          onPress={()=>router.push(`/system/${item.id}`)}
          style={{ backgroundColor: Colors.surface, padding: S.md, borderRadius: 12, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}
        >
          <Text style={{ color: Colors.text, fontWeight:'700' }}>{item.name}</Text>
          <DotsMenu items={[
            { label: 'Ver detalles', action: ()=>router.push(`/system/${item.id}`) },
            { label: 'Renombrar', action: () => { setRenameTarget({ id: item.id, name: item.name }); setRenameOpen(true); } },
            { label: 'Eliminar', action: askDeleteSystem, destructive: true },
          ]}/>
        </Pressable>
      </SwipeRow>
    );
  };

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
              setAllPlanets(prev => prev.filter(x => x.id !== item.id));
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
          onEditAvatar={(pid) => router.push({ pathname: '/planet/[id]', params: { id: pid, editAvatar: '1' } })}
        />
      </SwipeRow>
    );
  };

  return (
    <Screen scroll>
      <Text style={[T.h1, { color: Colors.text }]}>{galaxy.name}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: S.sm }}>
        <Text style={[T.p, { color: Colors.textDim }]}>Galaxia</Text>
        <TypePill type="galaxy" />
      </View>

      {!!systems.length && (
        <>
          <Divider />
          <Text style={[T.h3, { color: Colors.cyan, marginTop: S.sm, marginBottom: S.sm }]}>Sistemas</Text>
          <FlatList
            data={systems}
            keyExtractor={it => it.id}
            renderItem={renderSystem}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: S.sm }} />}
            contentContainerStyle={{ marginBottom: S.lg }}
          />
        </>
      )}

      {!!allPlanets.length && (
        <>
          <Divider />
          <Text style={[T.h3, { color: Colors.cyan, marginTop: S.sm, marginBottom: S.sm }]}>
            Todos los planetas de esta galaxia
          </Text>
          <FlatList
            data={allPlanets}
            keyExtractor={(it) => it.id}
            renderItem={renderPlanet}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: S.sm }} />}
            contentContainerStyle={{ paddingBottom: S.lg }}
          />
        </>
      )}

      {!systems.length && !allPlanets.length && (
        <>
          <Divider />
          <Text style={[T.p, { color: Colors.textDim, marginTop: S.lg }]}>
            Esta galaxia está vacía.
          </Text>
        </>
      )}

      <Pressable 
        onPress={onDeleteGalaxy} 
        style={{ marginTop: S.xl, padding: S.md, borderRadius: 12, backgroundColor: Colors.error || '#ff4444' }}
      >
        <Text style={{ color: '#000', textAlign: 'center', fontWeight: '800' }}>
          Eliminar Galaxia
        </Text>
      </Pressable>

      <PromptModal
        visible={renameOpen}
        title="Renombrar sistema"
        placeholder="Nuevo nombre"
        initialValue={renameTarget?.name ?? ''}
        onCancel={()=>setRenameOpen(false)}
        onConfirm={async (val) => {
          const v = val.trim();
          if (!v) { setRenameOpen(false); return; }
          await renameGroup(renameTarget!.id, v);
          toast.success('Sistema renombrado', v);
          setRenameOpen(false);
        }}
      />
    </Screen>
  );
}