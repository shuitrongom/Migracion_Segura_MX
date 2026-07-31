/**
 * FeedbackModal — Modal enterprise de reporte de problemas / sugerencias
 * Discreto, no intrusivo, diseñado para retroalimentación de calidad.
 */
import { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Device from 'expo-device';
import * as Application from 'expo-application';
import { useTheme } from '@/lib/theme';
import { apiFetch } from '@/lib/api';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FeedbackTipo = 'error' | 'sugerencia' | 'confusion' | 'otro';

interface FeedbackModalProps {
  visible: boolean;
  onClose: () => void;
  /** Pantalla actual (se pasa automáticamente desde el botón flotante) */
  pantallaActual?: string;
}

// ─── Configuración de tipos ───────────────────────────────────────────────────

const TIPOS: { value: FeedbackTipo; label: string; emoji: string; descripcion: string }[] = [
  {
    value: 'error',
    label: 'Error o falla',
    emoji: '🐛',
    descripcion: 'Algo no funciona como debería',
  },
  {
    value: 'confusion',
    label: 'Confusión de uso',
    emoji: '❓',
    descripcion: 'No entendí cómo hacer algo',
  },
  {
    value: 'sugerencia',
    label: 'Sugerencia',
    emoji: '💡',
    descripcion: 'Tengo una idea para mejorar la app',
  },
  {
    value: 'otro',
    label: 'Otro comentario',
    emoji: '📝',
    descripcion: 'Algo que quieras compartir',
  },
];

const PANTALLAS = [
  'Inicio', 'Seguimiento', 'Avisos', 'Consulta', 'Pagos', 'Perfil',
  'Nuevo trámite', 'Nueva solicitud', 'Documentos', 'Beneficiarios', 'Otra',
];

// ─── Componente ───────────────────────────────────────────────────────────────

export default function FeedbackModal({ visible, onClose, pantallaActual }: FeedbackModalProps) {
  const { colors, mode } = useTheme();

  const [step, setStep] = useState<'tipo' | 'detalle' | 'enviado'>('tipo');
  const [tipo, setTipo] = useState<FeedbackTipo | null>(null);
  const [pantalla, setPantalla] = useState(pantallaActual ?? '');
  const [descripcion, setDescripcion] = useState('');
  const [pasos, setPasos] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [enviando, setEnviando] = useState(false);

  const reset = () => {
    setStep('tipo');
    setTipo(null);
    setPantalla(pantallaActual ?? '');
    setDescripcion('');
    setPasos('');
    setRating(null);
    setEnviando(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSelectTipo = (t: FeedbackTipo) => {
    setTipo(t);
    setStep('detalle');
  };

  const handleEnviar = async () => {
    if (!descripcion.trim()) {
      Alert.alert('Falta información', 'Por favor describe el problema o sugerencia.');
      return;
    }

    setEnviando(true);
    try {
      // Recolectar info del dispositivo de forma segura
      const deviceInfo = {
        platform: Platform.OS,
        osVersion: String(Platform.Version ?? 'desconocido'),
        appVersion: Application.nativeApplicationVersion ?? '1.2.2',
        model: Device.modelName ?? undefined,
        locale: undefined as string | undefined,
      };

      try {
        const { getLocales } = require('expo-localization');
        const locales = getLocales?.();
        if (locales?.[0]) deviceInfo.locale = locales[0].languageTag;
      } catch {}

      const payload = {
        tipo,
        pantalla: pantalla || undefined,
        descripcion: descripcion.trim(),
        pasosReproduccion: pasos.trim() || undefined,
        rating: rating ?? undefined,
        deviceInfo,
      };

      const res = await apiFetch('/feedback', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setStep('enviado');
      } else {
        const err = await res.json().catch(() => ({}));
        Alert.alert('Error', err.message || 'No se pudo enviar el reporte. Intenta más tarde.');
      }
    } catch {
      Alert.alert('Sin conexión', 'No se pudo conectar al servidor. Verifica tu internet.');
    }
    setEnviando(false);
  };

  // ─── Step: Tipo ─────────────────────────────────────────────────────────────
  const renderStepTipo = () => (
    <View style={styles.stepContainer}>
      <Text style={[styles.stepTitle, { color: colors.text }]}>¿Qué quieres reportar?</Text>
      <Text style={[styles.stepSubtitle, { color: colors.textMuted }]}>
        Tu retroalimentación nos ayuda a mejorar la app
      </Text>
      <View style={styles.tiposGrid}>
        {TIPOS.map((t) => (
          <TouchableOpacity
            key={t.value}
            style={[
              styles.tipoCard,
              { backgroundColor: colors.bgCard, borderColor: tipo === t.value ? colors.accent : colors.borderLight },
            ]}
            onPress={() => handleSelectTipo(t.value)}
            activeOpacity={0.75}
          >
            <Text style={styles.tipoEmoji}>{t.emoji}</Text>
            <Text style={[styles.tipoLabel, { color: colors.text }]}>{t.label}</Text>
            <Text style={[styles.tipoDesc, { color: colors.textMuted }]}>{t.descripcion}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // ─── Step: Detalle ──────────────────────────────────────────────────────────
  const renderStepDetalle = () => {
    const tipoInfo = TIPOS.find((t) => t.value === tipo);
    return (
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.stepContainer}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header tipo */}
        <View style={styles.tipoHeader}>
          <Text style={styles.tipoHeaderEmoji}>{tipoInfo?.emoji}</Text>
          <View>
            <Text style={[styles.stepTitle, { color: colors.text, marginBottom: 0 }]}>{tipoInfo?.label}</Text>
            <Text style={[styles.stepSubtitle, { color: colors.textMuted, marginBottom: 0 }]}>{tipoInfo?.descripcion}</Text>
          </View>
        </View>

        {/* Pantalla */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>¿En qué pantalla ocurrió?</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {PANTALLAS.map((p) => (
              <TouchableOpacity
                key={p}
                style={[
                  styles.chip,
                  { borderColor: pantalla === p ? colors.accent : colors.borderLight },
                  pantalla === p && { backgroundColor: `${colors.accent}18` },
                ]}
                onPress={() => setPantalla(p)}
              >
                <Text style={[styles.chipText, { color: pantalla === p ? colors.accent : colors.textMuted }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Descripción */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
            {tipo === 'error' ? 'Describe qué pasó *' : tipo === 'sugerencia' ? 'Describe tu idea *' : 'Tu comentario *'}
          </Text>
          <TextInput
            style={[
              styles.textArea,
              { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.text },
            ]}
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder={
              tipo === 'error'
                ? 'Ej: Al seleccionar mi trámite, la pantalla se queda en blanco...'
                : tipo === 'sugerencia'
                ? 'Ej: Sería útil poder guardar mis datos para no llenarlos cada vez...'
                : 'Cuéntanos qué pasó...'
            }
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={2000}
          />
          <Text style={[styles.charCount, { color: colors.textMuted }]}>{descripcion.length}/2000</Text>
        </View>

        {/* Pasos (solo para errores) */}
        {tipo === 'error' && (
          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>
              ¿Cómo puedo reproducirlo? (opcional)
            </Text>
            <TextInput
              style={[
                styles.textArea,
                { backgroundColor: colors.bgInput, borderColor: colors.border, color: colors.text, height: 90 },
              ]}
              value={pasos}
              onChangeText={setPasos}
              placeholder={'1. Abrí la app\n2. Seleccioné Nuevo trámite\n3. Elegí Notificación de cambio...'}
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
              maxLength={2000}
            />
          </View>
        )}

        {/* Rating de experiencia */}
        <View style={styles.fieldGroup}>
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>¿Cómo calificarías tu experiencia? (opcional)</Text>
          <View style={styles.ratingRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[
                  styles.ratingBtn,
                  rating === n && { backgroundColor: `${colors.accent}20`, borderColor: colors.accent },
                  { borderColor: rating === n ? colors.accent : colors.borderLight },
                ]}
                onPress={() => setRating(rating === n ? null : n)}
              >
                <Text style={styles.ratingStar}>{n <= (rating ?? 0) ? '★' : '☆'}</Text>
                <Text style={[styles.ratingNum, { color: rating === n ? colors.accent : colors.textMuted }]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {rating !== null && (
            <Text style={[styles.ratingLabel, { color: colors.textMuted }]}>
              {['', 'Muy mala 😞', 'Mala 😕', 'Regular 😐', 'Buena 🙂', 'Excelente 😄'][rating]}
            </Text>
          )}
        </View>

        {/* Nota de privacidad */}
        <View style={[styles.privacyNote, { backgroundColor: `${colors.accent}08`, borderColor: `${colors.accent}25` }]}>
          <Text style={[styles.privacyText, { color: colors.textMuted }]}>
            🔒 Solo el equipo técnico puede ver estos reportes. Tus datos personales nunca se comparten.
          </Text>
        </View>
      </ScrollView>
    );
  };

  // ─── Step: Enviado ──────────────────────────────────────────────────────────
  const renderStepEnviado = () => (
    <View style={[styles.stepContainer, styles.successContainer]}>
      <Text style={styles.successEmoji}>✅</Text>
      <Text style={[styles.successTitle, { color: colors.text }]}>¡Gracias por tu reporte!</Text>
      <Text style={[styles.successText, { color: colors.textMuted }]}>
        Tu retroalimentación fue recibida y será revisada por el equipo técnico.{'\n\n'}
        Nos ayuda a mejorar la app para ti y para todos los usuarios.
      </Text>
      <TouchableOpacity
        style={[styles.successBtn, { backgroundColor: colors.accent }]}
        onPress={handleClose}
      >
        <Text style={styles.successBtnText}>Cerrar</Text>
      </TouchableOpacity>
    </View>
  );

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.borderLight }]}>
          <View style={styles.headerLeft}>
            {step === 'detalle' && (
              <TouchableOpacity onPress={() => setStep('tipo')} style={styles.backBtn}>
                <Text style={[styles.backBtnText, { color: colors.textMuted }]}>← Volver</Text>
              </TouchableOpacity>
            )}
          </View>
          <View style={styles.headerCenter}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>
              {step === 'enviado' ? 'Reporte enviado' : 'Reportar / Sugerir'}
            </Text>
          </View>
          <View style={styles.headerRight}>
            {step !== 'enviado' && (
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Text style={[styles.closeBtnText, { color: colors.textMuted }]}>Cerrar</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Contenido por paso */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {step === 'tipo' && renderStepTipo()}
          {step === 'detalle' && renderStepDetalle()}
          {step === 'enviado' && renderStepEnviado()}
        </KeyboardAvoidingView>

        {/* Footer con botón de enviar (solo en detalle) */}
        {step === 'detalle' && (
          <View style={[styles.footer, { borderTopColor: colors.borderLight, backgroundColor: colors.bg }]}>
            <TouchableOpacity
              style={[
                styles.sendBtn,
                { backgroundColor: colors.accent },
                (enviando || !descripcion.trim()) && { opacity: 0.5 },
              ]}
              onPress={handleEnviar}
              disabled={enviando || !descripcion.trim()}
              activeOpacity={0.85}
            >
              {enviando ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.sendBtnText}>Enviar reporte</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1 },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  headerLeft: { width: 80 },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerRight: { width: 80, alignItems: 'flex-end' },
  headerTitle: { fontSize: 16, fontWeight: '700' },
  backBtn: { paddingVertical: 4 },
  backBtnText: { fontSize: 14, fontWeight: '500' },
  closeBtn: { paddingVertical: 4, paddingHorizontal: 6 },
  closeBtnText: { fontSize: 14, fontWeight: '500' },

  // Steps
  stepContainer: { padding: 20, paddingBottom: 30 },
  stepTitle: { fontSize: 20, fontWeight: '700', marginBottom: 6 },
  stepSubtitle: { fontSize: 13, lineHeight: 19, marginBottom: 24 },

  // Tipos
  tiposGrid: { gap: 10 },
  tipoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  tipoEmoji: { fontSize: 26 },
  tipoLabel: { fontSize: 15, fontWeight: '700', flex: 1 },
  tipoDesc: { fontSize: 12, marginTop: 2, flex: 1 },

  // Detalle
  tipoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 22,
    paddingBottom: 18,
  },
  tipoHeaderEmoji: { fontSize: 36 },

  fieldGroup: { marginBottom: 20 },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },

  // Chips de pantalla
  chipScroll: { marginHorizontal: -4 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    marginHorizontal: 4,
  },
  chipText: { fontSize: 13, fontWeight: '500' },

  // Textarea
  textArea: {
    borderWidth: 1.5,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    height: 110,
    lineHeight: 20,
  },
  charCount: { fontSize: 10, textAlign: 'right', marginTop: 4 },

  // Rating
  ratingRow: { flexDirection: 'row', gap: 10 },
  ratingBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    gap: 2,
  },
  ratingStar: { fontSize: 20, color: '#f59e0b' },
  ratingNum: { fontSize: 11, fontWeight: '600' },
  ratingLabel: { fontSize: 13, marginTop: 8, textAlign: 'center' },

  // Privacidad
  privacyNote: {
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    marginTop: 4,
  },
  privacyText: { fontSize: 11, lineHeight: 17 },

  // Footer de envío
  footer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
  },
  sendBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  sendBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  // Éxito
  successContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  successEmoji: { fontSize: 60, marginBottom: 16 },
  successTitle: { fontSize: 22, fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  successText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 32 },
  successBtn: {
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  successBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
