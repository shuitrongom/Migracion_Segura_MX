import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Modal, FlatList, Pressable } from 'react-native';

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
  format: string; // placeholder format
}

const COUNTRIES: Country[] = [
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'México', format: '55 1234 5678' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'Estados Unidos', format: '(555) 123-4567' },
  { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia', format: '300 123 4567' },
  { code: 'VE', dial: '+58', flag: '🇻🇪', name: 'Venezuela', format: '412 123 4567' },
  { code: 'GT', dial: '+502', flag: '🇬🇹', name: 'Guatemala', format: '5123 4567' },
  { code: 'HN', dial: '+504', flag: '🇭🇳', name: 'Honduras', format: '9123 4567' },
  { code: 'SV', dial: '+503', flag: '🇸🇻', name: 'El Salvador', format: '7123 4567' },
  { code: 'NI', dial: '+505', flag: '🇳🇮', name: 'Nicaragua', format: '8123 4567' },
  { code: 'CR', dial: '+506', flag: '🇨🇷', name: 'Costa Rica', format: '8312 3456' },
  { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Perú', format: '912 345 678' },
  { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina', format: '11 2345 6789' },
  { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile', format: '9 1234 5678' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brasil', format: '11 91234 5678' },
  { code: 'EC', dial: '+593', flag: '🇪🇨', name: 'Ecuador', format: '99 123 4567' },
  { code: 'CU', dial: '+53', flag: '🇨🇺', name: 'Cuba', format: '5 123 4567' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'España', format: '612 34 56 78' },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (fullNumber: string) => void;
}

function formatPhoneDisplay(digits: string): string {
  // Format as groups of digits for readability
  const clean = digits.replace(/\D/g, '');
  if (clean.length <= 2) return clean;
  if (clean.length <= 4) return clean.slice(0, 2) + ' ' + clean.slice(2);
  if (clean.length <= 8) return clean.slice(0, 2) + ' ' + clean.slice(2, 6) + ' ' + clean.slice(6);
  return clean.slice(0, 2) + ' ' + clean.slice(2, 6) + ' ' + clean.slice(6, 10);
}

export default function PhoneInput({ value, onChangeText }: PhoneInputProps) {
  const [country, setCountry] = useState<Country>(COUNTRIES[0]); // México default
  const [digits, setDigits] = useState('');
  const [showPicker, setShowPicker] = useState(false);

  const handleDigitsChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 10);
    setDigits(clean);
    onChangeText(country.dial + clean);
  };

  const selectCountry = (c: Country) => {
    setCountry(c);
    setShowPicker(false);
    onChangeText(c.dial + digits);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.countryButton} onPress={() => setShowPicker(true)}>
        <Text style={styles.flag}>{country.flag}</Text>
        <Text style={styles.dial}>{country.dial}</Text>
        <Text style={styles.arrow}>▾</Text>
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        value={formatPhoneDisplay(digits)}
        onChangeText={handleDigitsChange}
        placeholder={country.format}
        placeholderTextColor="#9CA3AF"
        keyboardType="number-pad"
        maxLength={14}
      />

      <Modal visible={showPicker} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => setShowPicker(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Seleccionar país</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={COUNTRIES}
              keyExtractor={(item) => item.code}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.countryRow, item.code === country.code && styles.countryRowActive]}
                  onPress={() => selectCountry(item)}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <Text style={styles.countryName}>{item.name}</Text>
                  <Text style={styles.countryDial}>{item.dial}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFD3',
    borderRadius: 12,
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 10,
    paddingVertical: 14,
    borderRightWidth: 1,
    borderRightColor: '#E8DFD3',
    gap: 4,
  },
  flag: { fontSize: 20 },
  dial: { fontSize: 15, color: '#2C1810', fontWeight: '500' },
  arrow: { fontSize: 12, color: '#8B7B6F', marginLeft: 2 },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C1810',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8DFD3',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#2C1810' },
  modalClose: { fontSize: 20, color: '#6B5B4F', padding: 4 },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 12,
  },
  countryRowActive: { backgroundColor: '#F5F0E8' },
  countryFlag: { fontSize: 24 },
  countryName: { flex: 1, fontSize: 15, color: '#2C1810' },
  countryDial: { fontSize: 14, color: '#6B5B4F', fontWeight: '500' },
});
