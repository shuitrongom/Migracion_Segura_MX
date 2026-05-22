import { View, Text, StyleSheet, FlatList, RefreshControl, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

const estatusConfig: Record<string, { color: string; label: string; icon: string; step: number }> = {
  borrador: { color: '#9CA3AF', label: 'Borrador', icon: '📝', step: 1 },
  recibido: { color: '#3498DB', label: 'Recibido', icon: '📥', step: 2 },
  en_revision: { color: '#E67E22', label: 'En revisión', icon: '🔍', step: 3 },
  en_espera_resolucion: { color: '#9B59B6', label: 'En espera de resolución', icon: '⏳', step: 4 },
  aprobado: { color: '#27AE60', label: 'Aprobado', icon: '✅', step: 5 },
  rechazado: { color: '#E74C3C', label: 'Rechazado', icon: '❌', step: 5 },
  cancelado: { color: '#6B7280', label: 'Cancelado', icon: '🚫', step: 0 },
};

const STEPS = ['Recibido', 'En revisión', 'En espera', 'Resuelto'];

export default function EstatusScreen() {
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

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadTramites(); setRefreshing(false); }, []);

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#C4A265" /></View>;

  const renderTramite = ({ item }: { item: any }) => {
    const config = estatusConfig[item.estatus] || estatusConfig.borrador;
    const currentStep = config.step;

    return (
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <View style={[styles.statusBadge, { backgroundColor: config.color + '15' }]}>
            <Text style={{ fontSize: 16 }}>{config.icon}</Text>
            <Text style={[styles.statusText, { color: config.color }]}>{config.label}</Text>
          </View>
          {item.numeroPieza && (
            <Text style={styles.pieceNumber}>#{item.numeroPieza}</Text>
          )}
        </View>

        {/* Tipo de trámite */}
        <Text style={styles.tramiteType}>{(item.tipo || '').replace(/_/g, ' ')}</Text>

        {/* Timeline de progreso */}
        <View style={styles.timeline}>
          {STEPS.map((step, index) => {
            const isCompleted = index < currentStep - 1;
            const isCurrent = index === currentStep - 1;
            return (
              <View key={step} style={styles.timelineStep}>
                <View style={[
                  styles.timelineDot,
                  isCompleted && { backgroundColor: '#27AE60' },
                  isCurrent && { backgroundColor: config.color, transform: [{ scale: 1.3 }] },
                  !isCompleted && !isCurrent && { backgroundColor: '#E8DFD3' },
                ]} />
                {index < STEPS.length - 1 && (
                  <View style={[styles.timelineLine, isCompleted && { backgroundColor: '#27AE60' }]} />
                )}
                <Text style={[styles.timelineLabel, isCurrent && { color: config.color, fontWeight: '600' }]}>{step}</Text>
              </View>
            );
          })}
        </View>

        {/* Fecha */}
        <Text style={styles.date}>Iniciado: {item.createdAt?.slice(0, 10)}</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Estatus de trámites</Text>
        <Text style={styles.subtitle}>Sigue el progreso de tus solicitudes</Text>
      </View>

      {tramites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 48 }}>📋</Text>
          <Text style={styles.emptyTitle}>Sin trámites</Text>
          <Text style={styles.emptyText}>Cuando inicies un trámite, aquí verás su progreso en tiempo real</Text>
        </View>
      ) : (
        <FlatList
          data={tramites}
          renderItem={renderTramite}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4A265" />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8', paddingTop: 56 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' },
  header: { paddingHorizontal: 16, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#2C1810' },
  subtitle: { fontSize: 13, color: '#6B5B4F', marginTop: 4 },
  list: { paddingHorizontal: 16, paddingBottom: 20 },

  card: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 18, marginBottom: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 2 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 13, fontWeight: '600' },
  pieceNumber: { fontSize: 12, color: '#8B7B6F', fontFamily: 'monospace' },
  tramiteType: { fontSize: 16, fontWeight: '600', color: '#2C1810', textTransform: 'capitalize', marginBottom: 16 },

  timeline: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 },
  timelineStep: { alignItems: 'center', flex: 1 },
  timelineDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E8DFD3', marginBottom: 6 },
  timelineLine: { position: 'absolute', top: 5, left: '50%', right: '-50%', height: 2, backgroundColor: '#E8DFD3' },
  timelineLabel: { fontSize: 10, color: '#8B7B6F', textAlign: 'center' },

  date: { fontSize: 11, color: '#8B7B6F' },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: '#2C1810' },
  emptyText: { fontSize: 13, color: '#6B5B4F', textAlign: 'center', lineHeight: 20 },
});
