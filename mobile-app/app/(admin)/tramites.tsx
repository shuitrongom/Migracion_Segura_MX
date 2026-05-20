import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Alert } from 'react-native';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { apiFetch } from '@/lib/api';

const estatusColors: Record<string, string> = {
  borrador: '#9CA3AF', recibido: '#3498DB', en_revision: '#E67E22',
  en_espera_resolucion: '#9B59B6', aprobado: '#27AE60', rechazado: '#E74C3C', cancelado: '#6B7280',
};
const estatusLabels: Record<string, string> = {
  borrador: 'Borrador', recibido: 'Recibido', en_revision: 'En revisión',
  en_espera_resolucion: 'Esperando', aprobado: 'Aprobado', rechazado: 'Rechazado', cancelado: 'Cancelado',
};

export default function AdminTramitesScreen() {
  const [search, setSearch] = useState('');
  const [tramites, setTramites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadTramites(); }, []);

  const loadTramites = async () => {
    try {
      const res = await apiFetch('/tramites?page=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        setTramites(data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await loadTramites(); setRefreshing(false); };

  const filtered = tramites.filter((t) =>
    (t.cliente?.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.tipo || '').toLowerCase().includes(search.toLowerCase()),
  );

  const handleNewTramite = () => {
    Alert.alert('Nuevo trámite', 'Para crear un trámite completo, usa el panel web.\n\nmigracion-segura-mx-admin-panel.vercel.app');
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#C4A265" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Buscar trámite o cliente..." placeholderTextColor="#9CA3AF" />
      </View>

      <FlatList
        data={filtered}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No hay trámites registrados</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTipo}>{(item.tipo || '').replace(/_/g, ' ')}</Text>
              <View style={[styles.badge, { backgroundColor: (estatusColors[item.estatus] || '#9CA3AF') + '20' }]}>
                <Text style={[styles.badgeText, { color: estatusColors[item.estatus] || '#9CA3AF' }]}>
                  {estatusLabels[item.estatus] || item.estatus}
                </Text>
              </View>
            </View>
            <Text style={styles.cardCliente}>👤 {item.cliente?.nombre || 'Sin cliente'} {item.cliente?.apellidos || ''}</Text>
            <Text style={styles.cardFecha}>📅 {item.createdAt?.slice(0, 10) || ''}</Text>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleNewTramite}>
        <Text style={styles.fabText}>+ Nuevo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' },
  searchContainer: { padding: 16 },
  searchInput: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#E8DFD3', color: '#2C1810' },
  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, gap: 8, borderWidth: 1, borderColor: '#E8DFD3' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTipo: { fontSize: 15, fontWeight: '600', color: '#2C1810', textTransform: 'capitalize', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 12, fontWeight: '600' },
  cardCliente: { fontSize: 14, color: '#6B5B4F' },
  cardFecha: { fontSize: 13, color: '#8B7B6F' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#8B7B6F' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#C4A265', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14, elevation: 4 },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
