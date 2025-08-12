import React from 'react';
import { View, Pressable, Text } from 'react-native';

const EMOJIS = ['🪐','🌌','✨','⭐️','☄️','🌟','🌠','🛰️','🧭','🧪','💡','📚'];

export default function IconPicker({
  value, onChange
}: { value?: string | null; onChange: (icon: string) => void }) {
  return (
    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10 }}>
      {EMOJIS.map(e => (
        <Pressable key={e} onPress={()=>onChange(e)} style={{ padding:8, borderRadius:10, backgroundColor: value===e ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
          <Text style={{ fontSize:20 }}>{e}</Text>
        </Pressable>
      ))}
    </View>
  );
}