import React from 'react';
import { Text, View } from 'react-native';

export const typeColors = {
  galaxy:  '#8B5CF6', // morado
  system:  '#60A5FA', // azul
  planet:  '#22D3EE', // cian
} as const;

export default function TypePill({ type }: { type: 'galaxy' | 'system' | 'planet' }) {
  const color = (typeColors as any)[type] ?? '#64748B';
  return (
    <View style={{ paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, backgroundColor: `${color}22`, borderWidth: 1, borderColor: `${color}88` }}>
      <Text style={{ color: '#fff', fontWeight: '700', fontSize: 12 }}>
        {type === 'galaxy' ? 'Galaxia' : type === 'system' ? 'Sistema' : 'Planeta'}
      </Text>
    </View>
  );
}