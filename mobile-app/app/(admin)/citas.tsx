import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useState } from 'react';

interface Cita {
  id: string;
  clienteNombre: string;
  fecha: string;
  hora: string;
  modalidad: 'presencial' | 'videollamada';
  estatus: string;
}

const MOCK_CITAS: Cita[] = [
  {
    id: '1',
    clienteNombre: 'Carlos Rodríguez',
    fecha: '2025-05-20',
    hora: '10:00',
    modalidad: 'presencial',
    estatus: 'confirmada',
  },
  {
    id: '2',
    clienteNombre: 'María López',
    fecha: '2025-05-20',
    hora: '11:30',
    modalidad: 'videollamada',
    estatus: 'programada',
  },
  {
    id: '3',
    clienteNombre: 'John Smith',
    fecha: '2025-05-21',
    hora: '09:00',
    modalidad: 'presencial',
    estatus: 'programada',
  },
];

export default function CitasScreen() {
  const [citas] = useState<Cita[]>(MOCK_CITAS);

  const renderCita = ({ item }: { item: Cita }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardLeft}>
        <Text style={styles.cardHora}>{item.hora}</Text>
        <Text style={styles.cardFecha}>{item.fecha}</Text>
      </View>
      <View style={styles.cardRight}>
        <Text style={styles.cardCliente}>{item.clienteNombre}</Text>
        <View style={styles.cardMeta}>
          <Text style={styles.modalidad}>
            {item.modalidad === 'presencial' ? '🏢 Presencial' : '📹 Videollamada'}
          </Text>
          <View
            style={[
              styles.estatusDot,
              { backgroundColor: item.estatus === 'confirmada' ? '#27AE60' : '#E67E22' },
            ]}
          />
          <Text style={styles.estatus}>{item.estatus}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Próximas citas</Text>
      </View>

      <FlatList
        data={citas}
        renderItem={renderCita}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📅</Text>
            <Text style={styles.emptyText}>No hay citas programadas</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+ Agendar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  header: {
    padding: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2C1810',
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 80,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 16,
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  cardLeft: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F0E8',
    borderRadius: 10,
    padding: 12,
    minWidth: 70,
  },
  cardHora: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2C1810',
  },
  cardFecha: {
    fontSize: 11,
    color: '#6B5B4F',
    marginTop: 2,
  },
  cardRight: {
    flex: 1,
    justifyContent: 'center',
    gap: 6,
  },
  cardCliente: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C1810',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalidad: {
    fontSize: 13,
    color: '#6B5B4F',
  },
  estatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  estatus: {
    fontSize: 12,
    color: '#6B5B4F',
    textTransform: 'capitalize',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#8B7B6F',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#C4A265',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  fabText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});
