import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import * as Location from 'expo-location';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useTheme } from '@/lib/theme';
import DocumentUploadStep from '@/components/DocumentUploadStep';
import { OPCIONES_POR_TIPO, SEXOS, ESTADOS_CIVILES, DOCUMENTOS_IDENTIFICACION, NACIONALIDADES, PAISES, ACTIVIDADES_PRINCIPALES, SI_NO, SITUACIONES_TRABAJO, OCUPACIONES_TRABAJO, ESTADOS_MEXICO, SECTORES_ACTIVIDAD, TIPOS_PERSONA } from '@/lib/catalogos';
import FormSelect from '@/components/FormSelect';
import FormDatePicker from '@/components/FormDatePicker';
import VisaForm from '@/components/forms/VisaForm';
import GenericTramiteForm from '@/components/forms/GenericTramiteForm';

const TRAMITES_INM = [
  { key: 'visa', nombre: 'Visas solicitadas ante el INM', descripcion: 'Solicitud de visa por unidad familiar, razones humanitarias u oferta de empleo', icon: '✈️' },
  { key: 'permiso_trabajo', nombre: 'Permisos solicitados al INM', descripcion: 'Permiso para trabajar o permiso de salida y regreso', icon: '💼' },
  { key: 'notificacion_cambio', nombre: 'Notificación de Cambio (EC, NOM, NAC, DOM, LT)', descripcion: 'Notificar cambio de estado civil, nombre, nacionalidad, domicilio o lugar de trabajo', icon: '📝' },
  { key: 'expedicion_documento', nombre: 'Expedición de Documento Migratorio', descripcion: 'Renovación, canje, reposición o expedición por acuerdo de documento migratorio', icon: '📄' },
  { key: 'regularizacion_migratoria', nombre: 'Regularización de Situación Migratoria', descripcion: 'Regularización por razones humanitarias, unidad familiar o documento vencido', icon: '📋' },
  { key: 'constancia_empleador', nombre: 'Constancias de Inscripción de Empleador (CIE)', descripcion: 'Obtención o actualización de constancia para emitir ofertas de empleo a extranjeros', icon: '🏢' },
  { key: 'cambio_condicion_estancia', nombre: 'Cambios de Condición de Estancia', descripcion: 'Cambiar de una condición migratoria a otra (7 modalidades)', icon: '🔄' },
];

export default function TramiteNuevoScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ beneficiarioId?: string; beneficiarioNombre?: string }>();
  const [step, setStep] = useState<'select' | 'form' | 'docs' | 'success'>('select');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [beneficiarioId, setBeneficiarioId] = useState<string | null>(params.beneficiarioId || null);
  const [beneficiarioNombre, setBeneficiarioNombre] = useState(params.beneficiarioNombre || '');
  const [beneficiarios, setBeneficiarios] = useState<any[]>([]);
  const [loadingBenef, setLoadingBenef] = useState(true);

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
      fetchBeneficiario(params.beneficiarioId);
    }
  }, [params.beneficiarioId]);

  const fetchBeneficiario = async (id: string) => {
    try {
      const res = await apiFetch(`/beneficiarios/mis-beneficiarios/${id}`);
      if (res.ok) {
        const b = await res.json();
        selectBenef(b);
      }
    } catch {}
  };

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
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
    setLoadingBenef(false);
  };

  const selectBenef = (b: any) => {
    setBeneficiarioId(b.id);
    setBeneficiarioNombre(`${b.nombre} ${b.apellidos}`);
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

  const [form, setForm] = useState({
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
  });
  const u = (field: string, value: string) => setForm(prev => ({ ...prev, [field]: value }));

  // Estado del solicitante (solo para Visa)
  const [solicitante, setSolicitante] = useState<Record<string, string>>({
    tipoPersona: '', curp: '', rfc: '', nombre: '', apellidos: '', nacionalidad: '',
    tipoDocumento: '', numeroDocumento: '', vinculoParentesco: '',
    codigoPostal: '', estado: '', municipio: '', colonia: '', calle: '',
    numeroExterior: '', numeroInterior: '', lada: '', telefonoFijo: '',
    moralRfc: '', moralRazonSocial: '', moralSector: '', moralGiroComercial: '',
    moralCodigoPostal: '', moralEstado: '', moralMunicipio: '', moralColonia: '',
    moralCalle: '', moralNumeroExterior: '', moralNumeroInterior: '', moralLada: '', moralTelefonoFijo: '',
    moralNumeroActa: '', moralFechaActa: '',
  });
  const uSol = (field: string, value: string) => setSolicitante(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async () => {
    if (selectedTipo !== 'constancia_empleador' && (!form.nombre.trim() || !form.apellidos.trim())) { Alert.alert('Error', 'Nombre y apellidos son obligatorios'); return; }
    if (!form.propositoViaje) { Alert.alert('Error', 'Selecciona qué deseas hacer'); return; }
    if (!form.solicitanteEmail.trim()) { Alert.alert('Error', 'Ingresa tu correo electrónico'); return; }
    if (form.solicitanteEmail !== form.solicitanteEmailConfirmacion) { Alert.alert('Error', 'Los correos no coinciden'); return; }
    // Ir al paso de documentos
    setStep('docs');
  };

  const handleDocumentsComplete = async (docs: any[], whatsapp: string) => {
    setSubmitting(true);
    try {
      const userData = await storage.getItem('user_data');
      const user = userData ? JSON.parse(userData) : null;
      if (!user?.id) { Alert.alert('Error', 'No se encontró tu sesión.'); setSubmitting(false); return; }

      let ubicacion: { lat: number; lng: number; ciudad?: string } | null = null;
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          ubicacion = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          try {
            const [geo] = await Location.reverseGeocodeAsync({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            if (geo) ubicacion.ciudad = `${geo.city || ''}, ${geo.region || ''}`.replace(/^, |, $/g, '');
          } catch {}
        }
      } catch {}

      // 1. Crear trámite
      const res = await apiFetch('/tramites', {
        method: 'POST',
        body: JSON.stringify({ tipo: selectedTipo, clienteId: user.id, beneficiarioId: beneficiarioId || undefined, datosFormulario: { ...form, solicitante, telefono: whatsapp, ubicacion }, esBorrador: false }),
      });
      const data = await res.json();
      if (!res.ok) { Alert.alert('Error', Array.isArray(data.message) ? data.message.join('\n') : (data.message || 'Error')); setSubmitting(false); return; }

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

      setSubmitting(false);
      setStep('success');
    } catch { setSubmitting(false); Alert.alert('Error', 'No se pudo enviar'); }
  };

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

  if (step === 'success') {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={styles.successContainer}>
        <Animated.View style={{ alignItems: 'center', opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.successIconContainer}>
            <Text style={{ fontSize: 56 }}>✅</Text>
          </View>
          <Text style={[styles.successTitle, { color: colors.text }]}>¡Trámite enviado!</Text>
          <Text style={[styles.successText, { color: colors.textMuted }]}>Tu solicitud ha sido recibida. Un gestor la revisará y te contactará pronto.</Text>
          <TouchableOpacity onPress={() => { setStep('select'); setForm({ propositoViaje:'',especificaTramite:'',curpExtranjero:'',nombre:'',apellidos:'',sexo:'',fechaNacimiento:'',nacionalidad:'',estadoCivil:'',paisNacimiento:'',estadoProvinciaNacimiento:'',documentoIdentificacion:'',numeroDocumento:'',paisExpedicion:'',fechaExpedicion:'',fechaVencimiento:'',domCodigoPostal:'',domEstado:'',domMunicipio:'',domColonia:'',domCalle:'',domNumeroExterior:'',domNumeroInterior:'',domLada:'',domTelefonoFijo:'',actividadPrincipal:'',sectorTrabajo:'',situacionTrabajo:'',ocupacionTrabajo:'',expulsadoMexico:'',antecedentesPenales:'',empleadorTipoPersona:'',empleadorRfc:'',empleadorNumeroExpediente:'',solicitanteEmail:'',solicitanteEmailConfirmacion:'',comentarios:'' }); }}>
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.successBtn}>
              <Text style={styles.successBtnText}>Volver al inicio</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  if (step === 'form') {
    const tipoInfo = TRAMITES_INM.find(t => t.key === selectedTipo);
    const opciones = OPCIONES_POR_TIPO[selectedTipo] || { proposito: [], especifica: {} };
    const showCurp = !['visa', 'constancia_empleador'].includes(selectedTipo);
    const showDomicilio = ['permiso_trabajo', 'expedicion_documento', 'regularizacion_migratoria', 'cambio_condicion_estancia'].includes(selectedTipo);
    const showEmpleador = (selectedTipo === 'permiso_trabajo' && form.especificaTramite === 'Con empleador') || (selectedTipo === 'regularizacion_migratoria' && form.especificaTramite === 'Regularización por tener documento vencido o por realizar actividades no autorizadas');
    const showInfoAdicional = selectedTipo === 'visa';
    const especificaOpciones = opciones.especifica[form.propositoViaje] || [];

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
              <TouchableOpacity onPress={() => { setStep('select'); setForm({ propositoViaje:'',especificaTramite:'',curpExtranjero:'',nombre:'',apellidos:'',sexo:'',fechaNacimiento:'',nacionalidad:'',estadoCivil:'',paisNacimiento:'',estadoProvinciaNacimiento:'',documentoIdentificacion:'',numeroDocumento:'',paisExpedicion:'',fechaExpedicion:'',fechaVencimiento:'',domCodigoPostal:'',domEstado:'',domMunicipio:'',domColonia:'',domCalle:'',domNumeroExterior:'',domNumeroInterior:'',domLada:'',domTelefonoFijo:'',actividadPrincipal:'',sectorTrabajo:'',situacionTrabajo:'',ocupacionTrabajo:'',expulsadoMexico:'',antecedentesPenales:'',empleadorTipoPersona:'',empleadorRfc:'',empleadorNumeroExpediente:'',solicitanteEmail:'',solicitanteEmailConfirmacion:'',comentarios:'' }); setSolicitante({ tipoPersona:'',curp:'',rfc:'',nombre:'',apellidos:'',nacionalidad:'',tipoDocumento:'',numeroDocumento:'',vinculoParentesco:'',codigoPostal:'',estado:'',municipio:'',colonia:'',calle:'',numeroExterior:'',numeroInterior:'',lada:'',telefonoFijo:'',moralRfc:'',moralRazonSocial:'',moralSector:'',moralGiroComercial:'',moralCodigoPostal:'',moralEstado:'',moralMunicipio:'',moralColonia:'',moralCalle:'',moralNumeroExterior:'',moralNumeroInterior:'',moralLada:'',moralTelefonoFijo:'',moralNumeroActa:'',moralFechaActa:'' }); }} style={styles.backBtn}><Text style={styles.backText}>← Volver</Text></TouchableOpacity>
              <Text style={[styles.formTitle, { color: colors.text }]}>{tipoInfo?.nombre}</Text>
              <Text style={[styles.formDesc, { color: colors.textMuted }]}>Completa tus datos conforme a tu pasaporte o documento de identidad.</Text>

              {/* Formulario específico por tipo */}
              {selectedTipo === 'visa' ? (
                <VisaForm form={form} solicitante={solicitante} updateForm={u} updateSolicitante={uSol} />
              ) : (
                <GenericTramiteForm tipo={selectedTipo} form={form} updateForm={u} />
              )}

              <TouchableOpacity style={[submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.submitBtn}>
                  <Text style={styles.submitText}>{submitting ? 'Enviando...' : 'Enviar solicitud'}</Text>
                </LinearGradient>
              </TouchableOpacity>
              <Text style={[styles.disclaimer, { color: colors.textMuted }]}>Al enviar, un gestor revisará tu información y te contactará para continuar.</Text>
            </ScrollView>
          </LinearGradient>
      </KeyboardAvoidingView>
    );
  }

  // Seleccionar tipo
  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={{ flex: 1 }}>
      <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 56 }}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 12 }}>
            <Text style={{ color: '#f59e0b', fontSize: 14, fontWeight: '500' }}>← Volver</Text>
          </TouchableOpacity>
          <Text style={[styles.pageTitle, { color: colors.text }]}>Iniciar trámite</Text>
          <Text style={[styles.pageDesc, { color: colors.textMuted }]}>Selecciona el tipo de trámite migratorio que necesitas</Text>

          {/* Seleccionar beneficiario */}
          <View style={{ marginBottom: 20, marginTop: 8 }}>
            <Text style={{ fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>¿Para quién es el trámite?</Text>
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
            ) : loadingBenef ? (
              <ActivityIndicator color="#f59e0b" />
            ) : beneficiarios.length === 0 ? (
              <TouchableOpacity
                style={{ borderWidth: 2, borderColor: '#f59e0b', borderStyle: 'dashed', borderRadius: 12, padding: 16, alignItems: 'center' }}
                onPress={() => router.push({ pathname: '/(cliente)/beneficiarios', params: { selectMode: 'true', redirect: '/(cliente)/tramite-nuevo' } })}
              >
                <Text style={{ color: '#f59e0b', fontSize: 14, fontWeight: '600' }}>➕ Registrar extranjero primero</Text>
                <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11, marginTop: 4 }}>Registra a la persona para quien harás el trámite</Text>
              </TouchableOpacity>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {beneficiarios.map((b: any) => (
                  <TouchableOpacity
                    key={b.id}
                    style={{ backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)', borderRadius: 12, padding: 12, marginRight: 8, minWidth: 120, alignItems: 'center' }}
                    onPress={() => selectBenef(b)}
                  >
                    <Text style={{ fontSize: 22, marginBottom: 4 }}>👤</Text>
                    <Text style={{ color: '#fff', fontSize: 13, fontWeight: '600' }}>{b.nombre}</Text>
                    <Text style={{ color: 'rgba(255,255,255,0.4)', fontSize: 11 }}>{b.apellidos}</Text>
                  </TouchableOpacity>
                ))}
                <TouchableOpacity
                  style={{ backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', borderRadius: 12, padding: 12, marginRight: 8, minWidth: 90, alignItems: 'center', justifyContent: 'center' }}
                  onPress={() => router.push({ pathname: '/(cliente)/beneficiarios', params: { selectMode: 'true', redirect: '/(cliente)/tramite-nuevo' } })}
                >
                  <Text style={{ fontSize: 18 }}>➕</Text>
                  <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: '600', marginTop: 4 }}>Nuevo</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>

          {TRAMITES_INM.map((tipo) => (
            <TouchableOpacity key={tipo.key} style={styles.tipoCard} onPress={() => { setSelectedTipo(tipo.key); setStep('form'); }}>
              <View style={styles.tipoIcon}><Text style={{ fontSize: 20 }}>{tipo.icon}</Text></View>
              <View style={styles.tipoInfo}>
                <Text style={[styles.tipoLabel, { color: colors.text }]}>{tipo.nombre}</Text>
                <Text style={[styles.tipoDesc, { color: colors.textMuted }]} numberOfLines={2}>{tipo.descripcion}</Text>
              </View>
              <Text style={{ fontSize: 22, color: '#f59e0b' }}>›</Text>
            </TouchableOpacity>
          ))}
          <View style={{ height: 30 }} />
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  pageTitle: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  pageDesc: { fontSize: 14, marginBottom: 20, lineHeight: 20 },
  tipoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 10, gap: 14, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tipoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.06)', justifyContent: 'center', alignItems: 'center' },
  tipoInfo: { flex: 1 },
  tipoLabel: { fontSize: 14, fontWeight: '600' },
  tipoDesc: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 15, color: '#f59e0b', fontWeight: '600' },
  formTitle: { fontSize: 18, fontWeight: '700' },
  formDesc: { fontSize: 13, marginTop: 4, marginBottom: 16, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#f59e0b', marginTop: 20, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'rgba(245,158,11,0.3)' },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 5 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  requiredNote: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 16 },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 11, textAlign: 'center', marginTop: 12, lineHeight: 16, marginBottom: 20 },
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  successIconContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  successTitle: { fontSize: 22, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  successText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successBtn: { borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  successBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },
});
