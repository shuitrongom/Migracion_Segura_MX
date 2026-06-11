import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
  ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback,
  Keyboard, Animated,
} from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme';
import { storage } from '@/lib/storage';
import DocumentUploadStep from '@/components/DocumentUploadStep';
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
  const params = useLocalSearchParams<{ beneficiarioId?: string; beneficiarioNombre?: string }>();
  const { colors } = useTheme();
  const [step, setStep] = useState<'tipo' | 'form' | 'docs' | 'success'>('tipo'); // tipo=seleccionar, form=formulario, docs=documentos, success=confirmacion
  const [tipoTramite, setTipoTramite] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [beneficiarioId, setBeneficiarioId] = useState<string | null>(params.beneficiarioId || null);
  const [beneficiarioNombre, setBeneficiarioNombre] = useState(params.beneficiarioNombre || '');
  const [beneficiarios, setBeneficiarios] = useState<any[]>([]);
  const [loadingBeneficiarios, setLoadingBeneficiarios] = useState(true);

  const [form, setForm] = useState<Record<string, string>>({ ...EMPTY_FORM });
  const updateForm = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  const [solicitante, setSolicitante] = useState<Record<string, string>>({ ...EMPTY_SOLICITANTE });
  const updateSolicitante = (field: string, value: string) => setSolicitante(prev => ({ ...prev, [field]: value }));

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    loadBeneficiarios();
  }, []);

  // Escuchar cuando se regresa de la pantalla de beneficiarios con uno seleccionado
  useEffect(() => {
    if (params.beneficiarioId && params.beneficiarioId !== beneficiarioId) {
      setBeneficiarioId(params.beneficiarioId);
      setBeneficiarioNombre(params.beneficiarioNombre || '');
      // Fetch del beneficiario para pre-llenar datos
      fetchBeneficiario(params.beneficiarioId);
    }
  }, [params.beneficiarioId]);

  const fetchBeneficiario = async (id: string) => {
    try {
      const res = await apiFetch(`/beneficiarios/mis-beneficiarios/${id}`);
      if (res.ok) {
        const b = await res.json();
        selectBeneficiario(b);
      }
    } catch {}
  };

  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(30);
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, [step]);

  const loadBeneficiarios = async () => {
    try {
      const res = await apiFetch('/beneficiarios/mis-beneficiarios');
      if (res.ok) {
        const data = await res.json();
        setBeneficiarios(Array.isArray(data) ? data : []);
      }
    } catch {}
    setLoadingBeneficiarios(false);
  };

  const selectBeneficiario = (b: any) => {
    setBeneficiarioId(b.id);
    setBeneficiarioNombre(`${b.nombre} ${b.apellidos}`);
    // Pre-llenar formulario con datos del beneficiario
    setForm(prev => ({
      ...prev,
      nombre: b.nombre || '',
      apellidos: b.apellidos || '',
      sexo: b.sexo || '',
      fechaNacimiento: b.fechaNacimiento || '',
      nacionalidad: b.nacionalidad || '',
      estadoCivil: b.estadoCivil || '',
      paisNacimiento: b.paisNacimiento || '',
      curpExtranjero: b.curp || '',
      documentoIdentificacion: b.tipoDocumento || '',
      numeroDocumento: b.numeroDocumento || '',
      paisExpedicion: b.paisExpedicion || '',
      solicitanteEmail: b.email || '',
      solicitanteEmailConfirmacion: b.email || '',
    }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM });
    setSolicitante({ ...EMPTY_SOLICITANTE });
  };

  const handleSelectTipo = (value: string) => {
    setTipoTramite(value);
    resetForm();
    setStep('form');
  };

  const handleSubmit = async () => {
    // Validar según tipo de trámite — campos NO obligatorios, solo email requerido
    if (!form.solicitanteEmail.trim()) {
      Alert.alert('Error', 'Ingresa tu correo electrónico');
      return;
    }
    if (form.solicitanteEmailConfirmacion.trim() && form.solicitanteEmail !== form.solicitanteEmailConfirmacion) {
      Alert.alert('Error', 'Los correos no coinciden');
      return;
    }
    // Ir al paso de documentos
    setStep('docs');
  };

  const handleDocumentsComplete = async (docs: any[], whatsapp: string) => {
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

      // 1. Enviar solicitud con el teléfono
      const res = await apiFetch('/solicitudes', {
        method: 'POST',
        body: JSON.stringify({
          tipoTramite,
          beneficiarioId: beneficiarioId || undefined,
          datosFormulario: { ...form, solicitante, telefono: whatsapp, ubicacionOrigen: ubicacion },
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        Alert.alert('Error', Array.isArray(data.message) ? data.message.join('\n') : (data.message || 'No se pudo enviar la solicitud'));
        setSubmitting(false);
        return;
      }

      // 2. Subir documentos
      const token = await storage.getItem('access_token');
      for (const doc of docs) {
        try {
          const formData = new FormData();
          formData.append('file', {
            uri: doc.uri,
            name: `${doc.label}_${doc.side || 'doc'}_${Date.now()}.jpg`,
            type: 'image/jpeg',
          } as any);
          formData.append('nombre', `${doc.label}${doc.side ? ' - ' + doc.side : ''}`);
          formData.append('categoria', doc.label.toLowerCase().includes('pasaporte') ? 'pasaporte' : doc.label.toLowerCase().includes('residencia') ? 'identificacion' : 'comprobante');
          if (data.id) formData.append('tramiteId', data.id);

          await fetch('https://api.migracionseguramx.com/api/v1/documentos/upload', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
        } catch {}
      }

      setStep('success');
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setSubmitting(false);
    }
  };

  // ─── Paso 0: Seleccionar tipo ───────────────────────────────────────────────
  if (step === 'tipo') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={{ flex: 1 }}>
        <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingTop: 56, paddingBottom: 40 }}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← Volver</Text>
            </TouchableOpacity>

            <View style={styles.headerSection}>
              <Text style={styles.headerEmoji}>📄</Text>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Solicitud y Escritos</Text>
              <Text style={[styles.headerSub, { color: colors.textMuted }]}>Selecciona el tipo de trámite que necesitas</Text>
            </View>

            {/* Costo info */}
            <View style={styles.costoInfo}>
              <Text style={styles.costoLabel}>COSTO POR DOCUMENTO</Text>
              <Text style={styles.costoValue}>$100 MXN c/u</Text>
              <Text style={styles.costoNote}>Solicitud: $100 · Escrito: $100 · Cada documento adicional: $100</Text>
            </View>

            {/* Seleccionar beneficiario */}
            <View style={{ marginBottom: 20 }}>
              <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>¿Para quién es la solicitud?</Text>
              {beneficiarioId ? (
                <View style={{ backgroundColor: 'rgba(245,158,11,0.08)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Text style={{ fontSize: 20 }}>👤</Text>
                    <Text style={{ color: '#fff', fontSize: 15, fontWeight: '600' }}>{beneficiarioNombre}</Text>
                  </View>
                  <TouchableOpacity onPress={() => { setBeneficiarioId(null); setBeneficiarioNombre(''); }}>
                    <Text style={{ color: '#f59e0b', fontSize: 12 }}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              ) : loadingBeneficiarios ? (
                <ActivityIndicator color="#f59e0b" />
              ) : beneficiarios.length === 0 ? (
                <TouchableOpacity
                  style={{ borderWidth: 2, borderColor: '#f59e0b', borderStyle: 'dashed', borderRadius: 12, padding: 16, alignItems: 'center' }}
                  onPress={() => router.push({ pathname: '/(cliente)/beneficiarios', params: { selectMode: 'true', redirect: '/(cliente)/solicitud-nueva' } })}
                >
                  <Text style={{ color: '#f59e0b', fontSize: 14, fontWeight: '600' }}>➕ Registrar extranjero primero</Text>
                  <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>Necesitas registrar a la persona para quien harás la solicitud</Text>
                </TouchableOpacity>
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -4 }}>
                  {beneficiarios.map((b: any) => (
                    <TouchableOpacity
                      key={b.id}
                      style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginHorizontal: 4, minWidth: 130, alignItems: 'center' }}
                      onPress={() => selectBeneficiario(b)}
                    >
                      <Text style={{ fontSize: 24, marginBottom: 4 }}>👤</Text>
                      <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{b.nombre}</Text>
                      <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{b.apellidos}</Text>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', borderRadius: 12, padding: 12, marginHorizontal: 4, minWidth: 100, alignItems: 'center', justifyContent: 'center' }}
                    onPress={() => router.push({ pathname: '/(cliente)/beneficiarios', params: { selectMode: 'true', redirect: '/(cliente)/solicitud-nueva' } })}
                  >
                    <Text style={{ fontSize: 20 }}>➕</Text>
                    <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Nuevo</Text>
                  </TouchableOpacity>
                </ScrollView>
              )}
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
                  <Text style={[styles.tipoLabel, { color: colors.text }]}>{tipo.label}</Text>
                  <Text style={[styles.tipoDesc, { color: colors.textMuted }]} numberOfLines={2}>{tipo.descripcion}</Text>
                </View>
                <Text style={{ fontSize: 22, color: '#f59e0b' }}>›</Text>
              </TouchableOpacity>
            ))}
          </Animated.View>
        </ScrollView>
      </LinearGradient>
    );
  }

  // ─── Paso 1.5: Subir documentos ───────────────────────────────────────────
  if (step === 'docs') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={{ flex: 1, paddingTop: 56 }}>
        <DocumentUploadStep
          onComplete={handleDocumentsComplete}
          onSkip={() => {}}
          uploading={submitting}
        />
      </LinearGradient>
    );
  }

  // ─── Paso 2: Confirmación ────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={styles.successContainer}>
        <Animated.View style={{ alignItems: 'center', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.successIconContainer}>
            <Text style={{ fontSize: 56 }}>✅</Text>
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>¡Solicitud enviada!</Text>
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
        <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={{ flex: 1 }}>
          <ScrollView
            style={styles.container}
            contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 40 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={true}
            bounces={true}
            nestedScrollEnabled={true}
          >
            <TouchableOpacity onPress={() => setStep('tipo')} style={styles.backBtn}>
              <Text style={styles.backText}>← Cambiar tipo</Text>
            </TouchableOpacity>

            <Text style={[styles.formTitle, { color: colors.text }]}>{tipoInfo?.label}</Text>
            <Text style={[styles.formDesc, { color: colors.textMuted }]}>Llena la información conforme a tu pasaporte o documento de identidad.</Text>

            {/* Costo destacado arriba del form */}
            <View style={styles.costoInfoSmall}>
              <Text style={styles.costoLabelSmall}>💰 Costo por documento: </Text>
              <Text style={styles.costoValueSmall}>$100 MXN c/u</Text>
              <Text style={styles.costoNoteSmall}> — Solicitud + Escritos se cobran por separado</Text>
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
              Al enviar, un gestor revisará tu información. Costo: $100 MXN por solicitud y $100 MXN por cada escrito adicional.
            </Text>
          </ScrollView>
        </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  backBtn: { marginBottom: 16 },
  backText: { color: '#f59e0b', fontSize: 14, fontWeight: '600' },

  headerSection: { alignItems: 'center', marginBottom: 20 },
  headerEmoji: { fontSize: 40, marginBottom: 8 },
  headerTitle: { fontSize: 24, fontWeight: '800', letterSpacing: 0.5 },
  headerSub: { fontSize: 13, marginTop: 4, textAlign: 'center' },

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
  tipoLabel: { fontSize: 14, fontWeight: '600' },
  tipoDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },

  formTitle: { fontSize: 18, fontWeight: '700', marginBottom: 4 },
  formDesc: { fontSize: 13, marginBottom: 16, lineHeight: 18 },

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
  successTitle: { fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  successText: {
    fontSize: 14,
    textAlign: 'center', lineHeight: 22, marginBottom: 24,
  },
  successBtn: {
    borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32,
    shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  successBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
