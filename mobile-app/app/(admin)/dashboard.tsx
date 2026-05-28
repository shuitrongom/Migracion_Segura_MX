import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Linking } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';
import { WHATSAPP_URL } from '@/lib/config';

interface Metrics {
  totalClientes: number;
  totalTramites: number;
  citasHoy: number;
  pagosPendientes: number;
  ingresosDelMes: number;
}

interface EstatusItem { key: string; label: string; color: string; cantidad: number; }

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
  const [metrics, setMetrics] = useState<Metrics>({ totalClientes: 0, totalTramites: 0, citasHoy: 0, pagosPendientes: 0, ingresosDelMes: 0 });
  const [estatusData, setEstatusData] = useState<EstatusItem[]>([]);
  const [recentTramites, setRecentTramites] = useState<any[]>([]);
  const [notifCount, setNotifCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start(); }, [loading]);

  const loadData = async () => {
    const userData = await storage.getItem('user_data');
    if (userData) setUser(JSON.parse(userData));

    try {
      const [tramitesRes, clientesRes, citasRes, notifRes] = await Promise.all([
        apiFetch('/tramites?page=1&limit=100'),
        apiFetch('/clientes?page=1&limit=100'),
        apiFetch('/citas?page=1&limit=50'),
        apiFetch('/notificaciones/unread-count'),
      ]);

      const tramitesData = tramitesRes.ok ? await tramitesRes.json() : { data: [], meta: { total: 0 } };
      const clientesData = clientesRes.ok ? await clientesRes.json() : { data: [], meta: { total: 0 } };
      const citasData = citasRes.ok ? await citasRes.json() : { data: [] };
      const notifData = notifRes.ok ? await notifRes.json() : { count: 0 };

      const tramites = tramitesData.data || [];
      const clientes = clientesData.data || [];
      const citas = citasData.data || [];
      const today = new Date().toISOString().slice(0, 10);

      setMetrics({
        totalClientes: clientesData.meta?.total || clientes.length,
        totalTramites: tramitesData.meta?.total || tramites.length,
        citasHoy: citas.filter((c: any) => c.fecha?.startsWith(today)).length,
        pagosPendientes: 0,
        ingresosDelMes: 0,
      });

      setNotifCount(notifData.count || 0);
      setRecentTramites(tramites.slice(0, 5));

      const counts: Record<string, number> = {};
      tramites.forEach((t: any) => { counts[t.estatus] = (counts[t.estatus] || 0) + 1; });
      setEstatusData(ESTATUS_CONFIG.map(item => ({ ...item, cantidad: counts[item.key] || 0 })));
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);
  const totalEstatus = estatusData.reduce((sum, item) => sum + item.cantidad, 0);

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#C4A265" /><Text style={styles.loadingText}>Cargando panel...</Text></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4A265" />}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>Hola, {user?.fullName || user?.email?.split('@')[0] || 'Admin'}</Text>
            <Text style={styles.roleTag}>Administrador</Text>
          </View>
          <View style={styles.headerRight}>
            {notifCount > 0 && (
              <View style={styles.notifBadge}><Text style={styles.notifBadgeText}>{notifCount}</Text></View>
            )}
          </View>
        </View>

        {/* Métricas principales */}
        <View style={styles.metricsRow}>
          <TouchableOpacity style={[styles.metricCard, { borderLeftColor: '#C4A265' }]} onPress={() => router.push('/(admin)/extranjeros')}>
            <Text style={[styles.metricValue, { color: '#C4A265' }]}>{metrics.totalClientes}</Text>
            <Text style={styles.metricLabel}>Clientes</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.metricCard, { borderLeftColor: '#3498DB' }]} onPress={() => router.push('/(admin)/tramites')}>
            <Text style={[styles.metricValue, { color: '#3498DB' }]}>{metrics.totalTramites}</Text>
            <Text style={styles.metricLabel}>Trámites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.metricCard, { borderLeftColor: '#27AE60' }]} onPress={() => router.push('/(admin)/citas')}>
            <Text style={[styles.metricValue, { color: '#27AE60' }]}>{metrics.citasHoy}</Text>
            <Text style={styles.metricLabel}>Citas hoy</Text>
          </TouchableOpacity>
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

        {/* Últimos trámites */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Últimos trámites</Text>
            <TouchableOpacity onPress={() => router.push('/(admin)/tramites')}>
              <Text style={styles.cardLink}>Ver todos →</Text>
            </TouchableOpacity>
          </View>
          {recentTramites.length === 0 ? (
            <Text style={styles.emptyText}>Sin trámites registrados</Text>
          ) : (
            recentTramites.map((t: any) => (
              <View key={t.id} style={styles.tramiteRow}>
                <View style={styles.tramiteInfo}>
                  <Text style={styles.tramiteNombre} numberOfLines={1}>{t.cliente?.nombreCompleto || t.datosFormulario?.nombre || 'Sin nombre'}</Text>
                  <Text style={styles.tramiteTipo}>{(t.tipo || '').replace(/_/g, ' ')} · {t.numeroPieza || '—'}</Text>
                </View>
                <View style={[styles.tramiteBadge, { backgroundColor: (ESTATUS_CONFIG.find(e => e.key === t.estatus)?.color || '#9CA3AF') + '20' }]}>
                  <Text style={[styles.tramiteBadgeText, { color: ESTATUS_CONFIG.find(e => e.key === t.estatus)?.color || '#9CA3AF' }]}>
                    {ESTATUS_CONFIG.find(e => e.key === t.estatus)?.label || t.estatus}
                  </Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Acciones rápidas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Acciones rápidas</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL('https://migracion-segura-mx-admin-panel.vercel.app/tramites/nuevo')}>
              <Text style={styles.actionIcon}>📄</Text>
              <Text style={styles.actionLabel}>Nuevo trámite</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL('https://migracion-segura-mx-admin-panel.vercel.app/financiero')}>
              <Text style={styles.actionIcon}>💰</Text>
              <Text style={styles.actionLabel}>Financiero</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL(WHATSAPP_URL)}>
              <Text style={styles.actionIcon}>💬</Text>
              <Text style={styles.actionLabel}>WhatsApp</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => Linking.openURL('https://migracion-segura-mx-admin-panel.vercel.app')}>
              <Text style={styles.actionIcon}>💻</Text>
              <Text style={styles.actionLabel}>Panel web</Text>
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

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, paddingBottom: 12 },
  headerLeft: {},
  headerRight: {},
  greeting: { fontSize: 20, fontWeight: '700', color: '#2C1810' },
  roleTag: { fontSize: 13, color: '#C4A265', fontWeight: '600', marginTop: 2 },
  notifBadge: { backgroundColor: '#E74C3C', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  notifBadgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },

  metricsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 8, marginBottom: 16 },
  metricCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  metricValue: { fontSize: 24, fontWeight: '700' },
  metricLabel: { fontSize: 11, color: '#6B5B4F', marginTop: 2, fontWeight: '500' },

  card: { backgroundColor: '#FFFFFF', borderRadius: 14, marginHorizontal: 16, marginBottom: 14, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#2C1810', marginBottom: 12 },
  cardLink: { fontSize: 13, color: '#C4A265', fontWeight: '600' },

  estatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8, gap: 8 },
  estatusDot: { width: 8, height: 8, borderRadius: 4 },
  estatusLabel: { fontSize: 12, color: '#6B5B4F', width: 72 },
  estatusBarBg: { flex: 1, height: 6, backgroundColor: '#F0EBE3', borderRadius: 3, overflow: 'hidden' },
  estatusBarFill: { height: '100%', borderRadius: 3 },
  estatusCount: { fontSize: 12, fontWeight: '600', color: '#2C1810', width: 24, textAlign: 'right' },

  tramiteRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F5F0E8' },
  tramiteInfo: { flex: 1, marginRight: 8 },
  tramiteNombre: { fontSize: 14, fontWeight: '500', color: '#2C1810' },
  tramiteTipo: { fontSize: 11, color: '#8B7B6F', marginTop: 2, textTransform: 'capitalize' },
  tramiteBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  tramiteBadgeText: { fontSize: 10, fontWeight: '600' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '47%', backgroundColor: '#F5F0E8', borderRadius: 12, padding: 14, alignItems: 'center', gap: 6 },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: 12, fontWeight: '500', color: '#2C1810' },

  emptyText: { fontSize: 13, color: '#8B7B6F', textAlign: 'center', paddingVertical: 16 },
});
