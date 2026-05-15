import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#8B5E3C',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#e5e7eb',
          paddingTop: 8,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Inicio' }}
      />
      <Tabs.Screen
        name="tramites"
        options={{ title: 'Trámites' }}
      />
      <Tabs.Screen
        name="documentos"
        options={{ title: 'Documentos' }}
      />
      <Tabs.Screen
        name="notificaciones"
        options={{ title: 'Avisos' }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil' }}
      />
    </Tabs>
  );
}
