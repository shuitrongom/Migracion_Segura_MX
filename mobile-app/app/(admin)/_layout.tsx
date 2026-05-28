import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { HomeIcon, FileEditIcon, UserIcon, SearchIcon } from '@/components/TabIcons';
import Svg, { Path, Circle, Rect } from 'react-native-svg';

function CalendarIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
      <Path d="M16 2v4M8 2v4M3 10h18" />
    </Svg>
  );
}

function UsersIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <Circle cx="9" cy="7" r="4" />
      <Path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </Svg>
  );
}

function ClipboardIcon({ color, size = 22 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
      <Rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </Svg>
  );
}

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
          paddingTop: 8,
          paddingBottom: bottomPadding + 6,
          height: 62 + bottomPadding,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 8,
        },
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', marginTop: 2 },
      }}
    >
      <Tabs.Screen name="dashboard" options={{ title: 'Panel', tabBarLabel: 'Inicio', tabBarIcon: ({ color }) => <HomeIcon color={color} size={22} /> }} />
      <Tabs.Screen name="tramites" options={{ title: 'Trámites', tabBarLabel: 'Trámites', tabBarIcon: ({ color }) => <ClipboardIcon color={color} size={22} /> }} />
      <Tabs.Screen name="extranjeros" options={{ title: 'Extranjeros', tabBarLabel: 'Clientes', tabBarIcon: ({ color }) => <UsersIcon color={color} size={22} /> }} />
      <Tabs.Screen name="citas" options={{ title: 'Citas', tabBarLabel: 'Citas', tabBarIcon: ({ color }) => <CalendarIcon color={color} size={22} /> }} />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', tabBarLabel: 'Perfil', tabBarIcon: ({ color }) => <UserIcon color={color} size={22} /> }} />
    </Tabs>
  );
}
