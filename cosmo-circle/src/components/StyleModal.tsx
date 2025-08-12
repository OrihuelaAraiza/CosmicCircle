import React, { useEffect, useState } from 'react';
import { Modal, View, Text, Pressable } from 'react-native';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';

const PALETTE = ['#22D3EE','#60A5FA','#A78BFA','#F472B6','#F59E0B','#34D399','#F43F5E','#EAB308'];
const EMOJIS  = ['🪐','🌌','✨','⭐️','☄️','🌟','🌠','🛰️','🧭','🧪','💡','📚'];

type Props = {
  visible: boolean;
  initialColor?: string | null;
  initialIcon?: string | null;
  onCancel: () => void;
  onSave: (color: string | null, icon: string | null) => void;
};

export default function StyleModal({ visible, initialColor, initialIcon, onCancel, onSave }: Props) {
  const [color, setColor] = useState<string | null>(initialColor ?? null);
  const [icon,  setIcon]  = useState<string | null>(initialIcon ?? null);

  useEffect(() => { setColor(initialColor ?? null); setIcon(initialIcon ?? null); }, [visible, initialColor, initialIcon]);

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={{ flex:1, backgroundColor:'rgba(0,0,0,0.45)', alignItems:'center', justifyContent:'center', padding:24 }}>
        <View style={{ width:'100%', backgroundColor: Colors.surface, borderRadius:16, padding:S.lg, gap:12 }}>
          <Text style={{ color: Colors.text, fontWeight:'800', fontSize:18 }}>Estilo del universo</Text>

          <Text style={{ color: Colors.text, marginTop:2, marginBottom:4 }}>Color</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10 }}>
            {PALETTE.map(c => (
              <Pressable key={c} onPress={()=>setColor(c)}
                style={{ width:28, height:28, borderRadius:14, backgroundColor:c, borderWidth: color===c?3:0, borderColor:'#fff' }}/>
            ))}
          </View>

          <Text style={{ color: Colors.text, marginTop:10, marginBottom:4 }}>Ícono</Text>
          <View style={{ flexDirection:'row', flexWrap:'wrap', gap:10 }}>
            {EMOJIS.map(e => (
              <Pressable key={e} onPress={()=>setIcon(e)}
                style={{ paddingVertical:6, paddingHorizontal:10, borderRadius:10, backgroundColor: icon===e ? 'rgba(255,255,255,0.15)' : 'transparent' }}>
                <Text style={{ fontSize:20 }}>{e}</Text>
              </Pressable>
            ))}
          </View>

          <View style={{ flexDirection:'row', gap:10, marginTop:12 }}>
            <Pressable onPress={onCancel} style={{ flex:1, padding:12, borderRadius:12, backgroundColor: Colors.surface2 }}>
              <Text style={{ color: Colors.text, textAlign:'center', fontWeight:'700' }}>Cancelar</Text>
            </Pressable>
            <Pressable onPress={()=>onSave(color, icon)} style={{ flex:1, padding:12, borderRadius:12, backgroundColor: Colors.cyan }}>
              <Text style={{ color:'#000', textAlign:'center', fontWeight:'800' }}>Guardar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}