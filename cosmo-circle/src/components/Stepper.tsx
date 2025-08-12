import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';

type Props = { steps: string[]; current: number; };
export default function Stepper({ steps, current }: Props) {
  return (
    <View style={styles.wrap}>
      {steps.map((label, i) => {
        const active = i <= current;
        return (
          <View key={i} style={styles.item}>
            <View style={[styles.dot, active && styles.dotActive]} />
            <Text style={[styles.text, active && styles.textActive]} numberOfLines={1}>
              {label}
            </Text>
            {i < steps.length - 1 && <View style={[styles.line, active && styles.lineActive]} />}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', marginBottom: S.md },
  item: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#2b3150' },
  dotActive: { backgroundColor: Colors.cyan },
  text: { color: '#6e78a5', marginLeft: 6, fontSize: 13, flexShrink: 1 },
  textActive: { color: Colors.text },
  line: { flex: 1, height: 2, backgroundColor: '#1c223d', marginHorizontal: 8, borderRadius: 2 },
  lineActive: { backgroundColor: Colors.cyan }
});