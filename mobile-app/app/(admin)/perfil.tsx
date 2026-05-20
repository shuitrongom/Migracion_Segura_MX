import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';

export default function AdminPerfilScreen() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    storage.getItem('user_data').then((d) => { if (d) setUser(JSON.parse(d)); });
  }, []);

  const handleLogout = () => {
    Alert.alert('Cerrar sesión', '¿Estás seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Salir', style: 'destructive',
        onPress: async () => {
          await storage.deleteItem('access_token');
          await storage.deleteItem('user_data');
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const openWeb = () => {
    Linking.openURL('https://migracion-segura-mx-admin-panel.vercel.app');
  };

  return (
    <View style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.fullName || user?.email || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName || 'Sin nombre'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role === 'administrador' ? '🔑 Administrador' : '📋 Gestor'}</Text>
        </View>
      </View>

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={openWeb}>
          <Text style={styles.menuText}>💻 Abrir panel web completo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>🔔 Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem}>
          <Text style={styles.menuText}>🔒 Cambiar contraseña</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8', padding: 20 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 20 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#3D2B1F', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#FFFFFF', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#2C1810' },
  email: { fontSize: 14, color: '#6B5B4F' },
  roleBadge: { backgroundColor: '#F5F0E8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  roleText: { fontSize: 13, fontWeight: '600', color: '#C4A265' },
  menu: { backgroundColor: '#FFFFFF', borderRadius: 12, overflow: 'hidden', marginBottom: 20 },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#F5F0E8' },
  menuText: { fontSize: 15, color: '#2C1810', fontWeight: '500' },
  logoutButton: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E74C3C' },
  logoutText: { color: '#E74C3C', fontSize: 15, fontWeight: '600' },
});
