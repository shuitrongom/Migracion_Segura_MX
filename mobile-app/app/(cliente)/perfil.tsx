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
          await storage.deleteItem('welcome_popup_shown');
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      '⚠️ Eliminar cuenta',
      'Esta acción es PERMANENTE. Se eliminarán todos tus datos personales, documentos y trámites. No se puede deshacer.\n\n¿Estás seguro de que deseas eliminar tu cuenta?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sí, eliminar',
          style: 'destructive',
          onPress: () => {
            Alert.prompt
              ? Alert.prompt(
                  'Confirmar eliminación',
                  'Escribe "ELIMINAR MI CUENTA" para confirmar:',
                  async (text) => {
                    if (text !== 'ELIMINAR MI CUENTA') {
                      Alert.alert('Error', 'El texto no coincide. La cuenta NO fue eliminada.');
                      return;
                    }
                    try {
                      const res = await apiFetch('/auth/account/delete', {
                        method: 'POST',
                        body: JSON.stringify({ confirmacion: 'ELIMINAR MI CUENTA' }),
                      });
                      if (res.ok) {
                        await storage.deleteItem('access_token');
                        await storage.deleteItem('user_data');
                        Alert.alert('Cuenta eliminada', 'Tu cuenta y datos han sido eliminados.', [
                          { text: 'OK', onPress: () => router.replace('/(auth)/login') },
                        ]);
                      } else {
                        const err = await res.json().catch(() => ({}));
                        Alert.alert('Error', err.message || 'No se pudo eliminar la cuenta.');
                      }
                    } catch {
                      Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
                    }
                  },
                  'plain-text',
                )
              : // Android no tiene Alert.prompt, usar confirmación directa
                Alert.alert(
                  'Última confirmación',
                  '¿Realmente deseas ELIMINAR tu cuenta de forma permanente? Esta acción no se puede deshacer.',
                  [
                    { text: 'No, cancelar', style: 'cancel' },
                    {
                      text: 'Sí, eliminar permanentemente',
                      style: 'destructive',
                      onPress: async () => {
                        try {
                          const res = await apiFetch('/auth/account/delete', {
                            method: 'POST',
                            body: JSON.stringify({ confirmacion: 'ELIMINAR MI CUENTA' }),
                          });
                          if (res.ok) {
                            await storage.deleteItem('access_token');
                            await storage.deleteItem('user_data');
                            Alert.alert('Cuenta eliminada', 'Tu cuenta y datos han sido eliminados.', [
                              { text: 'OK', onPress: () => router.replace('/(auth)/login') },
                            ]);
                          } else {
                            const err = await res.json().catch(() => ({}));
                            Alert.alert('Error', err.message || 'No se pudo eliminar la cuenta.');
                          }
                        } catch {
                          Alert.alert('Error', 'Error de conexión. Intenta de nuevo.');
                        }
                      },
                    },
                  ],
                );
          },
        },
      ],
    );
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
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]} onPress={() => { const { Linking } = require('react-native'); Linking.openURL('https://migracionseguramx.com/terminos'); }}>
            <Text style={[styles.menuText, { color: colors.text }]}>📋 Términos y condiciones</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.menuItem, { borderBottomColor: colors.borderLight }]} onPress={() => { const { Linking } = require('react-native'); Linking.openURL('https://migracionseguramx.com/privacidad'); }}>
            <Text style={[styles.menuText, { color: colors.text }]}>🔒 Aviso de privacidad</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Eliminar mi cuenta</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textMuted }]}>Migración Segura MX v1.1.2</Text>
      </Animated.ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  profileCard: { backgroundColor: 'rgba(128,128,128,0.06)', borderRadius: 20, padding: 24, alignItems: 'center', gap: 8, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(128,128,128,0.12)' },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  avatarText: { color: '#f59e0b', fontSize: 28, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14 },
  menu: { backgroundColor: 'rgba(128,128,128,0.06)', borderRadius: 16, overflow: 'hidden', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(128,128,128,0.12)' },
  menuItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(128,128,128,0.1)' },
  menuText: { fontSize: 15, fontWeight: '500' },
  logoutButton: { backgroundColor: 'rgba(128,128,128,0.06)', borderRadius: 12, padding: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(231,76,60,0.4)' },
  logoutText: { color: '#E74C3C', fontSize: 15, fontWeight: '600' },
  deleteButton: { backgroundColor: 'rgba(128,128,128,0.03)', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 12, borderWidth: 1, borderColor: 'rgba(128,128,128,0.15)' },
  deleteText: { color: '#9CA3AF', fontSize: 13, fontWeight: '500' },
  version: { textAlign: 'center', fontSize: 12, marginTop: 20, marginBottom: 40 },
});
