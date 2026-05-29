import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Linking, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '@/lib/api';
import { ADMIN_PANEL_URL } from '@/lib/config';

export default function CitasScreen() {
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
      if (res.ok) {
        const data = await res.json();
        setCitas(data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await loadCitas(); setRefreshing(false); };

  const handleNewCita = () => {
    Linking.openURL(`${ADMIN_PANEL_URL}/citas`);
  };

  if (loading) return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>📅 Citas</Text>
          <Text style={styles.headerCount}>{citas.length} registradas</Text>
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
              <Text style={styles.emptyText}>No hay citas programadas</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.card}>
              <View style={styles.cardLeft}>
                <LinearGradient colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.04)']} style={styles.cardLeftGradient}>
                  <Text style={styles.cardHora}>{item.horaInicio?.slice(0, 5) || '--:--'}</Text>
                  <Text style={styles.cardFecha}>{item.fecha?.slice(0, 10) || ''}</Text>
                </LinearGradient>
              </View>
              <View style={styles.cardRight}>
                <Text style={styles.cardCliente}>{item.cliente?.nombreCompleto || item.cliente?.nombre || 'Sin cliente'}</Text>
                <View style={styles.cardMeta}>
                  <Text style={styles.modalidad}>
                    {item.modalidad === 'presencial' ? '🏢 En oficina' : '📹 Videollamada'}
                  </Text>
                  <View style={[styles.estatusDot, { backgroundColor: item.estatus === 'confirmada' || item.estatus === 'completada' ? '#27AE60' : '#E67E22' }]} />
                  <Text style={styles.estatus}>{item.estatus || 'programada'}</Text>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff' },
  headerCount: { fontSize: 13, color: 'rgba(255,255,255,0.4)' },
  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 10 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, flexDirection: 'row', gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardLeft: { alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  cardLeftGradient: { borderRadius: 12, padding: 12, alignItems: 'center', justifyContent: 'center', minWidth: 70 },
  cardHora: { fontSize: 16, fontWeight: '700', color: '#f59e0b' },
  cardFecha: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  cardRight: { flex: 1, justifyContent: 'center', gap: 6 },
  cardCliente: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalidad: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  estatusDot: { width: 8, height: 8, borderRadius: 4 },
  estatus: { fontSize: 12, color: 'rgba(255,255,255,0.4)', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIconBg: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.4)' },
  fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 24, elevation: 8, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14 },
  fabText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
