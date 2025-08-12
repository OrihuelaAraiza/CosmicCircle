// app/(tabs)/index.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, FlatList } from 'react-native';
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

export default function CosmosScreen() {
  const router = useRouter();
  const allGroups = useDB(s => s.groups);
  const galaxies = useMemo(() => allGroups.filter(g => g.type === 'galaxy'), [allGroups]);

  const variant = usePrefs(s => s.galaxyCardVariant);
  const fitMode = usePrefs(s => s.fitMode);

  const deleteGroup = useDB(s => s.deleteGroup);
  const getGalaxyDeleteSummary = useDB(s => s.getGalaxyDeleteSummary);
  const renameGroup = useDB(s => s.renameGroup);
  const updateGroupStyle = useDB(s => s.updateGroupStyle);

  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    if (!qq) return galaxies;
    return galaxies.filter(g => g.name.toLowerCase().includes(qq));
  }, [q, galaxies]);

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
      <Text style={[T.h1, { color: Colors.text, marginBottom: S.sm }]}>CosmoCircle</Text>

      <View style={{ backgroundColor: Colors.surface, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 10, marginBottom: S.md }}>
        <TextInput
          placeholder="Buscar en el cosmos"
          placeholderTextColor={Colors.textDim}
          value={q}
          onChangeText={setQ}
          style={{ color: Colors.text }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(it) => it.id}
        numColumns={2}
        // 🔑 Hace que ambas columnas estiren a la MISMA altura de su contenido
        columnWrapperStyle={{ gap: S.md, alignItems: 'stretch' }}
        contentContainerStyle={{ gap: S.md, paddingBottom: 160 }}
        renderItem={({ item }) => (
          // 🔑 Cada item ocupa una “columna” con flex:1
          <View style={{ flex: 1 }}>
            <SwipeRow onDelete={() => askDeleteGalaxy(item.id, item.name)} style={{ flex: 1 }}>
              <View style={{ flex: 1, marginBottom: S.md }}>
                <GalaxyCard
                  title={item.name}
                  color={item.color}
                  icon={item.icon}
                  variant={variant}
                  // fitMode ya no afecta porque GalaxyCard crece dinámicamente
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
              </View>
            </SwipeRow>
          </View>
        )}
      />

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