import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon, FileEditIcon, StatusIcon, SearchIcon, FolderIcon, UserIcon } from '@/components/TabIcons';

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
          paddingTop: 8,
          paddingBottom: bottomPadding + 6,
          height: 62 + bottomPadding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen
        name="mis-tramites"
        options={{
          tabBarLabel: 'Inicio',
          tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="tramite-nuevo"
        options={{
          tabBarLabel: 'Trámite',
          tabBarIcon: ({ color }) => <FileEditIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="estatus"
        options={{
          tabBarLabel: 'Estatus',
          tabBarIcon: ({ color }) => <StatusIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="consulta"
        options={{
          tabBarLabel: 'Consultar',
          tabBarIcon: ({ color }) => <SearchIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="documentos"
        options={{
          tabBarLabel: 'Docs',
          tabBarIcon: ({ color }) => <FolderIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color }) => <UserIcon color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="solicitud-nueva"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="mapa-inm"
        options={{ href: null }}
      />
      <Tabs.Screen
        name="chat"
        options={{ href: null }}
      />
    </Tabs>
  );
}
