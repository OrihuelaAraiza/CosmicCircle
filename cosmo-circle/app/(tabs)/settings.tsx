import React from 'react';
import { View, Text } from 'react-native';
import Screen from '../../src/components/Screen';
import { Colors } from '../../src/theme/colors';
import { T } from '../../src/theme/typography';
import { S } from '../../src/theme/spacing';
import { usePrefs } from '../../src/store/prefs';
import SelectableChip from '../../src/components/SelectableChip';

export default function SettingsScreen() {
  const variant = usePrefs(s => s.galaxyCardVariant);
  const fitMode = usePrefs(s => s.fitMode);
  const setVariant = usePrefs(s => s.setVariant);
  const setFitMode = usePrefs(s => s.setFitMode);

  return (
    <Screen>
      <Text style={[T.h1, { color: Colors.text }]}>Ajustes</Text>

      <Text style={[T.h3, { color: Colors.cyan, marginTop: S.lg }]}>Diseño de universos</Text>
      <View style={{ flexDirection:'row', gap: 8, marginTop: 8, flexWrap:'wrap' }}>
        <SelectableChip label="Órbita"   selected={variant==='orbit'}   onPress={()=>setVariant('orbit')} />
        <SelectableChip label="Tile"     selected={variant==='tile'}    onPress={()=>setVariant('tile')} />
        <SelectableChip label="Minimal"  selected={variant==='minimal'} onPress={()=>setVariant('minimal')} />
      </View>

      <Text style={[T.h3, { color: Colors.cyan, marginTop: S.lg }]}>Ajuste del nombre</Text>
      <View style={{ flexDirection:'row', gap: 8, marginTop: 8 }}>
        <SelectableChip label="2 líneas"        selected={fitMode==='wrap2'}  onPress={()=>setFitMode('wrap2')} />
        <SelectableChip label="Encoger 1 línea" selected={fitMode==='shrink1'} onPress={()=>setFitMode('shrink1')} />
      </View>
    </Screen>
  );
}