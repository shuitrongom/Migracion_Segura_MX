import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useState } from 'react';

interface MiCita {
  id: string;
  asesorNombre: string;
  fecha: string;
  hora: string;
  modalidad: 'presencial' | 'videollamada';
  estatus: string;
  notas?: string;
}

const MOCK_CITAS: MiCita[] = [
  {
    id: '1',
    asesorNombre: 'Lic. Ana García',
    fecha: '2025-05-22',
    hora: '10:00',
    modalidad: 'videollamada',
    estatus: 'confirmada',
    notas: 'Revisión de documentos para residencia temporal',
  },
  {
    id: '2',
    asesorNombre: 'Lic. Roberto Méndez',
    fecha: '2025-05-28',
    hora: '14:00',
    modalidad: 'presencial',
    estatus: 'programada',
    notas: 'Entrega de documentos originales',
  },
];

export default function MisCitasScreen() {
  const [citas] = useState<MiCita[]>(MOCK_CITAS);

  const renderCita = ({ item }: { item: MiCita }) => (
    <View style={styles.card}>
      <View style={styles.cardDateSection}>
        <Text style={styles.cardDay}>
          {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-MX', { day: 'numeric' })}
        </Text>
        <Text style={styles.cardMonth}>
          {new Date(item.fecha + 'T00:00:00').toLocaleDateString('es-MX', { month: 'short' })}
        </Text>
        <Text style={styles.cardHora}>{item.hora}</Text>
      </View>

      <View style={styles.cardContent}>
        <Text style={styles.cardAsesor}>{item.asesorNombre}</Text>
        <Text style={styles.cardModalidad}>
          {item.modalidad === 'presencial' ? '🏢 Presencial' : '📹 Videollamada'}
        </Text>
        {item.notas && <Text style={styles.cardNotas}>{item.notas}</Text>}
        <View
          style={[
            styles.estatusBadge,
            {
              backgroundColor:
                item.estatus === 'confirmada' ? '#27AE6020' : '#E67E2220',
            },
          ]}
        >
          <Text
            style={[
              styles.estatusText,
              {
                color: item.estatus === 'confirmada' ? '#27AE60' : '#E67E22',
              },
            ]}
          >
            {item.estatus === 'confirmada' ? '✓ Confirmada' : '⏳ Programada'}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {citas.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>📅</Text>
          <Text style={styles.emptyTitle}>Sin citas programadas</Text>
          <Text style={styles.emptySubtitle}>
            Tu gestor te agendará citas cuando sea necesario
          </Text>
        </View>
      ) : (
        <FlatList
          data={citas}
          renderItem={renderCita}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListHeaderComponent={
            <Text style={styles.listHeader}>Próximas citas</Text>
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
    fontSize: 14,
    fontWeight: '500',
    color: '#6B5B4F',
    marginBottom: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardDateSection: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E8',
    borderRadius: 12,
    padding: 12,
    minWidth: 64,
  },
  cardDay: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2C1810',
  },
  cardMonth: {
    fontSize: 12,
    color: '#6B5B4F',
    textTransform: 'capitalize',
  },
  cardHora: {
    fontSize: 13,
    fontWeight: '600',
    color: '#C4A265',
    marginTop: 4,
  },
  cardContent: {
    flex: 1,
    gap: 4,
  },
  cardAsesor: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C1810',
  },
  cardModalidad: {
    fontSize: 13,
    color: '#6B5B4F',
  },
  cardNotas: {
    fontSize: 12,
    color: '#8B7B6F',
    marginTop: 4,
    lineHeight: 18,
  },
  estatusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 6,
  },
  estatusText: {
    fontSize: 12,
    fontWeight: '600',
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
