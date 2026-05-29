import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Linking, Animated } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '@/lib/api';

export default function ExtranjerosScreen() {
  const [search, setSearch] = useState('');
  const [clientes, setClientes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => { loadClientes(); }, []);

  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

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

  if (loading) return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#f59e0b" />
    </LinearGradient>
  );

  return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.container}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.searchContainer}>
          <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
            placeholder="Buscar por nombre, email o nacionalidad..." placeholderTextColor="rgba(255,255,255,0.2)" />
        </View>

        <FlatList
          data={filtered}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={styles.emptyIconBg}>
                <Text style={styles.emptyEmoji}>👤</Text>
              </LinearGradient>
              <Text style={styles.emptyText}>No hay extranjeros registrados</Text>
            </View>
          }
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
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.fabGradient}>
            <Text style={styles.fabText}>+ Nuevo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { padding: 16 },
  searchInput: { backgroundColor: 'rgba(255,255,255,0.04)', borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', color: '#ffffff' },
  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 10 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(245,158,11,0.15)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#f59e0b', fontSize: 18, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 16, fontWeight: '600', color: '#ffffff' },
  cardNacionalidad: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 2 },
  cardDetails: { gap: 4, paddingLeft: 56 },
  detailText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIconBg: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 15, color: 'rgba(255,255,255,0.4)' },
  fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 24, elevation: 8, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14 },
  fabText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
