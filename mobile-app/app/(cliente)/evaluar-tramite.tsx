import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Animated, Dimensions } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { apiFetch } from '@/lib/api';

const { width } = Dimensions.get('window');

const PRIVACY_NOTICE = `Aviso de Privacidad: Tus datos personales y documentos están protegidos conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares. Las fotografías de tu documento se almacenan de forma segura y cifrada, únicamente para respaldo en caso de pérdida o reposición. No se compartirán con terceros sin tu consentimiento.`;

export default function EvaluarTramiteScreen() {
  const { tramiteId, tipoDocumento } = useLocalSearchParams<{ tramiteId: string; tipoDocumento?: string }>();

  const [calificacion, setCalificacion] = useState(0);
  const [comentario, setComentario] = useState('');
  const [recomendaria, setRecomendaria] = useState(true);
  const [fotoFrente, setFotoFrente] = useState<string | null>(null);
  const [fotoReverso, setFotoReverso] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pendingPhotoAction, setPendingPhotoAction] = useState<'frente' | 'reverso' | 'single' | null>(null);

  const confettiAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Determinar si es documento tipo tarjeta (residencia) o hoja
  const esResidencia = tipoDocumento?.includes('residencia') || tipoDocumento?.includes('permanente');

  const requestPhotoPermission = async (action: 'frente' | 'reverso' | 'single') => {
    setPendingPhotoAction(action);
    setShowPrivacy(true);
  };

  const handlePrivacyAccept = async () => {
    setShowPrivacy(false);
    if (pendingPhotoAction) {
      await takePhoto(pendingPhotoAction);
    }
    setPendingPhotoAction(null);
  };

  const takePhoto = async (side: 'frente' | 'reverso' | 'single') => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para fotografiar tu documento.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: esResidencia ? [16, 10] : [3, 4],
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      if (side === 'frente' || side === 'single') {
        setFotoFrente(uri);
      } else {
        setFotoReverso(uri);
      }
    }
  };

  const handleSubmit = async () => {
    if (calificacion === 0) {
      Alert.alert('Calificación requerida', 'Por favor selecciona una calificación de 1 a 5 estrellas.');
      return;
    }

    setSubmitting(true);
    try {
      // Enviar evaluación
      const body: Record<string, unknown> = {
        tramiteId,
        calificacion,
        comentario: comentario.trim() || null,
        recomendaria,
      };

      const res = await apiFetch('/evaluaciones', {
        method: 'POST',
        body: JSON.stringify(body),
      });

      // Subir fotos si existen
      if (fotoFrente) {
        const formData = new FormData();
        formData.append('file', {
          uri: fotoFrente,
          type: 'image/jpeg',
          name: 'documento_frente.jpg',
        } as unknown as Blob);
        formData.append('tramiteId', tramiteId || '');
        formData.append('tipo', 'documento_frente');

        await apiFetch('/documentos/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'multipart/form-data' },
          body: formData as unknown as BodyInit,
        }).catch(() => {});
      }

      if (fotoReverso) {
        const formData = new FormData();
        formData.append('file', {
          uri: fotoReverso,
          type: 'image/jpeg',
          name: 'documento_reverso.jpg',
        } as unknown as Blob);
        formData.append('tramiteId', tramiteId || '');
        formData.append('tipo', 'documento_reverso');

        await apiFetch('/documentos/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'multipart/form-data' },
          body: formData as unknown as BodyInit,
        }).catch(() => {});
      }

      // Mostrar animación de éxito
      setShowSuccess(true);
      Animated.parallel([
        Animated.spring(scaleAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(confettiAnim, { toValue: 1, duration: 1500, useNativeDriver: true }),
      ]).start();
    } catch (error) {
      Alert.alert('Error', 'No se pudo enviar la evaluación. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = () => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setCalificacion(star)}
            style={styles.starButton}
            accessibilityLabel={`${star} estrella${star > 1 ? 's' : ''}`}
          >
            <Text style={[styles.starText, star <= calificacion && styles.starActive]}>
              {star <= calificacion ? '★' : '☆'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  if (showSuccess) {
    return (
      <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.container}>
        <Animated.View style={[styles.successContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <Text style={styles.successEmoji}>🎉</Text>
          <Text style={styles.successTitle}>¡Felicidades!</Text>
          <Text style={styles.successMessage}>
            Gracias por tu preferencia.{'\n'}Estamos para servirte.{'\n'}¡Recomiéndanos!
          </Text>
          <Animated.View style={[styles.confettiRow, { opacity: confettiAnim }]}>
            <Text style={styles.confetti}>🎊</Text>
            <Text style={styles.confetti}>✨</Text>
            <Text style={styles.confetti}>🎊</Text>
          </Animated.View>
          <TouchableOpacity
            style={styles.successButton}
            onPress={() => router.back()}
          >
            <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.successButtonGradient}>
              <Text style={styles.successButtonText}>Volver a mis trámites</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Volver</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Evalúa nuestro servicio</Text>
          <Text style={styles.subtitle}>Tu opinión nos ayuda a mejorar</Text>
        </View>

        {/* Calificación */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Cómo calificarías nuestro servicio?</Text>
          {renderStars()}
          {calificacion > 0 && (
            <Text style={styles.ratingLabel}>
              {calificacion === 1 && 'Malo'}
              {calificacion === 2 && 'Regular'}
              {calificacion === 3 && 'Bueno'}
              {calificacion === 4 && 'Muy bueno'}
              {calificacion === 5 && 'Excelente'}
            </Text>
          )}
        </View>

        {/* Comentario */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Comentarios (opcional)</Text>
          <TextInput
            style={styles.textInput}
            placeholder="Cuéntanos tu experiencia..."
            placeholderTextColor="rgba(255,255,255,0.3)"
            multiline
            numberOfLines={4}
            value={comentario}
            onChangeText={setComentario}
            textAlignVertical="top"
          />
        </View>

        {/* Recomendación */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>¿Nos recomendarías?</Text>
          <View style={styles.toggleRow}>
            <TouchableOpacity
              style={[styles.toggleButton, recomendaria && styles.toggleActive]}
              onPress={() => setRecomendaria(true)}
            >
              <Text style={[styles.toggleText, recomendaria && styles.toggleTextActive]}>👍 Sí</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.toggleButton, !recomendaria && styles.toggleInactive]}
              onPress={() => setRecomendaria(false)}
            >
              <Text style={[styles.toggleText, !recomendaria && styles.toggleTextInactive]}>👎 No</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Fotos del documento */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📷 Foto de tu documento (respaldo)</Text>
          <Text style={styles.cardSubtitle}>
            {esResidencia
              ? 'Toma foto del frente y reverso de tu tarjeta de residencia'
              : 'Escanea tu documento para respaldo'}
          </Text>

          {esResidencia ? (
            <View style={styles.photoGrid}>
              <TouchableOpacity
                style={[styles.photoBox, fotoFrente && styles.photoBoxDone]}
                onPress={() => requestPhotoPermission('frente')}
              >
                <Text style={styles.photoIcon}>{fotoFrente ? '✅' : '📸'}</Text>
                <Text style={styles.photoLabel}>{fotoFrente ? 'Frente ✓' : 'Frente'}</Text>
                <Text style={styles.photoHint}>Toca para {fotoFrente ? 'retomar' : 'capturar'}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.photoBox, fotoReverso && styles.photoBoxDone]}
                onPress={() => requestPhotoPermission('reverso')}
              >
                <Text style={styles.photoIcon}>{fotoReverso ? '✅' : '📸'}</Text>
                <Text style={styles.photoLabel}>{fotoReverso ? 'Reverso ✓' : 'Reverso'}</Text>
                <Text style={styles.photoHint}>Toca para {fotoReverso ? 'retomar' : 'capturar'}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={[styles.photoBoxFull, fotoFrente && styles.photoBoxDone]}
              onPress={() => requestPhotoPermission('single')}
            >
              <Text style={styles.photoIcon}>{fotoFrente ? '✅' : '📄'}</Text>
              <Text style={styles.photoLabel}>{fotoFrente ? 'Documento escaneado ✓' : 'Escanear documento'}</Text>
              <Text style={styles.photoHint}>Toca para {fotoFrente ? 'retomar' : 'capturar'}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón enviar */}
        <TouchableOpacity
          style={[styles.submitButton, (calificacion === 0 || submitting) && styles.submitDisabled]}
          onPress={handleSubmit}
          disabled={calificacion === 0 || submitting}
        >
          <LinearGradient
            colors={calificacion > 0 ? ['#f59e0b', '#d97706'] : ['#3a3a3a', '#2a2a2a']}
            style={styles.submitGradient}
          >
            <Text style={styles.submitText}>
              {submitting ? 'Enviando...' : '✨ Enviar evaluación'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Aviso de Privacidad */}
      <Modal visible={showPrivacy} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>🔒 Aviso de Privacidad</Text>
            <ScrollView style={styles.modalScroll}>
              <Text style={styles.modalText}>{PRIVACY_NOTICE}</Text>
            </ScrollView>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => { setShowPrivacy(false); setPendingPhotoAction(null); }}
              >
                <Text style={styles.modalButtonCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButtonAccept} onPress={handlePrivacyAccept}>
                <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.modalButtonGradient}>
                  <Text style={styles.modalButtonAcceptText}>Acepto, continuar</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 } as const,
  scrollContent: { paddingHorizontal: 16, paddingBottom: 40 } as const,
  header: { marginBottom: 20 } as const,
  backButton: { marginBottom: 12 } as const,
  backText: { color: 'rgba(255,255,255,0.6)', fontSize: 14 } as const,
  title: { fontSize: 22, fontWeight: '700', color: '#ffffff' } as const,
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 } as const,

  card: {
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  } as const,
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#ffffff', marginBottom: 12 } as const,
  cardSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.5)', marginBottom: 14, marginTop: -4 } as const,

  starsContainer: { flexDirection: 'row', justifyContent: 'center', gap: 8 } as const,
  starButton: { padding: 8 } as const,
  starText: { fontSize: 36, color: 'rgba(255,255,255,0.2)' } as const,
  starActive: { color: '#f59e0b' } as const,
  ratingLabel: { textAlign: 'center', color: '#f59e0b', fontSize: 14, fontWeight: '600', marginTop: 10 } as const,

  textInput: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 12,
    padding: 14,
    color: '#ffffff',
    fontSize: 14,
    minHeight: 100,
  } as const,

  toggleRow: { flexDirection: 'row', gap: 12 } as const,
  toggleButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    backgroundColor: '#0a0a0a',
    alignItems: 'center',
  } as const,
  toggleActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)' } as const,
  toggleInactive: { borderColor: '#E74C3C', backgroundColor: 'rgba(231,76,60,0.08)' } as const,
  toggleText: { fontSize: 16, color: 'rgba(255,255,255,0.5)' } as const,
  toggleTextActive: { color: '#f59e0b', fontWeight: '600' } as const,
  toggleTextInactive: { color: '#E74C3C', fontWeight: '600' } as const,

  photoGrid: { flexDirection: 'row', gap: 12 } as const,
  photoBox: {
    flex: 1,
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderStyle: 'dashed' as const,
  } as const,
  photoBoxFull: {
    backgroundColor: '#0a0a0a',
    borderWidth: 1,
    borderColor: '#3a3a3a',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    borderStyle: 'dashed' as const,
  } as const,
  photoBoxDone: { borderColor: '#27AE60', borderStyle: 'solid' as const, backgroundColor: 'rgba(39,174,96,0.05)' } as const,
  photoIcon: { fontSize: 32, marginBottom: 8 } as const,
  photoLabel: { fontSize: 13, fontWeight: '600', color: '#ffffff', marginBottom: 4 } as const,
  photoHint: { fontSize: 11, color: 'rgba(255,255,255,0.4)' } as const,

  submitButton: { marginTop: 8 } as const,
  submitDisabled: { opacity: 0.5 } as const,
  submitGradient: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  } as const,
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '700' } as const,

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  } as const,
  modalContent: {
    backgroundColor: '#171717',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxHeight: '70%',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  } as const,
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#ffffff', marginBottom: 16, textAlign: 'center' } as const,
  modalScroll: { maxHeight: 200, marginBottom: 20 } as const,
  modalText: { fontSize: 13, color: 'rgba(255,255,255,0.7)', lineHeight: 20 } as const,
  modalButtons: { flexDirection: 'row', gap: 12 } as const,
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    alignItems: 'center',
  } as const,
  modalButtonCancelText: { color: 'rgba(255,255,255,0.6)', fontSize: 14, fontWeight: '500' } as const,
  modalButtonAccept: { flex: 1 } as const,
  modalButtonGradient: { paddingVertical: 12, borderRadius: 10, alignItems: 'center' } as const,
  modalButtonAcceptText: { color: '#ffffff', fontSize: 14, fontWeight: '600' } as const,

  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  } as const,
  successEmoji: { fontSize: 72, marginBottom: 20 } as const,
  successTitle: { fontSize: 28, fontWeight: '800', color: '#f59e0b', marginBottom: 12 } as const,
  successMessage: { fontSize: 16, color: 'rgba(255,255,255,0.8)', textAlign: 'center', lineHeight: 24, marginBottom: 24 } as const,
  confettiRow: { flexDirection: 'row', gap: 20, marginBottom: 32 } as const,
  confetti: { fontSize: 40 } as const,
  successButton: { width: '100%' } as const,
  successButtonGradient: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' } as const,
  successButtonText: { color: '#ffffff', fontSize: 16, fontWeight: '700' } as const,
});
