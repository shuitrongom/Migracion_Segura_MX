import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { router } from 'expo-router';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';

export default function AdminDashboardScreen() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState({ tramites: 0, clientes: 0, citas: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const userData = await storage.getItem('user_data');
    if (userData) setUser(JSON.parse(userData));

    try {
      const [tramitesRes, clientesRes, citasRes] = await Promise.all([
        apiFetch('/tramites?page=1&limit=1'),
        apiFetch('/clientes?page=1&limit=1'),
        apiFetch('/citas?page=1&limit=1'),
      ]);
      const tramitesData = tramitesRes.ok ? await tramitesRes.json() : { total: 0 };
      const clientesData = clientesRes.ok ? await clientesRes.json() : { total: 0 };
      const citasData = citasRes.ok ? await citasRes.json() : { total: 0 };
      setStats({
        tramites: tramitesData.total || tramitesData.data?.length || 0,
        clientes: clientesData.total || clientesData.data?.length || 0,
        citas: citasData.total || citasData.data?.length || 0,
      });
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  const isAdmin = user?.role === 'administrador';

  if (loading) {
    return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#C4A265" /></View>;
  }

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
      <View style={styles.welcome}>
        <Text style={styles.greeting}>Hola, {user?.fullName || user?.email || 'Admin'} 👋</Text>
        <Text style={styles.roleTag}>{isAdmin ? '🔑 Administrador' : '📋 Gestor'}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#C4A265' }]}>{stats.tramites}</Text>
          <Text style={styles.statLabel}>Trámites</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#27AE60' }]}>{stats.clientes}</Text>
          <Text style={styles.statLabel}>Extranjeros</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3498DB' }]}>{stats.citas}</Text>
          <Text style={styles.statLabel}>Citas</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Acciones rápidas</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(admin)/tramites')}>
            <Text style={styles.actionEmoji}>📄</Text>
            <Text style={styles.actionText}>Ver trámites</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(admin)/extranjeros')}>
            <Text style={styles.actionEmoji}>👤</Text>
            <Text style={styles.actionText}>Extranjeros</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(admin)/citas')}>
            <Text style={styles.actionEmoji}>📅</Text>
            <Text style={styles.actionText}>Citas</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(admin)/perfil')}>
            <Text style={styles.actionEmoji}>⚙️</Text>
            <Text style={styles.actionText}>Configuración</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' },
  welcome: { padding: 20, paddingBottom: 12 },
  greeting: { fontSize: 22, fontWeight: '700', color: '#2C1810' },
  roleTag: { fontSize: 14, color: '#6B5B4F', marginTop: 4 },
  statsGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 10 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center' },
  statValue: { fontSize: 28, fontWeight: '700' },
  statLabel: { fontSize: 12, color: '#6B5B4F', marginTop: 4 },
  section: { padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#2C1810', marginBottom: 12 },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  actionCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, alignItems: 'center', gap: 8, borderWidth: 1, borderColor: '#E8DFD3' },
  actionEmoji: { fontSize: 28 },
  actionText: { fontSize: 13, fontWeight: '500', color: '#2C1810' },
});
