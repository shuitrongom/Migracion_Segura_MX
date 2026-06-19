import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Linking, Dimensions } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';
import { WHATSAPP_URL } from '@/lib/config';
import { useTheme } from '@/lib/theme';

const { width } = Dimensions.get('window');

interface Metrics { totalClientes: number; totalTramites: number; citasHoy: number; }
interface EstatusItem { key: string; label: string; color: string; cantidad: number; }

const ESTATUS_CONFIG = [
  { key: 'borrador', label: 'Borrador', color: '#6b7280' },
  { key: 'recibido', label: 'Recibido', color: '#3b82f6' },
  { key: 'en_revision', label: 'En revisión', color: '#f59e0b' },
  { key: 'en_espera_resolucion', label: 'En espera', color: '#f97316' },
  { key: 'aprobado', label: 'Aprobado', color: '#22c55e' },
  { key: 'rechazado', label: 'Rechazado', color: '#ef4444' },
  { key: 'cancelado', label: 'Cancelado', color: '#6b7280' },
];

export default function AdminDashboardScreen() {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';
  const [user, setUser] = useState<any>(null);
  const [metrics, setMetrics] = useState<Metrics>({ totalClientes: 0, totalTramites: 0, citasHoy: 0 });
  const [estatusData, setEstatusData] = useState<EstatusItem[]>([]);
  const [recentTramites, setRecentTramites] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
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
      const citasData = citasRes.ok ? await citasRes.json() : { data: [] };
      const tramites = tramitesData.data || [];
      const today = new Date().toISOString().slice(0, 10);

      setMetrics({
        totalClientes: clientesData.meta?.total || (clientesData.data || []).length,
        totalTramites: tramitesData.meta?.total || tramites.length,
        citasHoy: (citasData.data || []).filter((c: any) => c.fecha?.startsWith(today)).length,
      });
      setRecentTramites(tramites.slice(0, 5));
      const counts: Record<string, number> = {};
      tramites.forEach((t: any) => { counts[t.estatus] = (counts[t.estatus] || 0) + 1; });
      setEstatusData(ESTATUS_CONFIG.map(item => ({ ...item, cantidad: counts[item.key] || 0 })));
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);
  const totalEstatus = estatusData.reduce((sum, item) => sum + item.cantidad, 0);

  // Colores dinámicos
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : colors.bgCard;
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : colors.border;
  const metricBorder = isDark ? 'rgba(255,255,255,0.06)' : colors.borderLight;
  const barBg = isDark ? 'rgba(255,255,255,0.05)' : colors.borderLight;
  const rowBorder = isDark ? 'rgba(255,255,255,0.04)' : colors.borderLight;
  const actionBg = isDark ? 'rgba(255,255,255,0.03)' : colors.bgTertiary;
  const actionBorder = isDark ? 'rgba(255,255,255,0.06)' : colors.borderLight;

  if (loading) return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color="#f59e0b" />
      <Text style={[styles.loadingText, { color: colors.textMuted }]}>Cargando panel...</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Header */}
          <LinearGradient colors={['rgba(245,158,11,0.08)', 'transparent']} style={styles.headerGradient}>
            <View style={styles.header}>
              <View>
                <Text style={[styles.greeting, { color: colors.text }]}>Hola, {user?.fullName?.split(' ')[0] || 'Admin'}</Text>
                <Text style={styles.roleTag}>Panel Administrativo</Text>
              </View>
              <View style={styles.avatarSmall}>
                <Text style={styles.avatarSmallText}>{(user?.fullName || 'A').charAt(0)}</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Metric cards */}
          <View style={styles.metricsRow}>
            <TouchableOpacity style={[styles.metricCard, { borderColor: metricBorder }]} onPress={() => router.push('/(admin)/extranjeros')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(59,130,246,0.1)', 'rgba(59,130,246,0.02)']} style={styles.metricGradient}>
                <Text style={[styles.metricValue, { color: '#60a5fa' }]}>{metrics.totalClientes}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Clientes</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.metricCard, { borderColor: metricBorder }]} onPress={() => router.push('/(admin)/tramites')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.02)']} style={styles.metricGradient}>
                <Text style={[styles.metricValue, { color: '#f59e0b' }]}>{metrics.totalTramites}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Trámites</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.metricCard, { borderColor: metricBorder }]} onPress={() => router.push('/(admin)/citas')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(34,197,94,0.1)', 'rgba(34,197,94,0.02)']} style={styles.metricGradient}>
                <Text style={[styles.metricValue, { color: '#22c55e' }]}>{metrics.citasHoy}</Text>
                <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Citas hoy</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Distribución por estatus */}
          {totalEstatus > 0 && (
            <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Distribución por estatus</Text>
              {estatusData.filter(item => item.cantidad > 0).map((item) => (
                <View key={item.key} style={styles.estatusRow}>
                  <View style={[styles.estatusDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.estatusLabel, { color: colors.textSecondary }]}>{item.label}</Text>
                  <View style={[styles.estatusBarBg, { backgroundColor: barBg }]}>
                    <View style={[styles.estatusBarFill, { width: `${(item.cantidad / totalEstatus) * 100}%`, backgroundColor: item.color }]} />
                  </View>
                  <Text style={[styles.estatusCount, { color: colors.text }]}>{item.cantidad}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Últimos trámites */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { color: colors.text }]}>Últimos trámites</Text>
              <TouchableOpacity onPress={() => router.push('/(admin)/tramites')}>
                <Text style={styles.cardLink}>Ver todos →</Text>
              </TouchableOpacity>
            </View>
            {recentTramites.length === 0 ? (
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>Sin trámites registrados</Text>
            ) : (
              recentTramites.map((t: any) => (
                <View key={t.id} style={[styles.tramiteRow, { borderBottomColor: rowBorder }]}>
                  <View style={styles.tramiteIcon}>
                    <Text style={{ fontSize: 14 }}>📄</Text>
                  </View>
                  <View style={styles.tramiteInfo}>
                    <Text style={[styles.tramiteNombre, { color: colors.text }]} numberOfLines={1}>{t.cliente?.nombreCompleto || t.datosFormulario?.nombre || 'Sin nombre'}</Text>
                    <Text style={[styles.tramiteTipo, { color: colors.textMuted }]}>{(t.tipo || '').replace(/_/g, ' ')}</Text>
                  </View>
                  <View style={[styles.tramiteBadge, { backgroundColor: (ESTATUS_CONFIG.find(e => e.key === t.estatus)?.color || '#6b7280') + '20' }]}>
                    <Text style={[styles.tramiteBadgeText, { color: ESTATUS_CONFIG.find(e => e.key === t.estatus)?.color || '#6b7280' }]}>
                      {ESTATUS_CONFIG.find(e => e.key === t.estatus)?.label || t.estatus}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>

          {/* Acciones rápidas */}
          <View style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Acciones rápidas</Text>
            <View style={styles.actionsGrid}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: actionBg, borderColor: actionBorder }]} onPress={() => Linking.openURL('https://migracion-segura-mx-admin-panel.vercel.app/tramites/nuevo')}>
                <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={styles.actionIconBg}>
                  <Text style={{ fontSize: 20 }}>📄</Text>
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Nuevo trámite</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: actionBg, borderColor: actionBorder }]} onPress={() => Linking.openURL('https://migracion-segura-mx-admin-panel.vercel.app/financiero')}>
                <LinearGradient colors={['rgba(34,197,94,0.15)', 'rgba(34,197,94,0.05)']} style={styles.actionIconBg}>
                  <Text style={{ fontSize: 20 }}>💰</Text>
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Financiero</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: actionBg, borderColor: actionBorder }]} onPress={() => Linking.openURL(WHATSAPP_URL)}>
                <LinearGradient colors={['rgba(37,211,102,0.15)', 'rgba(37,211,102,0.05)']} style={styles.actionIconBg}>
                  <Text style={{ fontSize: 20 }}>💬</Text>
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>WhatsApp</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: actionBg, borderColor: actionBorder }]} onPress={() => Linking.openURL('https://migracion-segura-mx-admin-panel.vercel.app')}>
                <LinearGradient colors={['rgba(59,130,246,0.15)', 'rgba(59,130,246,0.05)']} style={styles.actionIconBg}>
                  <Text style={{ fontSize: 20 }}>💻</Text>
                </LinearGradient>
                <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Panel web</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 30 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 12 },
  loadingText: { fontSize: 14 },

  headerGradient: { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  greeting: { fontSize: 24, fontWeight: '700' },
  roleTag: { fontSize: 12, color: '#f59e0b', fontWeight: '600', marginTop: 2, letterSpacing: 0.5 },
  avatarSmall: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarSmallText: { color: '#f59e0b', fontSize: 18, fontWeight: '700' },

  metricsRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  metricCard: { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1 },
  metricGradient: { padding: 16, alignItems: 'center' },
  metricValue: { fontSize: 28, fontWeight: '800' },
  metricLabel: { fontSize: 11, marginTop: 4, fontWeight: '500' },

  card: { borderRadius: 20, marginHorizontal: 16, marginBottom: 14, padding: 18, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', marginBottom: 14 },
  cardLink: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },

  estatusRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  estatusDot: { width: 8, height: 8, borderRadius: 4 },
  estatusLabel: { fontSize: 12, width: 72 },
  estatusBarBg: { flex: 1, height: 6, borderRadius: 3, overflow: 'hidden' },
  estatusBarFill: { height: '100%', borderRadius: 3 },
  estatusCount: { fontSize: 12, fontWeight: '700', width: 24, textAlign: 'right' },

  tramiteRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, gap: 12 },
  tramiteIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.1)', justifyContent: 'center', alignItems: 'center' },
  tramiteInfo: { flex: 1 },
  tramiteNombre: { fontSize: 14, fontWeight: '500' },
  tramiteTipo: { fontSize: 11, marginTop: 2, textTransform: 'capitalize' },
  tramiteBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  tramiteBadgeText: { fontSize: 10, fontWeight: '600' },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionBtn: { width: '47%', borderRadius: 14, padding: 16, alignItems: 'center', gap: 10, borderWidth: 1 },
  actionIconBg: { width: 44, height: 44, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '500', textAlign: 'center' },

  emptyText: { fontSize: 13, textAlign: 'center', paddingVertical: 16 },
});
