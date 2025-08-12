import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '../theme/colors';
import { S } from '../theme/spacing';

export function PlanetListItem({ name, subtitle, onPress }:{
  name: string; subtitle?: string; onPress?: ()=>void;
}) {
  const initial = name.charAt(0).toUpperCase();
  return (
    <Pressable onPress={onPress} style={styles.row}>
      <View style={styles.avatar}><Text style={styles.initial}>{initial}</Text></View>
      <View style={{flex:1}}>
        <Text style={styles.name}>{name}</Text>
        {!!subtitle && <Text style={styles.sub}>{subtitle}</Text>}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection:'row', alignItems:'center',
    backgroundColor: Colors.surface, padding: S.md, borderRadius: 14, marginBottom: S.sm
  },
  avatar: {
    width:40,height:40,borderRadius:20, backgroundColor: Colors.magenta,
    alignItems:'center',justifyContent:'center', marginRight: S.md
  },
  initial: { color:'#000', fontWeight:'800' },
  name: { color: Colors.text, fontSize: 16, fontWeight:'700' },
  sub: { color: Colors.textDim, marginTop: 2 }
});