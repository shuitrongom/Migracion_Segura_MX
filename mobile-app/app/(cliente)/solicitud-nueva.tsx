import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, Animated,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { apiFetch } from '@/lib/api';
import VisaForm from '@/components/forms/VisaForm';
import GenericTramiteForm from '@/components/forms/GenericTramiteForm';

const TIPOS_TRAMITE = [
  { value: 'visa', label: 'Visas solicitadas ante el INM', descripcion: 'Solicitud de visa por unidad familiar, razones humanitarias u oferta de empleo', icon: '✈️' },
  { value: 'permiso_trabajo', label: 'Permisos solicitados al INM', descripcion: 'Permiso para trabajar o permiso de salida y regreso', icon: '💼' },
  { value: 'notificacion_cambio', label: 'Notificación de Cambio', descripcion: 'Notificar cambio de estado civil, nombre, nacionalidad, domicilio o lugar de trabajo', icon: '📝' },
  { value: 'expedicion_documento', label: 'Expedición de Documento Migratorio', descripcion: 'Renovación, canje, reposición o expedición por acuerdo de documento migratorio', icon: '📄' },
  { value: 'regularizacion_migratoria', label: 'Regularización Migratoria', descripcion: 'Regularización por razones humanitarias, unidad familiar o documento vencido', icon: '📋' },
  { value: 'constancia_empleador', label: 'Constancia de Inscripción de Empleador', descripcion: 'Obtención o actualización de constancia para emitir ofertas de empleo a extranjeros', icon: '🏢' },
  { value: 'cambio_condicion_estancia', label: 'Cambio de Condición de Estancia', descripcion: 'Cambiar de una condición migratoria a otra (7 modalidades)', icon: '🔄' },
];

const EMPTY_FORM: Record<string, string> = {
  propositoViaje: '', especificaTramite: '', curpExtranjero: '',
  nombre: '', apellidos: '', sexo: '', fechaNacimiento: '',
  nacionalidad: '', estadoCivil: '',
  paisNacimiento: '', estadoProvinciaNacimiento: '',
  documentoIdentificacion: '', numeroDocumento: '',
  paisExpedicion: '', fechaExpedicion: '', fechaVencimiento: '',
  domCodigoPostal: '', domEstado: '', domMunicipio: '', domColonia: '', domCalle: '',
  domNumeroExterior: '', domNumeroInterior: '', domLada: '', domTelefonoFijo: '',
  actividadPrincipal: '', sectorTrabajo: '', situacionTrabajo: '', ocupacionTrabajo: '',
  expulsadoMexico: '', antecedentesPenales: '',
  empleadorTipoPersona: '', empleadorRfc: '', empleadorNumeroExpediente: '',
  solicitanteEmail: '', solicitanteEmailConfirmacion: '', comentarios: '',
};

const EMPTY_SOLICITANTE: Record<string, string> = {
  tipoPersona: '', curp: '', rfc: '', nombre: '', apellidos: '', nacionalidad: '',
  tipoDocumento: '', numeroDocumento: '', vinculoParentesco: '',
  codigoPostal: '', estado: '', municipio: '', colonia: '', calle: '',
  numeroExterior: '', numeroInterior: '', lada: '', telefonoFijo: '',
  moralRfc: '', moralRazonSocial: '', moralSector: '', moralGiroComercial: '',
  moralCodigoPostal: '', moralEstado: '', moralMunicipio: '', moralColonia: '',
  moralCalle: '', moralNumeroExterior: '', moralNumeroInterior: '', moralLada: '', moralTelefonoFijo: '',
  moralNumeroActa: '', moralFechaActa: '',
};

export default function SolicitudNuevaScreen() {
  const [step, setStep] = useState<0 | 1 | 2>(0); // 0=tipo, 1=form, 2=confirmacion
  const [tipoTramite, setTipoTramite] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY_FORM });
  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const [solicitante, setSolicitante] = useState<Record<string, string>>({ ...EMPTY_SOLICITANTE });
  const updateSolicitante = (field: string, value: string) => setSolicitante(prev => ({ ...prev, [field]: value }));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setSolicitante({ ...EMPTY_SOLICITANTE });
  };

  const handleSelectTipo = (value: string) => {
    setTipoTramite(value);
    resetForm();
    setStep(1);
  };

  const handleSubmit = async () => {
    // Validar según tipo de trámite
    if (tipoTramite !== 'constancia_empleador') {
      // Para todos los trámites excepto CIE, nombre y apellidos son obligatorios
      if (!form.nombre.trim() || !form.apellidos.trim()) {
        Alert.alert('Error', 'Nombre y apellidos son obligatorios');
        return;
      }
    }
    if (!form.solicitanteEmail.trim()) {
      Alert.alert('Error', 'Ingresa tu correo electrónico');
      return;
    }
    if (form.solicitanteEmail !== form.solicitanteEmailConfirmacion) {
      Alert.alert('Error', 'Los correos no coinciden');
      return;
    }

    setSubmitting(true);
    try {
      // Capturar ubicación automáticamente
      let ubicacion: { lat: number; lng: number; ciudad?: string } | null = null;
      try {
        const { status } = await Location.getForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          ubicacion = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          try {
            const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            if (geo) ubicacion.ciudad = `${geo.city || geo.district || ''}, ${geo.region || ''}`.trim().replace(/^,|,$/g, '');
          } catch {}
        }
      } catch {}

      const res = await apiFetch('/solicitudes', {
        method: 'POST',
        body: JSON.stringify({
          tipoTramite,
          datosFormulario: { ...form, solicitante, ubicacionOrigen: ubicacion },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        setStep(2);
      } else {
        Alert.alert('Error', Array.isArray(data.message) ? data.message.join('\n') : (data.message || 'No se pudo enviar la solicitud'));
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Paso 0: Seleccionar tipo ───────────────────────────────────────────────
  if (step === 0) {
    return (
      <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 }}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>

            <View style={styles.headerSection}>
              <Text style={styles.headerEmoji}>📄</Text>
              <Text style={styles.headerTitle}>Generar Solicitud</Text>
              <Text style={styles.headerSub}>Selecciona el tipo de trámite que necesitas</Text>
            </View>

            {/* Costo info */}
            <View style={styles.costoInfo}>
              <Text style={styles.costoLabel}>COSTO DEL SERVICIO</Text>
              <Text style={styles.costoValue}>$100 MXN</Text>
              <Text style={styles.costoNote}>Se genera el cobro una vez que tu solicitud sea procesada por el gestor</Text>
            </View>

            {TIPOS_TRAMITE.map((tipo) => (
              <TouchableOpacity
                key={tipo.value}
                style={styles.tipoCard}
                onPress={() => handleSelectTipo(tipo.value)}
                activeOpacity={0.8}
              >
                <View style={styles.tipoIcon}><Text style={{ fontSize: 22 }}>{tipo.icon}</Text></View>
                <View style={styles.tipoInfo}>
                  <Text style={styles.tipoLabel}>{tipo.label}</Text>
                  <Text style={styles.tipoDesc} numberOfLines={2}>{tipo.descripcion}</Text>
                </View>
                <Text style={{ fontSize: 22, color: '#f59e0b' }}>›</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ─── Paso 2: Confirmación ────────────────────────────────────────────────────
  if (step === 2) {
    return (
      <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.successContainer}>
        <Animated.View style={{ alignItems: 'center', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.successIconContainer}>
            <Text style={{ fontSize: 56 }}>✅</Text>
          </View>
          <Text style={styles.successTitle}>¡Solicitud enviada!</Text>
          <Text style={styles.successText}>
            Tu solicitud fue recibida exitosamente.{'\n\n'}
            En breve tu gestor la procesará en el INM y te enviará los requisitos.{'\n\n'}
            Recibirás una notificación con el enlace de pago por <Text style={{ color: '#f59e0b', fontWeight: '700' }}>$100 MXN</Text> una vez lista.
          </Text>
          <TouchableOpacity onPress={() => router.replace('/(cliente)/mis-tramites')} activeOpacity={0.85}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.successBtn}>
              <Text style={styles.successBtnText}>Volver al inicio</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  // ─── Paso 1: Formulario ──────────────────────────────────────────────────────
  const tipoInfo = TIPOS_TRAMITE.find(t => t.value === tipoTramite);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={{ flex: 1 }}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity onPress={() => setStep(0)} style={styles.backBtn}>
              <Text style={styles.backText}>← Cambiar tipo</Text>
            </TouchableOpacity>

            <Text style={styles.formTitle}>{tipoInfo?.label}</Text>
            <Text style={styles.formDesc}>Llena la información conforme a tu pasaporte o documento de identidad.</Text>

            {/* Costo destacado arriba del form */}
            <View style={styles.costoInfoSmall}>
              <Text style={styles.costoLabelSmall}>💰 Costo del servicio: </Text>
              <Text style={styles.costoValueSmall}>$100 MXN</Text>
              <Text style={styles.costoNoteSmall}> — Se cobra al procesar tu solicitud</Text>
            </View>

            {/* Formulario específico por tipo */}
            {tipoTramite === 'visa' ? (
              <VisaForm
                form={form}
                solicitante={solicitante}
                updateForm={updateForm}
                updateSolicitante={updateSolicitante}
              />
            ) : (
              <GenericTramiteForm
                tipo={tipoTramite}
                form={form}
                updateForm={updateForm}
              />
            )}

            {/* Botón enviar */}
            <TouchableOpacity
              style={[styles.submitBtnWrapper, submitting && { opacity: 0.6 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.submitBtn}>
                {submitting ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.submitText}>Enviar solicitud</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.disclaimer}>
              Al enviar, un gestor revisará tu información, la cargará en el INM y te enviará el cobro de $100 MXN.
            </Text>
          </ScrollView>
        </LinearGradient>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },

  headerSection: { alignItems: 'center', marginBottom: 20 },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, textAlign: 'center' },

  costoInfo: {
    backgroundColor: 'rgba(245,158,11,0.08)', borderRadius: 14, padding: 16,
    alignItems: 'center', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.25)',
  },
  costoLabel: { fontSize: 10, color: 'rgba(255,255,255,0.4)', fontWeight: '600', letterSpacing: 1.5 },
  costoValue: { fontSize: 30, fontWeight: '800', color: '#f59e0b', marginVertical: 4 },
  costoNote: { fontSize: 11, color: 'rgba(255,255,255,0.35)', textAlign: 'center' },

  costoInfoSmall: {
    flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap',
    backgroundColor: 'rgba(245,158,11,0.07)', borderRadius: 10, padding: 12,
    marginBottom: 16, borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)',
  },
  costoLabelSmall: { fontSize: 12, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  costoValueSmall: { fontSize: 14, fontWeight: '800', color: '#f59e0b' },
  costoNoteSmall: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },

  tipoCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16,
    marginBottom: 10, gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  tipoIcon: {
    width: 46, height: 46, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center',
  },
  tipoInfo: { flex: 1 },
  tipoLabel: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  tipoDesc: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 2, lineHeight: 16 },

  formTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  formDesc: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginBottom: 16, lineHeight: 18 },

  submitBtnWrapper: {
    borderRadius: 14, overflow: 'hidden', marginTop: 24,
    shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  submitBtn: { paddingVertical: 16, alignItems: 'center', justifyContent: 'center' },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  disclaimer: {
    fontSize: 11, color: 'rgba(255,255,255,0.35)',
    textAlign: 'center', marginTop: 12, lineHeight: 16, marginBottom: 20,
  },

  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIconContainer: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.03)',
    justifyContent: 'center', alignItems: 'center',
    marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
  },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginTop: 16, marginBottom: 8 },
  successText: {
    fontSize: 14, color: 'rgba(255,255,255,0.5)',
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  successBtn: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32,
    shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  successBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
