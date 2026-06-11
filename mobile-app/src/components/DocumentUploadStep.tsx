import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';
import { storage } from '@/lib/storage';

interface CapturedDoc {
  uri: string;
  label: string;
  side?: string;
}

interface DocumentUploadStepProps {
  onComplete: (docs: CapturedDoc[]) => void;
  onSkip?: () => void;
  uploading?: boolean;
}

export default function DocumentUploadStep({ onComplete, onSkip, uploading }: DocumentUploadStepProps) {
  const { colors, mode } = useTheme();
  const [pasaporte, setPasaporte] = useState<CapturedDoc | null>(null);
  const [residenciaFrente, setResidenciaFrente] = useState<CapturedDoc | null>(null);
  const [residenciaReverso, setResidenciaReverso] = useState<CapturedDoc | null>(null);
  const [comprobante, setComprobante] = useState<CapturedDoc | null>(null);

  const capturePhoto = async (label: string, aspect: [number, number] = [4, 3]): Promise<string | null> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      // Intentar galería
      const galleryStatus = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (galleryStatus.status !== 'granted') {
        Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara o galería.');
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.85,
        allowsEditing: true,
        aspect,
      });
      if (!result.canceled && result.assets[0]) return result.assets[0].uri;
      return null;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect,
    });
    if (!result.canceled && result.assets[0]) return result.assets[0].uri;
    return null;
  };

  const handleCapturePasaporte = async () => {
    const uri = await capturePhoto('Pasaporte', [3, 4]);
    if (uri) setPasaporte({ uri, label: 'Pasaporte', side: 'unico' });
  };

  const handleCaptureResidenciaFrente = async () => {
    const uri = await capturePhoto('Residencia Frente', [16, 10]);
    if (uri) setResidenciaFrente({ uri, label: 'Residencia', side: 'frente' });
  };

  const handleCaptureResidenciaReverso = async () => {
    const uri = await capturePhoto('Residencia Reverso', [16, 10]);
    if (uri) setResidenciaReverso({ uri, label: 'Residencia', side: 'reverso' });
  };

  const handleCaptureComprobante = async () => {
    const uri = await capturePhoto('Comprobante domicilio', [3, 4]);
    if (uri) setComprobante({ uri, label: 'Comprobante de domicilio', side: 'unico' });
  };

  const handleSubmit = () => {
    if (!pasaporte) {
      Alert.alert('Pasaporte obligatorio', 'Necesitas subir la foto de tu pasaporte para continuar.');
      return;
    }
    const docs: CapturedDoc[] = [pasaporte];
    if (residenciaFrente) docs.push(residenciaFrente);
    if (residenciaReverso) docs.push(residenciaReverso);
    if (comprobante) docs.push(comprobante);
    onComplete(docs);
  };

  const renderDocCard = (
    title: string,
    subtitle: string,
    required: boolean,
    captured: CapturedDoc | null,
    onCapture: () => void,
    icon: string,
  ) => (
    <View style={[styles.docCard, { backgroundColor: colors.bgCard, borderColor: captured ? '#22c55e' : colors.border }]}>
      <View style={styles.docCardHeader}>
        <Text style={{ fontSize: 28 }}>{icon}</Text>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={[styles.docTitle, { color: colors.text }]}>{title}</Text>
            {required && <View style={styles.requiredBadge}><Text style={styles.requiredText}>Obligatorio</Text></View>}
          </View>
          <Text style={[styles.docSubtitle, { color: colors.textMuted }]}>{subtitle}</Text>
        </View>
      </View>
      {captured ? (
        <View style={styles.capturedRow}>
          <Image source={{ uri: captured.uri }} style={styles.thumbnail} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.capturedText, { color: '#22c55e' }]}>✓ Capturado</Text>
          </View>
          <TouchableOpacity onPress={onCapture} style={styles.retakeBtn}>
            <Text style={styles.retakeText}>Retomar</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity onPress={onCapture} style={[styles.captureBtn, { borderColor: colors.accent }]} activeOpacity={0.7}>
          <Text style={[styles.captureBtnText, { color: colors.accent }]}>📷 Tomar foto</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={{ fontSize: 40, marginBottom: 8 }}>📸</Text>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Sube tus documentos</Text>
        <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
          Captura fotos claras de tus documentos.{'\n'}Coloca cada documento sobre una superficie plana con buena iluminación.
        </Text>
      </View>

      {/* Pasaporte - OBLIGATORIO */}
      {renderDocCard(
        'Pasaporte',
        'Primera página con tu foto (1 foto)',
        true,
        pasaporte,
        handleCapturePasaporte,
        '🛂',
      )}

      {/* Residencia - OPCIONAL */}
      <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>RESIDENCIA (si cuentas con ella)</Text>
      {renderDocCard(
        'Residencia — Frente',
        'Frente de tu tarjeta de residencia',
        false,
        residenciaFrente,
        handleCaptureResidenciaFrente,
        '🪪',
      )}
      {renderDocCard(
        'Residencia — Reverso',
        'Reverso de tu tarjeta de residencia',
        false,
        residenciaReverso,
        handleCaptureResidenciaReverso,
        '🪪',
      )}

      {/* Comprobante domicilio - OPCIONAL */}
      {renderDocCard(
        'Comprobante de domicilio',
        'Recibo de luz, agua, teléfono o estado de cuenta (1 foto)',
        false,
        comprobante,
        handleCaptureComprobante,
        '🏠',
      )}

      {/* Botón enviar */}
      <TouchableOpacity
        onPress={handleSubmit}
        disabled={!pasaporte || uploading}
        style={[!pasaporte && { opacity: 0.5 }]}
        activeOpacity={0.85}
      >
        <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.submitBtn}>
          {uploading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <Text style={styles.submitText}>Enviar solicitud con documentos</Text>
          )}
        </LinearGradient>
      </TouchableOpacity>

      {onSkip && (
        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Subir documentos después →</Text>
        </TouchableOpacity>
      )}

      <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
        📋 El pasaporte es obligatorio. Los demás documentos puedes subirlos después desde la sección de avisos.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 16, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 22, fontWeight: '800', textAlign: 'center' },
  headerSubtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 6 },
  sectionLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 8, textTransform: 'uppercase' },
  docCard: { borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1.5, gap: 12 },
  docCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docTitle: { fontSize: 15, fontWeight: '700' },
  docSubtitle: { fontSize: 12, marginTop: 2 },
  requiredBadge: { backgroundColor: 'rgba(239,68,68,0.1)', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  requiredText: { fontSize: 9, color: '#ef4444', fontWeight: '700', textTransform: 'uppercase' },
  captureBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  captureBtnText: { fontSize: 14, fontWeight: '600' },
  capturedRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  thumbnail: { width: 60, height: 44, borderRadius: 8, backgroundColor: '#eee' },
  capturedText: { fontSize: 13, fontWeight: '600' },
  retakeBtn: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 8, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  retakeText: { fontSize: 12, color: '#f59e0b', fontWeight: '600' },
  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  skipBtn: { marginTop: 12, paddingVertical: 14, alignItems: 'center' },
  skipText: { fontSize: 14, fontWeight: '500' },
  disclaimer: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginTop: 16 },
});
