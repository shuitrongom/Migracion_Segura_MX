import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { apiFetch } from '@/lib/api';

export default function DocumentosScreen() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  const loadData = async () => {
    try {
      const res = await apiFetch('/notificaciones?page=1&limit=30');
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);

  const markAsRead = async (id: string) => {
    await apiFetch(`/notificaciones/${id}/read`, { method: 'PATCH' });
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const handleUpload = () => {
    // Navegar a la pantalla de subida de documentos con el flujo completo
    // (INE/Residencia: frente y reverso, Pasaporte: primera hoja, Documentos: escáner)
    router.push('/(cliente)/subir-documento');
  };

  if (loading) return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Text style={styles.title}>Notificaciones y Documentos</Text>
        </View>
      </Animated.View>

      {/* Botón subir documento */}
      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
        <Text style={styles.uploadIcon}>📤</Text>
        <View>
          <Text style={styles.uploadText}>Subir documento</Text>
          <Text style={styles.uploadHint}>PDF, JPG, PNG (máx. 10MB)</Text>
        </View>
      </TouchableOpacity>

      {/* Notificaciones */}
      {notificaciones.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={{ fontSize: 40 }}>🔔</Text>
          </View>
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>Aquí recibirás avisos sobre tus trámites, documentos y pagos.</Text>
        </View>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifCard, !item.leida && styles.notifUnread]}
              onPress={() => markAsRead(item.id)}
            >
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>{item.titulo}</Text>
                {!item.leida && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifContent}>{item.contenido}</Text>
              <Text style={styles.notifDate}>{item.createdAt?.slice(0, 10)} · {item.createdAt?.slice(11, 16)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff' },

  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', marginHorizontal: 16, borderRadius: 12, padding: 14, gap: 12, borderWidth: 2, borderColor: '#f59e0b', borderStyle: 'dashed', marginBottom: 16 },
  uploadIcon: { fontSize: 24 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  uploadHint: { fontSize: 11, color: 'rgba(255,255,255,0.4)' },

  list: { paddingHorizontal: 16, paddingBottom: 20 },
  notifCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#ffffff', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' },
  notifContent: { fontSize: 13, color: 'rgba(255,255,255,0.5)', lineHeight: 18 },
  notifDate: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20 },
});
