import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { useState } from 'react';

interface Extranjero {
  id: string;
  nombre: string;
  email: string;
  telefono: string;
  nacionalidad: string;
  tramitesActivos: number;
}

const MOCK_EXTRANJEROS: Extranjero[] = [
  {
    id: '1',
    nombre: 'Carlos Rodríguez',
    email: 'carlos@email.com',
    telefono: '+52 55 1234 5678',
    nacionalidad: 'Colombiana',
    tramitesActivos: 2,
  },
  {
    id: '2',
    nombre: 'María López',
    email: 'maria@email.com',
    telefono: '+52 33 9876 5432',
    nacionalidad: 'Venezolana',
    tramitesActivos: 1,
  },
  {
    id: '3',
    nombre: 'John Smith',
    email: 'john@email.com',
    telefono: '+52 81 5555 4444',
    nacionalidad: 'Estadounidense',
    tramitesActivos: 3,
  },
];

export default function ExtranjerosScreen() {
  const [search, setSearch] = useState('');
  const [extranjeros] = useState<Extranjero[]>(MOCK_EXTRANJEROS);

  const filtered = extranjeros.filter(
    (e) =>
      e.nombre.toLowerCase().includes(search.toLowerCase()) ||
      e.email.toLowerCase().includes(search.toLowerCase()) ||
      e.nacionalidad.toLowerCase().includes(search.toLowerCase()),
  );

  const renderExtranjero = ({ item }: { item: Extranjero }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{item.nombre.charAt(0)}</Text>
        </View>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.nombre}</Text>
          <Text style={styles.cardNacionalidad}>🌍 {item.nacionalidad}</Text>
        </View>
        <View style={styles.tramitesBadge}>
          <Text style={styles.tramitesCount}>{item.tramitesActivos}</Text>
          <Text style={styles.tramitesLabel}>trámites</Text>
        </View>
      </View>
      <View style={styles.cardDetails}>
        <Text style={styles.detailText}>📧 {item.email}</Text>
        <Text style={styles.detailText}>📱 {item.telefono}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre, email o nacionalidad..."
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <FlatList
        data={filtered}
        renderItem={renderExtranjero}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>👤</Text>
            <Text style={styles.emptyText}>No se encontraron extranjeros</Text>
          </View>
        }
      />
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
    paddingBottom: 20,
    gap: 10,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E8DFD3',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#C4A265',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C1810',
  },
  cardNacionalidad: {
    fontSize: 13,
    color: '#6B5B4F',
    marginTop: 2,
  },
  tramitesBadge: {
    alignItems: 'center',
    backgroundColor: '#F5F0E8',
    borderRadius: 8,
    padding: 8,
  },
  tramitesCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#C4A265',
  },
  tramitesLabel: {
    fontSize: 10,
    color: '#6B5B4F',
  },
  cardDetails: {
    gap: 4,
    paddingLeft: 56,
  },
  detailText: {
    fontSize: 13,
    color: '#6B5B4F',
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
});
