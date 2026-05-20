import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 10) : insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#3D2B1F' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#C4A265',
        tabBarInactiveTintColor: '#8B7B6F',
        tabBarStyle: {
          backgroundColor: '#2C1810',
          borderTopWidth: 0,
          paddingTop: 6,
          paddingBottom: bottomPadding + 6,
          height: 60 + bottomPadding,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Panel', tabBarLabel: 'Inicio' }} />
      <Tabs.Screen name="tramites" options={{ title: 'Trámites', tabBarLabel: 'Trámites' }} />
      <Tabs.Screen name="extranjeros" options={{ title: 'Extranjeros', tabBarLabel: 'Clientes' }} />
      <Tabs.Screen name="citas" options={{ title: 'Citas', tabBarLabel: 'Citas' }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarLabel: 'Perfil' }} />
    </Tabs>
  );
}
