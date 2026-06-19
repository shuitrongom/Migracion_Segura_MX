import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Linking, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '@/lib/api';
import { ADMIN_PANEL_URL } from '@/lib/config';
import { useTheme } from '@/lib/theme';

export default function CitasScreen() {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => { loadCitas(); }, []);
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const loadCitas = async () => {
    try {
      const res = await apiFetch('/citas?page=1&limit=50');
      if (res.ok) { const data = await res.json(); setCitas(data.data || []); }
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await loadCitas(); setRefreshing(false); };
  const handleNewCita = () => { Linking.openURL(`${ADMIN_PANEL_URL}/citas`); };

  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : colors.bgCard;
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : colors.border;

  if (loading) return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color="#f59e0b" />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>📅 Citas</Text>
          <Text style={[styles.headerCount, { color: colors.textMuted }]}>{citas.length} registradas</Text>
        </View>

        <FlatList
          data={citas}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={styles.emptyIconBg}>
                <Text style={styles.emptyEmoji}>📅</Text>
              </LinearGradient>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No hay citas programadas</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
              <View style={styles.cardLeft}>
                <LinearGradient colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)']} style={styles.cardLeftGradient}>
                  <Text style={styles.cardHora}>{item.horaInicio?.slice(0, 5) || '--:--'}</Text>
                  <Text style={[styles.cardFecha, { color: colors.textMuted }]}>{item.fecha?.slice(0, 10) || ''}</Text>
                </LinearGradient>
              </View>
              <View style={styles.cardRight}>
                <Text style={[styles.cardCliente, { color: colors.text }]}>{item.cliente?.nombreCompleto || item.cliente?.nombre || 'Sin cliente'}</Text>
                <View style={styles.cardMeta}>
                  <Text style={[styles.modalidad, { color: colors.textSecondary }]}>
                    {item.modalidad === 'presencial' ? '🏢 En oficina' : '📹 Videollamada'}
                  </Text>
                  <View style={[styles.estatusDot, { backgroundColor: item.estatus === 'confirmada' || item.estatus === 'completada' ? '#27AE60' : '#E67E22' }]} />
                  <Text style={[styles.estatus, { color: colors.textMuted }]}>{item.estatus || 'programada'}</Text>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity style={styles.fab} onPress={handleNewCita}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.fabGradient}>
            <Text style={styles.fabText}>+ Agendar</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  headerCount: { fontSize: 13 },
  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 10 },
  card: { borderRadius: 16, padding: 16, flexDirection: 'row', gap: 16, borderWidth: 1 },
  cardLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  cardLeftGradient: { borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  cardHora: { fontSize: 16, fontWeight: '700', color: '#f59e0b' },
  cardFecha: { fontSize: 11, marginTop: 2 },
  cardRight: { flex: 1, justifyContent: 'center', gap: 6 },
  cardCliente: { fontSize: 15, fontWeight: '600' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalidad: { fontSize: 13 },
  estatusDot: { width: 8, height: 8, borderRadius: 4 },
  estatus: { fontSize: 12, textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIconBg: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 15 },
  fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 24, elevation: 8, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14 },
  fabText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
