// app/(tabs)/index.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList, Switch } from 'react-native';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { S } from '../../src/theme/spacing';
import { T } from '../../src/theme/typography';
import { useDB } from '../../src/store/useDB';
import { usePrefs } from '../../src/store/prefs';
import { GalaxyCard } from '../../src/components/GalaxyCard';
import DotsMenu from '../../src/components/DotsMenu';
import SwipeRow from '../../src/components/SwipeRow';
import { useRouter } from 'expo-router';
import PromptModal from '../../src/components/PromptModal';
import StyleModal from '../../src/components/StyleModal';
import { toast } from '../../src/utils/toast';

// 3D map
import GalaxyMap, { GalaxyNode } from '../../src/components/GalaxyMap';

export default function CosmosScreen() {
  const router = useRouter();
  const allGroups = useDB(s => s.groups);

  // 🔹 Trae TODAS las galaxias y ordénalas; no limits, no slice
  const galaxiesAll = useMemo(() => {
    return allGroups
      .filter(g => g.type === 'galaxy')
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0)); // o por nombre si prefieres
  }, [allGroups]);

  const variant = usePrefs(s => s.galaxyCardVariant);

  const deleteGroup = useDB(s => s.deleteGroup);
  const getGalaxyDeleteSummary = useDB(s => s.getGalaxyDeleteSummary);
  const renameGroup = useDB(s => s.renameGroup);
  const updateGroupStyle = useDB(s => s.updateGroupStyle);

  const [q, setQ] = useState('');
  const [isMap, setIsMap] = useState(false);

  // 🔹 Filtro sobre la lista completa
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return galaxiesAll;
    return galaxiesAll.filter(g => g.name.toLowerCase().includes(qq));
  }, [q, galaxiesAll]);

  // 🔹 Nodos para el mapa 3D
  const nodes: GalaxyNode[] = useMemo(() => {
    return filtered.map(g => {
      const systems = allGroups.filter(s => s.parentId === g.id);
      const size = 1.2 + Math.min(2.0, systems.length * 0.2);
      return {
        id: g.id,
        name: g.name,
        color: g.color ?? '#22d3ee',
        size,
      };
    });
  }, [filtered, allGroups]);

  // modales
  const [renameOpen, setRenameOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<{id:string; name:string} | null>(null);

  const [styleOpen, setStyleOpen] = useState(false);
  const [styleTarget, setStyleTarget] = useState<{id:string; color?:string|null; icon?:string|null} | null>(null);

  const askDeleteGalaxy = async (id: string, name: string) => {
    const sum = await getGalaxyDeleteSummary(id);
    await deleteGroup(id);
    toast.success('Galaxia eliminada', `${name} (sistemas: ${sum.systems}, vínculos: ${sum.links})`);
  };

  return (
    <Screen>
      {/* Header + toggle */}
      <View style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: S.sm }}>
        <Text style={[T.h1, { color: Colors.text }]}>CosmoCircle</Text>
        <View style={{ flexDirection:'row', alignItems:'center', gap: 8 }}>
          <Text style={{ color: Colors.textDim, fontWeight:'700' }}>Mapa 3D</Text>
          <Switch
            value={isMap}
            onValueChange={setIsMap}
            thumbColor="#0b1226"
            trackColor={{ false:'#263051', true: Colors.cyan }}
          />
        </View>
      </View>

      {/* Buscador */}
      <View style={{ backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: S.md }}>
        <TextInput
          placeholder="Buscar galaxias..."
          placeholderTextColor={Colors.textDim}
          value={q}
          onChangeText={setQ}
          style={{ color: Colors.text }}
        />
      </View>

      {/* Vista 3D o lista */}
      {isMap ? (
        <GalaxyMap
          nodes={nodes}
          onSelect={(id: string) => router.push(`/galaxy/${id}`)}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          numColumns={2}
          // 🔹 Asegura grid sólido
          columnWrapperStyle={{ gap: S.md }}
          contentContainerStyle={{ gap: S.md, paddingBottom: 160 }}
          initialNumToRender={20}
          windowSize={10}
          removeClippedSubviews={false}
          ListEmptyComponent={
            <Text style={{ color: Colors.textDim, paddingTop: S.md }}>
              No hay galaxias que coincidan con tu búsqueda.
            </Text>
          }
          renderItem={({ item }) => (
            // 🔹 Wrapper que respeta el ancho de columna
            <View style={{ flex: 1 }}>
              <SwipeRow onDelete={() => askDeleteGalaxy(item.id, item.name)}>
                <GalaxyCard
                  title={item.name}
                  color={item.color}
                  icon={item.icon}
                  variant={variant}
                  onPress={() => router.push(`/galaxy/${item.id}`)}
                  rightAccessory={
                    <DotsMenu
                      items={[
                        { label: 'Ver detalles', action: () => router.push(`/galaxy/${item.id}`) },
                        { label: 'Renombrar', action: () => { setRenameTarget({ id: item.id, name: item.name }); setRenameOpen(true); } },
                        { label: 'Editar estilo', action: () => { setStyleTarget({ id: item.id, color: item.color, icon: item.icon }); setStyleOpen(true); } },
                        { label: 'Eliminar', action: () => askDeleteGalaxy(item.id, item.name), destructive: true },
                      ]}
                    />
                  }
                />
              </SwipeRow>
            </View>
          )}
        />
      )}

      {/* Modal renombrar */}
      {renameTarget && (
        <PromptModal
          visible={renameOpen}
          title="Renombrar galaxia"
          placeholder="Nuevo nombre"
          initialValue={renameTarget.name}
          onCancel={()=>setRenameOpen(false)}
          onConfirm={async (val) => {
            const v = val.trim(); if (!v) { setRenameOpen(false); return; }
            await renameGroup(renameTarget.id, v);
            setRenameOpen(false);
            toast.success('Galaxia renombrada', v);
          }}
        />
      )}

      {/* Modal estilo */}
      {styleTarget && (
        <StyleModal
          visible={styleOpen}
          initialColor={styleTarget.color ?? undefined}
          initialIcon={styleTarget.icon ?? undefined}
          onCancel={()=>setStyleOpen(false)}
          onSave={async (c,i)=> {
            await updateGroupStyle(styleTarget.id, c ?? null, i ?? null);
            setStyleOpen(false);
            toast.success('Estilo actualizado');
          }}
        />
      )}
    </Screen>
  );
}