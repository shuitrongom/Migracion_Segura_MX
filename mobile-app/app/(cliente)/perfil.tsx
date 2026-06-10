import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, Linking, Switch, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { WHATSAPP_URL } from '@/lib/config';
import { isBiometricAvailable, isBiometricEnabled, setBiometricEnabled, getBiometricType } from '@/lib/biometrics';
import { useTheme } from '@/lib/theme';

export default function ClientePerfilScreen() {
  const [user, setUser] = useState<any>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricOn, setBiometricOn] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometría');
  const { colors, mode, toggle: toggleTheme } = useTheme();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    storage.getItem('user_data').then((d) => { if (d) setUser(JSON.parse(d)); });
    checkBiometrics();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const checkBiometrics = async () => {
    const available = await isBiometricAvailable();
    setBiometricAvailable(available);
    if (available) {
      const enabled = await isBiometricEnabled();
      setBiometricOn(enabled);
      const type = await getBiometricType();
      setBiometricLabel(type);
    }
  };

  const toggleBiometric = async (value: boolean) => {
    await setBiometricEnabled(value);
    setBiometricOn(value);
  };

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

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={{ flex: 1 }}>
      <Animated.ScrollView style={[styles.container, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]} contentContainerStyle={{ paddingTop: 56 }}>
        <View style={[styles.profileCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.accentLight, borderColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.accent }]}>{(user?.fullName || user?.email || '?').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={[styles.name, { color: colors.text }]}>{user?.fullName || 'Sin nombre'}</Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
        </View>

        <View style={[styles.menu, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
          {/* Theme Toggle */}
          <View style={[styles.menuItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.menuText, { color: colors.text }]}>{mode === 'dark' ? '🌙' : '☀️'} Modo {mode === 'dark' ? 'oscuro' : 'claro'}</Text>
            <Switch value={mode === 'light'} onValueChange={toggleTheme} trackColor={{ true: '#f59e0b', false: '#333' }} thumbColor="#FFFFFF" />
          </View>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]} onPress={() => Linking.openURL(WHATSAPP_URL)}>
            <Text style={[styles.menuText, { color: colors.text }]}>💬 Contactar asesor por WhatsApp</Text>
          </TouchableOpacity>
          {biometricAvailable && (
            <View style={[styles.menuItem, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.menuText, { color: colors.text }]}>🔒 Bloqueo con {biometricLabel}</Text>
              <Switch value={biometricOn} onValueChange={toggleBiometric} trackColor={{ true: '#f59e0b', false: '#333' }} thumbColor="#FFFFFF" />
            </View>
          )}
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.menuText, { color: colors.text }]}>🔔 Notificaciones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.menuText, { color: colors.text }]}>📋 Términos y condiciones</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textMuted }]}>Migración Segura MX v1.1.0</Text>
      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  profileCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#f59e0b', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  email: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  menu: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.04)' },
  menuText: { fontSize: 15, color: '#ffffff', fontWeight: '500' },
  logoutButton: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(231,76,60,0.4)' },
  logoutText: { color: '#E74C3C', fontSize: 15, fontWeight: '600' },
  version: { textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: 12, marginTop: 20, marginBottom: 40 },
});
