import React from 'react';
import { Platform, Pressable, ActionSheetIOS, Alert, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../theme/colors';

type Item = { label: string; action: () => void; destructive?: boolean; };

export default function DotsMenu({ items }: { items: Item[] }) {
  const onPress = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: [...items.map(i => i.label), 'Cancelar'],
          destructiveButtonIndex: items.findIndex(i => i.destructive),
          cancelButtonIndex: items.length
        },
        (btnIdx) => { if (btnIdx < items.length) items[btnIdx].action(); }
      );
    } else {
      // Android simple
      Alert.alert('Acciones', undefined, [
        ...items.map(i => ({ 
          text: i.label, 
          onPress: i.action, 
          style: i.destructive ? 'destructive' as const : 'default' as const 
        })),
        { text: 'Cancelar', style: 'cancel' as const }
      ]);
    }
  };

  return (
    <Pressable onPress={onPress} style={{ padding: 6 }}>
      <Ionicons name="ellipsis-horizontal" size={18} color={Colors.textDim} />
    </Pressable>
  );
} 