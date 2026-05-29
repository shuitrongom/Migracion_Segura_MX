import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { ADMIN_PANEL_URL, WHATSAPP_URL } from '@/lib/config';

export default function AdminPerfilScreen() {
  const [user, setUser] = useState<any>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    storage.getItem('user_data').then((d) => { if (d) setUser(JSON.parse(d)); });
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
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
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={{ flex: 1 }}>
      <Animated.ScrollView style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
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
      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  profileCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#f59e0b', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  roleBadge: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  roleText: { fontSize: 13, fontWeight: '600', color: '#f59e0b' },

  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#ffffff', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 },
  menuItem: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  menuText: { fontSize: 15, color: '#ffffff', fontWeight: '500' },

  securityInfo: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, gap: 6, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  securityItem: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },

  logoutButton: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(231,76,60,0.4)', marginTop: 8 },
  logoutText: { color: '#E74C3C', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 16, marginBottom: 40 },
});
