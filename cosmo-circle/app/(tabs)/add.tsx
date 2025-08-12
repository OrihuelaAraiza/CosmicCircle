// app/(tabs)/add.tsx
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, Alert, ScrollView } from 'react-native';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { S } from '../../src/theme/spacing';
import { T } from '../../src/theme/typography';
import { useDB } from '../../src/store/useDB';
import Stepper from '../../src/components/Stepper';
import SelectableChip from '../../src/components/SelectableChip';
import StyleModal from '../../src/components/StyleModal';

type Mode = 'planet' | 'group';

const stepsPlanet = ['Elegir', 'Datos', 'Grupos', 'Revisar'];
const stepsGroup  = ['Elegir', 'Nombre', 'Pertenece a', 'Revisar'];

export default function AddWizard() {
  const groups = useDB(s => s.groups);
  const createGroup = useDB(s => s.createGroup);
  const createPlanet = useDB(s => s.createPlanet);

  const galaxies = useMemo(() => groups.filter(g => g.type === 'galaxy'), [groups]);
  const systems  = useMemo(() => groups.filter(g => g.type === 'system'), [groups]);

  const [mode, setMode] = useState<Mode>('planet');
  const [step, setStep] = useState(0);

  // estado grupo
  const [gName, setGName] = useState('');
  const [gParent, setGParent] = useState<string | undefined>(undefined);
  const [gColor, setGColor] = useState<string | null>(null);
  const [gIcon, setGIcon] = useState<string | null>(null);
  const [styleOpen, setStyleOpen] = useState(false);

  // estado planeta
  const [pName, setPName] = useState('');
  const [pCompany, setPCompany] = useState('');
  const [pGroups, setPGroups] = useState<string[]>([]);

  const uuid = () => Math.random().toString(36).slice(2) + '-' + Date.now();

  const togglePG = (id: string) =>
    setPGroups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const onNext = () => {
    if (mode === 'planet') {
      if (step === 1 && !pName.trim()) return Alert.alert('Falta el nombre del planeta');
    } else {
      if (step === 1 && !gName.trim()) return Alert.alert('Falta el nombre del grupo');
    }
    setStep(s => Math.min(s + 1, 3));
  };
  const onBack = () => setStep(s => Math.max(s - 1, 0));

  const save = async () => {
    if (mode === 'planet') {
      const id = uuid();
      await createPlanet({
        id, fullName: pName.trim(),
        company: pCompany || undefined,
        createdAt: Date.now(), updatedAt: Date.now()
      } as any, pGroups);
      // reset
      setPName(''); setPCompany(''); setPGroups([]); setStep(0);
      Alert.alert('Listo', 'Planeta creado y asignado');
    } else {
      if (!gName.trim()) return Alert.alert('Nombre requerido');
      const id = uuid();
      await createGroup({
        id,
        name: gName.trim(),
        type: gParent ? 'system' : 'galaxy',
        parentId: gParent ?? null,
        color: gColor ?? null,
        icon: gIcon ?? null,
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
      // reset
      setGName('');
      setGParent(undefined);
      setGColor(null);
      setGIcon(null);
      setStep(0);
      Alert.alert('Listo', 'Grupo creado');
    }
  };

  const steps = mode === 'planet' ? stepsPlanet : stepsGroup;

  return (
    <Screen scroll>
      <Text style={[T.h1, { color: Colors.text }]}>Añadir</Text>
      <Stepper steps={steps} current={step} />

      {/* PASO 0 — Elegir qué crear */}
      {step === 0 && (
        <>
          <Text style={{ color: Colors.textDim, marginBottom: S.md }}>
            ¿Qué quieres crear?
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: S.lg }}>
            <CardSelect
              label="Planeta (persona)"
              active={mode === 'planet'}
              desc="Contacto con datos y notas"
              onPress={() => setMode('planet')}
            />
            <CardSelect
              label="Grupo (galaxia/sistema)"
              active={mode === 'group'}
              desc="Categorías para organizar"
              onPress={() => setMode('group')}
            />
          </View>
          <Primary label="Continuar" onPress={onNext} />
        </>
      )}

      {/* PASOS para PLANETA */}
      {mode === 'planet' && step === 1 && (
        <>
          <Text style={[T.h3, { color: Colors.cyan, marginTop: S.sm }]}>Datos del Planeta</Text>
          <TextInput
            placeholder="Nombre completo"
            placeholderTextColor={Colors.textDim}
            value={pName} onChangeText={setPName}
            style={input}
          />
          <TextInput
            placeholder="Empresa (opcional)"
            placeholderTextColor={Colors.textDim}
            value={pCompany} onChangeText={setPCompany}
            style={input}
          />
          <RowNav onBack={onBack} onNext={onNext} nextLabel="Elegir grupos" />
        </>
      )}

      {mode === 'planet' && step === 2 && (
        <>
          <Text style={[T.h3, { color: Colors.cyan, marginTop: S.sm }]}>Asignar a Galaxias</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }} contentContainerStyle={{ gap: 8 }}>
            {galaxies.length === 0 && <Text style={{ color: Colors.textDim }}>Crea una galaxia en el modo Grupo.</Text>}
            {galaxies.map(g => (
              <SelectableChip key={g.id} label={g.name} selected={pGroups.includes(g.id)} onPress={() => togglePG(g.id)} />
            ))}
          </ScrollView>

          <Text style={[T.h3, { color: Colors.cyan, marginTop: S.md }]}>Asignar a Sistemas</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }} contentContainerStyle={{ gap: 8 }}>
            {systems.length === 0 && <Text style={{ color: Colors.textDim }}>Crea sistemas dentro de una galaxia.</Text>}
            {systems.map(s => (
              <SelectableChip key={s.id} label={s.name} selected={pGroups.includes(s.id)} onPress={() => togglePG(s.id)} />
            ))}
          </ScrollView>

          <RowNav onBack={onBack} onNext={onNext} nextLabel="Revisar" />
        </>
      )}

      {mode === 'planet' && step === 3 && (
        <>
          <Text style={[T.h3, { color: Colors.cyan, marginTop: S.sm, marginBottom: 6 }]}>Revisión</Text>
          <ReviewRow k="Nombre" v={pName || '—'} />
          <ReviewRow k="Empresa" v={pCompany || '—'} />
          <ReviewRow
            k="Grupos"
            v={
              pGroups.length
                ? pGroups.map(id => groups.find(g => g.id === id)?.name ?? '—').join(', ')
                : '—'
            }
          />
          <RowNav onBack={onBack} onNext={save} nextLabel="Guardar Planeta" primary />
        </>
      )}

      {/* PASOS para GRUPO */}
      {mode === 'group' && step === 1 && (
        <>
          <Text style={[T.h3, { color: Colors.cyan, marginTop: S.sm }]}>Nombre del Grupo</Text>
          <TextInput
            placeholder="Ej. Universidad / Diseño"
            placeholderTextColor={Colors.textDim}
            value={gName} onChangeText={setGName}
            style={input}
          />
          <RowNav onBack={onBack} onNext={onNext} nextLabel="Pertenece a..." />
        </>
      )}

      {mode === 'group' && step === 2 && (
        <>
          <Text style={{ color: Colors.textDim, marginBottom: 8 }}>
            Deja “(ninguno)” para crear una <Text style={{color: Colors.cyan}}>Galaxia</Text>. Elige una galaxia para crear un <Text style={{color: Colors.cyan}}>Sistema</Text>.
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 8 }} contentContainerStyle={{ gap: 8 }}>
            <SelectableChip label="(ninguno)" selected={!gParent} onPress={() => setGParent(undefined)} />
            {galaxies.map(g => (
              <SelectableChip key={g.id} label={g.name} selected={gParent === g.id} onPress={() => setGParent(g.id)} />
            ))}
          </ScrollView>

          {/* Botón Estilo */}
          <Pressable
            onPress={()=>setStyleOpen(true)}
            style={{ backgroundColor: Colors.surface, borderRadius:12, padding:12, marginTop:8 }}
          >
            <Text style={{ color: Colors.text, fontWeight:'700' }}>Elegir color e ícono</Text>
            <Text style={{ color: Colors.textDim, marginTop:4 }}>
              {gColor ? `Color: ${gColor}` : 'Color no seleccionado'} · {gIcon ?? 'Ícono no seleccionado'}
            </Text>
          </Pressable>

          <RowNav onBack={onBack} onNext={onNext} nextLabel="Revisar" />

          {/* Modal de estilo */}
          {styleOpen && (
            <StyleModal
              visible={styleOpen}
              initialColor={gColor}
              initialIcon={gIcon}
              onCancel={()=>setStyleOpen(false)}
              onSave={(c,i)=>{ setGColor(c); setGIcon(i); setStyleOpen(false); }}
            />
          )}
        </>
      )}

      {mode === 'group' && step === 3 && (
        <>
          <Text style={[T.h3, { color: Colors.cyan, marginTop: S.sm, marginBottom: 6 }]}>Revisión</Text>
          <ReviewRow k="Nombre" v={gName || '—'} />
          <ReviewRow k="Tipo" v={gParent ? 'Sistema' : 'Galaxia'} />
          <ReviewRow k="Pertenece a" v={gParent ? (galaxies.find(x => x.id === gParent)?.name || '—') : '(ninguno)'} />
          <ReviewRow k="Color" v={gColor ?? '—'} />
          <ReviewRow k="Ícono" v={gIcon ?? '—'} />
          <RowNav onBack={onBack} onNext={save} nextLabel="Guardar Grupo" primary />
        </>
      )}
    </Screen>
  );
}

function CardSelect({ label, desc, active, onPress }:{
  label: string; desc: string; active?: boolean; onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={{
        flex: 1, minHeight: 92, borderRadius: 16, padding: 12,
        backgroundColor: active ? Colors.surface2 : Colors.surface,
        borderWidth: active ? 2 : 1, borderColor: active ? Colors.cyan : '#202744'
      }}
    >
      <Text style={{ color: Colors.text, fontWeight: '800', marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: Colors.textDim, fontSize: 13 }}>{desc}</Text>
    </Pressable>
  );
}

function Primary({ label, onPress }:{ label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ backgroundColor: Colors.violet, padding: 14, borderRadius: 12, marginTop: 10 }}>
      <Text style={{ color:'#000', textAlign:'center', fontWeight:'800' }}>{label}</Text>
    </Pressable>
  );
}

function RowNav({ onBack, onNext, nextLabel, primary }:{
  onBack: () => void; onNext: () => void; nextLabel: string; primary?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, marginTop: S.lg }}>
      <Pressable onPress={onBack} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.surface }}>
        <Text style={{ color: Colors.text, textAlign: 'center', fontWeight: '700' }}>Atrás</Text>
      </Pressable>
      <Pressable
        onPress={onNext}
        style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: primary ? Colors.violet : Colors.cyan }}
      >
        <Text style={{ color: '#000', textAlign: 'center', fontWeight: '800' }}>{nextLabel}</Text>
      </Pressable>
    </View>
  );
}

function ReviewRow({ k, v }:{ k: string; v: string; }) {
  return (
    <View style={{ backgroundColor: Colors.surface, padding: 12, borderRadius: 12, marginBottom: 8 }}>
      <Text style={{ color: Colors.textDim, fontSize: 12 }}>{k}</Text>
      <Text style={{ color: Colors.text, fontWeight: '700', marginTop: 4 }}>{v}</Text>
    </View>
  );
}

const input = {
  color: Colors.text,
  backgroundColor: Colors.surface,
  padding: S.md,
  borderRadius: 12,
  marginTop: S.sm
};