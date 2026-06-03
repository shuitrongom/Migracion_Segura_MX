import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet } from 'react-native';
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
      <TouchableOpacity
        style={[styles.select, value ? styles.selectFilled : null]}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, !value && styles.placeholder]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{label}</Text>
            <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }} style={styles.closeButton}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>

          {searchable && (
            <View style={styles.searchContainer}>
              <TextInput
                style={styles.searchInput}
                value={search}
                onChangeText={setSearch}
                placeholder="Buscar..."
                placeholderTextColor="rgba(255,255,255,0.25)"
                autoCorrect={false}
                clearButtonMode="while-editing"
                autoFocus
              />
            </View>
          )}

          <FlatList
            data={filtered}
            keyExtractor={(item, i) => `${item}-${i}`}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.listContent}
            getItemLayout={(_data, index) => ({ length: 50, offset: 50 * index, index })}
            initialNumToRender={25}
            maxToRenderPerBatch={25}
            windowSize={8}
            removeClippedSubviews={true}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.option, item === value && styles.optionActive]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.6}
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
  label: { fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.5)', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  select: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#1c1c1c',
    borderWidth: 1, borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 13,
  },
  selectFilled: { borderColor: 'rgba(245,158,11,0.35)' },
  selectText: { flex: 1, fontSize: 14, color: '#fff' },
  placeholder: { color: 'rgba(255,255,255,0.25)' },
  arrow: { fontSize: 12, color: 'rgba(245,158,11,0.7)', marginLeft: 8 },

  modalContainer: { flex: 1, backgroundColor: '#0d0d0d' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#222' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#fff' },
  closeButton: { paddingVertical: 4, paddingHorizontal: 8 },
  closeText: { fontSize: 15, color: '#f59e0b', fontWeight: '600' },

  searchContainer: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#1a1a1a' },
  searchInput: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, color: '#fff' },

  listContent: { paddingBottom: 40 },
  option: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#161616', flexDirection: 'row', alignItems: 'center' },
  optionActive: { backgroundColor: 'rgba(245,158,11,0.06)', borderLeftWidth: 3, borderLeftColor: '#f59e0b' },
  optionText: { flex: 1, fontSize: 15, color: 'rgba(255,255,255,0.75)' },
  optionTextActive: { fontWeight: '700', color: '#f59e0b' },
  check: { fontSize: 16, color: '#f59e0b', fontWeight: '700', marginLeft: 8 },
  emptyText: { textAlign: 'center', padding: 24, color: 'rgba(255,255,255,0.2)', fontSize: 15 },
});
