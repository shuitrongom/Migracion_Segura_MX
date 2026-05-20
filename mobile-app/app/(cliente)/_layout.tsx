import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ClienteLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#C4A265',
        tabBarInactiveTintColor: '#8B7B6F',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8DFD3',
          paddingTop: 6,
          paddingBottom: bottomPadding + 6,
          height: 60 + bottomPadding,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="mis-tramites" options={{ tabBarLabel: 'Inicio' }} />
      <Tabs.Screen name="tramite-nuevo" options={{ tabBarLabel: 'Trámite' }} />
      <Tabs.Screen name="consulta" options={{ tabBarLabel: 'Consultar' }} />
      <Tabs.Screen name="documentos" options={{ tabBarLabel: 'Docs' }} />
      <Tabs.Screen name="perfil" options={{ tabBarLabel: 'Perfil' }} />
    </Tabs>
  );
}
