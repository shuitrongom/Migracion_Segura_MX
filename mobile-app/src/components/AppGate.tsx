import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getRemoteConfig, isUpdateRequired, isMaintenanceMode, getStoreUrl, RemoteConfig } from '@/lib/remote-config';

interface AppGateProps {
  children: React.ReactNode;
}

/**
 * AppGate — Pantalla de control que se muestra ANTES de la app.
 * 
 * Verifica:
 * 1. ¿Está en modo mantenimiento? → Mostrar pantalla de mantenimiento
 * 2. ¿Necesita actualización forzosa? → Mostrar pantalla de actualización
 * 3. Todo OK → Renderizar la app normalmente
 * 
 * Se controla 100% desde el backend via /config/app
 */
export default function AppGate({ children }: AppGateProps) {
  const [state, setState] = useState<'loading' | 'maintenance' | 'update_required' | 'ok'>('loading');
  const [config, setConfig] = useState<RemoteConfig | null>(null);

  useEffect(() => {
    checkGate();
  }, []);

  const checkGate = async () => {
    try {
      const cfg = await getRemoteConfig();
      setConfig(cfg);

      if (isMaintenanceMode(cfg)) {
        setState('maintenance');
      } else if (isUpdateRequired(cfg)) {
        setState('update_required');
      } else {
        setState('ok');
      }
    } catch {
      // Si no puede obtener config, dejar pasar (fail-open)
      setState('ok');
    }
  };

  if (state === 'loading') {
    return (
      <LinearGradient colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']} style={styles.container}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </LinearGradient>
    );
  }

  if (state === 'maintenance') {
    return (
      <LinearGradient colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.icon}>🔧</Text>
          <Text style={styles.title}>En mantenimiento</Text>
          <Text style={styles.message}>
            {config?.maintenance.message || 'Estamos realizando mejoras. Volvemos pronto.'}
          </Text>
          {config?.maintenance.estimatedEnd && (
            <Text style={styles.detail}>
              Tiempo estimado: {new Date(config.maintenance.estimatedEnd).toLocaleString('es-MX')}
            </Text>
          )}
          <TouchableOpacity style={styles.retryBtn} onPress={checkGate}>
            <Text style={styles.retryText}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  if (state === 'update_required') {
    const storeUrl = config ? getStoreUrl(config) : '';
    return (
      <LinearGradient colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']} style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.icon}>📲</Text>
          <Text style={styles.title}>Actualización requerida</Text>
          <Text style={styles.message}>
            Hay una nueva versión de Migración Segura MX disponible. Actualiza para continuar usando la app.
          </Text>
          <TouchableOpacity
            style={styles.updateBtn}
            onPress={() => { if (storeUrl) Linking.openURL(storeUrl); }}
          >
            <Text style={styles.updateText}>Actualizar ahora</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  // Todo OK — renderizar la app
  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%', maxWidth: 340 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  detail: { fontSize: 12, color: 'rgba(245,158,11,0.8)', textAlign: 'center', marginBottom: 20 },
  retryBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(245,158,11,0.4)' },
  retryText: { color: '#f59e0b', fontSize: 15, fontWeight: '600' },
  updateBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, backgroundColor: '#f59e0b' },
  updateText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
