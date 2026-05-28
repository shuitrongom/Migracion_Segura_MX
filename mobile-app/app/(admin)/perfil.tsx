import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { ADMIN_PANEL_URL, WHATSAPP_URL } from '@/lib/config';

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
          await storage.deleteItem('refresh_token');
          await storage.deleteItem('user_data');
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(user?.fullName || user?.email || '?').charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.name}>{user?.fullName || 'Administrador'}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>🔑 Administrador</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Panel de gestión</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(ADMIN_PANEL_URL)}>
          <Text style={styles.menuText}>💻 Abrir panel web completo</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/financiero`)}>
          <Text style={styles.menuText}>💰 Módulo financiero</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/reportes`)}>
          <Text style={styles.menuText}>📊 Reportes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/configuracion`)}>
          <Text style={styles.menuText}>⚙️ Configuración</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Comunicación</Text>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(WHATSAPP_URL)}>
          <Text style={styles.menuText}>💬 WhatsApp de la empresa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/notificaciones`)}>
          <Text style={styles.menuText}>🔔 Notificaciones</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/soporte`)}>
          <Text style={styles.menuText}>🎫 Tickets de soporte</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Seguridad</Text>
        <View style={styles.securityInfo}>
          <Text style={styles.securityItem}>✅ Sesión segura (tokens 15 min)</Text>
          <Text style={styles.securityItem}>✅ Refresh automático (4h)</Text>
          <Text style={styles.securityItem}>✅ Cifrado de documentos</Text>
          <Text style={styles.securityItem}>✅ Historial de pagos inmutable</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutText}>Cerrar sesión</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Migración Segura MX v0.1.0 · Admin</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8', padding: 16 },
  profileCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#3D2B1F', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#C4A265', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#2C1810' },
  email: { fontSize: 14, color: '#6B5B4F' },
  roleBadge: { backgroundColor: '#F5F0E8', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  roleText: { fontSize: 13, fontWeight: '600', color: '#C4A265' },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#8B7B6F', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 },
  menuItem: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.02, shadowRadius: 2, elevation: 1 },
  menuText: { fontSize: 15, color: '#2C1810', fontWeight: '500' },

  securityInfo: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, gap: 6 },
  securityItem: { fontSize: 13, color: '#6B5B4F' },

  logoutButton: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: '#E74C3C', marginTop: 8 },
  logoutText: { color: '#E74C3C', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', color: '#8B7B6F', fontSize: 12, marginTop: 16, marginBottom: 40 },
});
