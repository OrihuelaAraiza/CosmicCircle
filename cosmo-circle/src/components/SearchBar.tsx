import React from 'react';
import { View, TextInput, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';
import { Ionicons } from '@expo/vector-icons';

export function SearchBar({ value, onChange, placeholder='Buscar en el cosmos' }:{
  value: string; onChange: (t:string)=>void; placeholder?: string;
}) {
  return (
    <View style={styles.wrap}>
      <Ionicons name="search" size={20} color={Colors.textDim} />
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={Colors.textDim}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.glass,
    paddingHorizontal: S.md,
    paddingVertical: S.sm,
    borderRadius: 16,
    gap: S.sm,
    marginBottom: S.lg
  },
  input: { color: Colors.text, flex: 1, fontSize: 16 }
});