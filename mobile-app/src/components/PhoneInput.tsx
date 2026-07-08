import { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Text, Modal, FlatList, Pressable } from 'react-native';
import { useTheme } from '@/lib/theme';

interface Country {
  code: string;
  dial: string;
  flag: string;
  name: string;
  placeholder: string;
}

const COUNTRIES: Country[] = [
  { code: 'MX', dial: '+52', flag: '🇲🇽', name: 'México', placeholder: '55 1234 5678' },
  { code: 'US', dial: '+1', flag: '🇺🇸', name: 'Estados Unidos', placeholder: '555 123 4567' },
  { code: 'CO', dial: '+57', flag: '🇨🇴', name: 'Colombia', placeholder: '300 123 4567' },
  { code: 'VE', dial: '+58', flag: '🇻🇪', name: 'Venezuela', placeholder: '412 123 4567' },
  { code: 'GT', dial: '+502', flag: '🇬🇹', name: 'Guatemala', placeholder: '5123 4567' },
  { code: 'HN', dial: '+504', flag: '🇭🇳', name: 'Honduras', placeholder: '9123 4567' },
  { code: 'SV', dial: '+503', flag: '🇸🇻', name: 'El Salvador', placeholder: '7123 4567' },
  { code: 'NI', dial: '+505', flag: '🇳🇮', name: 'Nicaragua', placeholder: '8123 4567' },
  { code: 'CR', dial: '+506', flag: '🇨🇷', name: 'Costa Rica', placeholder: '8312 3456' },
  { code: 'PE', dial: '+51', flag: '🇵🇪', name: 'Perú', placeholder: '912 345 678' },
  { code: 'AR', dial: '+54', flag: '🇦🇷', name: 'Argentina', placeholder: '11 2345 6789' },
  { code: 'CL', dial: '+56', flag: '🇨🇱', name: 'Chile', placeholder: '9 1234 5678' },
  { code: 'BR', dial: '+55', flag: '🇧🇷', name: 'Brasil', placeholder: '11 91234 5678' },
  { code: 'EC', dial: '+593', flag: '🇪🇨', name: 'Ecuador', placeholder: '99 123 4567' },
  { code: 'CU', dial: '+53', flag: '🇨🇺', name: 'Cuba', placeholder: '5 123 4567' },
  { code: 'ES', dial: '+34', flag: '🇪🇸', name: 'España', placeholder: '612 34 56 78' },
  { code: 'DO', dial: '+1', flag: '🇩🇴', name: 'Rep. Dominicana', placeholder: '809 123 4567' },
  { code: 'PA', dial: '+507', flag: '🇵🇦', name: 'Panamá', placeholder: '6123 4567' },
  { code: 'BO', dial: '+591', flag: '🇧🇴', name: 'Bolivia', placeholder: '71234567' },
  { code: 'PY', dial: '+595', flag: '🇵🇾', name: 'Paraguay', placeholder: '981 123456' },
  { code: 'UY', dial: '+598', flag: '🇺🇾', name: 'Uruguay', placeholder: '94 123 456' },
  { code: 'HT', dial: '+509', flag: '🇭🇹', name: 'Haití', placeholder: '34 12 3456' },
];

interface PhoneInputProps {
  value: string;
  onChangeText: (fullNumber: string) => void;
}

export default function PhoneInput({ value, onChangeText }: PhoneInputProps) {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [digits, setDigits] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  const filteredCountries = searchText
    ? COUNTRIES.filter(c =>
        c.name.toLowerCase().includes(searchText.toLowerCase()) ||
        c.dial.includes(searchText)
      )
    : COUNTRIES;

  const handleDigitsChange = (text: string) => {
    const clean = text.replace(/\D/g, '').slice(0, 15);
    setDigits(clean);
    onChangeText(country.dial + clean);
  };

  const selectCountry = (c: Country) => {
    setCountry(c);
    setShowPicker(false);
    setSearchText('');
    onChangeText(c.dial + digits);
  };

  const containerBg = isDark ? 'rgba(255,255,255,0.04)' : colors.bgInput;
  const containerBorder = isFocused
    ? 'rgba(245,158,11,0.4)'
    : isDark ? 'rgba(255,255,255,0.08)' : colors.border;
  const containerBgFocused = isDark ? 'rgba(255,255,255,0.06)' : colors.bgInput;

  return (
    <View style={[
      styles.container,
      {
        backgroundColor: isFocused ? containerBgFocused : containerBg,
        borderColor: containerBorder,
      }
    ]}>
      {/* Selector de país */}
      <TouchableOpacity
        style={[styles.countryButton, { borderRightColor: isDark ? 'rgba(255,255,255,0.06)' : colors.border }]}
        onPress={() => setShowPicker(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{country.flag}</Text>
        <Text style={[styles.dial, { color: colors.text }]}>{country.dial}</Text>
        <Text style={[styles.arrow, { color: colors.textMuted }]}>▾</Text>
      </TouchableOpacity>

      {/* Input del número */}
      <TextInput
        style={[styles.input, { color: colors.text }]}
        value={digits}
        onChangeText={handleDigitsChange}
        placeholder={country.placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType="phone-pad"
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
      />

      {/* Modal selector de países */}
      <Modal visible={showPicker} animationType="slide" transparent>
        <Pressable style={styles.modalOverlay} onPress={() => { setShowPicker(false); setSearchText(''); }}>
          <Pressable style={[styles.modalContent, { backgroundColor: isDark ? '#1a1a1a' : '#ffffff' }]} onPress={() => {}}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : '#f0f0f0' }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Seleccionar país</Text>
              <TouchableOpacity onPress={() => { setShowPicker(false); setSearchText(''); }} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Buscador */}
            <View style={[styles.searchContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#f5f5f5', borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e0e0e0' }]}>
              <Text style={styles.searchIcon}>🔍</Text>
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                value={searchText}
                onChangeText={setSearchText}
                placeholder="Buscar país..."
                placeholderTextColor={colors.textMuted}
                autoCorrect={false}
              />
            </View>

            {/* Lista de países */}
            <FlatList
              data={filteredCountries}
              keyExtractor={(item) => item.code}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.countryRow,
                    item.code === country.code && { backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.08)' }
                  ]}
                  onPress={() => selectCountry(item)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.countryFlag}>{item.flag}</Text>
                  <View style={styles.countryInfo}>
                    <Text style={[styles.countryName, { color: colors.text }]}>{item.name}</Text>
                  </View>
                  <Text style={[styles.countryDial, { color: colors.textMuted }]}>{item.dial}</Text>
                  {item.code === country.code && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    overflow: 'hidden',
  },
  countryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 12,
    paddingVertical: 16,
    borderRightWidth: 1,
    gap: 6,
  },
  flag: { fontSize: 22 },
  dial: { fontSize: 15, fontWeight: '600' },
  arrow: { fontSize: 10, marginLeft: 2 },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 16,
    fontSize: 16,
    letterSpacing: 0.5,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { fontSize: 22, padding: 4 },

  // Search
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },

  // Country rows
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    gap: 14,
  },
  countryFlag: { fontSize: 26 },
  countryInfo: { flex: 1 },
  countryName: { fontSize: 15, fontWeight: '500' },
  countryDial: { fontSize: 14, fontWeight: '500' },
  checkmark: { fontSize: 16, color: '#f59e0b', fontWeight: '700', marginLeft: 8 },
});
