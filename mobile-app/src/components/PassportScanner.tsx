import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '@/lib/theme';
import { apiFetch } from '@/lib/api';
import { BASE_URL } from '@/lib/api';
import { storage } from '@/lib/storage';

export interface PassportData {
  nombre: string;
  apellidos: string;
  sexo: string;
  fechaNacimiento: string;
  nacionalidad: string;
  numeroDocumento: string;
  paisExpedicion: string;
  fechaVencimiento: string;
  documentoIdentificacion: string;
  photoUri: string;
}

interface PassportScannerProps {
  onScanComplete: (data: PassportData) => void;
  onSkip: () => void;
}

export default function PassportScanner({ onScanComplete, onSkip }: PassportScannerProps) {
  const { colors } = useTheme();
  const [processing, setProcessing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const takePhoto = async () => {
    if (processing) return;

    Alert.alert(
      '📷 Escanear pasaporte',
      '¿Cómo deseas capturar tu pasaporte?',
      [
        { text: '📷 Tomar foto', onPress: () => captureFromCamera() },
        { text: '🖼️ Elegir de galería', onPress: () => pickFromGallery() },
        { text: 'Cancelar', style: 'cancel' },
      ],
    );
  };

  const captureFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu cámara para escanear tu pasaporte.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    processPhoto(result.assets[0].uri);
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso necesario', 'Necesitamos acceso a tu galería.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
    });

    if (result.canceled || !result.assets?.[0]) return;
    processPhoto(result.assets[0].uri);
  };

  const processPhoto = async (uri: string) => {
    setPhotoUri(uri);
    setProcessing(true);

    try {
      // Enviar imagen al backend para OCR con Google Cloud Vision
      const token = await storage.getItem('access_token');
      const formData = new FormData();
      formData.append('image', {
        uri,
        type: 'image/jpeg',
        name: 'passport.jpg',
      } as any);

      const response = await fetch(`${BASE_URL}/ocr/passport`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data) {
          onScanComplete({
            ...result.data,
            documentoIdentificacion: 'Pasaporte',
            photoUri: uri,
          });
          return;
        }
      }

      // OCR no pudo leer los datos — ofrecer opciones
      Alert.alert(
        '📷 Foto guardada',
        'No pudimos leer los datos automáticamente, pero tu foto de pasaporte se guardó para tu expediente.\n\nContinúa llenando los datos manualmente.',
        [
          { text: 'Intentar de nuevo', onPress: () => { setPhotoUri(null); setProcessing(false); } },
          {
            text: 'Continuar con la foto',
            onPress: () => onScanComplete({
              nombre: '', apellidos: '', sexo: '', fechaNacimiento: '',
              nacionalidad: '', numeroDocumento: '', paisExpedicion: '',
              fechaVencimiento: '', documentoIdentificacion: 'Pasaporte',
              photoUri: uri,
            }),
          },
        ],
      );
    } catch (error) {
      // Si falla la conexión al servidor, guardar foto y continuar
      Alert.alert(
        '📷 Foto guardada',
        'No se pudo procesar la imagen en este momento. Tu foto se guardó correctamente.\n\nContinúa llenando los datos manualmente.',
        [
          { text: 'Intentar de nuevo', onPress: () => { setPhotoUri(null); setProcessing(false); } },
          {
            text: 'Continuar con la foto',
            onPress: () => onScanComplete({
              nombre: '', apellidos: '', sexo: '', fechaNacimiento: '',
              nacionalidad: '', numeroDocumento: '', paisExpedicion: '',
              fechaVencimiento: '', documentoIdentificacion: 'Pasaporte',
              photoUri: uri,
            }),
          },
        ],
      );
    }

    setProcessing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {processing ? (
        <View style={styles.processingContainer}>
          {photoUri && <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />}
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 20 }} />
          <Text style={[styles.processingText, { color: colors.text }]}>Leyendo datos del pasaporte...</Text>
          <Text style={[styles.processingSubtext, { color: colors.textMuted }]}>Procesando con inteligencia artificial</Text>
        </View>
      ) : (
        <View style={styles.scanContainer}>
          <Text style={{ fontSize: 64, textAlign: 'center', marginBottom: 16 }}>📷</Text>
          <Text style={[styles.scanTitle, { color: colors.text }]}>Escanear pasaporte</Text>
          <Text style={[styles.scanSubtitle, { color: colors.textMuted }]}>
            Toma una foto de la página de datos de tu pasaporte. Podrás ajustar y recortar la imagen antes de enviar.
          </Text>
          <Text style={[styles.scanHint, { color: colors.textMuted }]}>
            💡 Asegúrate de que se vean las 2 líneas de texto al fondo del pasaporte (zona MRZ)
          </Text>

          <TouchableOpacity onPress={takePhoto} style={styles.scanBtn} activeOpacity={0.85}>
            <Text style={styles.scanBtnText}>📷 Abrir cámara y escanear</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>Omitir → Llenar manualmente</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scanContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  scanTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  scanSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  scanHint: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 24, paddingHorizontal: 16 },
  scanBtn: { backgroundColor: '#f59e0b', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center' },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  previewImage: { width: '90%', height: 250, borderRadius: 12 },
  processingText: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  processingSubtext: { fontSize: 12, marginTop: 4 },
  skipBtn: { marginTop: 20 },
  skipBtnText: { fontSize: 14 },
});
