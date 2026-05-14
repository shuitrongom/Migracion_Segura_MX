import { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Documento {
  id: string;
  nombre: string;
  estatus: 'pendiente' | 'recibido' | 'en_revision' | 'aprobado' | 'rechazado';
  fecha: string;
  fechaVencimiento?: string;
  tramiteId: string;
}

interface TramiteGroup {
  tramiteId: string;
  tramiteNombre: string;
  documentos: Documento[];
}

const ESTATUS_CONFIG: Record<string, { label: string; bgColor: string; textColor: string }> = {
  pendiente: { label: 'Pendiente', bgColor: '#fffbeb', textColor: '#b45309' },
  recibido: { label: 'Recibido', bgColor: '#eff6ff', textColor: '#2563eb' },
  en_revision: { label: 'En revisión', bgColor: '#fef3c7', textColor: '#92400e' },
  aprobado: { label: 'Aprobado', bgColor: '#f0fdf4', textColor: '#15803d' },
  rechazado: { label: 'Rechazado', bgColor: '#fef2f2', textColor: '#b91c1c' },
};

// Mock data
const MOCK_TRAMITE_GROUPS: TramiteGroup[] = [
  {
    tramiteId: '1',
    tramiteNombre: 'Residencia Temporal - MSM-2024-001234',
    documentos: [
      {
        id: '1',
        nombre: 'Pasaporte vigente',
        estatus: 'aprobado',
        fecha: '2024-03-10',
        fechaVencimiento: '2024-03-25',
        tramiteId: '1',
      },
      {
        id: '2',
        nombre: 'Comprobante de domicilio',
        estatus: 'en_revision',
        fecha: '2024-03-15',
        fechaVencimiento: '2024-03-22',
        tramiteId: '1',
      },
      {
        id: '3',
        nombre: 'Fotografías tamaño pasaporte',
        estatus: 'pendiente',
        fecha: '',
        tramiteId: '1',
      },
      {
        id: '4',
        nombre: 'Carta de empleo',
        estatus: 'rechazado',
        fecha: '2024-03-08',
        tramiteId: '1',
      },
      {
        id: '5',
        nombre: 'Acta de nacimiento apostillada',
        estatus: 'recibido',
        fecha: '2024-03-12',
        tramiteId: '1',
      },
    ],
  },
  {
    tramiteId: '2',
    tramiteNombre: 'Permiso de Trabajo - MSM-2024-001240',
    documentos: [
      {
        id: '6',
        nombre: 'Oferta de empleo',
        estatus: 'aprobado',
        fecha: '2024-02-20',
        tramiteId: '2',
      },
      {
        id: '7',
        nombre: 'Constancia de estudios',
        estatus: 'pendiente',
        fecha: '',
        tramiteId: '2',
      },
    ],
  },
];

const MOCK_DOCS_POR_VENCER = [
  { id: '1', nombre: 'Pasaporte vigente', diasRestantes: 5 },
  { id: '2', nombre: 'Comprobante de domicilio', diasRestantes: 4 },
];

export default function DocumentosScreen() {
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['1']);

  const toggleGroup = (tramiteId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(tramiteId) ? prev.filter((id) => id !== tramiteId) : [...prev, tramiteId],
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Mis Documentos</Text>

        {/* Alertas de documentos por vencer */}
        {MOCK_DOCS_POR_VENCER.length > 0 && (
          <View style={styles.alertSection}>
            <Text style={styles.alertSectionTitle}>⚠️ Documentos por vencer</Text>
            {MOCK_DOCS_POR_VENCER.map((doc) => (
              <View key={doc.id} style={styles.alertItem}>
                <Text style={styles.alertItemText}>
                  {doc.nombre} — vence en {doc.diasRestantes} días
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Upload button */}
        <TouchableOpacity
          style={styles.uploadButton}
          accessibilityRole="button"
          accessibilityLabel="Subir documento"
        >
          <Text style={styles.uploadButtonText}>+ Subir Documento</Text>
        </TouchableOpacity>

        {/* Documents grouped by tramite */}
        {MOCK_TRAMITE_GROUPS.map((group) => (
          <View key={group.tramiteId} style={styles.groupCard}>
            <TouchableOpacity
              style={styles.groupHeader}
              onPress={() => toggleGroup(group.tramiteId)}
              accessibilityRole="button"
              accessibilityLabel={`${expandedGroups.includes(group.tramiteId) ? 'Colapsar' : 'Expandir'} ${group.tramiteNombre}`}
            >
              <Text style={styles.groupTitle}>{group.tramiteNombre}</Text>
              <Text style={styles.groupChevron}>
                {expandedGroups.includes(group.tramiteId) ? '▼' : '▶'}
              </Text>
            </TouchableOpacity>

            {expandedGroups.includes(group.tramiteId) && (
              <View style={styles.docList}>
                {group.documentos.map((doc) => {
                  const config = ESTATUS_CONFIG[doc.estatus];
                  return (
                    <View key={doc.id} style={styles.docItem}>
                      <View style={styles.docInfo}>
                        <Text style={styles.docNombre}>{doc.nombre}</Text>
                        <Text style={styles.docFecha}>
                          {doc.fecha ? `Subido: ${doc.fecha}` : 'Sin subir'}
                        </Text>
                      </View>
                      <View style={[styles.estatusBadge, { backgroundColor: config.bgColor }]}>
                        <Text style={[styles.estatusBadgeText, { color: config.textColor }]}>
                          {config.label}
                        </Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 4 },
  alertSection: {
    backgroundColor: '#fffbeb',
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: '#f59e0b',
  },
  alertSectionTitle: { fontSize: 14, fontWeight: '600', color: '#b45309', marginBottom: 8 },
  alertItem: { marginBottom: 4 },
  alertItemText: { fontSize: 13, color: '#92400e' },
  uploadButton: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  uploadButtonText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  groupCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  groupTitle: { fontSize: 14, fontWeight: '600', color: '#374151', flex: 1 },
  groupChevron: { fontSize: 12, color: '#9ca3af' },
  docList: { paddingHorizontal: 16, paddingBottom: 8 },
  docItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  docInfo: { flex: 1, marginRight: 12 },
  docNombre: { fontSize: 14, fontWeight: '500', color: '#111827', marginBottom: 2 },
  docFecha: { fontSize: 12, color: '#9ca3af' },
  estatusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  estatusBadgeText: { fontSize: 11, fontWeight: '600' },
});
