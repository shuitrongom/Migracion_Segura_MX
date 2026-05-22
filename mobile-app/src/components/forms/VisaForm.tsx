import { View, Text, TextInput, StyleSheet } from 'react-native';
import FormSelect from '@/components/FormSelect';
import FormDatePicker from '@/components/FormDatePicker';
import { PROPOSITOS_VIAJE, SEXOS, ESTADOS_CIVILES, DOCUMENTOS_IDENTIFICACION, NACIONALIDADES, PAISES, ACTIVIDADES_PRINCIPALES, SI_NO, SITUACIONES_TRABAJO, OCUPACIONES_TRABAJO, SECTORES_ACTIVIDAD, VINCULOS_PARENTESCO, TIPOS_PERSONA, ESTADOS_MEXICO } from '@/lib/catalogos';

interface VisaFormProps {
  form: Record<string, string>;
  solicitante: Record<string, string>;
  updateForm: (field: string, value: string) => void;
  updateSolicitante: (field: string, value: string) => void;
}

export default function VisaForm({ form, solicitante, updateForm, updateSolicitante }: VisaFormProps) {
  // Lógica: si "Unidad familiar" → solo Física; si otros → Física y Moral
  const tipoPersonaOptions = form.propositoViaje === 'Unidad familiar'
    ? ['Física']
    : TIPOS_PERSONA;

  return (
    <View>
      {/* Propósito del viaje */}
      <Text style={styles.sectionTitle}>Propósito del viaje</Text>
      <FormSelect label="Propósito de viaje" value={form.propositoViaje} options={PROPOSITOS_VIAJE} onChange={(v) => { updateForm('propositoViaje', v); updateSolicitante('tipoPersona', ''); }} required />

      {/* Datos del extranjero */}
      <Text style={styles.sectionTitle}>Datos del extranjero (conforme a pasaporte)</Text>
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
      <Text style={styles.sectionTitle}>Pasaporte o documento de identidad</Text>
      <FormSelect label="Documento de identificación" value={form.documentoIdentificacion} options={DOCUMENTOS_IDENTIFICACION} onChange={(v) => updateForm('documentoIdentificacion', v)} required />
      <Field label="Número de documento *"><TextInput style={styles.input} value={form.numeroDocumento} onChangeText={(v) => updateForm('numeroDocumento', v)} placeholder="Número" placeholderTextColor="#9CA3AF" /></Field>
      <FormSelect label="País de expedición" value={form.paisExpedicion} options={PAISES} onChange={(v) => updateForm('paisExpedicion', v)} required searchable />
      <FormDatePicker label="Fecha de expedición" value={form.fechaExpedicion} onChange={(v) => updateForm('fechaExpedicion', v)} minYear={2000} maxYear={2026} />
      <FormDatePicker label="Fecha de vencimiento" value={form.fechaVencimiento} onChange={(v) => updateForm('fechaVencimiento', v)} minYear={2024} maxYear={2040} />

      {/* Información adicional del extranjero */}
      <Text style={styles.sectionTitle}>Información adicional del extranjero</Text>
      <FormSelect label="Actividad principal en tu país de residencia" value={form.actividadPrincipal} options={ACTIVIDADES_PRINCIPALES} onChange={(v) => updateForm('actividadPrincipal', v)} required />
      {form.actividadPrincipal === 'Trabajar' && (
        <>
          <FormSelect label="Sector o rama de actividad" value={form.sectorTrabajo} options={SECTORES_ACTIVIDAD} onChange={(v) => updateForm('sectorTrabajo', v)} required searchable />
          <FormSelect label="Situación en el trabajo" value={form.situacionTrabajo} options={SITUACIONES_TRABAJO} onChange={(v) => updateForm('situacionTrabajo', v)} required />
          <FormSelect label="Ocupación en el trabajo" value={form.ocupacionTrabajo} options={OCUPACIONES_TRABAJO} onChange={(v) => updateForm('ocupacionTrabajo', v)} required />
        </>
      )}
      <FormSelect label="¿Has sido expulsado de México?" value={form.expulsadoMexico} options={SI_NO} onChange={(v) => updateForm('expulsadoMexico', v)} required />
      <FormSelect label="¿Tienes antecedentes penales?" value={form.antecedentesPenales} options={SI_NO} onChange={(v) => updateForm('antecedentesPenales', v)} required />

      {/* Datos de la institución/persona que solicita la visa */}
      <Text style={styles.sectionTitle}>Datos de la institución, organismo o persona que solicita la autorización de la visa</Text>
      <FormSelect label="Tipo de persona" value={solicitante.tipoPersona} options={tipoPersonaOptions} onChange={(v) => updateSolicitante('tipoPersona', v)} required />

      {/* Persona Física */}
      {solicitante.tipoPersona === 'Física' && (
        <View>
          <Text style={styles.subsectionTitle}>Datos de la persona física</Text>
          <Field label="CURP"><TextInput style={styles.input} value={solicitante.curp} onChangeText={(v) => updateSolicitante('curp', v.toUpperCase())} placeholder="18 caracteres" placeholderTextColor="#9CA3AF" maxLength={18} autoCapitalize="characters" /></Field>
          <Field label="RFC"><TextInput style={styles.input} value={solicitante.rfc} onChangeText={(v) => updateSolicitante('rfc', v.toUpperCase())} placeholder="13 caracteres" placeholderTextColor="#9CA3AF" maxLength={13} autoCapitalize="characters" /></Field>
          <Field label="Nombre(s) *"><TextInput style={styles.input} value={solicitante.nombre} onChangeText={(v) => updateSolicitante('nombre', v)} placeholder="Nombre(s)" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Apellido(s) *"><TextInput style={styles.input} value={solicitante.apellidos} onChangeText={(v) => updateSolicitante('apellidos', v)} placeholder="Apellido(s)" placeholderTextColor="#9CA3AF" /></Field>
          <FormSelect label="Nacionalidad actual" value={solicitante.nacionalidad} options={NACIONALIDADES} onChange={(v) => updateSolicitante('nacionalidad', v)} required searchable />
          <FormSelect label="Tipo de documento" value={solicitante.tipoDocumento} options={DOCUMENTOS_IDENTIFICACION} onChange={(v) => updateSolicitante('tipoDocumento', v)} required />
          <Field label="Número de documento *"><TextInput style={styles.input} value={solicitante.numeroDocumento} onChangeText={(v) => updateSolicitante('numeroDocumento', v)} placeholder="Número" placeholderTextColor="#9CA3AF" /></Field>
          <FormSelect label="Vínculo o parentesco con el extranjero" value={solicitante.vinculoParentesco} options={VINCULOS_PARENTESCO} onChange={(v) => updateSolicitante('vinculoParentesco', v)} required />

          <Text style={styles.subsectionTitle}>Domicilio de la persona física</Text>
          <Field label="Código postal *"><TextInput style={styles.input} value={solicitante.codigoPostal} onChangeText={(v) => updateSolicitante('codigoPostal', v)} placeholder="CP" placeholderTextColor="#9CA3AF" keyboardType="number-pad" /></Field>
          <FormSelect label="Estado" value={solicitante.estado} options={ESTADOS_MEXICO} onChange={(v) => { updateSolicitante('estado', v); updateSolicitante('municipio', ''); }} required />
          <Field label="Municipio o Alcaldía *"><TextInput style={styles.input} value={solicitante.municipio} onChangeText={(v) => updateSolicitante('municipio', v)} placeholder="Municipio" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Colonia *"><TextInput style={styles.input} value={solicitante.colonia} onChangeText={(v) => updateSolicitante('colonia', v)} placeholder="Colonia" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Calle *"><TextInput style={styles.input} value={solicitante.calle} onChangeText={(v) => updateSolicitante('calle', v)} placeholder="Calle" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Número exterior *"><TextInput style={styles.input} value={solicitante.numeroExterior} onChangeText={(v) => updateSolicitante('numeroExterior', v)} placeholder="Núm. ext." placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Número interior"><TextInput style={styles.input} value={solicitante.numeroInterior} onChangeText={(v) => updateSolicitante('numeroInterior', v)} placeholder="Opcional" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Lada"><TextInput style={styles.input} value={solicitante.lada} onChangeText={(v) => updateSolicitante('lada', v)} placeholder="Lada" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Teléfono fijo"><TextInput style={styles.input} value={solicitante.telefonoFijo} onChangeText={(v) => updateSolicitante('telefonoFijo', v)} placeholder="Teléfono" placeholderTextColor="#9CA3AF" /></Field>
        </View>
      )}

      {/* Persona Moral */}
      {solicitante.tipoPersona === 'Moral' && (
        <View>
          <Text style={styles.subsectionTitle}>Datos de la persona moral</Text>
          <Field label="RFC *"><TextInput style={styles.input} value={solicitante.moralRfc} onChangeText={(v) => updateSolicitante('moralRfc', v.toUpperCase())} placeholder="12 caracteres" placeholderTextColor="#9CA3AF" maxLength={12} autoCapitalize="characters" /></Field>
          <Field label="Nombre o razón social *"><TextInput style={styles.input} value={solicitante.moralRazonSocial} onChangeText={(v) => updateSolicitante('moralRazonSocial', v)} placeholder="Razón social" placeholderTextColor="#9CA3AF" /></Field>
          <FormSelect label="Sector o rama de actividad" value={solicitante.moralSector} options={SECTORES_ACTIVIDAD} onChange={(v) => updateSolicitante('moralSector', v)} searchable />
          <Field label="Objeto de la empresa o giro comercial"><TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} value={solicitante.moralGiroComercial} onChangeText={(v) => updateSolicitante('moralGiroComercial', v)} placeholder="Giro comercial" placeholderTextColor="#9CA3AF" multiline /></Field>

          <Text style={styles.subsectionTitle}>Domicilio de la persona moral</Text>
          <Field label="Código postal *"><TextInput style={styles.input} value={solicitante.moralCodigoPostal} onChangeText={(v) => updateSolicitante('moralCodigoPostal', v)} placeholder="CP" placeholderTextColor="#9CA3AF" keyboardType="number-pad" /></Field>
          <FormSelect label="Estado" value={solicitante.moralEstado} options={ESTADOS_MEXICO} onChange={(v) => { updateSolicitante('moralEstado', v); updateSolicitante('moralMunicipio', ''); }} required />
          <Field label="Municipio o Alcaldía *"><TextInput style={styles.input} value={solicitante.moralMunicipio} onChangeText={(v) => updateSolicitante('moralMunicipio', v)} placeholder="Municipio" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Colonia *"><TextInput style={styles.input} value={solicitante.moralColonia} onChangeText={(v) => updateSolicitante('moralColonia', v)} placeholder="Colonia" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Calle *"><TextInput style={styles.input} value={solicitante.moralCalle} onChangeText={(v) => updateSolicitante('moralCalle', v)} placeholder="Calle" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Número exterior *"><TextInput style={styles.input} value={solicitante.moralNumeroExterior} onChangeText={(v) => updateSolicitante('moralNumeroExterior', v)} placeholder="Núm. ext." placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Número interior"><TextInput style={styles.input} value={solicitante.moralNumeroInterior} onChangeText={(v) => updateSolicitante('moralNumeroInterior', v)} placeholder="Opcional" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Lada"><TextInput style={styles.input} value={solicitante.moralLada} onChangeText={(v) => updateSolicitante('moralLada', v)} placeholder="Lada" placeholderTextColor="#9CA3AF" /></Field>
          <Field label="Teléfono fijo"><TextInput style={styles.input} value={solicitante.moralTelefonoFijo} onChangeText={(v) => updateSolicitante('moralTelefonoFijo', v)} placeholder="Teléfono" placeholderTextColor="#9CA3AF" /></Field>

          <Text style={styles.subsectionTitle}>Datos del acta constitutiva</Text>
          <Field label="Número de acta constitutiva"><TextInput style={styles.input} value={solicitante.moralNumeroActa} onChangeText={(v) => updateSolicitante('moralNumeroActa', v)} placeholder="Número" placeholderTextColor="#9CA3AF" /></Field>
          <FormDatePicker label="Fecha de registro del acta" value={solicitante.moralFechaActa} onChange={(v) => updateSolicitante('moralFechaActa', v)} minYear={1950} maxYear={2026} />
        </View>
      )}

      {/* Correo electrónico */}
      <Text style={styles.sectionTitle}>Correo electrónico para notificar al promovente</Text>
      <Field label="Correo electrónico *"><TextInput style={styles.input} value={form.solicitanteEmail} onChangeText={(v) => updateForm('solicitanteEmail', v)} placeholder="nombre@correo.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" /></Field>
      <Field label="Correo electrónico (confirmación) *"><TextInput style={styles.input} value={form.solicitanteEmailConfirmacion} onChangeText={(v) => updateForm('solicitanteEmailConfirmacion', v)} placeholder="Confirma tu correo" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" /></Field>

      {/* Comentarios */}
      <Text style={styles.sectionTitle}>Comentarios</Text>
      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.comentarios} onChangeText={(v) => updateForm('comentarios', v)} placeholder="Si lo deseas, puedes agregar algún comentario a la solicitud (opcional)" placeholderTextColor="#9CA3AF" multiline />
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
  subsectionTitle: { fontSize: 14, fontWeight: '600', color: '#4A3F37', marginTop: 18, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#E8DFD3' },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#4A3F37', marginBottom: 5 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DFD3', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#2C1810' },
  requiredNote: { fontSize: 11, color: '#8B7B6F', marginTop: 16 },
});
