import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useState, useCallback } from 'react';
import { EstatusTramite, TipoTramite } from '@/types';

interface MiTramite {
  id: string;
  tipo: TipoTramite;
  estatus: EstatusTramite;
  ultimaActualizacion: string;
  progreso: number; // 0-100
}

const MOCK_MIS_TRAMITES: MiTramite[] = [
  {
    id: '1',
    tipo: TipoTramite.RESIDENCIA_TEMPORAL,
    estatus: EstatusTramite.EN_REVISION,
    ultimaActualizacion: '2025-05-18',
    progreso: 60,
  },
  {
    id: '2',
    tipo: TipoTramite.PERMISO_TRABAJO,
    estatus: EstatusTramite.RECIBIDO,
    ultimaActualizacion: '2025-05-15',
    progreso: 30,
  },
];

const estatusColors: Record<string, string> = {
  borrador: '#9CA3AF',
  recibido: '#3498DB',
  en_revision: '#E67E22',
  en_espera_resolucion: '#9B59B6',
  aprobado: '#27AE60',
  rechazado: '#E74C3C',
  cancelado: '#6B7280',
};

const estatusLabels: Record<string, string> = {
  borrador: 'Borrador',
  recibido: 'Recibido',
  en_revision: 'En revisión',
  en_espera_resolucion: 'Esperando resolución',
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  cancelado: 'Cancelado',
};

const tipoLabels: Record<string, string> = {
  residencia_temporal: 'Residencia Temporal',
  residencia_permanente: 'Residencia Permanente',
  regularizacion: 'Regularización',
  cambio_condicion_migratoria: 'Cambio de Condición',
  visa: 'Visa',
  nacionalidad: 'Nacionalidad',
  permiso_trabajo: 'Permiso de Trabajo',
  renovacion: 'Renovación',
};

export default function MisTramitesScreen() {
  const [tramites] = useState<MiTramite[]>(MOCK_MIS_TRAMITES);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    // TODO: Refrescar desde API
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  const renderTramite = ({ item }: { item: MiTramite }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTipo}>{tipoLabels[item.tipo] || item.tipo}</Text>
        <View style={[styles.badge, { backgroundColor: estatusColors[item.estatus] + '20' }]}>
          <Text style={[styles.badgeText, { color: estatusColors[item.estatus] }]}>
            {estatusLabels[item.estatus]}
          </Text>
        </View>
      </View>

      {/* Barra de progreso */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${item.progreso}%`, backgroundColor: estatusColors[item.estatus] },
            ]}
          />
        </View>
        <Text style={styles.progressText}>{item.progreso}%</Text>
      </View>

      <Text style={styles.cardFecha}>
        Última actualización: {item.ultimaActualizacion}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {tramites.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📋</Text>
          <Text style={styles.emptyTitle}>Sin trámites activos</Text>
          <Text style={styles.emptySubtitle}>
            Cuando tu gestor inicie un trámite, aparecerá aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={tramites}
          renderItem={renderTramite}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <Text style={styles.listHeaderText}>
                {tramites.length} trámite{tramites.length !== 1 ? 's' : ''} activo{tramites.length !== 1 ? 's' : ''}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  list: {
    padding: 16,
    gap: 12,
  },
  listHeader: {
    marginBottom: 4,
  },
  listHeaderText: {
    fontSize: 14,
    color: '#6B5B4F',
    fontWeight: '500',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTipo: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C1810',
    flex: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#E8DFD3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B5B4F',
    minWidth: 36,
  },
  cardFecha: {
    fontSize: 12,
    color: '#8B7B6F',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 56,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2C1810',
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#6B5B4F',
    textAlign: 'center',
    lineHeight: 22,
  },
});
