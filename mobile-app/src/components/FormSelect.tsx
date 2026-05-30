import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, TextInput, StyleSheet, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';

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
  const glowAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, { toValue: 1, tension: 65, friction: 11, useNativeDriver: true }).start();
    }
  }, [visible]);

  const filtered = searchable && search
    ? options.filter(o => o.toLowerCase().includes(search.toLowerCase()))
    : options;

  const handleSelect = (item: string) => {
    onChange(item);
    setVisible(false);
    setSearch('');
  };

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1A3A4A', '#00D4FF'],
  });

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <Animated.View style={[styles.selectWrapper, { borderColor }]}>
        <TouchableOpacity style={styles.select} onPress={() => setVisible(true)}>
          <Text style={[styles.selectText, !value && styles.placeholder]} numberOfLines={1}>
            {value || placeholder}
          </Text>
          <Text style={styles.arrow}>▾</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <LinearGradient colors={['#0A1628', '#0F2027', '#1A1A2E']} style={styles.modalGradient}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label}</Text>
              <TouchableOpacity onPress={() => { setVisible(false); setSearch(''); }} style={styles.closeButton}>
                <Text style={styles.closeText}>Cerrar</Text>
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            {searchable && (
              <View style={styles.searchContainer}>
                <TextInput
                  style={styles.searchInput}
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar..."
                  placeholderTextColor="#4A6FA5"
                  autoCorrect={false}
                  clearButtonMode="while-editing"
                />
              </View>
            )}

            {/* Lista */}
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
          </LinearGradient>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: '#8EC8F8', marginBottom: 5, letterSpacing: 0.3 },
  selectWrapper: { borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
  select: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1B2A', paddingHorizontal: 14, paddingVertical: 13 },
  selectText: { flex: 1, fontSize: 14, color: '#E0F7FA' },
  placeholder: { color: '#4A6FA5' },
  arrow: { fontSize: 14, color: '#00D4FF', marginLeft: 8 },

  modalContainer: { flex: 1, backgroundColor: '#0A1628' },
  modalGradient: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#1A3A4A' },
  modalTitle: { fontSize: 17, fontWeight: '700', color: '#E0F7FA', letterSpacing: 0.5 },
  closeButton: { paddingVertical: 4, paddingHorizontal: 8 },
  closeText: { fontSize: 15, color: '#00D4FF', fontWeight: '600' },

  searchContainer: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#1A3A4A' },
  searchInput: { backgroundColor: '#112240', borderWidth: 1, borderColor: '#1A3A4A', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: '#E0F7FA' },

  listContent: { paddingBottom: 40 },
  option: { paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#112240', flexDirection: 'row', alignItems: 'center' },
  optionActive: { backgroundColor: '#112240', borderLeftWidth: 3, borderLeftColor: '#00D4FF' },
  optionText: { flex: 1, fontSize: 15, color: '#B0C4DE' },
  optionTextActive: { fontWeight: '700', color: '#00D4FF' },
  check: { fontSize: 18, color: '#00D4FF', fontWeight: '700', marginLeft: 8 },
  emptyText: { textAlign: 'center', padding: 24, color: '#4A6FA5', fontSize: 15 },
});
