import { Tabs } from 'expo-router';

export default function AdminLayout() {
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
          paddingBottom: 8,
          height: 68,
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
