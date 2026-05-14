import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Mock data
const MOCK_TRAMITE_ACTIVO = {
  id: '1',
  tipo: 'Residencia Temporal',
  numeroPieza: 'MSM-2024-001234',
  estatus: 'En revisión',
  etapasCompletadas: 3,
  etapasTotal: 6,
  tiempoEstimadoRestante: '15 días',
  ultimasActualizaciones: [
    { id: '1', fecha: '2024-03-18', descripcion: 'Documentos enviados a INM para revisión' },
    { id: '2', fecha: '2024-03-15', descripcion: 'Expediente completo verificado por asesor' },
    { id: '3', fecha: '2024-03-12', descripcion: 'Documento de identidad aprobado' },
  ],
};

const MOCK_CITAS = [
  {
    id: '1',
    fecha: '2024-03-25',
    hora: '10:00',
    modalidad: 'Videollamada',
    asesor: 'Carlos Mendoza',
  },
  {
    id: '2',
    fecha: '2024-04-02',
    hora: '14:30',
    modalidad: 'Presencial',
    asesor: 'Carlos Mendoza',
  },
];

const MOCK_DOCUMENTOS_PENDIENTES = 2;

const MOCK_ALERTAS = [
  { id: '1', mensaje: 'Tu pasaporte vence en 5 días', tipo: 'warning' as const },
  { id: '2', mensaje: 'Comprobante de domicilio por vencer', tipo: 'warning' as const },
];

export default function DashboardScreen() {
  const router = useRouter();
  const hasTramiteActivo = true;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>Hola, María</Text>
          <Text style={styles.subtitle}>Aquí está el resumen de tu trámite</Text>
        </View>

        {/* Alertas de documentos por vencer */}
        {MOCK_ALERTAS.length > 0 && (
          <View style={styles.alertSection}>
            {MOCK_ALERTAS.map((alerta) => (
              <View key={alerta.id} style={styles.alertCard}>
                <Text style={styles.alertIcon}>⚠️</Text>
                <Text style={styles.alertText}>{alerta.mensaje}</Text>
              </View>
            ))}
          </View>
        )}

        {hasTramiteActivo ? (
          <>
            {/* Trámite activo con barra de progreso */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Trámite Activo</Text>
                <View style={styles.estatusBadge}>
                  <Text style={styles.estatusBadgeText}>{MOCK_TRAMITE_ACTIVO.estatus}</Text>
                </View>
              </View>
              <Text style={styles.tramiteTipo}>{MOCK_TRAMITE_ACTIVO.tipo}</Text>
              <Text style={styles.tramiteNumero}>{MOCK_TRAMITE_ACTIVO.numeroPieza}</Text>

              {/* Barra de progreso */}
              <View style={styles.progressSection}>
                <View style={styles.progressLabelRow}>
                  <Text style={styles.progressLabel}>Progreso</Text>
                  <Text style={styles.progressValue}>
                    {MOCK_TRAMITE_ACTIVO.etapasCompletadas} / {MOCK_TRAMITE_ACTIVO.etapasTotal} etapas
                  </Text>
                </View>
                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${(MOCK_TRAMITE_ACTIVO.etapasCompletadas / MOCK_TRAMITE_ACTIVO.etapasTotal) * 100}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Tiempo estimado */}
              <View style={styles.tiempoEstimado}>
                <Text style={styles.tiempoLabel}>Tiempo estimado restante:</Text>
                <Text style={styles.tiempoValue}>{MOCK_TRAMITE_ACTIVO.tiempoEstimadoRestante}</Text>
              </View>
            </View>

            {/* Últimas actualizaciones */}
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Últimas Actualizaciones</Text>
              {MOCK_TRAMITE_ACTIVO.ultimasActualizaciones.map((update) => (
                <View key={update.id} style={styles.updateItem}>
                  <View style={styles.updateDot} />
                  <View style={styles.updateContent}>
                    <Text style={styles.updateDesc}>{update.descripcion}</Text>
                    <Text style={styles.updateFecha}>{update.fecha}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          /* Sin trámite activo */
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Sin Trámite Activo</Text>
            <Text style={styles.emptyText}>
              No tienes un trámite en curso. Inicia uno para comenzar tu proceso migratorio.
            </Text>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => router.push('/tramites/nuevo')}
              accessibilityRole="button"
              accessibilityLabel="Iniciar trámite"
            >
              <Text style={styles.primaryButtonText}>Iniciar Trámite</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Próximas citas */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Próximas Citas</Text>
          {MOCK_CITAS.length === 0 ? (
            <Text style={styles.emptyText}>No tienes citas programadas</Text>
          ) : (
            MOCK_CITAS.map((cita) => (
              <View key={cita.id} style={styles.citaItem}>
                <View style={styles.citaFecha}>
                  <Text style={styles.citaFechaText}>{cita.fecha}</Text>
                  <Text style={styles.citaHoraText}>{cita.hora}</Text>
                </View>
                <View style={styles.citaInfo}>
                  <Text style={styles.citaAsesor}>{cita.asesor}</Text>
                  <View
                    style={[
                      styles.modalidadBadge,
                      cita.modalidad === 'Videollamada'
                        ? styles.modalidadVideo
                        : styles.modalidadPresencial,
                    ]}
                  >
                    <Text style={styles.modalidadText}>{cita.modalidad}</Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Documentos pendientes */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Documentos Pendientes</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{MOCK_DOCUMENTOS_PENDIENTES}</Text>
            </View>
          </View>
          <Text style={styles.cardSubtitle}>
            Tienes {MOCK_DOCUMENTOS_PENDIENTES} documentos por subir o actualizar.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => router.push('/(tabs)/documentos')}
            accessibilityRole="button"
            accessibilityLabel="Ver documentos pendientes"
          >
            <Text style={styles.secondaryButtonText}>Ver Documentos</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  header: { marginBottom: 8 },
  greeting: { fontSize: 24, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 15, color: '#6b7280', marginTop: 4 },
  alertSection: { gap: 8 },
  alertCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#f59e0b',
    gap: 8,
  },
  alertIcon: { fontSize: 16 },
  alertText: { fontSize: 13, color: '#b45309', flex: 1, fontWeight: '500' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 8 },
  cardSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 12 },
  tramiteTipo: { fontSize: 15, fontWeight: '500', color: '#374151', marginBottom: 4 },
  tramiteNumero: { fontSize: 13, color: '#6b7280', fontFamily: 'monospace', marginBottom: 16 },
  estatusBadge: {
    backgroundColor: '#eff6ff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  estatusBadgeText: { fontSize: 12, fontWeight: '600', color: '#2563eb' },
  progressSection: { marginBottom: 12 },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabel: { fontSize: 13, color: '#6b7280' },
  progressValue: { fontSize: 13, fontWeight: '600', color: '#374151' },
  progressBarBg: {
    height: 8,
    backgroundColor: '#e5e7eb',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2563eb',
    borderRadius: 4,
  },
  tiempoEstimado: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  tiempoLabel: { fontSize: 13, color: '#6b7280' },
  tiempoValue: { fontSize: 13, fontWeight: '600', color: '#2563eb' },
  updateItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 },
  updateDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2563eb',
    marginTop: 5,
  },
  updateContent: { flex: 1 },
  updateDesc: { fontSize: 14, color: '#374151', marginBottom: 2 },
  updateFecha: { fontSize: 12, color: '#9ca3af' },
  citaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  citaFecha: {},
  citaFechaText: { fontSize: 14, fontWeight: '500', color: '#374151' },
  citaHoraText: { fontSize: 13, color: '#6b7280' },
  citaInfo: { alignItems: 'flex-end' },
  citaAsesor: { fontSize: 13, color: '#374151', marginBottom: 4 },
  modalidadBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  modalidadVideo: { backgroundColor: '#eff6ff' },
  modalidadPresencial: { backgroundColor: '#f0fdf4' },
  modalidadText: { fontSize: 11, fontWeight: '500', color: '#374151' },
  countBadge: {
    backgroundColor: '#ef4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  emptyText: { fontSize: 14, color: '#9ca3af', fontStyle: 'italic' },
  primaryButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  primaryButtonText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  secondaryButton: {
    backgroundColor: '#eff6ff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  secondaryButtonText: { fontSize: 14, fontWeight: '600', color: '#2563eb' },
});
