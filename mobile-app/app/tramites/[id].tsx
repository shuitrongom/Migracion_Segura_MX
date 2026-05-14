import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';

type EstatusTramite =
  | 'borrador'
  | 'recibido'
  | 'en_revision'
  | 'en_espera_resolucion'
  | 'aprobado'
  | 'rechazado'
  | 'cancelado';

interface Etapa {
  id: string;
  nombre: string;
  orden: number;
  completada: boolean;
  observaciones: string | null;
  fechaCompletada: string | null;
}

interface TramiteDetail {
  id: string;
  tipo: string;
  estatus: EstatusTramite;
  numeroPieza: string;
  createdAt: string;
  etapas: Etapa[];
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

const TIPO_LABELS: Record<string, string> = {
  residencia_temporal: 'Residencia Temporal',
  residencia_permanente: 'Residencia Permanente',
  regularizacion: 'Regularización',
  visa: 'Visa',
  nacionalidad: 'Nacionalidad',
  permiso_trabajo: 'Permiso de Trabajo',
  renovacion: 'Renovación',
};

// Mock data for detail
const MOCK_TRAMITE: TramiteDetail = {
  id: '1',
  tipo: 'residencia_temporal',
  estatus: 'en_revision',
  numeroPieza: 'MSM-2024-001234',
  createdAt: '2024-03-15T10:00:00Z',
  etapas: [
    {
      id: 'e1',
      nombre: 'Recepción de documentos',
      orden: 1,
      completada: true,
      observaciones: 'Documentos recibidos correctamente.',
      fechaCompletada: '2024-03-15T10:00:00Z',
    },
    {
      id: 'e2',
      nombre: 'Revisión inicial',
      orden: 2,
      completada: true,
      observaciones: 'Revisión completada sin observaciones.',
      fechaCompletada: '2024-03-17T14:30:00Z',
    },
    {
      id: 'e3',
      nombre: 'Análisis de expediente',
      orden: 3,
      completada: false,
      observaciones: 'En proceso de análisis por el asesor.',
      fechaCompletada: null,
    },
    {
      id: 'e4',
      nombre: 'Resolución INM',
      orden: 4,
      completada: false,
      observaciones: null,
      fechaCompletada: null,
    },
    {
      id: 'e5',
      nombre: 'Entrega de documento',
      orden: 5,
      completada: false,
      observaciones: null,
      fechaCompletada: null,
    },
  ],
};

export default function TramiteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const tramite = MOCK_TRAMITE; // In production, fetch by id

  const estatusConfig = ESTATUS_CONFIG[tramite.estatus];

  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  const currentEtapaIndex = tramite.etapas.findIndex((e) => !e.completada);
  const progressPercent =
    currentEtapaIndex === -1
      ? 100
      : Math.round((currentEtapaIndex / tramite.etapas.length) * 100);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Número de pieza */}
        <View style={styles.piezaContainer}>
          <Text style={styles.piezaLabel}>Número de pieza</Text>
          <Text style={styles.piezaValue}>{tramite.numeroPieza}</Text>
        </View>

        {/* Estatus y tipo */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Tipo</Text>
            <Text style={styles.infoValue}>{TIPO_LABELS[tramite.tipo] ?? tramite.tipo}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Estatus</Text>
            <View style={[styles.badge, { backgroundColor: estatusConfig.bg }]}>
              <Text style={[styles.badgeText, { color: estatusConfig.text }]}>
                {estatusConfig.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressSection}>
          <View style={styles.progressHeader}>
            <Text style={styles.sectionTitle}>Progreso</Text>
            <Text style={styles.progressPercent}>{progressPercent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progressPercent}%` }]} />
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.timelineSection}>
          <Text style={styles.sectionTitle}>Etapas del trámite</Text>
          {tramite.etapas.map((etapa, index) => {
            const isCurrent = index === currentEtapaIndex;
            return (
              <View
                key={etapa.id}
                style={styles.timelineItem}
                accessibilityLabel={`Etapa ${etapa.orden}: ${etapa.nombre}, ${etapa.completada ? 'completada' : isCurrent ? 'en proceso' : 'pendiente'}`}
              >
                {/* Connector line */}
                {index < tramite.etapas.length - 1 && (
                  <View
                    style={[
                      styles.timelineLine,
                      etapa.completada && styles.timelineLineCompleted,
                    ]}
                  />
                )}

                {/* Dot */}
                <View
                  style={[
                    styles.timelineDot,
                    etapa.completada && styles.timelineDotCompleted,
                    isCurrent && styles.timelineDotCurrent,
                  ]}
                >
                  {etapa.completada && <Text style={styles.checkmark}>✓</Text>}
                  {isCurrent && <View style={styles.currentDotInner} />}
                </View>

                {/* Content */}
                <View style={styles.timelineContent}>
                  <Text
                    style={[
                      styles.timelineNombre,
                      etapa.completada && styles.timelineNombreCompleted,
                      isCurrent && styles.timelineNombreCurrent,
                    ]}
                  >
                    {etapa.nombre}
                  </Text>
                  {etapa.fechaCompletada && (
                    <Text style={styles.timelineFecha}>
                      {formatDate(etapa.fechaCompletada)}
                    </Text>
                  )}
                  {etapa.observaciones && (
                    <View style={styles.observacionBox}>
                      <Text style={styles.observacionText}>{etapa.observaciones}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Documents section */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionTitle}>Documentos</Text>
          <View style={styles.documentsPlaceholder}>
            <Text style={styles.placeholderText}>
              Los documentos asociados a este trámite aparecerán aquí.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  piezaContainer: {
    backgroundColor: '#2563eb',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  piezaLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#bfdbfe',
    marginBottom: 4,
  },
  piezaValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
    fontFamily: 'monospace',
    letterSpacing: 1,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  infoItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2563eb',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  timelineSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 11,
    top: 24,
    bottom: -20,
    width: 2,
    backgroundColor: '#e5e7eb',
  },
  timelineLineCompleted: {
    backgroundColor: '#22c55e',
  },
  timelineDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    zIndex: 1,
  },
  timelineDotCompleted: {
    backgroundColor: '#22c55e',
  },
  timelineDotCurrent: {
    backgroundColor: '#dbeafe',
    borderWidth: 2,
    borderColor: '#2563eb',
  },
  checkmark: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '700',
  },
  currentDotInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 2,
  },
  timelineNombre: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9ca3af',
  },
  timelineNombreCompleted: {
    color: '#111827',
  },
  timelineNombreCurrent: {
    color: '#2563eb',
    fontWeight: '600',
  },
  timelineFecha: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  observacionBox: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 10,
    marginTop: 6,
  },
  observacionText: {
    fontSize: 13,
    color: '#4b5563',
    lineHeight: 18,
  },
  documentsSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  documentsPlaceholder: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 13,
    color: '#9ca3af',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
