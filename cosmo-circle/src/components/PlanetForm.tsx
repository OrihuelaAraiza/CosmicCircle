import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, ScrollView, Pressable } from 'react-native';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';
import { T } from '../theme/typography';
import SelectableChip from './SelectableChip';
import type { Planet } from '../types/models';

type Props = {
  mode: 'create' | 'edit';
  initial?: Partial<Planet>;
  galaxies: { id:string; name:string }[];
  systems: { id:string; name:string }[];
  selectedGroupIds: string[];
  onChangeGroups: (ids: string[]) => void;
  onSubmit: (values: Required<Pick<Planet,'fullName'>> & Partial<Planet>) => void;
};

export default function PlanetForm({
  mode, initial, galaxies, systems, selectedGroupIds, onChangeGroups, onSubmit
}: Props) {
  const [fullName, setFullName] = useState(initial?.fullName ?? '');
  const [jobTitle, setJobTitle] = useState(initial?.jobTitle ?? '');
  const [company, setCompany] = useState(initial?.company ?? '');
  const [phone, setPhone] = useState(initial?.phone ?? '');
  const [email, setEmail] = useState(initial?.email ?? '');
  const [howWeMet, setHowWeMet] = useState(initial?.howWeMet ?? '');
  const [commonGround, setCommonGround] = useState(initial?.commonGround ?? '');
  const [notes, setNotes] = useState((initial?.notes ?? []).join('\n'));
  const [keywords, setKeywords] = useState((initial?.keywords ?? []).join(', '));
  const [socialsText, setSocialsText] = useState(
    (initial?.socials ?? []).map(s => `${s.type}:${s.url}`).join('\n')
  );

  const toggle = (id: string) =>
    onChangeGroups(selectedGroupIds.includes(id) ? selectedGroupIds.filter(x=>x!==id) : [...selectedGroupIds, id]);

  const submit = () => {
    if (!fullName.trim()) return;
    onSubmit({
      fullName: fullName.trim(),
      jobTitle: jobTitle.trim() || undefined,
      company: company.trim() || undefined,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      howWeMet: howWeMet.trim() || undefined,
      commonGround: commonGround.trim() || undefined,
      notes: notes.split('\n').map(s=>s.trim()).filter(Boolean),
      keywords: keywords.split(',').map(s=>s.trim()).filter(Boolean),
      socials: socialsText.split('\n').map(line=>{
        const [type, ...rest] = line.split(':');
        const url = rest.join(':').trim();
        return type && url ? { type: type.trim() as any, url } : null;
      }).filter(Boolean) as any
    });
  };

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
      <Text style={[T.h3, { color: Colors.cyan, marginTop: S.sm }]}>Datos básicos</Text>
      <Input placeholder="Nombre completo" value={fullName} onChangeText={setFullName} />
      <Input placeholder="Puesto" value={jobTitle} onChangeText={setJobTitle} />
      <Input placeholder="Empresa" value={company} onChangeText={setCompany} />
      <Input placeholder="Teléfono" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
      <Input placeholder="Email" value={email} onChangeText={setEmail} keyboardType="email-address" />

      <Text style={[T.h3, { color: Colors.cyan, marginTop: S.lg }]}>Relación</Text>
      <TextArea placeholder="Cómo nos conocimos" value={howWeMet} onChangeText={setHowWeMet} />
      <TextArea placeholder="Qué tenemos en común" value={commonGround} onChangeText={setCommonGround} />

      <Text style={[T.h3, { color: Colors.cyan, marginTop: S.lg }]}>Notas (una por línea)</Text>
      <TextArea placeholder="Ej. Le gusta la foto analógica" value={notes} onChangeText={setNotes} />

      <Text style={[T.h3, { color: Colors.cyan, marginTop: S.lg }]}>Keywords (separadas por coma)</Text>
      <Input placeholder="UX, IA, Figma" value={keywords} onChangeText={setKeywords} />

      <Text style={[T.h3, { color: Colors.cyan, marginTop: S.lg }]}>Redes (formato tipo:url por línea)</Text>
      <TextArea placeholder={'linkedin:https://...\ninstagram:https://...'} value={socialsText} onChangeText={setSocialsText} />

      <Text style={[T.h3, { color: Colors.text, marginTop: S.lg }]}>Asignar a Galaxias</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {galaxies.map(g => (
          <SelectableChip key={g.id} label={g.name} selected={selectedGroupIds.includes(g.id)} onPress={()=>toggle(g.id)} />
        ))}
      </ScrollView>

      <Text style={[T.h3, { color: Colors.text, marginTop: S.md }]}>Asignar a Sistemas</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 8 }}>
        {systems.map(s => (
          <SelectableChip key={s.id} label={s.name} selected={selectedGroupIds.includes(s.id)} onPress={()=>toggle(s.id)} />
        ))}
      </ScrollView>

      <Pressable onPress={submit} style={{ backgroundColor: Colors.violet, padding: 14, borderRadius: 12, marginTop: S.lg }}>
        <Text style={{ color:'#000', textAlign:'center', fontWeight:'800' }}>{mode==='create'?'Guardar Planeta':'Guardar cambios'}</Text>
      </Pressable>
    </ScrollView>
  );
}

function Input(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={Colors.textDim}
      style={{ color: Colors.text, backgroundColor: Colors.surface, padding: S.md, borderRadius: 12, marginTop: S.sm }}
    />
  );
}
function TextArea(props: any) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={Colors.textDim}
      style={{ color: Colors.text, backgroundColor: Colors.surface, padding: S.md, borderRadius: 12, marginTop: S.sm, minHeight: 90 }}
      multiline
      textAlignVertical="top"
    />
  );
} 