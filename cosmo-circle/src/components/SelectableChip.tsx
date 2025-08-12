import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Colors } from '../theme/colors';

type Props = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
};

export default function SelectableChip({ label, selected, onPress }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: selected ? Colors.cyan : Colors.surface },
        { borderColor: selected ? Colors.cyan : Colors.textDim }
      ]}
    >
      <Text style={{ color: selected ? Colors.bg : Colors.text }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
});