import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet, Platform, Pressable, Animated, Easing } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface FormDatePickerProps {
  label: string;
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  required?: boolean;
  minYear?: number;
  maxYear?: number;
}

export default function FormDatePicker({ label, value, onChange, required, minYear = 1940, maxYear = 2040 }: FormDatePickerProps) {
  const [show, setShow] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      ])
    ).start();
  }, []);

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

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1A3A4A', '#00D4FF'],
  });

  if (Platform.OS === 'android') {
    return (
      <View style={styles.container}>
        <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
        <Animated.View style={[styles.selectWrapper, { borderColor }]}>
          <TouchableOpacity style={styles.select} onPress={() => setShow(true)}>
            <Text style={[styles.selectText, !value && styles.placeholder]}>
              {value ? formatDisplay(value) : 'DD/MM/AAAA'}
            </Text>
            <Text style={styles.icon}>📅</Text>
          </TouchableOpacity>
        </Animated.View>
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

  // iOS: modal con spinner
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}{required ? ' *' : ''}</Text>
      <Animated.View style={[styles.selectWrapper, { borderColor }]}>
        <TouchableOpacity style={styles.select} onPress={() => setShow(true)}>
          <Text style={[styles.selectText, !value && styles.placeholder]}>
            {value ? formatDisplay(value) : 'DD/MM/AAAA'}
          </Text>
          <Text style={styles.icon}>📅</Text>
        </TouchableOpacity>
      </Animated.View>

      <Modal visible={show} animationType="slide" transparent>
        <Pressable style={styles.overlay} onPress={() => setShow(false)}>
          <View style={styles.modal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShow(false)}>
                <Text style={styles.cancelBtn}>Cancelar</Text>
              </TouchableOpacity>
              <Text style={styles.modalTitle}>{label}</Text>
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
  label: { fontSize: 12, fontWeight: '600', color: '#8EC8F8', marginBottom: 5, letterSpacing: 0.3 },
  selectWrapper: { borderWidth: 1.5, borderRadius: 12, overflow: 'hidden' },
  select: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0D1B2A', paddingHorizontal: 14, paddingVertical: 13 },
  selectText: { flex: 1, fontSize: 14, color: '#E0F7FA' },
  placeholder: { color: '#4A6FA5' },
  icon: { fontSize: 16 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: '#0F2027', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#00D4FF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#1A3A4A' },
  modalTitle: { fontSize: 16, fontWeight: '700', color: '#E0F7FA' },
  cancelBtn: { fontSize: 15, color: '#4A6FA5' },
  doneBtn: { fontSize: 15, color: '#00D4FF', fontWeight: '700' },
});
