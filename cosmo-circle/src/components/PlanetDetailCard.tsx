import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, Animated, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';
import { T } from '../theme/typography';
import Planet3D from './Planet3D';
import Planet2D from './Planet2D';
import SegmentedControl from '@react-native-segmented-control/segmented-control';

export type MiniGroup = { id: string; name: string; color?: string | null; type?: 'galaxy' | 'system' };

export type PlanetDetail = {
  id: string;
  fullName: string;
  jobTitle?: string | null;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  howWeMet?: string | null;
  commonGround?: string | null;
  notes?: string[];
  emoji?: string | null;
  groups: MiniGroup[];
};

type Props = {
  planet: PlanetDetail;
  allGroups: MiniGroup[];
  onSave: (p: PlanetDetail, groupIds: string[]) => Promise<void>;
  onDelete?: () => void;
};

const Section = ({ icon, title, children }: { icon: any; title: string; children?: React.ReactNode }) => (
  <View style={{ marginTop: S.lg }}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
      <Ionicons name={icon} size={16} color={Colors.cyan} />
      <Text style={[T.h3, { color: Colors.cyan }]}>{title}</Text>
    </View>
    {children}
  </View>
);

const Chip = ({ label, color, selected, onPress, onRemove }:{
  label: string; color?: string | null; selected?: boolean;
  onPress?: () => void; onRemove?: () => void;
}) => (
  <Pressable
    onPress={onPress}
    style={[
      styles.chip,
      {
        backgroundColor: (color ?? '#24304f') + (selected ? '88' : '55'),
        borderColor: color ?? '#24304f',
        opacity: selected ? 1 : 0.9
      }
    ]}
  >
    <Text style={styles.chipText} numberOfLines={1}>{label}</Text>
    {!!onRemove && (
      <Pressable onPress={onRemove} hitSlop={8} style={styles.chipX}>
        <Ionicons name="close-circle" size={14} color="#ff7070" />
      </Pressable>
    )}
  </Pressable>
);

export default function PlanetDetailCard({ planet, allGroups, onSave, onDelete }: Props) {
  const [editing, setEditing] = useState(false);

  // estado editable
  const [fullName, setFullName] = useState(planet.fullName);
  const [jobTitle, setJobTitle] = useState(planet.jobTitle ?? '');
  const [company, setCompany] = useState(planet.company ?? '');
  const [phone, setPhone] = useState(planet.phone ?? '');
  const [email, setEmail] = useState(planet.email ?? '');
  const [howWeMet, setHowWeMet] = useState(planet.howWeMet ?? '');
  const [commonGround, setCommonGround] = useState(planet.commonGround ?? '');
  const [notes, setNotes] = useState<string[]>(planet.notes ?? []);
  const [emoji, setEmoji] = useState(planet.emoji ?? '🪐');
  const [groupIds, setGroupIds] = useState<string[]>(planet.groups.map(g => g.id));

  // viewer mode: '3d' | '2d' | 'off'
  const [viewer, setViewer] = useState<'3d' | '2d' | 'off'>('3d');

  // animación de modo edición
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: editing ? 1 : 0, duration: 220, useNativeDriver: false }).start();
  }, [editing]);

  const labelOpacity = a.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });
  const borderColor  = a.interpolate({ inputRange: [0, 1], outputRange: ['#202744', Colors.cyan] as any });

  const accent = useMemo(() => {
    const g = planet.groups.find(x => x.color);
    return g?.color ?? Colors.cyan;
  }, [planet.groups]);

  // datos visuales para lunas: 1 por grupo + 1 si hay notas
  const moons = useMemo(() => {
    const fromGroups = planet.groups.map(g => ({ color: g.color ?? '#9aa4c7' }));
    const extra = (planet.notes && planet.notes.length) ? [{ color: '#ffd166' }] : [];
    // cap opcional, pero puedes dejar todas
    return [...fromGroups, ...extra].map((m, i) => ({ ...m, radius: 1.6 + i * 0.35 }));
  }, [planet.groups, planet.notes]);

  const selectedGroups = useMemo(
    () => groupIds.map(id => allGroups.find(g => g.id === id)).filter(Boolean) as MiniGroup[],
    [groupIds, allGroups]
  );

  const toggleGroup = (id: string) =>
    setGroupIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  const removeGroup = (id: string) => setGroupIds(prev => prev.filter(x => x !== id));

  const save = async () => {
    const payload: PlanetDetail = {
      ...planet,
      fullName: fullName.trim() || '(Sin nombre)',
      jobTitle: jobTitle || null,
      company: company || null,
      phone: phone || null,
      email: email || null,
      howWeMet: howWeMet || null,
      commonGround: commonGround || null,
      emoji,
      notes,
      groups: selectedGroups
    };
    await onSave(payload, groupIds);
    setEditing(false);
  };

  // UI del viewer (selector simple)
  const ViewerSelector = (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center', marginBottom: 8 }}>
      <Pressable onPress={() => setViewer('3d')} style={[styles.seg, viewer === '3d' && styles.segActive]}>
        <Text style={[styles.segText, viewer === '3d' && styles.segTextActive]}>3D</Text>
      </Pressable>
      <Pressable onPress={() => setViewer('2d')} style={[styles.seg, viewer === '2d' && styles.segActive]}>
        <Text style={[styles.segText, viewer === '2d' && styles.segTextActive]}>2D</Text>
      </Pressable>
      <Pressable onPress={() => setViewer('off')} style={[styles.seg, viewer === 'off' && styles.segActive]}>
        <Text style={[styles.segText, viewer === 'off' && styles.segTextActive]}>Off</Text>
      </Pressable>
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        {/* Viewer */}
        <View style={{ marginBottom: S.md }}>
          {ViewerSelector}
          {viewer === '3d' && <Planet3D baseColor={accent} moons={moons} height={260} autoRotate intensity={1} />}
          {viewer === '2d' && <Planet2D baseColor={accent} moons={moons} height={220} />}
        </View>

        {/* Cabecera (editable) */}
        <View style={[styles.card, { borderColor: accent }]}>
          <View style={styles.header}>
            <Pressable
              onPress={() => editing && setEmoji(emoji === '🪐' ? '🛰️' : emoji === '🛰️' ? '🌎' : '🪐')}
              style={[styles.avatar, { borderColor: accent }]}
            >
              <Text style={styles.avatarText}>{emoji || '🪐'}</Text>
            </Pressable>

            <View style={{ flex: 1 }}>
              {!editing ? (
                <>
                  <Text style={[T.h1, { color: Colors.text }]} numberOfLines={2}>{fullName}</Text>
                  <Text style={[T.p, { color: Colors.textDim, marginTop: 4 }]}>
                    {[jobTitle, company].filter(Boolean).join(' @ ') || '—'}
                  </Text>
                </>
              ) : (
                <>
                  <TextInput
                    value={fullName}
                    onChangeText={setFullName}
                    placeholder="Nombre completo"
                    placeholderTextColor={Colors.textDim}
                    style={[styles.inputBig]}
                  />
                  <View style={{ flexDirection:'row', gap: 8 }}>
                    <TextInput
                      value={jobTitle}
                      onChangeText={setJobTitle}
                      placeholder="Puesto"
                      placeholderTextColor={Colors.textDim}
                      style={[styles.input, { flex: 1 }]}
                    />
                    <TextInput
                      value={company}
                      onChangeText={setCompany}
                      placeholder="Empresa"
                      placeholderTextColor={Colors.textDim}
                      style={[styles.input, { flex: 1 }]}
                    />
                  </View>
                </>
              )}
            </View>

            {/* Toggle edición */}
            <Pressable onPress={() => setEditing(v => !v)} style={styles.editBtn}>
              <Ionicons name={editing ? 'checkmark' : 'create-outline'} size={18} color="#000" />
            </Pressable>
          </View>

          {/* Separador */}
          <Animated.View style={[styles.sep, { borderColor }]} />

          {/* Grupos */}
          <Section icon="layers-outline" title="Grupos">
            <View style={styles.chipsRow}>
              {selectedGroups.map(g => (
                <Chip
                  key={g.id}
                  label={g.name}
                  color={g.color}
                  selected
                  onRemove={editing ? () => removeGroup(g.id) : undefined}
                />
              ))}
            </View>

            {editing && (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 6 }}>
                {allGroups.map(g => (
                  <Chip
                    key={g.id}
                    label={g.name}
                    color={g.color}
                    selected={groupIds.includes(g.id)}
                    onPress={() => toggleGroup(g.id)}
                  />
                ))}
              </ScrollView>
            )}
          </Section>

          {/* Contacto */}
          <Section icon="call-outline" title="Contacto">
            {!editing ? (
              <View style={{ gap: 6 }}>
                <Row icon="call-outline" label={phone || '—'} />
                <Row icon="mail-outline" label={email || '—'} />
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <TextInput value={phone} onChangeText={setPhone} placeholder="Teléfono"
                  placeholderTextColor={Colors.textDim} keyboardType="phone-pad" style={styles.input}/>
                <TextInput value={email} onChangeText={setEmail} placeholder="Email"
                  placeholderTextColor={Colors.textDim} keyboardType="email-address" style={styles.input}/>
              </View>
            )}
          </Section>

          {/* Relación */}
          <Section icon="sparkles-outline" title="Relación">
            {!editing ? (
              <View style={{ gap: 6 }}>
                <Row icon="hand-left-outline" label={howWeMet || 'Cómo nos conocimos: —'} />
                <Row icon="people-outline" label={commonGround || 'En común: —'} />
              </View>
            ) : (
              <View style={{ gap: 8 }}>
                <TextInput
                  value={howWeMet} onChangeText={setHowWeMet}
                  placeholder="Cómo nos conocimos…"
                  placeholderTextColor={Colors.textDim} style={styles.input}
                />
                <TextInput
                  value={commonGround} onChangeText={setCommonGround}
                  placeholder="Qué tenemos en común…"
                  placeholderTextColor={Colors.textDim} style={styles.input}
                />
              </View>
            )}
          </Section>

          {/* Notas */}
          <Section icon="document-text-outline" title="Notas">
            {!editing ? (
              (notes?.length ? notes : ['—']).map((n, i) => (
                <View key={i} style={styles.noteRow}>
                  <View style={styles.bullet}/>
                  <Text style={{ color: Colors.text }}>{n}</Text>
                </View>
              ))
            ) : (
              <EditableNotes notes={notes} onChange={setNotes} />
            )}
          </Section>

          {/* Botonera acción */}
          {editing ? (
            <View style={{ flexDirection: 'row', gap: 12, marginTop: S.lg }}>
              <Pressable onPress={() => setEditing(false)} style={[styles.btn, { backgroundColor: Colors.surface }]}>
                <Text style={[styles.btnText, { color: Colors.text }]}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={save} style={[styles.btn, { backgroundColor: Colors.cyan }]}>
                <Text style={styles.btnText}>Guardar</Text>
              </Pressable>
            </View>
          ) : !!onDelete && (
            <Pressable onPress={onDelete} style={[styles.btn, { backgroundColor: Colors.error || '#ff4444', marginTop: S.lg }]}>
              <Text style={styles.btnText}>Eliminar planeta</Text>
            </Pressable>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Row({ icon, label }: { icon: any; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
      <Ionicons name={icon} size={16} color={Colors.textDim} />
      <Text style={{ color: Colors.text }}>{label}</Text>
    </View>
  );
}

function EditableNotes({ notes, onChange }:{ notes: string[]; onChange: (n: string[]) => void }) {
  const [value, setValue] = useState('');
  const add = () => {
    const v = value.trim();
    if (!v) return;
    onChange([...(notes ?? []), v]);
    setValue('');
  };
  return (
    <View style={{ gap: 8 }}>
      {(notes ?? []).map((n, i) => (
        <View key={i} style={[styles.noteRow, { alignItems: 'center' }]}>
          <View style={styles.bullet}/>
          <Text style={{ color: Colors.text, flex: 1 }}>{n}</Text>
          <Pressable onPress={() => onChange(notes.filter((_, idx) => idx !== i))}>
            <Ionicons name="trash-outline" size={16} color="#ff7070" />
          </Pressable>
        </View>
      ))}
      <View style={{ flexDirection:'row', gap: 8 }}>
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder="Añadir nota…"
          placeholderTextColor={Colors.textDim}
          style={[styles.input, { flex:1 }]}
        />
        <Pressable onPress={add} style={[styles.btn, { backgroundColor: Colors.violet, paddingHorizontal: 14 }]}>
          <Ionicons name="add" size={18} color="#000" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    padding: S.lg,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  avatar: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.06)'
  },
  avatarText: { fontSize: 28, color: '#fff' },
  editBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: Colors.cyan, alignItems: 'center', justifyContent: 'center'
  },
  sep: { marginTop: S.md, borderTopWidth: 1, opacity: 0.7 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1,
  },
  chipText: { color: '#fff', fontWeight: '700', maxWidth: 180 },
  chipX: { marginLeft: 4 },
  input: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: '#202744', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, color: Colors.text
  },
  inputBig: {
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: '#202744', borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 12, color: Colors.text, fontSize: 18, fontWeight: '800', marginBottom: 8
  },
  noteRow: { flexDirection: 'row', gap: 8, paddingVertical: 4 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.cyan, marginTop: 8 },
  btn: { paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#000', fontWeight: '800' },
  seg: {
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#2a3356',
    backgroundColor: '#1a1f37'
  },
  segActive: { backgroundColor: Colors.cyan, borderColor: Colors.cyan },
  segText: { color: Colors.textDim, fontWeight: '700' },
  segTextActive: { color: '#000' },
});