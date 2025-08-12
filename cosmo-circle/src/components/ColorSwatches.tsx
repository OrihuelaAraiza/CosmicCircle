import React from 'react';
import { View, Pressable } from 'react-native';

const PALETTE = ['#22D3EE','#60A5FA','#A78BFA','#F472B6','#F59E0B','#34D399','#F43F5E','#EAB308'];

export default function ColorSwatches({
  value, onChange
}: { value?: string | null; onChange: (hex: string) => void }) {
  return (
    <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10 }}>
      {PALETTE.map(c => (
        <Pressable
          key={c}
          onPress={()=>onChange(c)}
          style={{ width:28, height:28, borderRadius:14, backgroundColor:c, borderWidth: value===c ? 3 : 0, borderColor:'#fff' }}
        />
      ))}
    </View>
  );
}