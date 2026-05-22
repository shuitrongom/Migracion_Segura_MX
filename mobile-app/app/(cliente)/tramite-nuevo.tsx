import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';
import { OPCIONES_POR_TIPO, SEXOS, ESTADOS_CIVILES, DOCUMENTOS_IDENTIFICACION, NACIONALIDADES, PAISES, ACTIVIDADES_PRINCIPALES, SI_NO, SITUACIONES_TRABAJO, OCUPACIONES_TRABAJO, ESTADOS_MEXICO, SECTORES_ACTIVIDAD, TIPOS_PERSONA } from '@/lib/catalogos';
import FormSelect from '@/components/FormSelect';
import FormDatePicker from '@/components/FormDatePicker';
import VisaForm from '@/components/forms/VisaForm';

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
  const [step, setStep] = useState<'select' | 'form' | 'success'>('select');
  const [selectedTipo, setSelectedTipo] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
    if (!form.nombre.trim() || !form.apellidos.trim()) { Alert.alert('Error', 'Nombre y apellidos son obligatorios'); return; }
    if (!form.propositoViaje) { Alert.alert('Error', 'Selecciona qué deseas hacer'); return; }
    if (!form.nacionalidad) { Alert.alert('Error', 'Selecciona tu nacionalidad'); return; }
    if (!form.solicitanteEmail.trim()) { Alert.alert('Error', 'Ingresa tu correo electrónico'); return; }
    if (form.solicitanteEmail !== form.solicitanteEmailConfirmacion) { Alert.alert('Error', 'Los correos no coinciden'); return; }

    setSubmitting(true);
    try {
      const userData = await storage.getItem('user_data');
      const user = userData ? JSON.parse(userData) : null;
      const res = await apiFetch('/tramites', {
        method: 'POST',
        body: JSON.stringify({ tipo: selectedTipo, clienteId: user?.id, datosFormulario: { ...form, solicitante }, esBorrador: false }),
      });
      const data = await res.json();
      setSubmitting(false);
      if (res.ok) { setStep('success'); }
      else { Alert.alert('Error', Array.isArray(data.message) ? data.message.join('\n') : (data.message || 'Error')); }
    } catch { setSubmitting(false); Alert.alert('Error', 'No se pudo enviar'); }
  };

  if (step === 'success') {
    return (
      <View style={styles.successContainer}>
        <Text style={{ fontSize: 56 }}>✅</Text>
        <Text style={styles.successTitle}>¡Trámite enviado!</Text>
        <Text style={styles.successText}>Tu solicitud ha sido recibida. Un gestor la revisará y te contactará pronto.</Text>
        <TouchableOpacity style={styles.successBtn} onPress={() => { setStep('select'); setForm({ propositoViaje:'',especificaTramite:'',curpExtranjero:'',nombre:'',apellidos:'',sexo:'',fechaNacimiento:'',nacionalidad:'',estadoCivil:'',paisNacimiento:'',estadoProvinciaNacimiento:'',documentoIdentificacion:'',numeroDocumento:'',paisExpedicion:'',fechaExpedicion:'',fechaVencimiento:'',domCodigoPostal:'',domEstado:'',domMunicipio:'',domColonia:'',domCalle:'',domNumeroExterior:'',domNumeroInterior:'',domLada:'',domTelefonoFijo:'',actividadPrincipal:'',sectorTrabajo:'',situacionTrabajo:'',ocupacionTrabajo:'',expulsadoMexico:'',antecedentesPenales:'',empleadorTipoPersona:'',empleadorRfc:'',empleadorNumeroExpediente:'',solicitanteEmail:'',solicitanteEmailConfirmacion:'',comentarios:'' }); }}>
          <Text style={styles.successBtnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
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
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 56, paddingBottom: 40 }}>
            <TouchableOpacity onPress={() => setStep('select')} style={styles.backBtn}><Text style={styles.backText}>← Volver</Text></TouchableOpacity>
            <Text style={styles.formTitle}>{tipoInfo?.nombre}</Text>
            <Text style={styles.formDesc}>Completa tus datos conforme a tu pasaporte o documento de identidad.</Text>

            {/* Formulario específico por tipo */}
            {selectedTipo === 'visa' ? (
              <VisaForm form={form} solicitante={solicitante} updateForm={u} updateSolicitante={uSol} />
            ) : (
            <>
            {/* ¿Qué deseas hacer? */}
            <Text style={styles.sectionTitle}>¿Qué deseas hacer?</Text>
            <FormSelect label="Propósito" value={form.propositoViaje} options={opciones.proposito} onChange={(v) => { u('propositoViaje', v); u('especificaTramite', ''); }} required />
            {especificaOpciones.length > 0 && (
              <FormSelect label="Especifica" value={form.especificaTramite} options={especificaOpciones} onChange={(v) => u('especificaTramite', v)} required />
            )}

            {/* Datos del extranjero */}
            <Text style={styles.sectionTitle}>Datos del extranjero</Text>
            {showCurp && (<View style={styles.fieldContainer}><Text style={styles.fieldLabel}>CURP</Text><TextInput style={styles.input} value={form.curpExtranjero} onChangeText={(v) => u('curpExtranjero', v.toUpperCase())} placeholder="18 caracteres" placeholderTextColor="#9CA3AF" maxLength={18} autoCapitalize="characters" /></View>)}
            <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Nombre(s) *</Text><TextInput style={styles.input} value={form.nombre} onChangeText={(v) => u('nombre', v)} placeholder="Nombre(s)" placeholderTextColor="#9CA3AF" /></View>
            <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Apellido(s) *</Text><TextInput style={styles.input} value={form.apellidos} onChangeText={(v) => u('apellidos', v)} placeholder="Apellido(s)" placeholderTextColor="#9CA3AF" /></View>
            <FormSelect label="Sexo" value={form.sexo ? SEXOS.find(s=>s.value===form.sexo)?.label||'' : ''} options={SEXOS.map(s=>s.label)} onChange={(v) => u('sexo', SEXOS.find(s=>s.label===v)?.value||'')} required />
            <FormDatePicker label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={(v) => u('fechaNacimiento', v)} required minYear={1940} maxYear={2010} />
            <FormSelect label="Nacionalidad actual" value={form.nacionalidad} options={NACIONALIDADES} onChange={(v) => u('nacionalidad', v)} required searchable />
            <FormSelect label="Estado civil" value={form.estadoCivil} options={ESTADOS_CIVILES.map(e=>e.label)} onChange={(v) => u('estadoCivil', v)} />

            {/* Lugar de nacimiento */}
            <Text style={styles.sectionTitle}>Lugar de nacimiento</Text>
            <FormSelect label="País de nacimiento" value={form.paisNacimiento} options={PAISES} onChange={(v) => u('paisNacimiento', v)} required searchable />
            <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Estado/Provincia *</Text><TextInput style={styles.input} value={form.estadoProvinciaNacimiento} onChangeText={(v) => u('estadoProvinciaNacimiento', v)} placeholder="Estado o provincia" placeholderTextColor="#9CA3AF" /></View>

            {/* Pasaporte */}
            <Text style={styles.sectionTitle}>Pasaporte o documento de identidad</Text>
            <FormSelect label="Documento de identificación" value={form.documentoIdentificacion} options={DOCUMENTOS_IDENTIFICACION} onChange={(v) => u('documentoIdentificacion', v)} required />
            <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Número de documento *</Text><TextInput style={styles.input} value={form.numeroDocumento} onChangeText={(v) => u('numeroDocumento', v)} placeholder="Número" placeholderTextColor="#9CA3AF" /></View>
            <FormSelect label="País de expedición" value={form.paisExpedicion} options={PAISES} onChange={(v) => u('paisExpedicion', v)} required searchable />
            <FormDatePicker label="Fecha de expedición" value={form.fechaExpedicion} onChange={(v) => u('fechaExpedicion', v)} minYear={2000} maxYear={2026} />
            <FormDatePicker label="Fecha de vencimiento" value={form.fechaVencimiento} onChange={(v) => u('fechaVencimiento', v)} minYear={2024} maxYear={2040} />

            {/* Domicilio en México */}
            {showDomicilio && (<>
              <Text style={styles.sectionTitle}>Domicilio en México</Text>
              <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Código postal *</Text><TextInput style={styles.input} value={form.domCodigoPostal} onChangeText={(v) => u('domCodigoPostal', v)} placeholder="CP" placeholderTextColor="#9CA3AF" keyboardType="number-pad" /></View>
              <FormSelect label="Estado" value={form.domEstado} options={ESTADOS_MEXICO} onChange={(v) => { u('domEstado', v); u('domMunicipio', ''); }} required />
              <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Municipio/Alcaldía *</Text><TextInput style={styles.input} value={form.domMunicipio} onChangeText={(v) => u('domMunicipio', v)} placeholder="Municipio" placeholderTextColor="#9CA3AF" /></View>
              <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Colonia *</Text><TextInput style={styles.input} value={form.domColonia} onChangeText={(v) => u('domColonia', v)} placeholder="Colonia" placeholderTextColor="#9CA3AF" /></View>
              <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Calle *</Text><TextInput style={styles.input} value={form.domCalle} onChangeText={(v) => u('domCalle', v)} placeholder="Calle" placeholderTextColor="#9CA3AF" /></View>
              <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Número exterior *</Text><TextInput style={styles.input} value={form.domNumeroExterior} onChangeText={(v) => u('domNumeroExterior', v)} placeholder="Núm. ext." placeholderTextColor="#9CA3AF" /></View>
              <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Número interior</Text><TextInput style={styles.input} value={form.domNumeroInterior} onChangeText={(v) => u('domNumeroInterior', v)} placeholder="Opcional" placeholderTextColor="#9CA3AF" /></View>
            </>)}

            {/* Empleador */}
            {showEmpleador && (<>
              <Text style={styles.sectionTitle}>Datos del empleador</Text>
              <FormSelect label="Tipo de persona" value={form.empleadorTipoPersona} options={TIPOS_PERSONA} onChange={(v) => u('empleadorTipoPersona', v)} required />
              {form.empleadorTipoPersona !== '' && (<>
                <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>RFC *</Text><TextInput style={styles.input} value={form.empleadorRfc} onChangeText={(v) => u('empleadorRfc', v.toUpperCase())} placeholder="RFC" placeholderTextColor="#9CA3AF" autoCapitalize="characters" maxLength={form.empleadorTipoPersona === 'Moral' ? 12 : 13} /></View>
                <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Número de expediente *</Text><TextInput style={styles.input} value={form.empleadorNumeroExpediente} onChangeText={(v) => u('empleadorNumeroExpediente', v)} placeholder="Expediente" placeholderTextColor="#9CA3AF" /></View>
              </>)}
            </>)}

            {/* Info adicional (visa) */}
            {showInfoAdicional && (<>
              <Text style={styles.sectionTitle}>Información adicional</Text>
              <FormSelect label="Actividad principal en tu país" value={form.actividadPrincipal} options={ACTIVIDADES_PRINCIPALES} onChange={(v) => u('actividadPrincipal', v)} required />
              {form.actividadPrincipal === 'Trabajar' && (<>
                <FormSelect label="Sector de actividad" value={form.sectorTrabajo} options={SECTORES_ACTIVIDAD} onChange={(v) => u('sectorTrabajo', v)} required searchable />
                <FormSelect label="Situación en el trabajo" value={form.situacionTrabajo} options={SITUACIONES_TRABAJO} onChange={(v) => u('situacionTrabajo', v)} required />
                <FormSelect label="Ocupación" value={form.ocupacionTrabajo} options={OCUPACIONES_TRABAJO} onChange={(v) => u('ocupacionTrabajo', v)} required />
              </>)}
              <FormSelect label="¿Has sido expulsado de México?" value={form.expulsadoMexico} options={SI_NO} onChange={(v) => u('expulsadoMexico', v)} required />
              <FormSelect label="¿Tienes antecedentes penales?" value={form.antecedentesPenales} options={SI_NO} onChange={(v) => u('antecedentesPenales', v)} required />
            </>)}

            {/* Correo */}
            <Text style={styles.sectionTitle}>Correo electrónico para notificaciones</Text>
            <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Correo electrónico *</Text><TextInput style={styles.input} value={form.solicitanteEmail} onChangeText={(v) => u('solicitanteEmail', v)} placeholder="nombre@correo.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" /></View>
            <View style={styles.fieldContainer}><Text style={styles.fieldLabel}>Confirmar correo *</Text><TextInput style={styles.input} value={form.solicitanteEmailConfirmacion} onChangeText={(v) => u('solicitanteEmailConfirmacion', v)} placeholder="Confirma tu correo" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" /></View>

            {/* Comentarios */}
            <Text style={styles.sectionTitle}>Comentarios</Text>
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.comentarios} onChangeText={(v) => u('comentarios', v)} placeholder="Información adicional (opcional)" placeholderTextColor="#9CA3AF" multiline />
            <Text style={styles.requiredNote}>* Campos obligatorios</Text>
            </>
            )}

            <TouchableOpacity style={[styles.submitBtn, submitting && { opacity: 0.6 }]} onPress={handleSubmit} disabled={submitting}>
              <Text style={styles.submitText}>{submitting ? 'Enviando...' : 'Enviar solicitud'}</Text>
            </TouchableOpacity>
            <Text style={styles.disclaimer}>Al enviar, un gestor revisará tu información y te contactará para continuar.</Text>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    );
  }

  // Seleccionar tipo
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingTop: 56 }}>
      <Text style={styles.pageTitle}>Iniciar trámite</Text>
      <Text style={styles.pageDesc}>Selecciona el tipo de trámite migratorio que necesitas</Text>
      {TRAMITES_INM.map((tipo) => (
        <TouchableOpacity key={tipo.key} style={styles.tipoCard} onPress={() => { setSelectedTipo(tipo.key); setStep('form'); }}>
          <View style={styles.tipoIcon}><Text style={{ fontSize: 20 }}>{tipo.icon}</Text></View>
          <View style={styles.tipoInfo}>
            <Text style={styles.tipoLabel}>{tipo.nombre}</Text>
            <Text style={styles.tipoDesc} numberOfLines={2}>{tipo.descripcion}</Text>
          </View>
          <Text style={{ fontSize: 22, color: '#C4A265' }}>›</Text>
        </TouchableOpacity>
      ))}
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#2C1810', marginBottom: 4 },
  pageDesc: { fontSize: 14, color: '#6B5B4F', marginBottom: 20, lineHeight: 20 },
  tipoCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, gap: 14, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  tipoIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center' },
  tipoInfo: { flex: 1 },
  tipoLabel: { fontSize: 14, fontWeight: '600', color: '#2C1810' },
  tipoDesc: { fontSize: 12, color: '#6B5B4F', marginTop: 2, lineHeight: 16 },
  backBtn: { marginBottom: 12 },
  backText: { fontSize: 15, color: '#C4A265', fontWeight: '600' },
  formTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  formDesc: { fontSize: 13, color: '#6B5B4F', marginTop: 4, marginBottom: 16, lineHeight: 18 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2C1810', marginTop: 20, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#C4A265' },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#4A3F37', marginBottom: 5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DFD3', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2C1810' },
  requiredNote: { fontSize: 11, color: '#8B7B6F', marginTop: 16 },
  submitBtn: { backgroundColor: '#C4A265', borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  disclaimer: { fontSize: 11, color: '#8B7B6F', textAlign: 'center', marginTop: 12, lineHeight: 16, marginBottom: 20 },
  successContainer: { flex: 1, backgroundColor: '#F5F0E8', justifyContent: 'center', alignItems: 'center', padding: 32 },
  successTitle: { fontSize: 22, fontWeight: '700', color: '#2C1810', marginTop: 16, marginBottom: 8 },
  successText: { fontSize: 14, color: '#6B5B4F', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  successBtn: { backgroundColor: '#3D2B1F', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 32 },
  successBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },
});
