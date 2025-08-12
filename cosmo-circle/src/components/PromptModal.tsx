import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TextInput, Pressable } from 'react-native';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';

type Props = {
  visible: boolean;
  title: string;
  placeholder?: string;
  initialValue?: string;
  onCancel: () => void;
  onConfirm: (value: string) => void;
};

export default function PromptModal({ visible, title, placeholder, initialValue, onCancel, onConfirm }: Props) {
  const [val, setVal] = useState(initialValue ?? '');
  useEffect(()=>{ setVal(initialValue ?? ''); }, [visible, initialValue]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center', padding: 24 }}>
        <View style={{ width:'100%', backgroundColor: Colors.surface, borderRadius: 16, padding: S.lg, gap: 12 }}>
          <Text style={{ color: Colors.text, fontWeight:'800', fontSize:18 }}>{title}</Text>
          <TextInput
            value={val}
            onChangeText={setVal}
            placeholder={placeholder}
            placeholderTextColor={Colors.textDim}
            style={{ color: Colors.text, backgroundColor: Colors.surface2, borderRadius: 12, padding: 12 }}
          />
          <View style={{ flexDirection:'row', gap:10 }}>
            <Pressable onPress={onCancel} style={{ flex:1, padding: 12, borderRadius: 12, backgroundColor: Colors.surface2 }}>
              <Text style={{ color: Colors.text, textAlign:'center', fontWeight:'700' }}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={()=>onConfirm(val)} style={{ flex:1, padding: 12, borderRadius: 12, backgroundColor: Colors.cyan }}>
              <Text style={{ color:'#000', textAlign:'center', fontWeight:'800' }}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}