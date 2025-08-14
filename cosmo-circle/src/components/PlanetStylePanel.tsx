// src/components/PlanetStylePanel.tsx
import React, { useMemo, useState } from 'react';
import { Modal, View, Text, Pressable, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';
import { T } from '../theme/typography';
import type { PlanetStyle3D } from './Planet3D';

type Props = {
  visible: boolean;
  initial?: Partial<PlanetStyle3D>;
  onCancel: () => void;
  onSave: (style: PlanetStyle3D) => void;
};

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));

export default function PlanetStylePanel({ visible, initial, onCancel, onSave }: Props) {
  const [rings, setRings] = useState<number>(clamp(initial?.rings ?? 0, 0, 6));
  const [hue, setHue] = useState<number>(210);
  const [sat, setSat] = useState<number>(70);
  const [lit, setLit] = useState<number>(50);
  const [autoRotate, setAutoRotate] = useState<boolean>(initial?.autoRotate ?? true);
  const [intensity, setIntensity] = useState<number>(clamp(initial?.intensity ?? 1.1, 0.2, 2));
  const [noiseScale, setNoiseScale] = useState<number>(clamp(initial?.noiseScale ?? 4, 1, 8));
  const [octaves, setOctaves] = useState<number>(clamp(initial?.octaves ?? 3, 1, 6));

  const land = useMemo(() => `hsl(${hue} ${sat}% ${lit}%)`, [hue, sat, lit]);
  const ring = land;

  const save = () =>
    onSave({
      landColor: land,
      ringColor: ring,
      seaColor: initial?.seaColor ?? '#0b2845',
      orbitsColor: initial?.orbitsColor ?? '#7a86b9',
      rings,
      showOrbits: initial?.showOrbits ?? true,
      autoRotate,
      intensity,
      noiseScale,
      octaves,
    });

  return (
    <Modal animationType="slide" transparent visible={visible} onRequestClose={onCancel}>
      <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'flex-end' }}>
        <View
          style={{
            maxHeight: '82%',
            backgroundColor: Colors.surface,
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: S.lg,
          }}
        >
          <View style={{ paddingHorizontal: S.lg, paddingTop: S.lg }}>
            <Text style={[T.h3, { color: Colors.text }]}>Estilo del planeta</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingHorizontal: S.lg, gap: S.md }}>
            {/* Preview */}
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <View
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: 48,
                  overflow: 'hidden',
                  borderWidth: 1,
                  borderColor: '#ffffff22',
                }}
              >
                <LinearGradient
                  colors={[land, `hsl(${(hue + 40) % 360} ${sat}% ${Math.max(10, lit - 15)}%)`]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={{ flex: 1 }}
                />
              </View>
              {rings > 0 && (
                <Text style={{ color: Colors.textDim, marginTop: 6 }}>{rings} anillo(s)</Text>
              )}
            </View>

            <Field label="Tono (Hue)"><Slider value={hue} minimumValue={0} maximumValue={360} step={1} onValueChange={v => setHue(v)} /></Field>
            <Field label="Saturación"><Slider value={sat} minimumValue={0} maximumValue={100} step={1} onValueChange={v => setSat(v)} /></Field>
            <Field label="Luminosidad"><Slider value={lit} minimumValue={0} maximumValue={100} step={1} onValueChange={v => setLit(v)} /></Field>
            <Field label="Anillos"><Slider value={rings} minimumValue={0} maximumValue={6} step={1} onValueChange={v => setRings(v)} /></Field>
            <Field label="Intensidad de luz"><Slider value={intensity} minimumValue={0.2} maximumValue={2} step={0.05} onValueChange={v => setIntensity(v)} /></Field>
            <Field label="Escala de ruido (textura)"><Slider value={noiseScale} minimumValue={1} maximumValue={8} step={1} onValueChange={v => setNoiseScale(v)} /></Field>
            <Field label="Octavas de ruido"><Slider value={octaves} minimumValue={1} maximumValue={6} step={1} onValueChange={v => setOctaves(v)} /></Field>
            <Field label="Auto-rotación"><Slider value={autoRotate ? 1 : 0} minimumValue={0} maximumValue={1} step={1} onValueChange={v => setAutoRotate(!!v)} /></Field>

            <View style={{ height: S.sm }} />
          </ScrollView>

          {/* Actions */}
          <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: S.lg, marginTop: S.md }}>
            <Pressable onPress={onCancel} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.surface }}>
              <Text style={{ color: Colors.text, textAlign: 'center', fontWeight: '700' }}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={save} style={{ flex: 1, padding: 14, borderRadius: 12, backgroundColor: Colors.cyan }}>
              <Text style={{ color: '#000', textAlign: 'center', fontWeight: '800' }}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginTop: S.md }}>
      <Text style={{ color: '#9CA3AF', marginBottom: 6 }}>{label}</Text>
      {children}
    </View>
  );
}