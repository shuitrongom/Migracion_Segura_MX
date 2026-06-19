import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { ADMIN_PANEL_URL, WHATSAPP_URL } from '@/lib/config';
import { useTheme } from '@/lib/theme';

export default function AdminPerfilScreen() {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';
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

  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : colors.bgCard;
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : colors.border;

  return (
    <View style={[{ flex: 1 }, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <Animated.ScrollView style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={[styles.profileCard, { backgroundColor: cardBg, borderColor: cardBorder }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.fullName || user?.email || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.fullName || 'Administrador'}</Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleText}>🔑 Administrador</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Panel de gestión</Text>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => Linking.openURL(ADMIN_PANEL_URL)}>
            <Text style={[styles.menuText, { color: colors.text }]}>💻 Abrir panel web completo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/financiero`)}>
            <Text style={[styles.menuText, { color: colors.text }]}>💰 Módulo financiero</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/reportes`)}>
            <Text style={[styles.menuText, { color: colors.text }]}>📊 Reportes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/configuracion`)}>
            <Text style={[styles.menuText, { color: colors.text }]}>⚙️ Configuración</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Comunicación</Text>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => Linking.openURL(WHATSAPP_URL)}>
            <Text style={[styles.menuText, { color: colors.text }]}>💬 WhatsApp de la empresa</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/notificaciones`)}>
            <Text style={[styles.menuText, { color: colors.text }]}>🔔 Notificaciones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/soporte`)}>
            <Text style={[styles.menuText, { color: colors.text }]}>🎫 Tickets de soporte</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Seguridad</Text>
          <View style={[styles.securityInfo, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.securityItem, { color: colors.textSecondary }]}>✅ Sesión segura (tokens 15 min)</Text>
            <Text style={[styles.securityItem, { color: colors.textSecondary }]}>✅ Refresh automático (4h)</Text>
            <Text style={[styles.securityItem, { color: colors.textSecondary }]}>✅ Cifrado de documentos</Text>
            <Text style={[styles.securityItem, { color: colors.textSecondary }]}>✅ Historial de pagos inmutable</Text>
          </View>
        </View>

        <TouchableOpacity style={[styles.logoutButton, { backgroundColor: cardBg }]} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textMuted }]}>Migración Segura MX v0.1.0 · Admin</Text>
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  profileCard: { borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, marginBottom: 16, borderWidth: 1 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#f59e0b', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14 },
  roleBadge: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, marginTop: 4 },
  roleText: { fontSize: 13, fontWeight: '600', color: '#f59e0b' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 13, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, paddingLeft: 4 },
  menuItem: { borderRadius: 12, padding: 14, marginBottom: 6, borderWidth: 1 },
  menuText: { fontSize: 15, fontWeight: '500' },
  securityInfo: { borderRadius: 12, padding: 14, gap: 6, borderWidth: 1 },
  securityItem: { fontSize: 13 },
  logoutButton: { borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(231,76,60,0.4)', marginTop: 8 },
  logoutText: { color: '#E74C3C', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 16, marginBottom: 40 },
});
