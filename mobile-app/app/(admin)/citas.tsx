import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function CitasScreen() {
  const [citas, setCitas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadCitas(); }, []);

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
    Linking.openURL('https://migracion-segura-mx-admin-panel.vercel.app/citas');
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#C4A265" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Citas</Text>
        <Text style={styles.headerCount}>{citas.length} registradas</Text>
      </View>

      <FlatList
        data={citas}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyEmoji}>📅</Text><Text style={styles.emptyText}>No hay citas programadas</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardLeft}>
              <Text style={styles.cardHora}>{item.horaInicio?.slice(0, 5) || '--:--'}</Text>
              <Text style={styles.cardFecha}>{item.fecha?.slice(0, 10) || ''}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.cardCliente}>{item.cliente?.nombreCompleto || item.cliente?.nombre || 'Sin cliente'}</Text>
              <View style={styles.cardMeta}>
                <Text style={styles.modalidad}>
                  {item.modalidad === 'presencial' ? '🏢 Presencial' : '📹 Videollamada'}
                </Text>
                <View style={[styles.estatusDot, { backgroundColor: item.estatus === 'confirmada' || item.estatus === 'completada' ? '#27AE60' : '#E67E22' }]} />
                <Text style={styles.estatus}>{item.estatus || 'programada'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleNewCita}>
        <Text style={styles.fabText}>+ Agendar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' },
  header: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#2C1810' },
  headerCount: { fontSize: 13, color: '#6B5B4F' },
  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, flexDirection: 'row', gap: 16, borderWidth: 1, borderColor: '#E8DFD3' },
  cardLeft: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F5F0E8', borderRadius: 10, padding: 12, minWidth: 70 },
  cardHora: { fontSize: 16, fontWeight: '700', color: '#2C1810' },
  cardFecha: { fontSize: 11, color: '#6B5B4F', marginTop: 2 },
  cardRight: { flex: 1, justifyContent: 'center', gap: 6 },
  cardCliente: { fontSize: 15, fontWeight: '600', color: '#2C1810' },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalidad: { fontSize: 13, color: '#6B5B4F' },
  estatusDot: { width: 8, height: 8, borderRadius: 4 },
  estatus: { fontSize: 12, color: '#6B5B4F', textTransform: 'capitalize' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#8B7B6F' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#C4A265', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14, elevation: 4 },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
