import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface FormSelectProps {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
  required?: boolean;
  placeholder?: string;
  searchable?: boolean;
}

export default function FormSelect({ label, value, options, onChange, required, placeholder = 'Selecciona', searchable = false }: FormSelectProps) {
  const [visible, setVisible] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = searchable && search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (item: string) => {
    onChange(item);
    setVisible(false);
    setSearch('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <TouchableOpacity style={styles.select} onPress={() => setVisible(true)}>
        <Text style={[styles.selectText, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          {/* Header fijo */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }} style={styles.closeButton}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {/* Buscador fijo debajo del header */}
          {searchable && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar..."
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                clearButtonMode="while-editing"
              />
            </View>
          )}

          {/* Lista de opciones */}
          <FlatList
            data={filtered}
            keyExtractor={(item, i) => `${item}-${i}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, item === value && styles.optionActive]}
                onPress={() => handleSelect(item)}
              >
                <Text style={[styles.optionText, item === value && styles.optionTextActive]} numberOfLines={2}>{item}</Text>
                {item === value && <Text style={styles.check}>✓</Text>}
              </TouchableOpacity>
            )}
            ListEmptyComponent={<Text style={styles.emptyText}>Sin resultados</Text>}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#4A3F37', marginBottom: 5 },
  select: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DFD3', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13 },
  selectText: { flex: 1, fontSize: 14, color: '#2C1810' },
  placeholder: { color: '#9CA3AF' },
  arrow: { fontSize: 14, color: '#8B7B6F', marginLeft: 8 },

  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E8DFD3' },
  modalTitle: { fontSize: 17, fontWeight: '600', color: '#2C1810' },
  closeButton: { paddingVertical: 4, paddingHorizontal: 8 },
  closeText: { fontSize: 15, color: '#C4A265', fontWeight: '600' },

  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0EBE3' },
  searchInput: { backgroundColor: '#F5F0E8', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#2C1810' },

  listContent: { paddingBottom: 40 },
  option: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F5F0E8', flexDirection: 'row', alignItems: 'center' },
  optionActive: { backgroundColor: '#F5F0E8' },
  optionText: { flex: 1, fontSize: 15, color: '#2C1810' },
  optionTextActive: { fontWeight: '600', color: '#C4A265' },
  check: { fontSize: 18, color: '#C4A265', fontWeight: '700', marginLeft: 8 },
  emptyText: { textAlign: 'center', padding: 24, color: '#8B7B6F', fontSize: 15 },
});
