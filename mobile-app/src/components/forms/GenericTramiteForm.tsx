import { View, Text, TextInput, StyleSheet } from 'react-native';
import FormSelect from '@/components/FormSelect';
import FormDatePicker from '@/components/FormDatePicker';
import FormWizard from '@/components/forms/FormWizard';
import { useTheme } from '@/lib/theme';
import {
  OPCIONES_POR_TIPO,
  SEXOS,
  ESTADOS_CIVILES,
  DOCUMENTOS_IDENTIFICACION,
  NACIONALIDADES,
  PAISES,
  ESTADOS_MEXICO,
} from '@/lib/catalogos';

interface GenericTramiteFormProps {
  tipo: string;
  form: Record<string, string>;
  updateForm: (field: string, value: string) => void;
  onSubmit?: () => void;
}

const STEP_SUBTITLE = 'Llena los datos que conozcas. Tu asesor te contactará para completar lo que falte.';

export default function GenericTramiteForm({ tipo, form, updateForm, onSubmit }: GenericTramiteFormProps) {
  const { colors } = useTheme();
  const inputStyle = [styles.input, { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.text }];
  const placeholderColor = colors.textMuted;

  const opciones = OPCIONES_POR_TIPO[tipo] || { proposito: [], especifica: {} };
  const especificaOpciones = opciones.especifica[form.propositoViaje] || [];

  // --- Paso 1: Tipo de trámite ---
  const step1 = {
    title: 'Tipo de trámite',
    subtitle: STEP_SUBTITLE,
    content: (
      <View>
        <FormSelect
          label="¿Qué deseas hacer?"
          value={form.propositoViaje}
          options={opciones.proposito}
          onChange={(v) => {
            updateForm('propositoViaje', v);
            updateForm('especificaTramite', '');
          }}
        />
        {especificaOpciones.length > 0 && (
          <FormSelect
            label="Especifica"
            value={form.especificaTramite}
            options={especificaOpciones}
            onChange={(v) => updateForm('especificaTramite', v)}
          />
        )}
      </View>
    ),
  };

  // --- Paso 2: Datos personales ---
  const step2 = {
    title: 'Datos personales',
    subtitle: STEP_SUBTITLE,
    content: (
      <View>
        <Field label="Nombre(s)">
          <TextInput
            style={inputStyle}
            value={form.nombre}
            onChangeText={(v) => updateForm('nombre', v)}
            placeholder="Nombre(s)"
            placeholderTextColor={placeholderColor}
          />
        </Field>
        <Field label="Apellido(s)">
          <TextInput
            style={inputStyle}
            value={form.apellidos}
            onChangeText={(v) => updateForm('apellidos', v)}
            placeholder="Apellido(s)"
            placeholderTextColor={placeholderColor}
          />
        </Field>
        <FormSelect
          label="Sexo"
          value={form.sexo ? SEXOS.find((s) => s.value === form.sexo)?.label || '' : ''}
          options={SEXOS.map((s) => s.label)}
          onChange={(v) => updateForm('sexo', SEXOS.find((s) => s.label === v)?.value || '')}
        />
        <FormDatePicker
          label="Fecha de nacimiento"
          value={form.fechaNacimiento}
          onChange={(v) => updateForm('fechaNacimiento', v)}
          minYear={1940}
          maxYear={2010}
        />
        <FormSelect
          label="Nacionalidad"
          value={form.nacionalidad}
          options={NACIONALIDADES}
          onChange={(v) => updateForm('nacionalidad', v)}
          searchable
        />
        <FormSelect
          label="Estado civil"
          value={form.estadoCivil}
          options={ESTADOS_CIVILES.map((e) => e.label)}
          onChange={(v) => updateForm('estadoCivil', v)}
        />
      </View>
    ),
  };

  // --- Paso 3: Lugar de nacimiento + Pasaporte ---
  const step3 = {
    title: 'Lugar de nacimiento y pasaporte',
    subtitle: STEP_SUBTITLE,
    content: (
      <View>
        <FormSelect
          label="País de nacimiento"
          value={form.paisNacimiento}
          options={PAISES}
          onChange={(v) => updateForm('paisNacimiento', v)}
          searchable
        />
        <Field label="Estado/Provincia de nacimiento">
          <TextInput
            style={inputStyle}
            value={form.estadoProvinciaNacimiento}
            onChangeText={(v) => updateForm('estadoProvinciaNacimiento', v)}
            placeholder="Estado o provincia"
            placeholderTextColor={placeholderColor}
          />
        </Field>
        <FormSelect
          label="Documento de identificación"
          value={form.documentoIdentificacion}
          options={DOCUMENTOS_IDENTIFICACION}
          onChange={(v) => updateForm('documentoIdentificacion', v)}
        />
        <Field label="Número de documento">
          <TextInput
            style={inputStyle}
            value={form.numeroDocumento}
            onChangeText={(v) => updateForm('numeroDocumento', v)}
            placeholder="Número"
            placeholderTextColor={placeholderColor}
          />
        </Field>
        <FormSelect
          label="País de expedición"
          value={form.paisExpedicion}
          options={PAISES}
          onChange={(v) => updateForm('paisExpedicion', v)}
          searchable
        />
        <FormDatePicker
          label="Fecha de expedición"
          value={form.fechaExpedicion}
          onChange={(v) => updateForm('fechaExpedicion', v)}
          minYear={2000}
          maxYear={2026}
        />
        <FormDatePicker
          label="Fecha de vencimiento"
          value={form.fechaVencimiento}
          onChange={(v) => updateForm('fechaVencimiento', v)}
          minYear={2024}
          maxYear={2040}
        />
      </View>
    ),
  };

  // --- Paso 4: Domicilio + Email + Comentarios ---
  const step4 = {
    title: 'Domicilio y contacto',
    subtitle: STEP_SUBTITLE,
    content: (
      <View>
        <Field label="Código postal">
          <TextInput
            style={inputStyle}
            value={form.domCodigoPostal}
            onChangeText={(v) => updateForm('domCodigoPostal', v)}
            placeholder="CP"
            placeholderTextColor={placeholderColor}
            keyboardType="number-pad"
          />
        </Field>
        <FormSelect
          label="Estado"
          value={form.domEstado}
          options={ESTADOS_MEXICO}
          onChange={(v) => {
            updateForm('domEstado', v);
            updateForm('domMunicipio', '');
          }}
        />
        <Field label="Municipio o Alcaldía">
          <TextInput
            style={inputStyle}
            value={form.domMunicipio}
            onChangeText={(v) => updateForm('domMunicipio', v)}
            placeholder="Municipio"
            placeholderTextColor={placeholderColor}
          />
        </Field>
        <Field label="Colonia">
          <TextInput
            style={inputStyle}
            value={form.domColonia}
            onChangeText={(v) => updateForm('domColonia', v)}
            placeholder="Colonia"
            placeholderTextColor={placeholderColor}
          />
        </Field>
        <Field label="Calle">
          <TextInput
            style={inputStyle}
            value={form.domCalle}
            onChangeText={(v) => updateForm('domCalle', v)}
            placeholder="Calle"
            placeholderTextColor={placeholderColor}
          />
        </Field>
        <Field label="Número exterior">
          <TextInput
            style={inputStyle}
            value={form.domNumeroExterior}
            onChangeText={(v) => updateForm('domNumeroExterior', v)}
            placeholder="Núm. ext."
            placeholderTextColor={placeholderColor}
          />
        </Field>
        <Field label="Número interior">
          <TextInput
            style={inputStyle}
            value={form.domNumeroInterior}
            onChangeText={(v) => updateForm('domNumeroInterior', v)}
            placeholder="Opcional"
            placeholderTextColor={placeholderColor}
          />
        </Field>
        <Field label="Correo electrónico">
          <TextInput
            style={inputStyle}
            value={form.solicitanteEmail}
            onChangeText={(v) => updateForm('solicitanteEmail', v)}
            placeholder="nombre@correo.com"
            placeholderTextColor={placeholderColor}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>
        <Field label="Confirmar correo">
          <TextInput
            style={inputStyle}
            value={form.solicitanteEmailConfirmacion}
            onChangeText={(v) => updateForm('solicitanteEmailConfirmacion', v)}
            placeholder="Confirma tu correo"
            placeholderTextColor={placeholderColor}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </Field>
        <Field label="📱 WhatsApp / Teléfono *">
          <TextInput
            style={inputStyle}
            value={form.telefono}
            onChangeText={(v) => updateForm('telefono', v)}
            placeholder="+52 55 1234 5678"
            placeholderTextColor={placeholderColor}
            keyboardType="phone-pad"
          />
        </Field>
        <Field label="Comentarios (opcional)">
          <TextInput
            style={[inputStyle, { height: 80, textAlignVertical: 'top' } as any]}
            value={form.comentarios}
            onChangeText={(v) => updateForm('comentarios', v)}
            placeholder="Algo que quieras agregar..."
            placeholderTextColor={placeholderColor}
            multiline
          />
        </Field>
      </View>
    ),
  };

  const steps = [step1, step2, step3, step4];

  return <FormWizard steps={steps} onFinish={onSubmit || (() => {})} finishLabel="Enviar solicitud" />;
}

// --- Helper component ---
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldContainer: { marginBottom: 14 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 5, letterSpacing: 0.3 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14 },
});
