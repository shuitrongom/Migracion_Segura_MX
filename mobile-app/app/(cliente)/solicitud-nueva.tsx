import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '@/lib/api';

const { width } = Dimensions.get('window');

const TIPOS_TRAMITE = [
  { value: 'visa', label: 'Visas solicitadas ante el INM' },
  { value: 'permiso_trabajo', label: 'Permisos solicitados al INM' },
  { value: 'notificacion_cambio', label: 'Notificación de Cambio' },
  { value: 'expedicion_documento', label: 'Expedición de Documento Migratorio' },
  { value: 'regularizacion_migratoria', label: 'Regularización Migratoria' },
  { value: 'constancia_empleador', label: 'Constancia de Inscripción de Empleador' },
  { value: 'cambio_condicion_estancia', label: 'Cambio de Condición de Estancia' },
];

export default function SolicitudNuevaScreen() {
  const [step, setStep] = useState(0); // 0=tipo, 1=datos, 2=confirmacion
  const [tipoTramite, setTipoTramite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [datos, setDatos] = useState({
    nombre: '', apellidos: '', sexo: '', fechaNacimiento: '',
    nacionalidad: '', paisNacimiento: '', curp: '',
    email: '', telefono: '', domicilio: '',
    pasaporteNumero: '', pasaporteVigencia: '',
  });

  const fadeAnim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [step]);

  const updateDato = (field: string, value: string) => {
    const upper = ['curp'].includes(field) ? value.toUpperCase() : value;
    setDatos(prev => ({ ...prev, [field]: upper }));
  };

  const handleSubmit = async () => {
    if (!datos.nombre.trim() || !datos.apellidos.trim()) {
      Alert.alert('Error', 'Nombre y apellidos son obligatorios');
      return;
    }
    if (!datos.email.trim() || !datos.email.includes('@')) {
      Alert.alert('Error', 'Ingresa un correo válido');
      return;
    }

    setSubmitting(true);
    try {
      const res = await apiFetch('/solicitudes', {
        method: 'POST',
        body: JSON.stringify({
          tipoTramite,
          datosFormulario: datos,
        }),
      });

      if (res.ok) {
        setStep(2); // Pantalla de confirmación
      } else {
        const error = await res.json();
        Alert.alert('Error', error.message || 'No se pudo enviar la solicitud');
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setSubmitting(false);
    }
  };

  // Paso 0: Seleccionar tipo de trámite
  if (step === 0) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={StyleSheet.absoluteFill} />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>

            <View style={styles.headerSection}>
              <Text style={styles.headerEmoji}>📄</Text>
              <Text style={styles.headerTitle}>Generar Solicitud</Text>
              <Text style={styles.headerSub}>Selecciona el tipo de trámite que necesitas</Text>
            </View>

            <View style={styles.tiposList}>
              {TIPOS_TRAMITE.map((tipo) => (
                <TouchableOpacity
                  key={tipo.value}
                  style={[styles.tipoCard, tipoTramite === tipo.value && styles.tipoCardSelected]}
                  onPress={() => setTipoTramite(tipo.value)}
                  activeOpacity={0.8}
                >
                  <View style={[styles.tipoRadio, tipoTramite === tipo.value && styles.tipoRadioSelected]} />
                  <Text style={[styles.tipoLabel, tipoTramite === tipo.value && styles.tipoLabelSelected]}>{tipo.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {tipoTramite && (
              <TouchableOpacity style={styles.nextBtn} onPress={() => setStep(1)} activeOpacity={0.85}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.nextGradient}>
                  <Text style={styles.nextText}>Continuar →</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </Animated.View>
        </ScrollView>
      </View>
    );
  }

  // Paso 2: Confirmación
  if (step === 2) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={StyleSheet.absoluteFill} />
        <View style={styles.confirmContainer}>
          <View style={styles.confirmIcon}>
            <Text style={{ fontSize: 48 }}>✅</Text>
          </View>
          <Text style={styles.confirmTitle}>Solicitud enviada</Text>
          <Text style={styles.confirmText}>
            Tu solicitud fue recibida exitosamente.{'\n\n'}
            En breve tu gestor te contactará para procesar tu solicitud y enviarte los requisitos.{'\n\n'}
            Recibirás una notificación cuando esté lista.
          </Text>
          <TouchableOpacity style={styles.nextBtn} onPress={() => router.replace('/(cliente)/mis-tramites')} activeOpacity={0.85}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.nextGradient}>
              <Text style={styles.nextText}>Volver al inicio</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Paso 1: Formulario de datos
  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim }}>
          <TouchableOpacity onPress={() => setStep(0)} style={styles.backBtn}>
            <Text style={styles.backText}>← Cambiar tipo</Text>
          </TouchableOpacity>

          <View style={styles.headerSection}>
            <Text style={styles.headerTitle}>Tus datos</Text>
            <Text style={styles.headerSub}>Llena la información conforme a tu pasaporte</Text>
          </View>

          <View style={styles.formCard}>
            <LinearGradient colors={['rgba(245,158,11,0.1)', 'rgba(245,158,11,0.02)']} style={styles.formCardBorder} />
            <View style={styles.formInner}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NOMBRE(S) *</Text>
                <TextInput style={styles.input} value={datos.nombre} onChangeText={v => updateDato('nombre', v)} placeholder="Como aparece en pasaporte" placeholderTextColor="rgba(255,255,255,0.2)" autoCapitalize="words" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>APELLIDOS *</Text>
                <TextInput style={styles.input} value={datos.apellidos} onChangeText={v => updateDato('apellidos', v)} placeholder="Apellido paterno y materno" placeholderTextColor="rgba(255,255,255,0.2)" autoCapitalize="words" />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1 }]}>
                  <Text style={styles.label}>SEXO</Text>
                  <TextInput style={styles.input} value={datos.sexo} onChangeText={v => updateDato('sexo', v)} placeholder="H / M" placeholderTextColor="rgba(255,255,255,0.2)" maxLength={1} autoCapitalize="characters" />
                </View>
                <View style={[styles.inputGroup, { flex: 2 }]}>
                  <Text style={styles.label}>FECHA NACIMIENTO</Text>
                  <TextInput style={styles.input} value={datos.fechaNacimiento} onChangeText={v => updateDato('fechaNacimiento', v)} placeholder="DD/MM/AAAA" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="numeric" />
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NACIONALIDAD</Text>
                <TextInput style={styles.input} value={datos.nacionalidad} onChangeText={v => updateDato('nacionalidad', v)} placeholder="Ej: Colombiana" placeholderTextColor="rgba(255,255,255,0.2)" autoCapitalize="words" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>PAÍS DE NACIMIENTO</Text>
                <TextInput style={styles.input} value={datos.paisNacimiento} onChangeText={v => updateDato('paisNacimiento', v)} placeholder="Ej: Colombia" placeholderTextColor="rgba(255,255,255,0.2)" autoCapitalize="words" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CURP (si tienes)</Text>
                <TextInput style={styles.input} value={datos.curp} onChangeText={v => updateDato('curp', v)} placeholder="18 caracteres" placeholderTextColor="rgba(255,255,255,0.2)" maxLength={18} autoCapitalize="characters" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CORREO ELECTRÓNICO *</Text>
                <TextInput style={styles.input} value={datos.email} onChangeText={v => updateDato('email', v)} placeholder="tu@email.com" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="email-address" autoCapitalize="none" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>TELÉFONO / WHATSAPP</Text>
                <TextInput style={styles.input} value={datos.telefono} onChangeText={v => updateDato('telefono', v)} placeholder="+52 55 1234 5678" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="phone-pad" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>DOMICILIO EN MÉXICO</Text>
                <TextInput style={styles.input} value={datos.domicilio} onChangeText={v => updateDato('domicilio', v)} placeholder="Calle, número, colonia, ciudad" placeholderTextColor="rgba(255,255,255,0.2)" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>NÚMERO DE PASAPORTE</Text>
                <TextInput style={styles.input} value={datos.pasaporteNumero} onChangeText={v => updateDato('pasaporteNumero', v)} placeholder="Número de pasaporte" placeholderTextColor="rgba(255,255,255,0.2)" autoCapitalize="characters" />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>VIGENCIA DEL PASAPORTE</Text>
                <TextInput style={styles.input} value={datos.pasaporteVigencia} onChangeText={v => updateDato('pasaporteVigencia', v)} placeholder="DD/MM/AAAA" placeholderTextColor="rgba(255,255,255,0.2)" keyboardType="numeric" />
              </View>

              {/* Info de costo */}
              <View style={styles.costoInfo}>
                <Text style={styles.costoLabel}>Costo del servicio</Text>
                <Text style={styles.costoValue}>$100 MXN</Text>
                <Text style={styles.costoNote}>Se generará el cobro una vez que tu solicitud sea procesada</Text>
              </View>

              {/* Submit */}
              <TouchableOpacity style={[styles.nextBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting} activeOpacity={0.85}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.nextGradient}>
                  {submitting ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.nextText}>Enviar solicitud</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { paddingHorizontal: 20, paddingVertical: 50 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },

  headerSection: { alignItems: 'center', marginBottom: 24 },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'center' },

  tiposList: { gap: 10, marginBottom: 24 },
  tipoCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 14, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tipoCardSelected: { borderColor: 'rgba(245,158,11,0.5)', backgroundColor: 'rgba(245,158,11,0.05)' },
  tipoRadio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: 'rgba(255,255,255,0.2)' },
  tipoRadioSelected: { borderColor: '#f59e0b', backgroundColor: '#f59e0b' },
  tipoLabel: { fontSize: 14, color: 'rgba(255,255,255,0.6)', flex: 1, fontWeight: '500' },
  tipoLabelSelected: { color: '#ffffff' },

  formCard: { position: 'relative', borderRadius: 20, overflow: 'hidden', marginBottom: 30 },
  formCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 20 },
  formInner: { margin: 1, borderRadius: 19, backgroundColor: 'rgba(23,23,23,0.9)', padding: 20 },

  inputGroup: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 6 },
  input: { backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: '#ffffff' },
  row: { flexDirection: 'row', gap: 10 },

  costoInfo: { backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)' },
  costoLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 1 },
  costoValue: { fontSize: 28, fontWeight: '800', color: '#f59e0b', marginVertical: 4 },
  costoNote: { fontSize: 11, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

  nextBtn: { borderRadius: 14, overflow: 'hidden', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  nextGradient: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  nextText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  confirmContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  confirmIcon: { marginBottom: 20 },
  confirmTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', marginBottom: 16 },
  confirmText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', textAlign: 'center', lineHeight: 22, marginBottom: 32 },
});
