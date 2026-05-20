import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Linking } from 'react-native';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ExtranjerosScreen() {
  const [search, setSearch] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadClientes(); }, []);

  const loadClientes = async () => {
    try {
      const res = await apiFetch('/clientes?page=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        setClientes(data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await loadClientes(); setRefreshing(false); };

  const filtered = clientes.filter((c) =>
    (c.nombreCompleto || c.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.nacionalidad || '').toLowerCase().includes(search.toLowerCase()),
  );

  const handleNewCliente = () => {
    Linking.openURL('https://migracion-segura-mx-admin-panel.vercel.app/clientes/nuevo');
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#C4A265" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Buscar por nombre, email o nacionalidad..." placeholderTextColor="#9CA3AF" />
      </View>

      <FlatList
        data={filtered}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyEmoji}>👤</Text><Text style={styles.emptyText}>No hay extranjeros registrados</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{(item.nombreCompleto || item.nombre || '?').charAt(0)}</Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.cardName}>{item.nombreCompleto || `${item.nombre || ''} ${item.apellidos || ''}`}</Text>
                {item.nacionalidad && <Text style={styles.cardNacionalidad}>🌍 {item.nacionalidad}</Text>}
              </View>
            </View>
            <View style={styles.cardDetails}>
              <Text style={styles.detailText}>📧 {item.email}</Text>
              {item.telefono && <Text style={styles.detailText}>📱 {item.telefono}</Text>}
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={handleNewCliente}>
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
  card: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, gap: 12, borderWidth: 1, borderColor: '#E8DFD3' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#C4A265', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#2C1810' },
  cardNacionalidad: { fontSize: 13, color: '#6B5B4F', marginTop: 2 },
  cardDetails: { gap: 4, paddingLeft: 56 },
  detailText: { fontSize: 13, color: '#6B5B4F' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyEmoji: { fontSize: 40 },
  emptyText: { fontSize: 15, color: '#8B7B6F' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#C4A265', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14, elevation: 4 },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
