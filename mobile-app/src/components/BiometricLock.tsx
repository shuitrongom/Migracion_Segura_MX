import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, AppStateStatus } from 'react-native';
import { authenticateWithBiometrics, needsReauth, getBiometricType, isBiometricEnabled } from '@/lib/biometrics';

interface BiometricLockProps {
  children: React.ReactNode;
}

export default function BiometricLock({ children }: BiometricLockProps) {
  const [locked, setLocked] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometría');

  useEffect(() => {
    checkLock();

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  const handleAppStateChange = (nextState: AppStateStatus) => {
    if (nextState === 'active') {
      checkLock();
    }
  };

  const checkLock = async () => {
    const needs = await needsReauth();
    if (needs) {
      setLocked(true);
      const type = await getBiometricType();
      setBiometricType(type);
      // Intentar autenticación automática
      const success = await authenticateWithBiometrics();
      if (success) setLocked(false);
    }
  };

  const handleUnlock = async () => {
    const success = await authenticateWithBiometrics();
    if (success) setLocked(false);
  };

  if (locked) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.lockIcon}>🔒</Text>
          <Text style={styles.title}>App bloqueada</Text>
          <Text style={styles.subtitle}>Verifica tu identidad para continuar</Text>
          <TouchableOpacity style={styles.button} onPress={handleUnlock}>
            <Text style={styles.buttonText}>Desbloquear con {biometricType}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#3D2B1F', justifyContent: 'center', alignItems: 'center', padding: 32 },
  content: { alignItems: 'center', gap: 16 },
  lockIcon: { fontSize: 64, marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  subtitle: { fontSize: 14, color: '#BDB0A0', textAlign: 'center' },
  button: { backgroundColor: '#C4A265', borderRadius: 14, paddingVertical: 16, paddingHorizontal: 32, marginTop: 16 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});
