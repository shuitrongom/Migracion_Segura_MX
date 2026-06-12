import { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { storage } from '@/lib/storage';

let LocalAuthentication: any = null;
try {
  LocalAuthentication = require('expo-local-authentication');
} catch {}

const LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos

interface BiometricLockProps {
  children: React.ReactNode;
}

export default function BiometricLock({ children }: BiometricLockProps) {
  const [locked, setLocked] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometría');
  const initialLoadRef = useRef(false);

  useEffect(() => {
    // Dar 3 segundos para que la app cargue antes de activar el bloqueo
    const timer = setTimeout(() => { initialLoadRef.current = true; }, 3000);

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active' && initialLoadRef.current) {
        checkLock();
      }
    });

    return () => { clearTimeout(timer); subscription.remove(); };
  }, []);

  const checkLock = async () => {
    try {
      if (!LocalAuthentication) return;

      // Solo bloquear si el usuario ACTIVÓ la biometría desde su perfil
      const biometricEnabled = await storage.getItem('biometric_enabled');
      if (biometricEnabled !== 'true') return;

      // Solo bloquear si el usuario está logueado
      const token = await storage.getItem('access_token');
      if (!token) return;

      // Verificar si biometría está disponible en el hardware
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) return;
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) return;

      // Verificar timeout — si se autenticó hace menos de 2 min, no pedir de nuevo
      const lastAuth = await storage.getItem('biometric_last_auth');
      if (lastAuth) {
        const elapsed = Date.now() - parseInt(lastAuth, 10);
        if (elapsed < LOCK_TIMEOUT_MS) return;
      }

      // Obtener tipo de biometría
      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      if (types.includes(2)) setBiometricType('Face ID');
      else if (types.includes(1)) setBiometricType('Huella digital');

      setLocked(true);
      // Intentar autenticación automática
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifica tu identidad',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar contraseña',
      });
      if (result.success) {
        await storage.setItem('biometric_last_auth', Date.now().toString());
        setLocked(false);
      }
    } catch {
      setLocked(false);
    }
  };

  const handleUnlock = async () => {
    try {
      if (!LocalAuthentication) { setLocked(false); return; }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verifica tu identidad',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar contraseña',
      });
      if (result.success) {
        await storage.setItem('biometric_last_auth', Date.now().toString());
        setLocked(false);
      }
    } catch {
      setLocked(false);
    }
  };

  if (locked) {
    return (
      <View style={styles.container}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.title}>App bloqueada</Text>
        <Text style={styles.subtitle}>Verifica tu identidad para continuar</Text>
        <TouchableOpacity style={styles.button} onPress={handleUnlock}>
          <Text style={styles.buttonText}>Desbloquear con {biometricType}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#3D2B1F', justifyContent: 'center', alignItems: 'center', padding: 32 },
  lockIcon: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#BDB0A0', textAlign: 'center', marginTop: 8 },
  button: { backgroundColor: '#C4A265', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, marginTop: 24 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
