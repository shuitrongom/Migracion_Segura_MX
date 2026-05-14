import { View, Text, ScrollView, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useState } from 'react';

type EstatusTramite =
  | 'borrador'
  | 'recibido'
  | 'en_revision'
  | 'en_espera_resolucion'
  | 'aprobado'
  | 'rechazado'
  | 'cancelado';

type TipoTramite =
  | 'residencia_temporal'
  | 'residencia_permanente'
  | 'regularizacion'
  | 'visa'
  | 'nacionalidad'
  | 'permiso_trabajo'
  | 'renovacion';

interface Tramite {
  id: string;
  tipo: TipoTramite;
  estatus: EstatusTramite;
  numeroPieza: string | null;
  createdAt: string;
}

const ESTATUS_CONFIG: Record<EstatusTramite, { label: string; bg: string; text: string }> = {
  borrador: { label: 'Borrador', bg: '#f3f4f6', text: '#4b5563' },
  recibido: { label: 'Recibido', bg: '#dbeafe', text: '#1d4ed8' },
  en_revision: { label: 'En revisión', bg: '#fef3c7', text: '#b45309' },
  en_espera_resolucion: { label: 'En espera', bg: '#ffedd5', text: '#c2410c' },
  aprobado: { label: 'Aprobado', bg: '#dcfce7', text: '#15803d' },
  rechazado: { label: 'Rechazado', bg: '#fef2f2', text: '#b91c1c' },
  cancelado: { label: 'Cancelado', bg: '#f3f4f6', text: '#6b7280' },
};

const TIPO_LABELS: Record<TipoTramite, string> = {
  residencia_temporal: 'Residencia Temporal',
  residencia_permanente: 'Residencia Permanente',
  regularizacion: 'Regularización',
  visa: 'Visa',
  nacionalidad: 'Nacionalidad',
  permiso_trabajo: 'Permiso de Trabajo',
  renovacion: 'Renovación',
};

// Mock data
const MOCK_TRAMITES: Tramite[] = [
  {
    id: '1',
    tipo: 'residencia_temporal',
    estatus: 'en_revision',
    numeroPieza: 'MSM-2024-001234',
    createdAt: '2024-03-15T10:00:00Z',
  },
  {
    id: '2',
    tipo: 'permiso_trabajo',
    estatus: 'recibido',
    numeroPieza: 'MSM-2024-001235',
    createdAt: '2024-03-10T14:30:00Z',
  },
  {
    id: '3',
    tipo: 'renovacion',
    estatus: 'borrador',
    numeroPieza: null,
    createdAt: '2024-03-20T09:00:00Z',
  },
];

export default function TramitesScreen() {
  const router = useRouter();
  const [tramites] = useState<Tramite[]>(MOCK_TRAMITES);

  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const renderTramiteCard = ({ item }: { item: Tramite }) => {
    const estatusConfig = ESTATUS_CONFIG[item.estatus];
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/tramites/${item.id}`)}
        accessibilityRole="button"
        accessibilityLabel={`Trámite ${TIPO_LABELS[item.tipo]}, estatus ${estatusConfig.label}`}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTipo}>{TIPO_LABELS[item.tipo]}</Text>
          <View style={[styles.badge, { backgroundColor: estatusConfig.bg }]}>
            <Text style={[styles.badgeText, { color: estatusConfig.text }]}>
              {estatusConfig.label}
            </Text>
          </View>
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardPieza}>
            {item.numeroPieza ?? 'Sin número de pieza'}
          </Text>
          <Text style={styles.cardFecha}>{formatDate(item.createdAt)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyIcon}>📋</Text>
      <Text style={styles.emptyTitle}>Sin trámites</Text>
      <Text style={styles.emptyText}>
        Aún no tienes trámites registrados. Inicia uno nuevo para comenzar tu proceso migratorio.
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => router.push('/tramites/nuevo')}
        accessibilityRole="button"
        accessibilityLabel="Iniciar nuevo trámite"
      >
        <Text style={styles.emptyButtonText}>Iniciar trámite</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Trámites</Text>
        <TouchableOpacity
          style={styles.consultaButton}
          onPress={() => router.push('/tramites/consulta')}
          accessibilityRole="button"
          accessibilityLabel="Consultar trámite por número de pieza"
        >
          <Text style={styles.consultaButtonText}>Consultar</Text>
        </TouchableOpacity>
      </View>

      {tramites.length === 0 ? (
        renderEmptyState()
      ) : (
        <FlatList
          data={tramites}
          renderItem={renderTramiteCard}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* FAB - Nuevo Trámite */}
      {tramites.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => router.push('/tramites/nuevo')}
          accessibilityRole="button"
          accessibilityLabel="Crear nuevo trámite"
        >
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
  },
  consultaButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#eff6ff',
    borderRadius: 8,
  },
  consultaButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2563eb',
  },
  listContent: {
    padding: 20,
    paddingTop: 8,
    gap: 12,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  cardTipo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
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
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardPieza: {
    fontSize: 13,
    color: '#6b7280',
    fontFamily: 'monospace',
  },
  cardFecha: {
    fontSize: 12,
    color: '#9ca3af',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  emptyButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  fabText: {
    fontSize: 28,
    color: '#ffffff',
    fontWeight: '300',
    marginTop: -2,
  },
});
