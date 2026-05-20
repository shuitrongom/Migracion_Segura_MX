import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';
import { EstatusTramite, TipoTramite } from '@/types';

interface TramiteItem {
  id: string;
  tipo: TipoTramite;
  estatus: EstatusTramite;
  clienteNombre: string;
  fecha: string;
}

const MOCK_TRAMITES: TramiteItem[] = [
  {
    id: '1',
    tipo: TipoTramite.RESIDENCIA_TEMPORAL,
    estatus: EstatusTramite.EN_REVISION,
    clienteNombre: 'Carlos Rodríguez',
    fecha: '2025-05-15',
  },
  {
    id: '2',
    tipo: TipoTramite.VISA,
    estatus: EstatusTramite.RECIBIDO,
    clienteNombre: 'María López',
    fecha: '2025-05-14',
  },
  {
    id: '3',
    tipo: TipoTramite.RESIDENCIA_PERMANENTE,
    estatus: EstatusTramite.APROBADO,
    clienteNombre: 'John Smith',
    fecha: '2025-05-12',
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

export default function AdminTramitesScreen() {
  const [search, setSearch] = useState('');
  const [tramites] = useState<TramiteItem[]>(MOCK_TRAMITES);

  const filteredTramites = tramites.filter(
    (t) =>
      t.clienteNombre.toLowerCase().includes(search.toLowerCase()) ||
      t.tipo.toLowerCase().includes(search.toLowerCase()),
  );

  const renderTramite = ({ item }: { item: TramiteItem }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTipo}>{item.tipo.replace(/_/g, ' ')}</Text>
        <View style={[styles.badge, { backgroundColor: estatusColors[item.estatus] + '20' }]}>
          <Text style={[styles.badgeText, { color: estatusColors[item.estatus] }]}>
            {estatusLabels[item.estatus]}
          </Text>
        </View>
      </View>
      <Text style={styles.cardCliente}>👤 {item.clienteNombre}</Text>
      <Text style={styles.cardFecha}>📅 {item.fecha}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar trámite o cliente..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={filteredTramites}
        renderItem={renderTramite}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No se encontraron trámites</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab}>
        <Text style={styles.fabText}>+ Nuevo</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: '#E8DFD3',
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
    gap: 8,
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTipo: {
    fontSize: 15,
    fontWeight: '600',
    color: '#2C1810',
    textTransform: 'capitalize',
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
  cardCliente: {
    fontSize: 14,
    color: '#6B5B4F',
  },
  cardFecha: {
    fontSize: 13,
    color: '#8B7B6F',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
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
