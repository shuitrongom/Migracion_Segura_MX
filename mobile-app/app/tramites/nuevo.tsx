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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

type TipoTramite =
  | 'residencia_temporal'
  | 'residencia_permanente'
  | 'regularizacion'
  | 'visa'
  | 'nacionalidad'
  | 'permiso_trabajo'
  | 'renovacion';

interface TipoOption {
  value: TipoTramite;
  label: string;
  description: string;
}

const TIPOS: TipoOption[] = [
  { value: 'residencia_temporal', label: 'Residencia Temporal', description: 'Permiso para residir temporalmente en México' },
  { value: 'residencia_permanente', label: 'Residencia Permanente', description: 'Permiso para residir de forma permanente en México' },
  { value: 'regularizacion', label: 'Regularización', description: 'Regularizar tu situación migratoria' },
  { value: 'visa', label: 'Visa', description: 'Solicitud de visa para ingresar a México' },
  { value: 'nacionalidad', label: 'Nacionalidad', description: 'Trámite de nacionalidad mexicana' },
  { value: 'permiso_trabajo', label: 'Permiso de Trabajo', description: 'Autorización para trabajar en México' },
  { value: 'renovacion', label: 'Renovación', description: 'Renovar tu documento migratorio vigente' },
];

interface FormData {
  nombreCompleto: string;
  nacionalidad: string;
  fechaNacimiento: string;
  pasaporteNumero: string;
  domicilioMexico: string;
}

export default function NuevoTramiteScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedTipo, setSelectedTipo] = useState<TipoTramite | null>(null);
  const [formData, setFormData] = useState<FormData>({
    nombreCompleto: '',
    nacionalidad: '',
    fechaNacimiento: '',
    pasaporteNumero: '',
    domicilioMexico: '',
  });

  const handleSelectTipo = (tipo: TipoTramite) => {
    setSelectedTipo(tipo);
    setStep(2);
  };

  const handleFormChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = (): boolean => {
    return (
      formData.nombreCompleto.trim().length > 0 &&
      formData.nacionalidad.trim().length > 0 &&
      formData.fechaNacimiento.trim().length > 0 &&
      formData.pasaporteNumero.trim().length > 0 &&
      formData.domicilioMexico.trim().length > 0
    );
  };

  const handleContinue = () => {
    if (!isFormValid()) {
      Alert.alert('Campos requeridos', 'Por favor completa todos los campos antes de continuar.');
      return;
    }
    setStep(3);
  };

  const handleSaveDraft = () => {
    Alert.alert('Borrador guardado', 'Tu trámite se ha guardado como borrador.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleSubmit = () => {
    Alert.alert(
      'Trámite enviado',
      'Tu trámite ha sido enviado correctamente. Recibirás tu número de pieza pronto.',
      [{ text: 'OK', onPress: () => router.back() }],
    );
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {[1, 2, 3].map((s) => (
        <View key={s} style={styles.stepRow}>
          <View style={[styles.stepDot, step >= s && styles.stepDotActive]}>
            <Text style={[styles.stepDotText, step >= s && styles.stepDotTextActive]}>
              {s}
            </Text>
          </View>
          {s < 3 && <View style={[styles.stepLine, step > s && styles.stepLineActive]} />}
        </View>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Selecciona el tipo de trámite</Text>
      <Text style={styles.stepSubtitle}>Elige el trámite migratorio que deseas iniciar</Text>
      {TIPOS.map((tipo) => (
        <TouchableOpacity
          key={tipo.value}
          style={styles.tipoCard}
          onPress={() => handleSelectTipo(tipo.value)}
          accessibilityRole="button"
          accessibilityLabel={`Seleccionar ${tipo.label}`}
        >
          <Text style={styles.tipoLabel}>{tipo.label}</Text>
          <Text style={styles.tipoDescription}>{tipo.description}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  const renderStep2 = () => (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.flex}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.stepTitle}>Datos personales</Text>
        <Text style={styles.stepSubtitle}>
          Completa la información requerida para tu trámite de{' '}
          {TIPOS.find((t) => t.value === selectedTipo)?.label}
        </Text>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nombre completo *</Text>
          <TextInput
            style={styles.input}
            value={formData.nombreCompleto}
            onChangeText={(v) => handleFormChange('nombreCompleto', v)}
            placeholder="Nombre(s) y apellido(s)"
            accessibilityLabel="Nombre completo"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Nacionalidad *</Text>
          <TextInput
            style={styles.input}
            value={formData.nacionalidad}
            onChangeText={(v) => handleFormChange('nacionalidad', v)}
            placeholder="País de origen"
            accessibilityLabel="Nacionalidad"
            autoCapitalize="words"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Fecha de nacimiento *</Text>
          <TextInput
            style={styles.input}
            value={formData.fechaNacimiento}
            onChangeText={(v) => handleFormChange('fechaNacimiento', v)}
            placeholder="DD/MM/AAAA"
            accessibilityLabel="Fecha de nacimiento"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Número de pasaporte *</Text>
          <TextInput
            style={styles.input}
            value={formData.pasaporteNumero}
            onChangeText={(v) => handleFormChange('pasaporteNumero', v)}
            placeholder="Número de pasaporte"
            accessibilityLabel="Número de pasaporte"
            autoCapitalize="characters"
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Domicilio en México *</Text>
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            value={formData.domicilioMexico}
            onChangeText={(v) => handleFormChange('domicilioMexico', v)}
            placeholder="Calle, número, colonia, ciudad, estado"
            accessibilityLabel="Domicilio en México"
            multiline
            numberOfLines={3}
          />
        </View>

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.draftButton}
            onPress={handleSaveDraft}
            accessibilityRole="button"
            accessibilityLabel="Guardar borrador"
          >
            <Text style={styles.draftButtonText}>Guardar borrador</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.primaryButton, !isFormValid() && styles.primaryButtonDisabled]}
            onPress={handleContinue}
            accessibilityRole="button"
            accessibilityLabel="Continuar al resumen"
          >
            <Text style={styles.primaryButtonText}>Continuar</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.stepTitle}>Confirmar trámite</Text>
      <Text style={styles.stepSubtitle}>Revisa la información antes de enviar</Text>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Tipo de trámite</Text>
        <Text style={styles.summaryValue}>
          {TIPOS.find((t) => t.value === selectedTipo)?.label}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Nombre completo</Text>
        <Text style={styles.summaryValue}>{formData.nombreCompleto}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Nacionalidad</Text>
        <Text style={styles.summaryValue}>{formData.nacionalidad}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Fecha de nacimiento</Text>
        <Text style={styles.summaryValue}>{formData.fechaNacimiento}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Número de pasaporte</Text>
        <Text style={styles.summaryValue}>{formData.pasaporteNumero}</Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Domicilio en México</Text>
        <Text style={styles.summaryValue}>{formData.domicilioMexico}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity
          style={styles.draftButton}
          onPress={() => setStep(2)}
          accessibilityRole="button"
          accessibilityLabel="Volver a editar"
        >
          <Text style={styles.draftButtonText}>Editar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleSubmit}
          accessibilityRole="button"
          accessibilityLabel="Enviar trámite"
        >
          <Text style={styles.primaryButtonText}>Enviar trámite</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {renderStepIndicator()}
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  flex: {
    flex: 1,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e5e7eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotActive: {
    backgroundColor: '#2563eb',
  },
  stepDotText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
  },
  stepDotTextActive: {
    color: '#ffffff',
  },
  stepLine: {
    width: 40,
    height: 2,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 4,
  },
  stepLineActive: {
    backgroundColor: '#2563eb',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  stepSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 20,
  },
  tipoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  tipoLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  tipoDescription: {
    fontSize: 13,
    color: '#6b7280',
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#111827',
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  draftButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#d1d5db',
    alignItems: 'center',
  },
  draftButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
  },
  primaryButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: '#2563eb',
    alignItems: 'center',
  },
  primaryButtonDisabled: {
    backgroundColor: '#93c5fd',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6b7280',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#111827',
  },
});
