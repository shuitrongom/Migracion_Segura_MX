import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type EstatusTramite =
  | 'borrador'
  | 'recibido'
  | 'en_revision'
  | 'en_espera_resolucion'
  | 'aprobado'
  | 'rechazado'
  | 'cancelado';

interface Etapa {
  nombre: string;
  completada: boolean;
  fechaCompletada: string | null;
}

interface ConsultaResult {
  numeroPieza: string;
  tipo: string;
  estatus: EstatusTramite;
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

// Mock result for demo
const MOCK_RESULT: ConsultaResult = {
  numeroPieza: 'MSM-2024-001234',
  tipo: 'residencia_temporal',
  estatus: 'en_revision',
  etapas: [
    { nombre: 'Recepción de documentos', completada: true, fechaCompletada: '2024-03-15T10:00:00Z' },
    { nombre: 'Revisión inicial', completada: true, fechaCompletada: '2024-03-17T14:30:00Z' },
    { nombre: 'Análisis de expediente', completada: false, fechaCompletada: null },
    { nombre: 'Resolución INM', completada: false, fechaCompletada: null },
    { nombre: 'Entrega de documento', completada: false, fechaCompletada: null },
  ],
};

export default function ConsultaTramiteScreen() {
  const [numeroPieza, setNumeroPieza] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ConsultaResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = () => {
    if (!numeroPieza.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      if (numeroPieza.trim().toUpperCase() === 'MSM-2024-001234') {
        setResult(MOCK_RESULT);
      } else {
        setError('No se encontró ningún trámite con ese número de pieza. Verifica que el número sea correcto.');
      }
    }, 1500);
  };

  const formatDate = (dateStr: string): string => {
    return new Intl.DateTimeFormat('es-MX', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(dateStr));
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>Consultar trámite</Text>
        <Text style={styles.subtitle}>
          Ingresa tu número de pieza para consultar el estatus de tu trámite migratorio.
        </Text>

        {/* Search input */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.input}
            value={numeroPieza}
            onChangeText={setNumeroPieza}
            placeholder="Ej: MSM-2024-001234"
            accessibilityLabel="Número de pieza"
            autoCapitalize="characters"
            returnKeyType="search"
            onSubmitEditing={handleSearch}
          />
          <TouchableOpacity
            style={[styles.searchButton, !numeroPieza.trim() && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={!numeroPieza.trim() || loading}
            accessibilityRole="button"
            accessibilityLabel="Buscar trámite"
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <Text style={styles.searchButtonText}>Buscar</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Error state */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Result */}
        {result && (
          <View style={styles.resultContainer}>
            {/* Header */}
            <View style={styles.resultHeader}>
              <Text style={styles.resultPieza}>{result.numeroPieza}</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: ESTATUS_CONFIG[result.estatus].bg },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: ESTATUS_CONFIG[result.estatus].text },
                  ]}
                >
                  {ESTATUS_CONFIG[result.estatus].label}
                </Text>
              </View>
            </View>

            <Text style={styles.resultTipo}>
              {TIPO_LABELS[result.tipo] ?? result.tipo}
            </Text>

            {/* Timeline */}
            <View style={styles.timelineContainer}>
              <Text style={styles.timelineTitle}>Progreso del trámite</Text>
              {result.etapas.map((etapa, index) => {
                const isCurrent =
                  !etapa.completada &&
                  (index === 0 || result.etapas[index - 1].completada);
                return (
                  <View
                    key={index}
                    style={styles.timelineItem}
                    accessibilityLabel={`Etapa: ${etapa.nombre}, ${etapa.completada ? 'completada' : isCurrent ? 'en proceso' : 'pendiente'}`}
                  >
                    {index < result.etapas.length - 1 && (
                      <View
                        style={[
                          styles.timelineLine,
                          etapa.completada && styles.timelineLineCompleted,
                        ]}
                      />
                    )}
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
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        )}
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
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 24,
    lineHeight: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  input: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  searchButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  searchButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  errorIcon: {
    fontSize: 18,
  },
  errorText: {
    flex: 1,
    fontSize: 14,
    color: '#b91c1c',
    lineHeight: 20,
  },
  resultContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  resultPieza: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    fontFamily: 'monospace',
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
  resultTipo: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  timelineContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 16,
  },
  timelineTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 16,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 18,
    position: 'relative',
  },
  timelineLine: {
    position: 'absolute',
    left: 9,
    top: 22,
    bottom: -18,
    width: 2,
    backgroundColor: '#e5e7eb',
  },
  timelineLineCompleted: {
    backgroundColor: '#22c55e',
  },
  timelineDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
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
    fontSize: 10,
    color: '#ffffff',
    fontWeight: '700',
  },
  currentDotInner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#2563eb',
  },
  timelineContent: {
    flex: 1,
    paddingTop: 1,
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
});
