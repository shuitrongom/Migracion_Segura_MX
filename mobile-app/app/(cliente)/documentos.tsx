import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl, Animated } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { apiFetch } from '@/lib/api';

export default function NotificacionesScreen() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [hasTramiteActivo, setHasTramiteActivo] = useState(false);
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
      const [notifRes, tramitesRes] = await Promise.all([
        apiFetch('/notificaciones?page=1&limit=50'),
        apiFetch('/tramites?page=1&limit=10'),
      ]);
      if (notifRes.ok) {
        const data = await notifRes.json();
        const items = data.data || [];
        setNotificaciones(items);
        setUnreadCount(items.filter((n: any) => !n.leida).length);
      }
      if (tramitesRes.ok) {
        const data = await tramitesRes.json();
        const tramites = data.data || [];
        // Si tiene al menos 1 trámite que no sea borrador/cancelado/completado → puede subir docs
        setHasTramiteActivo(tramites.some((t: any) =>
          !['borrador', 'cancelado', 'completado', 'rechazado'].includes(t.estatus)
        ));
      }
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);

  const markAsRead = async (id: string) => {
    await apiFetch(`/notificaciones/${id}/read`, { method: 'PATCH' });
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    await apiFetch('/notificaciones/read-all', { method: 'PATCH' });
    setNotificaciones(prev => prev.map(n => ({ ...n, leida: true })));
    setUnreadCount(0);
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
          <View style={styles.headerRow}>
            <Text style={styles.title}>Notificaciones</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          {unreadCount > 0 && (
            <TouchableOpacity onPress={markAllAsRead} style={styles.markAllBtn}>
              <Text style={styles.markAllText}>Marcar todo como leído</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Subir documento - solo si tiene trámite activo */}
      {hasTramiteActivo && (
        <TouchableOpacity style={styles.uploadBtn} onPress={() => router.push('/(cliente)/subir-documento')}>
          <Text style={{ fontSize: 20 }}>📤</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.uploadText}>Subir documento requerido</Text>
            <Text style={styles.uploadHint}>Tu gestor te solicitó documentos</Text>
          </View>
          <Text style={{ color: '#f59e0b', fontSize: 18 }}>→</Text>
        </TouchableOpacity>
      )}

      {/* Lista de notificaciones */}
      {notificaciones.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIconContainer}>
            <Text style={{ fontSize: 40 }}>🔔</Text>
          </View>
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>Aquí recibirás avisos sobre tus trámites, pagos y documentos.</Text>
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
  header: { paddingHorizontal: 16, marginBottom: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 22, fontWeight: '700', color: '#ffffff' },
  badge: { backgroundColor: '#f59e0b', borderRadius: 12, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  markAllBtn: { marginTop: 6 },
  markAllText: { color: '#f59e0b', fontSize: 12, fontWeight: '500' },

  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(245,158,11,0.06)', marginHorizontal: 16, borderRadius: 12, padding: 14, gap: 12, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', marginBottom: 16 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  uploadHint: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },

  list: { paddingHorizontal: 16, paddingBottom: 20 },
  notifCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.03)' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#ffffff', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#f59e0b' },
  notifContent: { fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 18 },
  notifDate: { fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 6 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
  emptyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', textAlign: 'center', lineHeight: 20 },
});
