import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { api } from '../../src/lib/api';

const TRAMITES = [
  { value: 'visa', label: 'Visas solicitadas ante el INM', description: 'Visa por unidad familiar, razones humanitarias u oferta de empleo' },
  { value: 'residencia_temporal', label: 'Residencia Temporal', description: 'Residir en México de 1 a 4 años' },
  { value: 'residencia_permanente', label: 'Residencia Permanente', description: 'Residir indefinidamente en México' },
  { value: 'regularizacion', label: 'Regularización Migratoria', description: 'Regularizar situación migratoria irregular' },
  { value: 'cambio_condicion_migratoria', label: 'Cambio de Condición', description: 'Cambiar de una condición migratoria a otra' },
  { value: 'nacionalidad', label: 'Nacionalidad Mexicana', description: 'Carta de naturalización o declaratoria' },
  { value: 'permiso_trabajo', label: 'Permiso de Trabajo', description: 'Autorización para actividades remuneradas' },
  { value: 'renovacion', label: 'Renovación de Documento', description: 'Renovar tarjeta de residente' },
  { value: 'cambio_domicilio', label: 'Cambio de Domicilio', description: 'Notificar cambio de domicilio al INM' },
  { value: 'reposicion_documento', label: 'Reposición de Documento', description: 'Reponer documento por robo o extravío' },
  { value: 'cambio_nacionalidad', label: 'Cambio de Nacionalidad', description: 'Notificar cambio de nacionalidad' },
];

export default function NuevoTramiteScreen() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [selectedTipo, setSelectedTipo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    apellidos: '',
    nacionalidad: '',
    fechaNacimiento: '',
    sexo: '',
    pasaporteNumero: '',
    telefono: '',
    email: '',
  });

  const handleSelectTipo = (tipo: string) => {
    setSelectedTipo(tipo);
    setStep(2);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return formData.nombre.trim() && formData.apellidos.trim() && formData.email.trim() && formData.telefono.trim();
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert('Campos requeridos', 'Completa nombre, apellidos, email y teléfono.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Crear cliente
      const clienteRes = await api.post('/clientes', {
        nombreCompleto: `${formData.nombre} ${formData.apellidos}`.trim(),
        email: formData.email,
        telefono: formData.telefono,
      });
      const clienteId = clienteRes.data.id;

      // 2. Crear trámite (se auto-asigna gestor)
      await api.post('/tramites', {
        tipo: selectedTipo,
        clienteId,
        datosFormulario: { ...formData },
        esBorrador: false,
      });

      setStep(3);
    } catch (error: any) {
      const msg = error?.response?.data?.message || 'Error al enviar tu solicitud';
      Alert.alert('Error', typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setSubmitting(false);
    }
  };

  // Step 1: Seleccionar trámite
  if (step === 1) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepDotTextActive}>1</Text></View>
          <View style={styles.stepLine} />
          <View style={styles.stepDot}><Text style={styles.stepDotText}>2</Text></View>
        </View>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.stepTitle}>¿Qué trámite necesitas?</Text>
          <Text style={styles.stepSubtitle}>Selecciona el trámite migratorio que deseas iniciar</Text>
          {TRAMITES.map((t) => (
            <TouchableOpacity key={t.value} style={[styles.tipoCard, selectedTipo === t.value && styles.tipoCardSelected]} onPress={() => handleSelectTipo(t.value)}>
              <Text style={[styles.tipoLabel, selectedTipo === t.value && styles.tipoLabelSelected]}>{t.label}</Text>
              <Text style={styles.tipoDescription}>{t.description}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  // Step 2: Datos del extranjero
  if (step === 2) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.stepIndicator}>
          <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepDotTextActive}>✓</Text></View>
          <View style={[styles.stepLine, styles.stepLineActive]} />
          <View style={[styles.stepDot, styles.stepDotActive]}><Text style={styles.stepDotTextActive}>2</Text></View>
        </View>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.stepTitle}>Tus datos personales</Text>
            <Text style={styles.stepSubtitle}>Información conforme a tu pasaporte o documento de identidad</Text>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre(s) *</Text>
              <TextInput style={styles.input} value={formData.nombre} onChangeText={(v) => handleFormChange('nombre', v)} placeholder="Nombre(s)" autoCapitalize="words" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Apellido(s) *</Text>
              <TextInput style={styles.input} value={formData.apellidos} onChangeText={(v) => handleFormChange('apellidos', v)} placeholder="Apellido(s)" autoCapitalize="words" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nacionalidad</Text>
              <TextInput style={styles.input} value={formData.nacionalidad} onChangeText={(v) => handleFormChange('nacionalidad', v)} placeholder="Ej: Colombiana" autoCapitalize="words" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Fecha de nacimiento</Text>
              <TextInput style={styles.input} value={formData.fechaNacimiento} onChangeText={(v) => handleFormChange('fechaNacimiento', v)} placeholder="DD/MM/AAAA" keyboardType="numbers-and-punctuation" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Sexo</Text>
              <View style={styles.sexRow}>
                <TouchableOpacity style={[styles.sexOption, formData.sexo === 'H' && styles.sexOptionActive]} onPress={() => handleFormChange('sexo', 'H')}>
                  <Text style={[styles.sexText, formData.sexo === 'H' && styles.sexTextActive]}>Hombre</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.sexOption, formData.sexo === 'M' && styles.sexOptionActive]} onPress={() => handleFormChange('sexo', 'M')}>
                  <Text style={[styles.sexText, formData.sexo === 'M' && styles.sexTextActive]}>Mujer</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Número de pasaporte</Text>
              <TextInput style={styles.input} value={formData.pasaporteNumero} onChangeText={(v) => handleFormChange('pasaporteNumero', v.toUpperCase())} placeholder="Número de pasaporte" autoCapitalize="characters" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Teléfono *</Text>
              <TextInput style={styles.input} value={formData.telefono} onChangeText={(v) => handleFormChange('telefono', v)} placeholder="+52 55 1234 5678" keyboardType="phone-pad" />
            </View>
            <View style={styles.formGroup}>
              <Text style={styles.label}>Correo electrónico *</Text>
              <TextInput style={styles.input} value={formData.email} onChangeText={(v) => handleFormChange('email', v)} placeholder="correo@ejemplo.com" keyboardType="email-address" autoCapitalize="none" />
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.draftButton} onPress={() => setStep(1)}>
                <Text style={styles.draftButtonText}>← Atrás</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.primaryButton, !isFormValid() && styles.primaryButtonDisabled]} onPress={handleSubmit} disabled={submitting}>
                {submitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Enviar solicitud</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Step 3: Confirmación - Se asignará gestor
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successIconText}>✓</Text>
        </View>
        <Text style={styles.successTitle}>¡Solicitud enviada!</Text>
        <Text style={styles.successMessage}>
          Tu solicitud de {TRAMITES.find(t => t.value === selectedTipo)?.label} ha sido recibida correctamente.
        </Text>
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>¿Qué sigue?</Text>
          <Text style={styles.infoText}>• Se asignará un gestor para dar seguimiento a tu trámite</Text>
          <Text style={styles.infoText}>• El gestor te contactará en breve por correo o WhatsApp</Text>
          <Text style={styles.infoText}>• Recibirás notificaciones sobre el avance de tu trámite</Text>
        </View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => router.back()}>
          <Text style={styles.primaryButtonText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  stepIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 60 },
  stepDot: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#e5e7eb', justifyContent: 'center', alignItems: 'center' },
  stepDotActive: { backgroundColor: '#8B5E3C' },
  stepDotText: { fontSize: 14, fontWeight: '600', color: '#6b7280' },
  stepDotTextActive: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  stepLine: { flex: 1, height: 2, backgroundColor: '#e5e7eb', marginHorizontal: 8 },
  stepLineActive: { backgroundColor: '#8B5E3C' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  stepTitle: { fontSize: 22, fontWeight: '700', color: '#111827', marginBottom: 4 },
  stepSubtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20 },
  tipoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 2, borderColor: '#e5e7eb' },
  tipoCardSelected: { borderColor: '#8B5E3C', backgroundColor: '#fdf8f4' },
  tipoLabel: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 3 },
  tipoLabelSelected: { color: '#8B5E3C' },
  tipoDescription: { fontSize: 13, color: '#6b7280' },
  formGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: '#111827' },
  sexRow: { flexDirection: 'row', gap: 12 },
  sexOption: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center', backgroundColor: '#fff' },
  sexOptionActive: { borderColor: '#8B5E3C', backgroundColor: '#fdf8f4' },
  sexText: { fontSize: 14, fontWeight: '500', color: '#6b7280' },
  sexTextActive: { color: '#8B5E3C', fontWeight: '600' },
  buttonRow: { flexDirection: 'row', gap: 12, marginTop: 24 },
  draftButton: { flex: 1, paddingVertical: 14, borderRadius: 10, borderWidth: 1, borderColor: '#d1d5db', alignItems: 'center' },
  draftButtonText: { fontSize: 15, fontWeight: '600', color: '#374151' },
  primaryButton: { flex: 1, paddingVertical: 14, borderRadius: 10, backgroundColor: '#8B5E3C', alignItems: 'center' },
  primaryButtonDisabled: { backgroundColor: '#c4a265' },
  primaryButtonText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#dcfce7', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  successIconText: { fontSize: 36, color: '#16a34a' },
  successTitle: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 8 },
  successMessage: { fontSize: 15, color: '#6b7280', textAlign: 'center', marginBottom: 24 },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#e5e7eb', width: '100%', marginBottom: 24 },
  infoTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  infoText: { fontSize: 14, color: '#4b5563', marginBottom: 8, lineHeight: 20 },
});
