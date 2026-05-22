import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import FormSelect from '@/components/FormSelect';
import FormDatePicker from '@/components/FormDatePicker';
import { OPCIONES_POR_TIPO, SEXOS, ESTADOS_CIVILES, DOCUMENTOS_IDENTIFICACION, NACIONALIDADES, PAISES, ESTADOS_MEXICO, TIPOS_PERSONA, DOCUMENTOS_IDENTIFICACION_PERSONA } from '@/lib/catalogos';

interface GenericTramiteFormProps {
  tipo: string;
  form: Record<string, string>;
  updateForm: (field: string, value: string) => void;
}

export default function GenericTramiteForm({ tipo, form, updateForm }: GenericTramiteFormProps) {
  const opciones = OPCIONES_POR_TIPO[tipo] || { proposito: [], especifica: {} };
  const especificaOpciones = opciones.especifica[form.propositoViaje] || [];

  const showCurp = ['permiso_trabajo', 'notificacion_cambio', 'expedicion_documento', 'regularizacion_migratoria', 'cambio_condicion_estancia'].includes(tipo);
  const showDomicilio = ['permiso_trabajo', 'expedicion_documento', 'regularizacion_migratoria', 'cambio_condicion_estancia'].includes(tipo);
  const showEmpleador = (tipo === 'permiso_trabajo' && form.especificaTramite === 'Con empleador') || (tipo === 'regularizacion_migratoria' && form.especificaTramite === 'Regularización por tener documento vencido o por realizar actividades no autorizadas');

  // Personas autorizadas
  const [personasAutorizadas, setPersonasAutorizadas] = useState<{ curp: string; nombre: string; apellidos: string; nacionalidad: string; tipoDocumento: string; numeroDocumento: string }[]>([]);
  const [personaTemp, setPersonaTemp] = useState({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });
  const handleAddPersona = () => {
    if (!personaTemp.nombre.trim() || !personaTemp.apellidos.trim()) { Alert.alert('Error', 'Nombre y apellidos son obligatorios'); return; }
    setPersonasAutorizadas([...personasAutorizadas, { ...personaTemp }]);
    setPersonaTemp({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });
  };

  // Label del primer select según tipo
  const propositoLabel = tipo === 'visa' ? 'Propósito de viaje' : '¿Qué deseas hacer?';

  return (
    <View>
      {/* Tipo de trámite / Propósito */}
      <Text style={styles.sectionTitle}>{tipo === 'constancia_empleador' ? '¿Qué deseas hacer?' : 'Tipo de trámite'}</Text>
      <FormSelect label={propositoLabel} value={form.propositoViaje} options={opciones.proposito} onChange={(v) => { updateForm('propositoViaje', v); updateForm('especificaTramite', ''); }} required />
      {especificaOpciones.length > 0 && (
        <FormSelect label="Especifica" value={form.especificaTramite} options={especificaOpciones} onChange={(v) => updateForm('especificaTramite', v)} required />
      )}

      {/* Datos del extranjero (no aplica para constancia_empleador) */}
      {tipo !== 'constancia_empleador' && (
        <>
          <Text style={styles.sectionTitle}>Datos del extranjero (conforme a pasaporte o documento de identidad)</Text>
          {showCurp && <Field label="Clave Única de Registro de Población (CURP)"><TextInput style={styles.input} value={form.curpExtranjero} onChangeText={(v) => updateForm('curpExtranjero', v.toUpperCase())} placeholder="18 caracteres" placeholderTextColor="#9CA3AF" maxLength={18} autoCapitalize="characters" /></Field>}
          <Field label="Nombre(s) *"><TextInput style={styles.input} value={form.nombre} onChangeText={(v) => updateForm('nombre', v)} placeholder="Nombre(s)" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Apellido(s) *"><TextInput style={styles.input} value={form.apellidos} onChangeText={(v) => updateForm('apellidos', v)} placeholder="Apellido(s)" placeholderTextColor="#9CA3AF" /></Field>
          <FormSelect label="Sexo" value={form.sexo ? SEXOS.find(s => s.value === form.sexo)?.label || '' : ''} options={SEXOS.map(s => s.label)} onChange={(v) => updateForm('sexo', SEXOS.find(s => s.label === v)?.value || '')} required />
          <FormDatePicker label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={(v) => updateForm('fechaNacimiento', v)} required minYear={1940} maxYear={2010} />
          <FormSelect label="Nacionalidad actual" value={form.nacionalidad} options={NACIONALIDADES} onChange={(v) => updateForm('nacionalidad', v)} required searchable />
          <FormSelect label="Estado civil actual" value={form.estadoCivil} options={ESTADOS_CIVILES.map(e => e.label)} onChange={(v) => updateForm('estadoCivil', v)} />

          {/* Lugar de nacimiento */}
          <Text style={styles.sectionTitle}>Lugar de nacimiento</Text>
          <FormSelect label="País de nacimiento" value={form.paisNacimiento} options={PAISES} onChange={(v) => updateForm('paisNacimiento', v)} required searchable />
          <Field label="Estado, provincia o departamento *"><TextInput style={styles.input} value={form.estadoProvinciaNacimiento} onChangeText={(v) => updateForm('estadoProvinciaNacimiento', v)} placeholder="Estado o provincia" placeholderTextColor="#9CA3AF" /></Field>

          {/* Pasaporte */}
          <Text style={styles.sectionTitle}>Pasaporte o documento con el que se identifica el extranjero</Text>
          <FormSelect label="Documento de identificación" value={form.documentoIdentificacion} options={DOCUMENTOS_IDENTIFICACION} onChange={(v) => updateForm('documentoIdentificacion', v)} required />
          <Field label="Número de documento *"><TextInput style={styles.input} value={form.numeroDocumento} onChangeText={(v) => updateForm('numeroDocumento', v)} placeholder="Número" placeholderTextColor="#9CA3AF" /></Field>
          <FormSelect label="País de expedición" value={form.paisExpedicion} options={PAISES} onChange={(v) => updateForm('paisExpedicion', v)} required searchable />
          <FormDatePicker label="Fecha de expedición" value={form.fechaExpedicion} onChange={(v) => updateForm('fechaExpedicion', v)} minYear={2000} maxYear={2026} />
          <FormDatePicker label="Fecha de vencimiento" value={form.fechaVencimiento} onChange={(v) => updateForm('fechaVencimiento', v)} minYear={2024} maxYear={2040} />
        </>
      )}

      {/* Domicilio del extranjero en México */}
      {showDomicilio && (
        <>
          <Text style={styles.sectionTitle}>Domicilio del extranjero en México</Text>
          <Field label="Código postal *"><TextInput style={styles.input} value={form.domCodigoPostal} onChangeText={(v) => updateForm('domCodigoPostal', v)} placeholder="CP" placeholderTextColor="#9CA3AF" keyboardType="number-pad" /></Field>
          <FormSelect label="Estado" value={form.domEstado} options={ESTADOS_MEXICO} onChange={(v) => { updateForm('domEstado', v); updateForm('domMunicipio', ''); }} required />
          <Field label="Municipio o Alcaldía *"><TextInput style={styles.input} value={form.domMunicipio} onChangeText={(v) => updateForm('domMunicipio', v)} placeholder="Municipio" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Colonia *"><TextInput style={styles.input} value={form.domColonia} onChangeText={(v) => updateForm('domColonia', v)} placeholder="Colonia" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Calle *"><TextInput style={styles.input} value={form.domCalle} onChangeText={(v) => updateForm('domCalle', v)} placeholder="Calle" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Número exterior *"><TextInput style={styles.input} value={form.domNumeroExterior} onChangeText={(v) => updateForm('domNumeroExterior', v)} placeholder="Núm. ext." placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Número interior"><TextInput style={styles.input} value={form.domNumeroInterior} onChangeText={(v) => updateForm('domNumeroInterior', v)} placeholder="Opcional" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Lada"><TextInput style={styles.input} value={form.domLada} onChangeText={(v) => updateForm('domLada', v)} placeholder="Lada" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Teléfono fijo"><TextInput style={styles.input} value={form.domTelefonoFijo} onChangeText={(v) => updateForm('domTelefonoFijo', v)} placeholder="Teléfono" placeholderTextColor="#9CA3AF" /></Field>
        </>
      )}

      {/* Datos del empleador */}
      {showEmpleador && (
        <>
          <Text style={styles.sectionTitle}>Datos del empleador</Text>
          <Text style={styles.infoText}>Si presenta oferta de empleo, proporcione los datos del empleador.</Text>
          <FormSelect label="Tipo de persona" value={form.empleadorTipoPersona} options={TIPOS_PERSONA} onChange={(v) => updateForm('empleadorTipoPersona', v)} required />
          {form.empleadorTipoPersona !== '' && (
            <>
              <Field label="Registro Federal de Contribuyentes (RFC) *"><TextInput style={styles.input} value={form.empleadorRfc} onChangeText={(v) => updateForm('empleadorRfc', v.toUpperCase())} placeholder="RFC" placeholderTextColor="#9CA3AF" autoCapitalize="characters" maxLength={form.empleadorTipoPersona === 'Moral' ? 12 : 13} /></Field>
              <Field label="Número de expediente *"><TextInput style={styles.input} value={form.empleadorNumeroExpediente} onChangeText={(v) => updateForm('empleadorNumeroExpediente', v)} placeholder="Expediente" placeholderTextColor="#9CA3AF" /></Field>
            </>
          )}
        </>
      )}

      {/* Correo electrónico */}
      <Text style={styles.sectionTitle}>Correo electrónico para notificar al promovente</Text>
      <Text style={styles.infoText}>Agrega la dirección de correo electrónico en donde se recibirán las notificaciones asociadas a tu trámite.</Text>
      <Field label="Correo electrónico *"><TextInput style={styles.input} value={form.solicitanteEmail} onChangeText={(v) => updateForm('solicitanteEmail', v)} placeholder="nombre@correo.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" /></Field>
      <Field label="Correo electrónico (confirmación) *"><TextInput style={styles.input} value={form.solicitanteEmailConfirmacion} onChangeText={(v) => updateForm('solicitanteEmailConfirmacion', v)} placeholder="Confirma tu correo" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" /></Field>

      {/* Persona autorizada */}
      <Text style={styles.sectionTitle}>En su caso, persona autorizada para tramitar, oír o recibir notificaciones</Text>
      <Text style={styles.infoText}>Si deseas agregar personas autorizadas es necesario que lo efectúes con el botón "Agregar persona", de lo contrario los datos capturados en esta sección no serán guardados.</Text>
      <Field label="CURP"><TextInput style={styles.input} value={personaTemp.curp} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, curp: v.toUpperCase() }))} placeholder="18 caracteres" placeholderTextColor="#9CA3AF" maxLength={18} autoCapitalize="characters" /></Field>
      <Field label="Nombre(s) *"><TextInput style={styles.input} value={personaTemp.nombre} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, nombre: v }))} placeholder="Nombre(s)" placeholderTextColor="#9CA3AF" /></Field>
      <Field label="Apellido(s) *"><TextInput style={styles.input} value={personaTemp.apellidos} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, apellidos: v }))} placeholder="Apellido(s)" placeholderTextColor="#9CA3AF" /></Field>
      <FormSelect label="Nacionalidad actual" value={personaTemp.nacionalidad} options={NACIONALIDADES} onChange={(v) => setPersonaTemp(prev => ({ ...prev, nacionalidad: v }))} searchable />
      <FormSelect label="Tipo de documento de identificación" value={personaTemp.tipoDocumento} options={DOCUMENTOS_IDENTIFICACION_PERSONA} onChange={(v) => setPersonaTemp(prev => ({ ...prev, tipoDocumento: v }))} />
      <Field label="Número de documento"><TextInput style={styles.input} value={personaTemp.numeroDocumento} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, numeroDocumento: v }))} placeholder="Número" placeholderTextColor="#9CA3AF" /></Field>
      <TouchableOpacity style={styles.addButton} onPress={handleAddPersona}>
        <Text style={styles.addButtonText}>+ Agregar persona</Text>
      </TouchableOpacity>
      {personasAutorizadas.length > 0 && (
        <View style={styles.listContainer}>
          {personasAutorizadas.map((p, i) => (
            <View key={i} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listItemName}>{p.nombre} {p.apellidos}</Text>
                <Text style={styles.listItemDetail}>{p.nacionalidad} · {p.tipoDocumento} {p.numeroDocumento}</Text>
              </View>
              <TouchableOpacity onPress={() => setPersonasAutorizadas(personasAutorizadas.filter((_, idx) => idx !== i))}>
                <Text style={styles.removeText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Comentarios */}
      <Text style={styles.sectionTitle}>Comentarios</Text>
      <Text style={styles.commentHint}>Si lo deseas, puedes agregar algún comentario a la solicitud.</Text>
      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.comentarios} onChangeText={(v) => updateForm('comentarios', v)} placeholder="Comentarios (opcional)" placeholderTextColor="#9CA3AF" multiline />
      <Text style={styles.requiredNote}>* Campos obligatorios</Text>
    </View>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#2C1810', marginTop: 24, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#C4A265' },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#4A3F37', marginBottom: 5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DFD3', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2C1810' },
  requiredNote: { fontSize: 11, color: '#8B7B6F', marginTop: 16 },
  infoText: { fontSize: 12, color: '#6B5B4F', marginBottom: 12, lineHeight: 18, backgroundColor: '#EDE9E0', padding: 12, borderRadius: 8 },
  commentHint: { fontSize: 12, color: '#6B5B4F', marginBottom: 8 },
  addButton: { backgroundColor: '#F5F0E8', borderWidth: 1, borderColor: '#C4A265', borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  addButtonText: { color: '#C4A265', fontSize: 14, fontWeight: '600' },
  listContainer: { marginTop: 8, gap: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F0E8', borderRadius: 10, padding: 12 },
  listItemName: { fontSize: 14, fontWeight: '600', color: '#2C1810' },
  listItemDetail: { fontSize: 12, color: '#6B5B4F', marginTop: 2 },
  removeText: { fontSize: 12, color: '#E74C3C', fontWeight: '500' },
});
