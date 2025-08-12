import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Toast from 'react-native-toast-message';

import { useFonts, SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold } from '@expo-google-fonts/space-grotesk';
import { Colors } from '../src/theme/colors';
import { createSchema } from '../src/db/schema';
import { seedIfEmpty } from '../src/db/seed';
import { useDB } from '../src/store/useDB';
import { View, ActivityIndicator } from 'react-native';

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_400Regular, SpaceGrotesk_600SemiBold, SpaceGrotesk_700Bold
  });

  const loadAll = useDB(s => s.loadAll);
  const ready = useDB(s => s.ready);

  useEffect(() => {
    (async () => {
      await createSchema();
      await seedIfEmpty();
      await loadAll();
    })();
  }, []);

  if (!fontsLoaded || !ready) {
    return (
      <View style={{flex:1, backgroundColor: Colors.bg, alignItems:'center', justifyContent:'center'}}>
        <ActivityIndicator color={Colors.cyan} />
      </View>
    );
  }

    return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          {/* Grupo de tabs con tus 4 ítems */}
          <Stack.Screen name="(tabs)" />

          {/* Rutas de detalle fuera del tab bar */}
          <Stack.Screen name="galaxy/[id]" />
          <Stack.Screen name="system/[id]" />
          <Stack.Screen name="planet/[id]" />

          {/* Archivos de plantilla ocultos */}
          <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
        </Stack>
        <Toast />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}