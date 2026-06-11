import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, Pressable } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '@/lib/theme';

interface FormDatePickerProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
}

export default function FormDatePicker({ label, value, onChange, required, minYear = 1940, maxYear = 2040 }: FormDatePickerProps) {
  const { colors } = useTheme();
  const [show, setShow] = useState(false);

  const dateValue = value ? new Date(value + 'T00:00:00') : new Date(2000, 0, 1);
  const minDate = new Date(minYear, 0, 1);
  const maxDate = new Date(maxYear, 11, 31);

  const formatDisplay = (dateStr: string) => {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const handleChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShow(false);
    if (selectedDate) {
      const y = selectedDate.getFullYear();
      const m = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const d = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${y}-${m}-${d}`);
    }
  };

  if (Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <Text style={[styles.label, { color: colors.textMuted }]}>{label}{required ? ' *' : ''}</Text>
        <TouchableOpacity style={[styles.select, { backgroundColor: colors.bgInput, borderColor: colors.border }, value ? styles.selectFilled : null]} onPress={() => setShow(true)} activeOpacity={0.7}>
          <Text style={[styles.selectText, { color: colors.text }, !value && { color: colors.textMuted }]}>
            {value ? formatDisplay(value) : 'DD/MM/AAAA'}
          </Text>
          <Text style={styles.icon}>📅</Text>
        </TouchableOpacity>
        {show && (
          <DateTimePicker
            value={dateValue}
            mode="date"
            display="default"
            onChange={handleChange}
            minimumDate={minDate}
            maximumDate={maxDate}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}{required ? ' *' : ''}</Text>
      <TouchableOpacity style={[styles.select, { backgroundColor: colors.bgInput, borderColor: colors.border }, value ? styles.selectFilled : null]} onPress={() => setShow(true)} activeOpacity={0.7}>
        <Text style={[styles.selectText, { color: colors.text }, !value && { color: colors.textMuted }]}>
          {value ? formatDisplay(value) : 'DD/MM/AAAA'}
        </Text>
        <Text style={styles.icon}>📅</Text>
      </TouchableOpacity>

      <Modal visible={show} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={() => setShow(false)}>
          <View style={[styles.modal, { backgroundColor: colors.bgModal, borderTopColor: colors.border }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={[styles.cancelBtn, { color: colors.textMuted }]}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={[styles.modalTitle, { color: colors.text }]}>{label}</Text>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.doneBtn}>Listo</Text>
              </TouchableOpacity>
            </View>
            <DateTimePicker
              value={dateValue}
              mode="date"
              display="spinner"
              onChange={handleChange}
              minimumDate={minDate}
              maximumDate={maxDate}
              locale="es-MX"
              style={{ height: 200 }}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginBottom: 14 },
  label: { fontSize: 11, fontWeight: '600', marginBottom: 6, letterSpacing: 0.5, textTransform: 'uppercase' },
  select: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13 },
  selectFilled: { borderColor: 'rgba(245,158,11,0.35)' },
  selectText: { flex: 1, fontSize: 14 },
  icon: { fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 30, borderTopWidth: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 15, fontWeight: '700' },
  cancelBtn: { fontSize: 15 },
  doneBtn: { fontSize: 15, color: '#f59e0b', fontWeight: '700' },
});
