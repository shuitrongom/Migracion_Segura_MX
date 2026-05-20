import { Tabs } from 'expo-router';

export default function ClienteLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#2C1810',
        headerTitleStyle: { fontWeight: '600' },
        tabBarActiveTintColor: '#C4A265',
        tabBarInactiveTintColor: '#8B7B6F',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E8DFD3',
          paddingTop: 6,
          paddingBottom: 8,
          height: 68,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
      }}
    >
      <Tabs.Screen
        name="mis-tramites"
        options={{ title: 'Mis Trámites', tabBarLabel: 'Trámites' }}
      />
      <Tabs.Screen
        name="documentos"
        options={{ title: 'Documentos', tabBarLabel: 'Documentos' }}
      />
      <Tabs.Screen
        name="citas"
        options={{ title: 'Citas', tabBarLabel: 'Citas' }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarLabel: 'Perfil' }}
      />
    </Tabs>
  );
}
