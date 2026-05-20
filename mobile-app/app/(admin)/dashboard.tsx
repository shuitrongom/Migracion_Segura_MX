import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';

interface Metrics {
  totalClientes: number;
  totalTramites: number;
  citasHoy: number;
}

interface EstatusItem {
  key: string;
  label: string;
  color: string;
  cantidad: number;
}

const ESTATUS_CONFIG = [
  { key: 'borrador', label: 'Borrador', color: '#9CA3AF' },
  { key: 'recibido', label: 'Recibido', color: '#3498DB' },
  { key: 'en_revision', label: 'En revisión', color: '#F39C12' },
  { key: 'en_espera_resolucion', label: 'En espera', color: '#E67E22' },
  { key: 'aprobado', label: 'Aprobado', color: '#27AE60' },
  { key: 'rechazado', label: 'Rechazado', color: '#E74C3C' },
  { key: 'cancelado', label: 'Cancelado', color: '#6B7280' },
];

export default function AdminDashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<Metrics>({ totalClientes: 0, totalTramites: 0, citasHoy: 0 });
  const [estatusData, setEstatusData] = useState<EstatusItem[]>([]);
  const [citasHoy, setCitasHoy] = useState<any[]>([]);
  const [recentTramites, setRecentTramites] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => { loadData(); }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const loadData = async () => {
    const userData = await storage.getItem('user_data');
    if (userData) setUser(JSON.parse(userData));

    try {
      const [tramitesRes, clientesRes, citasRes] = await Promise.all([
        apiFetch('/tramites?page=1&limit=100'),
        apiFetch('/clientes?page=1&limit=100'),
        apiFetch('/citas?page=1&limit=50'),
      ]);

      const tramitesData = tramitesRes.ok ? await tramitesRes.json() : { data: [], meta: { total: 0 } };
      const clientesData = clientesRes.ok ? await clientesRes.json() : { data: [], meta: { total: 0 } };
      const citasData = citasRes.ok ? await citasRes.json() : { data: [], meta: { total: 0 } };

      const tramites = tramitesData.data || [];
      const clientes = clientesData.data || [];
      const citas = citasData.data || [];

      // Métricas
      const today = new Date().toISOString().slice(0, 10);
      const citasDeHoy = citas.filter((c: any) => c.fecha?.startsWith(today));

      setMetrics({
        totalClientes: clientesData.meta?.total || clientes.length,
        totalTramites: tramitesData.meta?.total || tramites.length,
        citasHoy: citasDeHoy.length,
      });

      setCitasHoy(citasDeHoy.slice(0, 5));

      // Distribución por estatus
      const counts: Record<string, number> = {};
      tramites.forEach((t: any) => { counts[t.estatus] = (counts[t.estatus] || 0) + 1; });
      setEstatusData(ESTATUS_CONFIG.map(item => ({ ...item, cantidad: counts[item.key] || 0 })));

      // Actividad reciente (últimos 5 trámites)
      setRecentTramites(tramites.slice(0, 5));
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const isAdmin = user?.role === 'administrador';
  const totalEstatus = estatusData.reduce((sum, item) => sum + item.cantidad, 0);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#C4A265" />
        <Text style={styles.loadingText}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4A265" />}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hola, {user?.fullName || user?.email?.split('@')[0] || 'Admin'}</Text>
            <Text style={styles.roleTag}>{isAdmin ? 'Administrador' : 'Gestor'}</Text>
          </View>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>{(user?.fullName || user?.email || 'A').charAt(0).toUpperCase()}</Text>
          </View>
        </View>

        {/* Metric Cards */}
        <View style={styles.metricsRow}>
          <View style={[styles.metricCard, { borderLeftColor: '#C4A265' }]}>  
            <Text style={styles.metricValue}>{metrics.totalClientes}</Text>
            <Text style={styles.metricLabel}>Clientes</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#3498DB' }]}>
            <Text style={styles.metricValue}>{metrics.totalTramites}</Text>
            <Text style={styles.metricLabel}>Trámites</Text>
          </View>
          <View style={[styles.metricCard, { borderLeftColor: '#27AE60' }]}>
            <Text style={styles.metricValue}>{metrics.citasHoy}</Text>
            <Text style={styles.metricLabel}>Citas hoy</Text>
          </View>
        </View>

        {/* Distribución por estatus */}
        {totalEstatus > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Distribución por estatus</Text>
            {estatusData.filter(item => item.cantidad > 0).map((item) => (
              <View key={item.key} style={styles.estatusRow}>
                <View style={[styles.estatusDot, { backgroundColor: item.color }]} />
                <Text style={styles.estatusLabel}>{item.label}</Text>
                <View style={styles.estatusBarBg}>
                  <View style={[styles.estatusBarFill, { width: `${(item.cantidad / totalEstatus) * 100}%`, backgroundColor: item.color }]} />
                </View>
                <Text style={styles.estatusCount}>{item.cantidad}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Citas de hoy */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Citas de hoy</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/citas')}>
              <Text style={styles.cardLink}>Ver todas →</Text>
            </TouchableOpacity>
          </View>
          {citasHoy.length === 0 ? (
            <Text style={styles.emptyText}>No hay citas programadas para hoy</Text>
          ) : (
            citasHoy.map((cita: any) => (
              <View key={cita.id} style={styles.citaRow}>
                <View style={styles.citaTime}>
                  <Text style={styles.citaHora}>{cita.horaInicio?.slice(0, 5) || '--:--'}</Text>
                </View>
                <View style={styles.citaInfo}>
                  <Text style={styles.citaCliente}>{cita.cliente?.nombreCompleto || 'Cliente'}</Text>
                  <Text style={styles.citaModalidad}>{cita.modalidad === 'videollamada' ? '📹 Videollamada' : '🏢 Presencial'}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Actividad reciente */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Actividad reciente</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/tramites')}>
              <Text style={styles.cardLink}>Ver todos →</Text>
            </TouchableOpacity>
          </View>
          {recentTramites.length === 0 ? (
            <Text style={styles.emptyText}>No hay actividad reciente</Text>
          ) : (
            recentTramites.map((tramite: any) => (
              <View key={tramite.id} style={styles.activityRow}>
                <View style={[styles.activityDot, { backgroundColor: ESTATUS_CONFIG.find(e => e.key === tramite.estatus)?.color || '#9CA3AF' }]} />
                <View style={styles.activityInfo}>
                  <Text style={styles.activityText} numberOfLines={1}>
                    {(tramite.tipo || '').replace(/_/g, ' ')} — {tramite.cliente?.nombreCompleto || 'Sin cliente'}
                  </Text>
                  <Text style={styles.activityMeta}>
                    {tramite.numeroPieza ? `#${tramite.numeroPieza}` : ''} · {tramite.estatus?.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Acciones rápidas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones rápidas</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(admin)/tramites')}>
              <Text style={styles.actionIcon}>📄</Text>
              <Text style={styles.actionLabel}>Trámites</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(admin)/extranjeros')}>
              <Text style={styles.actionIcon}>👤</Text>
              <Text style={styles.actionLabel}>Clientes</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(admin)/citas')}>
              <Text style={styles.actionIcon}>📅</Text>
              <Text style={styles.actionLabel}>Citas</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={{ height: 30 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8', gap: 12 },
  loadingText: { fontSize: 14, color: '#6B5B4F' },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 16 },
  greeting: { fontSize: 20, fontWeight: '700', color: '#2C1810' },
  roleTag: { fontSize: 13, color: '#6B5B4F', marginTop: 2 },
  avatarSmall: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3D2B1F', justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { color: '#C4A265', fontSize: 16, fontWeight: '700' },

  metricsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  metricValue: { fontSize: 24, fontWeight: '700', color: '#2C1810' },
  metricLabel: { fontSize: 11, color: '#6B5B4F', marginTop: 2, fontWeight: '500' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 14, marginHorizontal: 16, marginBottom: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#2C1810', marginBottom: 14 },
  cardLink: { fontSize: 13, color: '#C4A265', fontWeight: '600' },

  estatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  estatusDot: { width: 8, height: 8, borderRadius: 4 },
  estatusLabel: { fontSize: 12, color: '#6B5B4F', width: 72 },
  estatusBarBg: { flex: 1, height: 6, backgroundColor: '#F0EBE3', borderRadius: 3, overflow: 'hidden' },
  estatusBarFill: { height: '100%', borderRadius: 3 },
  estatusCount: { fontSize: 12, fontWeight: '600', color: '#2C1810', width: 24, textAlign: 'right' },

  citaRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F0E8' },
  citaTime: { backgroundColor: '#F5F0E8', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  citaHora: { fontSize: 13, fontWeight: '700', color: '#2C1810', fontVariant: ['tabular-nums'] },
  citaInfo: { flex: 1 },
  citaCliente: { fontSize: 14, fontWeight: '500', color: '#2C1810' },
  citaModalidad: { fontSize: 12, color: '#6B5B4F', marginTop: 2 },

  activityRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F5F0E8' },
  activityDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  activityInfo: { flex: 1 },
  activityText: { fontSize: 13, color: '#2C1810', fontWeight: '500' },
  activityMeta: { fontSize: 11, color: '#8B7B6F', marginTop: 2, textTransform: 'capitalize' },

  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#F5F0E8', borderRadius: 12, padding: 14, alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 12, fontWeight: '500', color: '#2C1810' },

  emptyText: { fontSize: 13, color: '#8B7B6F', textAlign: 'center', paddingVertical: 16 },
});
