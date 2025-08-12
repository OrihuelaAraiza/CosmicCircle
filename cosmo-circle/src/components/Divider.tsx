import React from 'react';
import { View } from 'react-native';

export default function Divider({ height = 12, alpha = 0.12 }: { height?: number; alpha?: number }) {
  return (
    <View
      style={{
        height,
        width: '100%',
        backgroundColor: `rgba(255,255,255,${alpha})`,
        borderRadius: 999,
        opacity: 0.12,
        marginVertical: 8,
      }}
    />
  );
}