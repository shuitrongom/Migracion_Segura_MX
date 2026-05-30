import { View, Text, TextInput, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import FormSelect from '@/components/FormSelect';
import FormDatePicker from '@/components/FormDatePicker';
import { OPCIONES_POR_TIPO, SEXOS, ESTADOS_CIVILES, DOCUMENTOS_IDENTIFICACION, NACIONALIDADES, PAISES, ESTADOS_MEXICO, TIPOS_PERSONA, DOCUMENTOS_IDENTIFICACION_PERSONA, SECTORES_ACTIVIDAD } from '@/lib/catalogos';

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
  const isCIE = tipo === 'constancia_empleador';

  // Estado CIE - Persona Física
  const [cieTipoPersona, setCieTipoPersona] = useState('');
  const [cieF, setCieF] = useState({
    curp: '', rfc: '', nombre: '', apellidos: '', nacionalidad: '',
    tipoDocumento: '', numeroDocumento: '',
    codigoPostal: '', estado: '', municipio: '', colonia: '', calle: '',
    numeroExterior: '', numeroInterior: '', lada: '', telefonoFijo: '',
  });
  // Estado CIE - Persona Moral
  const [cieM, setCieM] = useState({
    rfc: '', razonSocial: '', sector: '', giroComercial: '',
    codigoPostal: '', estado: '', municipio: '', colonia: '', calle: '',
    numeroExterior: '', numeroInterior: '', lada: '', telefonoFijo: '',
    numeroActa: '', fechaActa: '',
  });

  const updateCieF = (field: string, value: string) => {
    const upper = ['curp', 'rfc'];
    setCieF(prev => ({ ...prev, [field]: upper.includes(field) ? value.toUpperCase() : value }));
  };
  const updateCieM = (field: string, value: string) => {
    setCieM(prev => ({ ...prev, [field]: field === 'rfc' ? value.toUpperCase() : value }));
  };

  // Representantes legales (CIE Moral)
  const [representantes, setRepresentantes] = useState<{ curp: string; nombre: string; apellidos: string; nacionalidad: string; tipoDocumento: string; numeroDocumento: string; lada: string; telefonoFijo: string }[]>([]);
  const [repTemp, setRepTemp] = useState({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '', lada: '', telefonoFijo: '' });

  const handleAddRepresentante = () => {
    if (!repTemp.nombre.trim() || !repTemp.apellidos.trim()) { Alert.alert('Error', 'Nombre y apellidos son obligatorios'); return; }
    setRepresentantes([...representantes, { ...repTemp }]);
    setRepTemp({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '', lada: '', telefonoFijo: '' });
  };

  // Personas autorizadas
  const [personasAutorizadas, setPersonasAutorizadas] = useState<{ curp: string; nombre: string; apellidos: string; nacionalidad: string; tipoDocumento: string; numeroDocumento: string }[]>([]);
  const [personaTemp, setPersonaTemp] = useState({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });
  const handleAddPersona = () => {
    if (!personaTemp.nombre.trim() || !personaTemp.apellidos.trim()) { Alert.alert('Error', 'Nombre y apellidos son obligatorios'); return; }
    setPersonasAutorizadas([...personasAutorizadas, { ...personaTemp }]);
    setPersonaTemp({ curp: '', nombre: '', apellidos: '', nacionalidad: '', tipoDocumento: '', numeroDocumento: '' });
  };

  const propositoLabel = tipo === 'visa' ? 'Propósito de viaje' : '¿Qué deseas hacer?';

  return (
    <View>
      {/* Tipo de trámite / Propósito */}
      <Text style={styles.sectionTitle}>{isCIE ? '¿Qué deseas hacer?' : 'Tipo de trámite'}</Text>
      <FormSelect label={propositoLabel} value={form.propositoViaje} options={opciones.proposito} onChange={(v) => { updateForm('propositoViaje', v); updateForm('especificaTramite', ''); }} required />
      {especificaOpciones.length > 0 && (
        <FormSelect label="Especifica" value={form.especificaTramite} options={especificaOpciones} onChange={(v) => updateForm('especificaTramite', v)} required />
      )}

      {/* ===== SECCIÓN CIE: Datos de la empresa o persona ===== */}
      {isCIE && (
        <>
          <Text style={styles.sectionTitle}>Datos de la empresa o persona que tendrá a su cargo o responsabilidad a extranjeros</Text>
          <FormSelect label="Tipo de persona" value={cieTipoPersona} options={TIPOS_PERSONA} onChange={(v) => setCieTipoPersona(v)} required />

          {/* CIE - Persona Física */}
          {cieTipoPersona === 'Física' && (
            <View>
              <Text style={styles.subsectionTitle}>Datos de la persona física</Text>
              <Field label="CURP"><TextInput style={styles.input} value={cieF.curp} onChangeText={(v) => updateCieF('curp', v)} placeholder="18 caracteres" placeholderTextColor="#4A6FA5" maxLength={18} autoCapitalize="characters" /></Field>
              <Field label="RFC *"><TextInput style={styles.input} value={cieF.rfc} onChangeText={(v) => updateCieF('rfc', v)} placeholder="13 caracteres" placeholderTextColor="#4A6FA5" maxLength={13} autoCapitalize="characters" /></Field>
              <Field label="Nombre(s) *"><TextInput style={styles.input} value={cieF.nombre} onChangeText={(v) => updateCieF('nombre', v)} placeholder="Nombre(s)" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Apellido(s) *"><TextInput style={styles.input} value={cieF.apellidos} onChangeText={(v) => updateCieF('apellidos', v)} placeholder="Apellido(s)" placeholderTextColor="#4A6FA5" /></Field>
              <FormSelect label="Nacionalidad actual" value={cieF.nacionalidad} options={NACIONALIDADES} onChange={(v) => updateCieF('nacionalidad', v)} required searchable />
              <FormSelect label="Tipo de documento" value={cieF.tipoDocumento} options={DOCUMENTOS_IDENTIFICACION_PERSONA} onChange={(v) => updateCieF('tipoDocumento', v)} required />
              <Field label="Número de documento *"><TextInput style={styles.input} value={cieF.numeroDocumento} onChangeText={(v) => updateCieF('numeroDocumento', v)} placeholder="Número" placeholderTextColor="#4A6FA5" /></Field>

              <Text style={styles.subsectionTitle}>Domicilio fiscal de la persona física</Text>
              <Field label="Código postal *"><TextInput style={styles.input} value={cieF.codigoPostal} onChangeText={(v) => updateCieF('codigoPostal', v)} placeholder="CP" placeholderTextColor="#4A6FA5" keyboardType="number-pad" /></Field>
              <FormSelect label="Estado" value={cieF.estado} options={ESTADOS_MEXICO} onChange={(v) => { updateCieF('estado', v); updateCieF('municipio', ''); }} required />
              <Field label="Municipio o Alcaldía *"><TextInput style={styles.input} value={cieF.municipio} onChangeText={(v) => updateCieF('municipio', v)} placeholder="Municipio" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Colonia *"><TextInput style={styles.input} value={cieF.colonia} onChangeText={(v) => updateCieF('colonia', v)} placeholder="Colonia" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Calle *"><TextInput style={styles.input} value={cieF.calle} onChangeText={(v) => updateCieF('calle', v)} placeholder="Calle" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Número exterior *"><TextInput style={styles.input} value={cieF.numeroExterior} onChangeText={(v) => updateCieF('numeroExterior', v)} placeholder="Núm. ext." placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Número interior"><TextInput style={styles.input} value={cieF.numeroInterior} onChangeText={(v) => updateCieF('numeroInterior', v)} placeholder="Opcional" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Lada"><TextInput style={styles.input} value={cieF.lada} onChangeText={(v) => updateCieF('lada', v)} placeholder="Lada" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Teléfono fijo"><TextInput style={styles.input} value={cieF.telefonoFijo} onChangeText={(v) => updateCieF('telefonoFijo', v)} placeholder="Teléfono" placeholderTextColor="#4A6FA5" /></Field>
            </View>
          )}

          {/* CIE - Persona Moral */}
          {cieTipoPersona === 'Moral' && (
            <View>
              <Text style={styles.subsectionTitle}>Datos de la persona moral</Text>
              <Field label="RFC *"><TextInput style={styles.input} value={cieM.rfc} onChangeText={(v) => updateCieM('rfc', v)} placeholder="12 caracteres" placeholderTextColor="#4A6FA5" maxLength={12} autoCapitalize="characters" /></Field>
              <Field label="Nombre o razón social *"><TextInput style={styles.input} value={cieM.razonSocial} onChangeText={(v) => updateCieM('razonSocial', v)} placeholder="Razón social" placeholderTextColor="#4A6FA5" /></Field>
              <FormSelect label="Sector o rama de actividad" value={cieM.sector} options={SECTORES_ACTIVIDAD} onChange={(v) => updateCieM('sector', v)} searchable />
              <Field label="Objeto de la empresa o giro comercial *"><TextInput style={[styles.input, { height: 70, textAlignVertical: 'top' }]} value={cieM.giroComercial} onChangeText={(v) => updateCieM('giroComercial', v)} placeholder="Giro comercial" placeholderTextColor="#4A6FA5" multiline /></Field>

              <Text style={styles.subsectionTitle}>Domicilio fiscal de la persona moral</Text>
              <Field label="Código postal *"><TextInput style={styles.input} value={cieM.codigoPostal} onChangeText={(v) => updateCieM('codigoPostal', v)} placeholder="CP" placeholderTextColor="#4A6FA5" keyboardType="number-pad" /></Field>
              <FormSelect label="Estado" value={cieM.estado} options={ESTADOS_MEXICO} onChange={(v) => { updateCieM('estado', v); updateCieM('municipio', ''); }} required />
              <Field label="Municipio o Alcaldía *"><TextInput style={styles.input} value={cieM.municipio} onChangeText={(v) => updateCieM('municipio', v)} placeholder="Municipio" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Colonia *"><TextInput style={styles.input} value={cieM.colonia} onChangeText={(v) => updateCieM('colonia', v)} placeholder="Colonia" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Calle *"><TextInput style={styles.input} value={cieM.calle} onChangeText={(v) => updateCieM('calle', v)} placeholder="Calle" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Número exterior *"><TextInput style={styles.input} value={cieM.numeroExterior} onChangeText={(v) => updateCieM('numeroExterior', v)} placeholder="Núm. ext." placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Número interior"><TextInput style={styles.input} value={cieM.numeroInterior} onChangeText={(v) => updateCieM('numeroInterior', v)} placeholder="Opcional" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Lada"><TextInput style={styles.input} value={cieM.lada} onChangeText={(v) => updateCieM('lada', v)} placeholder="Lada" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Teléfono fijo"><TextInput style={styles.input} value={cieM.telefonoFijo} onChangeText={(v) => updateCieM('telefonoFijo', v)} placeholder="Teléfono" placeholderTextColor="#4A6FA5" /></Field>

              <Text style={styles.subsectionTitle}>Datos del acta constitutiva</Text>
              <Field label="Número de acta constitutiva"><TextInput style={styles.input} value={cieM.numeroActa} onChangeText={(v) => updateCieM('numeroActa', v)} placeholder="Número" placeholderTextColor="#4A6FA5" /></Field>
              <FormDatePicker label="Fecha de registro del acta" value={cieM.fechaActa} onChange={(v) => updateCieM('fechaActa', v)} minYear={1950} maxYear={2026} />
            </View>
          )}

          {/* CIE - Representante legal (solo Moral) */}
          {cieTipoPersona === 'Moral' && (
            <>
              <Text style={styles.sectionTitle}>Datos del representante legal de la persona moral</Text>
              <Text style={styles.infoText}>Se debe capturar el nombre del representante legal que tiene facultades para promover actos legales ante autoridades administrativas. Si usted quiere agregar representantes legales es necesario que lo efectúe con el botón 'Agregar representante'.</Text>
              <Field label="CURP"><TextInput style={styles.input} value={repTemp.curp} onChangeText={(v) => setRepTemp(prev => ({ ...prev, curp: v.toUpperCase() }))} placeholder="18 caracteres" placeholderTextColor="#4A6FA5" maxLength={18} autoCapitalize="characters" /></Field>
              <Field label="Nombre(s) *"><TextInput style={styles.input} value={repTemp.nombre} onChangeText={(v) => setRepTemp(prev => ({ ...prev, nombre: v }))} placeholder="Nombre(s)" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Apellido(s) *"><TextInput style={styles.input} value={repTemp.apellidos} onChangeText={(v) => setRepTemp(prev => ({ ...prev, apellidos: v }))} placeholder="Apellido(s)" placeholderTextColor="#4A6FA5" /></Field>
              <FormSelect label="Nacionalidad actual" value={repTemp.nacionalidad} options={NACIONALIDADES} onChange={(v) => setRepTemp(prev => ({ ...prev, nacionalidad: v }))} searchable />
              <FormSelect label="Tipo de documento de identificación" value={repTemp.tipoDocumento} options={DOCUMENTOS_IDENTIFICACION_PERSONA} onChange={(v) => setRepTemp(prev => ({ ...prev, tipoDocumento: v }))} />
              <Field label="Número de documento"><TextInput style={styles.input} value={repTemp.numeroDocumento} onChangeText={(v) => setRepTemp(prev => ({ ...prev, numeroDocumento: v }))} placeholder="Número" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Lada"><TextInput style={styles.input} value={repTemp.lada} onChangeText={(v) => setRepTemp(prev => ({ ...prev, lada: v }))} placeholder="Lada" placeholderTextColor="#4A6FA5" /></Field>
              <Field label="Teléfono fijo"><TextInput style={styles.input} value={repTemp.telefonoFijo} onChangeText={(v) => setRepTemp(prev => ({ ...prev, telefonoFijo: v }))} placeholder="Teléfono" placeholderTextColor="#4A6FA5" /></Field>
              <TouchableOpacity style={styles.addButton} onPress={handleAddRepresentante}>
                <Text style={styles.addButtonText}>+ Agregar representante</Text>
              </TouchableOpacity>
              {representantes.length > 0 && (
                <View style={styles.listContainer}>
                  {representantes.map((r, i) => (
                    <View key={i} style={styles.listItem}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.listItemName}>{r.nombre} {r.apellidos}</Text>
                        <Text style={styles.listItemDetail}>{r.nacionalidad} · {r.tipoDocumento} {r.numeroDocumento}</Text>
                      </View>
                      <TouchableOpacity onPress={() => setRepresentantes(representantes.filter((_, idx) => idx !== i))}>
                        <Text style={styles.removeText}>Eliminar</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}
            </>
          )}
        </>
      )}

      {/* Datos del extranjero (no aplica para constancia_empleador) */}
      {!isCIE && (
        <>
          <Text style={styles.sectionTitle}>Datos del extranjero (conforme a pasaporte o documento de identidad)</Text>
          {showCurp && <Field label="Clave Única de Registro de Población (CURP)"><TextInput style={styles.input} value={form.curpExtranjero} onChangeText={(v) => updateForm('curpExtranjero', v.toUpperCase())} placeholder="18 caracteres" placeholderTextColor="#4A6FA5" maxLength={18} autoCapitalize="characters" /></Field>}
          <Field label="Nombre(s) *"><TextInput style={styles.input} value={form.nombre} onChangeText={(v) => updateForm('nombre', v)} placeholder="Nombre(s)" placeholderTextColor="#4A6FA5" /></Field>
          <Field label="Apellido(s) *"><TextInput style={styles.input} value={form.apellidos} onChangeText={(v) => updateForm('apellidos', v)} placeholder="Apellido(s)" placeholderTextColor="#4A6FA5" /></Field>
          <FormSelect label="Sexo" value={form.sexo ? SEXOS.find(s => s.value === form.sexo)?.label || '' : ''} options={SEXOS.map(s => s.label)} onChange={(v) => updateForm('sexo', SEXOS.find(s => s.label === v)?.value || '')} required />
          <FormDatePicker label="Fecha de nacimiento" value={form.fechaNacimiento} onChange={(v) => updateForm('fechaNacimiento', v)} required minYear={1940} maxYear={2010} />
          <FormSelect label="Nacionalidad actual" value={form.nacionalidad} options={NACIONALIDADES} onChange={(v) => updateForm('nacionalidad', v)} required searchable />
          <FormSelect label="Estado civil actual" value={form.estadoCivil} options={ESTADOS_CIVILES.map(e => e.label)} onChange={(v) => updateForm('estadoCivil', v)} />

          {/* Lugar de nacimiento */}
          <Text style={styles.sectionTitle}>Lugar de nacimiento</Text>
          <FormSelect label="País de nacimiento" value={form.paisNacimiento} options={PAISES} onChange={(v) => updateForm('paisNacimiento', v)} required searchable />
          <Field label="Estado, provincia o departamento *"><TextInput style={styles.input} value={form.estadoProvinciaNacimiento} onChangeText={(v) => updateForm('estadoProvinciaNacimiento', v)} placeholder="Estado o provincia" placeholderTextColor="#4A6FA5" /></Field>

          {/* Pasaporte */}
          <Text style={styles.sectionTitle}>Pasaporte o documento con el que se identifica el extranjero</Text>
          <FormSelect label="Documento de identificación" value={form.documentoIdentificacion} options={DOCUMENTOS_IDENTIFICACION} onChange={(v) => updateForm('documentoIdentificacion', v)} required />
          <Field label="Número de documento *"><TextInput style={styles.input} value={form.numeroDocumento} onChangeText={(v) => updateForm('numeroDocumento', v)} placeholder="Número" placeholderTextColor="#4A6FA5" /></Field>
          <FormSelect label="País de expedición" value={form.paisExpedicion} options={PAISES} onChange={(v) => updateForm('paisExpedicion', v)} required searchable />
          <FormDatePicker label="Fecha de expedición" value={form.fechaExpedicion} onChange={(v) => updateForm('fechaExpedicion', v)} minYear={2000} maxYear={2026} />
          <FormDatePicker label="Fecha de vencimiento" value={form.fechaVencimiento} onChange={(v) => updateForm('fechaVencimiento', v)} minYear={2024} maxYear={2040} />
        </>
      )}

      {/* Domicilio del extranjero en México */}
      {showDomicilio && (
        <>
          <Text style={styles.sectionTitle}>Domicilio del extranjero en México</Text>
          <Field label="Código postal *"><TextInput style={styles.input} value={form.domCodigoPostal} onChangeText={(v) => updateForm('domCodigoPostal', v)} placeholder="CP" placeholderTextColor="#4A6FA5" keyboardType="number-pad" /></Field>
          <FormSelect label="Estado" value={form.domEstado} options={ESTADOS_MEXICO} onChange={(v) => { updateForm('domEstado', v); updateForm('domMunicipio', ''); }} required />
          <Field label="Municipio o Alcaldía *"><TextInput style={styles.input} value={form.domMunicipio} onChangeText={(v) => updateForm('domMunicipio', v)} placeholder="Municipio" placeholderTextColor="#4A6FA5" /></Field>
          <Field label="Colonia *"><TextInput style={styles.input} value={form.domColonia} onChangeText={(v) => updateForm('domColonia', v)} placeholder="Colonia" placeholderTextColor="#4A6FA5" /></Field>
          <Field label="Calle *"><TextInput style={styles.input} value={form.domCalle} onChangeText={(v) => updateForm('domCalle', v)} placeholder="Calle" placeholderTextColor="#4A6FA5" /></Field>
          <Field label="Número exterior *"><TextInput style={styles.input} value={form.domNumeroExterior} onChangeText={(v) => updateForm('domNumeroExterior', v)} placeholder="Núm. ext." placeholderTextColor="#4A6FA5" /></Field>
          <Field label="Número interior"><TextInput style={styles.input} value={form.domNumeroInterior} onChangeText={(v) => updateForm('domNumeroInterior', v)} placeholder="Opcional" placeholderTextColor="#4A6FA5" /></Field>
          <Field label="Lada"><TextInput style={styles.input} value={form.domLada} onChangeText={(v) => updateForm('domLada', v)} placeholder="Lada" placeholderTextColor="#4A6FA5" /></Field>
          <Field label="Teléfono fijo"><TextInput style={styles.input} value={form.domTelefonoFijo} onChangeText={(v) => updateForm('domTelefonoFijo', v)} placeholder="Teléfono" placeholderTextColor="#4A6FA5" /></Field>
        </>
      )}

      {/* Datos del empleador (para permiso_trabajo/regularización) */}
      {showEmpleador && (
        <>
          <Text style={styles.sectionTitle}>Datos del empleador</Text>
          <Text style={styles.infoText}>Si presenta oferta de empleo, proporcione los datos del empleador.</Text>
          <FormSelect label="Tipo de persona" value={form.empleadorTipoPersona} options={TIPOS_PERSONA} onChange={(v) => updateForm('empleadorTipoPersona', v)} required />
          {form.empleadorTipoPersona !== '' && (
            <>
              <Field label="Registro Federal de Contribuyentes (RFC) *"><TextInput style={styles.input} value={form.empleadorRfc} onChangeText={(v) => updateForm('empleadorRfc', v.toUpperCase())} placeholder="RFC" placeholderTextColor="#4A6FA5" autoCapitalize="characters" maxLength={form.empleadorTipoPersona === 'Moral' ? 12 : 13} /></Field>
              <Field label="Número de expediente *"><TextInput style={styles.input} value={form.empleadorNumeroExpediente} onChangeText={(v) => updateForm('empleadorNumeroExpediente', v)} placeholder="Expediente" placeholderTextColor="#4A6FA5" /></Field>
            </>
          )}
        </>
      )}

      {/* Correo electrónico */}
      <Text style={styles.sectionTitle}>Correo electrónico para notificar al promovente</Text>
      <Text style={styles.infoText}>Agrega la dirección de correo electrónico en donde se recibirán las notificaciones asociadas a tu trámite.</Text>
      <Field label="Correo electrónico *"><TextInput style={styles.input} value={form.solicitanteEmail} onChangeText={(v) => updateForm('solicitanteEmail', v)} placeholder="nombre@correo.com" placeholderTextColor="#4A6FA5" keyboardType="email-address" autoCapitalize="none" /></Field>
      <Field label="Correo electrónico (confirmación) *"><TextInput style={styles.input} value={form.solicitanteEmailConfirmacion} onChangeText={(v) => updateForm('solicitanteEmailConfirmacion', v)} placeholder="Confirma tu correo" placeholderTextColor="#4A6FA5" keyboardType="email-address" autoCapitalize="none" /></Field>

      {/* Persona autorizada */}
      <Text style={styles.sectionTitle}>En su caso, persona autorizada para tramitar, oír o recibir notificaciones</Text>
      <Text style={styles.infoText}>Si deseas agregar personas autorizadas es necesario que lo efectúes con el botón "Agregar persona", de lo contrario los datos capturados en esta sección no serán guardados.</Text>
      <Field label="CURP"><TextInput style={styles.input} value={personaTemp.curp} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, curp: v.toUpperCase() }))} placeholder="18 caracteres" placeholderTextColor="#4A6FA5" maxLength={18} autoCapitalize="characters" /></Field>
      <Field label="Nombre(s) *"><TextInput style={styles.input} value={personaTemp.nombre} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, nombre: v }))} placeholder="Nombre(s)" placeholderTextColor="#4A6FA5" /></Field>
      <Field label="Apellido(s) *"><TextInput style={styles.input} value={personaTemp.apellidos} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, apellidos: v }))} placeholder="Apellido(s)" placeholderTextColor="#4A6FA5" /></Field>
      <FormSelect label="Nacionalidad actual" value={personaTemp.nacionalidad} options={NACIONALIDADES} onChange={(v) => setPersonaTemp(prev => ({ ...prev, nacionalidad: v }))} searchable />
      <FormSelect label="Tipo de documento de identificación" value={personaTemp.tipoDocumento} options={DOCUMENTOS_IDENTIFICACION_PERSONA} onChange={(v) => setPersonaTemp(prev => ({ ...prev, tipoDocumento: v }))} />
      <Field label="Número de documento"><TextInput style={styles.input} value={personaTemp.numeroDocumento} onChangeText={(v) => setPersonaTemp(prev => ({ ...prev, numeroDocumento: v }))} placeholder="Número" placeholderTextColor="#4A6FA5" /></Field>
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
      <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} value={form.comentarios} onChangeText={(v) => updateForm('comentarios', v)} placeholder="Comentarios (opcional)" placeholderTextColor="#4A6FA5" multiline />
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
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#00D4FF', marginTop: 24, marginBottom: 12, paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#1A3A4A', letterSpacing: 0.5 },
  subsectionTitle: { fontSize: 14, fontWeight: '600', color: '#8EC8F8', marginTop: 18, marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: '#112240' },
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: '#8EC8F8', marginBottom: 5, letterSpacing: 0.3 },
  input: { backgroundColor: '#0D1B2A', borderWidth: 1.5, borderColor: '#1A3A4A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: '#E0F7FA' },
  requiredNote: { fontSize: 11, color: '#4A6FA5', marginTop: 16 },
  infoText: { fontSize: 12, color: '#8EC8F8', marginBottom: 12, lineHeight: 18, backgroundColor: '#112240', padding: 12, borderRadius: 10, borderWidth: 1, borderColor: '#1A3A4A' },
  commentHint: { fontSize: 12, color: '#4A6FA5', marginBottom: 8 },
  addButton: { backgroundColor: '#112240', borderWidth: 1.5, borderColor: '#00D4FF', borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginTop: 8, marginBottom: 8 },
  addButtonText: { color: '#00D4FF', fontSize: 14, fontWeight: '700' },
  listContainer: { marginTop: 8, gap: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#112240', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1A3A4A' },
  listItemName: { fontSize: 14, fontWeight: '600', color: '#E0F7FA' },
  listItemDetail: { fontSize: 12, color: '#4A6FA5', marginTop: 2 },
  removeText: { fontSize: 12, color: '#FF6B6B', fontWeight: '600' },
});
