import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import FormSelect from '@/components/FormSelect';
import FormDatePicker from '@/components/FormDatePicker';
import { useTheme } from '@/lib/theme';
import { PROPOSITOS_VIAJE, SEXOS, ESTADOS_CIVILES, DOCUMENTOS_IDENTIFICACION, NACIONALIDADES, PAISES, ACTIVIDADES_PRINCIPALES, SI_NO, SITUACIONES_TRABAJO, OCUPACIONES_TRABAJO, SECTORES_ACTIVIDAD, VINCULOS_PARENTESCO, TIPOS_PERSONA, ESTADOS_MEXICO, DOCUMENTOS_IDENTIFICACION_PERSONA } from '@/lib/catalogos';

interface VisaFormProps {
  form: Record<string, string>;
  solicitante: Record<string, string>;
  updateForm: (field: string, value: string) => void;
  updateSolicitante: (field: string, value: string) => void;
}

export default function VisaForm({ form, solicitante, updateForm, updateSolicitante }: VisaFormProps) {
  const { colors } = useTheme();
  const inputStyle = [styles.input, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.text }];
  const placeholderColor = colors.textMuted;
  const tipoPersonaOptions = form.propositoViaje === 'Unidad familiar'
    ? ['Física']
    : TIPOS_PERSONA;

  const [visas, setVisas] = useState<{ pais: string; numero: string; fechaVencimiento: string }[]>([]);
  const [visaTemp, setVisaTemp] = useState({ pais: '', numero: '', fechaVencimiento: '' });

  const handleAddVisa = () => {
    if (!visaTemp.pais.trim() || !visaTemp.numero.trim()) {
      Alert.alert('Error', 'País y número de visa son obligatorios');
      return;
    }
    setVisas([...visas, { ...visaTemp }]);
    setVisaTemp({ pais: '', numero: '', fechaVencimiento: '' });
  };

  const [personasAutorizadas, setPersonasAutorizadas] = useState<{ curp: string; nombre: string; apellidos: string; nacionalidad: string; tipoDocumento: string; numeroDocumento: string }[]>([]);
  const [personaTemp, setPersonaTemp] = useState({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });

  const handleAddPersona = () => {
    if (!personaTemp.nombre.trim() || !personaTemp.apellidos.trim()) {
      Alert.alert('Error', 'Nombre y apellidos son obligatorios');
      return;
    }
    setPersonasAutorizadas([...personasAutorizadas, { ...personaTemp }]);
    setPersonaTemp({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });
  };

  return (
    <View>
      {/* Propósito del viaje */}
      <Text style={styles.sectionTitle}>Propósito del viaje</Text>
      <FormSelect label="Propósito de viaje" value={form.propositoViaje} options={PROPOSITOS_VIAJE} onChange={(v) => { updateForm('propositoViaje', v); updateSolicitante('tipoPersona', ''); }} required />

      {/* Datos del extranjero */}
      <Text style={styles.sectionTitle}>Datos del extranjero (conforme a pasaporte)</Text>
      <Field label="Nombre(s) *"><TextInput style={inputStyle} value={form.nombre} onChangeText={(v) => updateForm('nombre', v)} placeholder="Nombre(s)" placeholderTextColor={placeholderColor} /></Field>
      <Field label="Apellido(s) *"><TextInput style={inputStyle} value={form.apellidos} onChangeText={(v) => updateForm('apellidos', v)} placeholder="Apellido(s)" placeholderTextColor={placeholderColor} /></Field>
      <FormSelect label="Sexo" value={form.sexo ? SEXOS.find(s => s.value === form.sexo)?.label || '' : ''} options={SEXOS.map(s => s.label)} onChange={(v) => updateForm('sexo', SEXOS.find(s => s.label === v)?.value || '')} required />
      <FormDatePicker label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={(v) => updateForm('fechaNacimiento', v)} required minYear={1940} maxYear={2010} />
      <FormSelect label="Nacionalidad actual" value={form.nacionalidad} options={NACIONALIDADES} onChange={(v) => updateForm('nacionalidad', v)} required searchable />
      <FormSelect label="Estado civil actual" value={form.estadoCivil} options={ESTADOS_CIVILES.map(e => e.label)} onChange={(v) => updateForm('estadoCivil', v)} />

      {/* Lugar de nacimiento */}
      <Text style={styles.sectionTitle}>Lugar de nacimiento</Text>
      <FormSelect label="País de nacimiento" value={form.paisNacimiento} options={PAISES} onChange={(v) => updateForm('paisNacimiento', v)} required searchable />
      <Field label="Estado, provincia o departamento *"><TextInput style={inputStyle} value={form.estadoProvinciaNacimiento} onChangeText={(v) => updateForm('estadoProvinciaNacimiento', v)} placeholder="Estado o provincia" placeholderTextColor={placeholderColor} /></Field>

      {/* Pasaporte */}
      <Text style={styles.sectionTitle}>Pasaporte o documento de identidad</Text>
      <FormSelect label="Documento de identificación" value={form.documentoIdentificacion} options={DOCUMENTOS_IDENTIFICACION} onChange={(v) => updateForm('documentoIdentificacion', v)} required />
      <Field label="Número de documento *"><TextInput style={inputStyle} value={form.numeroDocumento} onChangeText={(v) => updateForm('numeroDocumento', v)} placeholder="Número" placeholderTextColor={placeholderColor} /></Field>
      <FormSelect label="País de expedición" value={form.paisExpedicion} options={PAISES} onChange={(v) => updateForm('paisExpedicion', v)} required searchable />
      <FormDatePicker label="Fecha de expedición" value={form.fechaExpedicion} onChange={(v) => updateForm('fechaExpedicion', v)} minYear={2000} maxYear={2026} />
      <FormDatePicker label="Fecha de vencimiento" value={form.fechaVencimiento} onChange={(v) => updateForm('fechaVencimiento', v)} minYear={2024} maxYear={2040} />

      {/* Información adicional */}
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

      {/* Visas */}
      <Text style={styles.sectionTitle}>Señala las visas con las que cuenta el extranjero</Text>
      <Text style={styles.infoText}>Si deseas agregar visas será necesario que lo efectúes con el botón 'Agregar visa', de lo contrario los datos de esta sección no serán guardados.</Text>
      <FormSelect label="País" value={visaTemp.pais} options={PAISES} onChange={(v) => setVisaTemp(prev => ({ ...prev, pais: v }))} searchable />
      <Field label="Número"><TextInput style={inputStyle} value={visaTemp.numero} onChangeText={(v) => setVisaTemp(prev => ({ ...prev, numero: v }))} placeholder="Número de visa" placeholderTextColor={placeholderColor} /></Field>
      <FormDatePicker label="Fecha de vencimiento" value={visaTemp.fechaVencimiento} onChange={(v) => setVisaTemp(prev => ({ ...prev, fechaVencimiento: v }))} minYear={2020} maxYear={2040} />
      <TouchableOpacity style={styles.addButton} onPress={handleAddVisa}>
        <Text style={styles.addButtonText}>+ Agregar visa</Text>
      </TouchableOpacity>

      {visas.length > 0 && (
        <View style={styles.listContainer}>
          {visas.map((visa, i) => (
            <View key={i} style={styles.listItem}>
              <View style={{ flex: 1 }}>
                <Text style={styles.listItemName}>{visa.pais}</Text>
                <Text style={styles.listItemDetail}>Núm: {visa.numero} · Vence: {visa.fechaVencimiento || 'N/A'}</Text>
              </View>
              <TouchableOpacity onPress={() => setVisas(visas.filter((_, idx) => idx !== i))}>
                <Text style={styles.removeText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      {/* Datos de la institución/persona */}
      <Text style={styles.sectionTitle}>Datos de la institución, organismo o persona que solicita la autorización de la visa</Text>
      <FormSelect label="Tipo de persona" value={solicitante.tipoPersona} options={tipoPersonaOptions} onChange={(v) => updateSolicitante('tipoPersona', v)} required />

      {/* Persona Física */}
      {solicitante.tipoPersona === 'Física' && (
        <View>
          <Text style={styles.subsectionTitle}>Datos de la persona física</Text>
          <Field label="CURP"><TextInput style={inputStyle} value={solicitante.curp} onChangeText={(v) => updateSolicitante('curp', v.toUpperCase())} placeholder="18 caracteres" placeholderTextColor={placeholderColor} maxLength={18} autoCapitalize="characters" /></Field>
          <Field label="RFC"><TextInput style={inputStyle} value={solicitante.rfc} onChangeText={(v) => updateSolicitante('rfc', v.toUpperCase())} placeholder="13 caracteres" placeholderTextColor={placeholderColor} maxLength={13} autoCapitalize="characters" /></Field>
          <Field label="Nombre(s) *"><TextInput style={inputStyle} value={solicitante.nombre} onChangeText={(v) => updateSolicitante('nombre', v)} placeholder="Nombre(s)" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Apellido(s) *"><TextInput style={inputStyle} value={solicitante.apellidos} onChangeText={(v) => updateSolicitante('apellidos', v)} placeholder="Apellido(s)" placeholderTextColor={placeholderColor} /></Field>
          <FormSelect label="Nacionalidad actual" value={solicitante.nacionalidad} options={NACIONALIDADES} onChange={(v) => updateSolicitante('nacionalidad', v)} required searchable />
          <FormSelect label="Tipo de documento" value={solicitante.tipoDocumento} options={DOCUMENTOS_IDENTIFICACION} onChange={(v) => updateSolicitante('tipoDocumento', v)} required />
          <Field label="Número de documento *"><TextInput style={inputStyle} value={solicitante.numeroDocumento} onChangeText={(v) => updateSolicitante('numeroDocumento', v)} placeholder="Número" placeholderTextColor={placeholderColor} /></Field>
          <FormSelect label="Vínculo o parentesco con el extranjero" value={solicitante.vinculoParentesco} options={VINCULOS_PARENTESCO} onChange={(v) => updateSolicitante('vinculoParentesco', v)} required />

          <Text style={styles.subsectionTitle}>Domicilio de la persona física</Text>
          <Field label="Código postal *"><TextInput style={inputStyle} value={solicitante.codigoPostal} onChangeText={(v) => updateSolicitante('codigoPostal', v)} placeholder="CP" placeholderTextColor={placeholderColor} keyboardType="number-pad" /></Field>
          <FormSelect label="Estado" value={solicitante.estado} options={ESTADOS_MEXICO} onChange={(v) => { updateSolicitante('estado', v); updateSolicitante('municipio', ''); }} required />
          <Field label="Municipio o Alcaldía *"><TextInput style={inputStyle} value={solicitante.municipio} onChangeText={(v) => updateSolicitante('municipio', v)} placeholder="Municipio" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Colonia *"><TextInput style={inputStyle} value={solicitante.colonia} onChangeText={(v) => updateSolicitante('colonia', v)} placeholder="Colonia" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Calle *"><TextInput style={inputStyle} value={solicitante.calle} onChangeText={(v) => updateSolicitante('calle', v)} placeholder="Calle" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Número exterior *"><TextInput style={inputStyle} value={solicitante.numeroExterior} onChangeText={(v) => updateSolicitante('numeroExterior', v)} placeholder="Núm. ext." placeholderTextColor={placeholderColor} /></Field>
          <Field label="Número interior"><TextInput style={inputStyle} value={solicitante.numeroInterior} onChangeText={(v) => updateSolicitante('numeroInterior', v)} placeholder="Opcional" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Lada"><TextInput style={inputStyle} value={solicitante.lada} onChangeText={(v) => updateSolicitante('lada', v)} placeholder="Lada" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Teléfono fijo"><TextInput style={inputStyle} value={solicitante.telefonoFijo} onChangeText={(v) => updateSolicitante('telefonoFijo', v)} placeholder="Teléfono" placeholderTextColor={placeholderColor} /></Field>
        </View>
      )}

      {/* Persona Moral */}
      {solicitante.tipoPersona === 'Moral' && (
        <View>
          <Text style={styles.subsectionTitle}>Datos de la persona moral</Text>
          <Field label="RFC *"><TextInput style={inputStyle} value={solicitante.moralRfc} onChangeText={(v) => updateSolicitante('moralRfc', v.toUpperCase())} placeholder="12 caracteres" placeholderTextColor={placeholderColor} maxLength={12} autoCapitalize="characters" /></Field>
          <Field label="Nombre o razón social *"><TextInput style={inputStyle} value={solicitante.moralRazonSocial} onChangeText={(v) => updateSolicitante('moralRazonSocial', v)} placeholder="Razón social" placeholderTextColor={placeholderColor} /></Field>
          <FormSelect label="Sector o rama de actividad" value={solicitante.moralSector} options={SECTORES_ACTIVIDAD} onChange={(v) => updateSolicitante('moralSector', v)} searchable />
          <Field label="Objeto de la empresa o giro comercial"><TextInput style={[...inputStyle, { height: 70, textAlignVertical: 'top' }]} value={solicitante.moralGiroComercial} onChangeText={(v) => updateSolicitante('moralGiroComercial', v)} placeholder="Giro comercial" placeholderTextColor={placeholderColor} multiline /></Field>

          <Text style={styles.subsectionTitle}>Domicilio de la persona moral</Text>
          <Field label="Código postal *"><TextInput style={inputStyle} value={solicitante.moralCodigoPostal} onChangeText={(v) => updateSolicitante('moralCodigoPostal', v)} placeholder="CP" placeholderTextColor={placeholderColor} keyboardType="number-pad" /></Field>
          <FormSelect label="Estado" value={solicitante.moralEstado} options={ESTADOS_MEXICO} onChange={(v) => { updateSolicitante('moralEstado', v); updateSolicitante('moralMunicipio', ''); }} required />
          <Field label="Municipio o Alcaldía *"><TextInput style={inputStyle} value={solicitante.moralMunicipio} onChangeText={(v) => updateSolicitante('moralMunicipio', v)} placeholder="Municipio" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Colonia *"><TextInput style={inputStyle} value={solicitante.moralColonia} onChangeText={(v) => updateSolicitante('moralColonia', v)} placeholder="Colonia" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Calle *"><TextInput style={inputStyle} value={solicitante.moralCalle} onChangeText={(v) => updateSolicitante('moralCalle', v)} placeholder="Calle" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Número exterior *"><TextInput style={inputStyle} value={solicitante.moralNumeroExterior} onChangeText={(v) => updateSolicitante('moralNumeroExterior', v)} placeholder="Núm. ext." placeholderTextColor={placeholderColor} /></Field>
          <Field label="Número interior"><TextInput style={inputStyle} value={solicitante.moralNumeroInterior} onChangeText={(v) => updateSolicitante('moralNumeroInterior', v)} placeholder="Opcional" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Lada"><TextInput style={inputStyle} value={solicitante.moralLada} onChangeText={(v) => updateSolicitante('moralLada', v)} placeholder="Lada" placeholderTextColor={placeholderColor} /></Field>
          <Field label="Teléfono fijo"><TextInput style={inputStyle} value={solicitante.moralTelefonoFijo} onChangeText={(v) => updateSolicitante('moralTelefonoFijo', v)} placeholder="Teléfono" placeholderTextColor={placeholderColor} /></Field>

          <Text style={styles.subsectionTitle}>Datos del acta constitutiva</Text>
          <Field label="Número de acta constitutiva"><TextInput style={inputStyle} value={solicitante.moralNumeroActa} onChangeText={(v) => updateSolicitante('moralNumeroActa', v)} placeholder="Número" placeholderTextColor={placeholderColor} /></Field>
          <FormDatePicker label="Fecha de registro del acta" value={solicitante.moralFechaActa} onChange={(v) => updateSolicitante('moralFechaActa', v)} minYear={1950} maxYear={2026} />
        </View>
      )}

      {/* Correo electrónico */}
      <Text style={styles.sectionTitle}>Correo electrónico para notificar al promovente</Text>
      <Field label="Correo electrónico *"><TextInput style={inputStyle} value={form.solicitanteEmail} onChangeText={(v) => updateForm('solicitanteEmail', v)} placeholder="nombre@correo.com" placeholderTextColor={placeholderColor} keyboardType="email-address" autoCapitalize="none" /></Field>
      <Field label="Correo electrónico (confirmación) *"><TextInput style={inputStyle} value={form.solicitanteEmailConfirmacion} onChangeText={(v) => updateForm('solicitanteEmailConfirmacion', v)} placeholder="Confirma tu correo" placeholderTextColor={placeholderColor} keyboardType="email-address" autoCapitalize="none" /></Field>
      <Field label="Teléfono o WhatsApp *"><TextInput style={inputStyle} value={form.telefono} onChangeText={(v) => updateForm('telefono', v)} placeholder="+52 1 55 1234 5678" placeholderTextColor={placeholderColor} keyboardType="phone-pad" /></Field>

      {/* Persona autorizada */}
      <Text style={styles.sectionTitle}>En su caso, persona autorizada para tramitar, oír o recibir notificaciones</Text>
      <Text style={styles.infoText}>Si deseas agregar personas autorizadas, llena los datos y presiona "Agregar persona".</Text>
      <Field label="CURP"><TextInput style={inputStyle} value={personaTemp.curp} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, curp: v.toUpperCase() }))} placeholder="18 caracteres" placeholderTextColor={placeholderColor} maxLength={18} autoCapitalize="characters" /></Field>
      <Field label="Nombre(s) *"><TextInput style={inputStyle} value={personaTemp.nombre} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, nombre: v }))} placeholder="Nombre(s)" placeholderTextColor={placeholderColor} /></Field>
      <Field label="Apellido(s) *"><TextInput style={inputStyle} value={personaTemp.apellidos} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, apellidos: v }))} placeholder="Apellido(s)" placeholderTextColor={placeholderColor} /></Field>
      <FormSelect label="Nacionalidad actual" value={personaTemp.nacionalidad} options={NACIONALIDADES} onChange={(v) => setPersonaTemp(prev => ({ ...prev, nacionalidad: v }))} searchable />
      <FormSelect label="Tipo de documento de identificación" value={personaTemp.tipoDocumento} options={DOCUMENTOS_IDENTIFICACION_PERSONA} onChange={(v) => setPersonaTemp(prev => ({ ...prev, tipoDocumento: v }))} />
      <Field label="Número de documento"><TextInput style={inputStyle} value={personaTemp.numeroDocumento} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, numeroDocumento: v }))} placeholder="Número" placeholderTextColor={placeholderColor} /></Field>
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
      <TextInput style={[...inputStyle, { height: 80, textAlignVertical: 'top' }]} value={form.comentarios} onChangeText={(v) => updateForm('comentarios', v)} placeholder="Si lo deseas, puedes agregar algún comentario a la solicitud (opcional)" placeholderTextColor={placeholderColor} multiline />
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#f59e0b', marginTop: 24, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: 'rgba(245,158,11,0.3)', letterSpacing: 0.5 },
  subsectionTitle: { fontSize: 14, fontWeight: '600', marginTop: 18, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: 'rgba(0,0,0,0.08)' },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 5, letterSpacing: 0.3 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
  requiredNote: { fontSize: 11, marginTop: 16 },
  infoText: { fontSize: 12, marginBottom: 12, lineHeight: 18, padding: 12, borderRadius: 10, borderWidth: 1 },
  addButton: { borderWidth: 1.5, borderColor: '#f59e0b', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  addButtonText: { color: '#f59e0b', fontSize: 14, fontWeight: '700' },
  listContainer: { marginTop: 8, gap: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, borderWidth: 1 },
  listItemName: { fontSize: 14, fontWeight: '600' },
  listItemDetail: { fontSize: 12, marginTop: 2 },
  removeText: { fontSize: 12, color: '#ef4444', fontWeight: '600' },
});
