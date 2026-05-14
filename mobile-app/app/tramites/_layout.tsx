import { Stack } from 'expo-router';

export default function TramitesLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#2563eb',
        headerTitleStyle: { fontWeight: '600', color: '#111827' },
        headerShadowVisible: false,
        headerBackTitle: 'Atrás',
      }}
    >
      <Stack.Screen
        name="nuevo"
        options={{ title: 'Nuevo Trámite' }}
      />
      <Stack.Screen
        name="[id]"
        options={{ title: 'Detalle del Trámite' }}
      />
      <Stack.Screen
        name="consulta"
        options={{ title: 'Consultar Trámite' }}
      />
    </Stack>
  );
}
