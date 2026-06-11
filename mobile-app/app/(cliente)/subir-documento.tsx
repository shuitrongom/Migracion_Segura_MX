import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Alert, ActivityIndicator, Platform } from 'react-native';
import { useState, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useTheme } from '@/lib/theme';

type TipoDocumento = 'ine' | 'residencia' | 'pasaporte' | 'documento';

interface CapturedImage {
  uri: string;
  label: string;
}

const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string; icon: string; description: string }[] = [
  { value: 'ine', label: 'INE', icon: '🪪', description: 'Frente y reverso' },
  { value: 'residencia', label: 'Residencia', icon: '🏠', description: 'Frente y reverso' },
  { value: 'pasaporte', label: 'Pasaporte', icon: '🛂', description: 'Primera página' },
  { value: 'documento', label: 'Documento (hoja)', icon: '📄', description: 'Escaneo de documento' },
];

export default function SubirDocumentoScreen() {
  const { colors } = useTheme();
  const [tipoSeleccionado, setTipoSeleccionado] = useState<TipoDocumento | null>(null);
  const [images, setImages] = useState<CapturedImage[]>([]);
  const [uploading, setUploading] = useState(false);
  const [step, setStep] = useState<'tipo' | 'captura' | 'preview'>('tipo');

  const getRequiredCaptures = (tipo: TipoDocumento): { label: string; guide: string }[] => {
    switch (tipo) {
      case 'ine':
      case 'residencia':
        return [
          { label: 'Frente', guide: 'Coloca el frente de tu documento dentro del recuadro' },
          { label: 'Reverso', guide: 'Ahora voltea y captura el reverso' },
        ];
      case 'pasaporte':
        return [{ label: 'Primera página', guide: 'Abre tu pasaporte en la página con tu foto' }];
      case 'documento':
        return [{ label: 'Documento', guide: 'Coloca el documento sobre una superficie plana' }];
    }
  };

  const captureImage = useCallback(async (label: string) => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara para capturar el documento.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: tipoSeleccionado === 'pasaporte' ? [3, 4] : [16, 10],
    });

    if (!result.canceled && result.assets[0]) {
      setImages(prev => [...prev, { uri: result.assets[0].uri, label }]);
    }
  }, [tipoSeleccionado]);

  // Elegir desde galería
  const pickFromGallery = useCallback(async (label: string) => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso requerido', 'Necesitamos acceso a tu galería.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: true,
      aspect: tipoSeleccionado === 'pasaporte' ? [3, 4] : [16, 10],
    });
    if (!result.canceled && result.assets[0]) {
      setImages(prev => [...prev, { uri: result.assets[0].uri, label }]);
    }
  }, [tipoSeleccionado]);

  const handleSelectTipo = (tipo: TipoDocumento) => {
    setTipoSeleccionado(tipo);
    setImages([]);
    setStep('captura');
  };

  const handleStartCapture = async () => {
    if (!tipoSeleccionado) return;
    const captures = getRequiredCaptures(tipoSeleccionado);
    
    for (const capture of captures) {
      Alert.alert(
        `Capturar: ${capture.label}`,
        capture.guide,
        [{ text: 'Abrir cámara', onPress: () => captureImage(capture.label) }]
      );
      // Wait a bit for user interaction
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  };

  const handleCaptureSingle = async (label: string) => {
    await captureImage(label);
  };

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (images.length === 0) {
      Alert.alert('Sin imágenes', 'Captura al menos una imagen antes de subir.');
      return;
    }

    setUploading(true);
    try {
      const token = await storage.getItem('access_token');
      if (!token) {
        Alert.alert('Error', 'No hay sesión activa. Cierra sesión e inicia de nuevo.');
        setUploading(false);
        return;
      }

      for (const img of images) {
        const formData = new FormData();
        const filename = `${tipoSeleccionado}_${img.label}_${Date.now()}.jpg`;

        // React Native FormData requiere este formato exacto
        formData.append('file', {
          uri: Platform.OS === 'android' ? img.uri : img.uri.replace('file://', ''),
          type: 'image/jpeg',
          name: filename,
        } as any);
        formData.append('nombre', `${TIPOS_DOCUMENTO.find(t => t.value === tipoSeleccionado)?.label || tipoSeleccionado} - ${img.label}`);
        formData.append('categoria', 
          tipoSeleccionado === 'ine' || tipoSeleccionado === 'residencia' ? 'identificacion' : 
          tipoSeleccionado === 'pasaporte' ? 'pasaporte' : 'otro'
        );

        // NO poner Content-Type manualmente — fetch lo pone automáticamente con el boundary
        const res = await fetch('https://api.migracionseguramx.com/api/v1/documentos/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            // NO incluir Content-Type aquí — fetch lo agrega con boundary automáticamente
          },
          body: formData,
        });

        const responseText = await res.text();
        console.log('Upload response:', res.status, responseText);

        if (!res.ok) {
          let errMsg = `Error ${res.status}`;
          try { errMsg = JSON.parse(responseText)?.message || errMsg; } catch {}
          throw new Error(errMsg);
        }
      }

      Alert.alert(
        '✅ Documentos subidos',
        'Tus documentos se han enviado correctamente. Serán revisados por tu asesor.',
        [{ text: 'Aceptar', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Upload error:', error);
      Alert.alert('Error al subir', error.message || 'No se pudieron subir los documentos. Intenta de nuevo.');
    } finally {
      setUploading(false);
    }
  };

  const renderTipoSelector = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>¿Qué tipo de documento vas a subir?</Text>
      <View style={styles.tiposGrid}>
        {TIPOS_DOCUMENTO.map(tipo => (
          <TouchableOpacity
            key={tipo.value}
            style={[styles.tipoCard, tipoSeleccionado === tipo.value && styles.tipoCardSelected]}
            onPress={() => handleSelectTipo(tipo.value)}
            activeOpacity={0.7}
          >
            <Text style={styles.tipoIcon}>{tipo.icon}</Text>
            <Text style={[styles.tipoLabel, { color: colors.text }]}>{tipo.label}</Text>
            <Text style={styles.tipoDesc}>{tipo.description}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderCaptura = () => {
    if (!tipoSeleccionado) return null;
    const captures = getRequiredCaptures(tipoSeleccionado);
    const pendingCaptures = captures.filter(c => !images.find(img => img.label === c.label));

    return (
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Capturar imágenes</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
          {tipoSeleccionado === 'ine' || tipoSeleccionado === 'residencia'
            ? 'Necesitas capturar frente y reverso del documento'
            : tipoSeleccionado === 'pasaporte'
            ? 'Captura la primera página de tu pasaporte'
            : 'Captura el documento completo'}
        </Text>

        {/* Overlay guide illustration */}
        <View style={styles.guideContainer}>
          <View style={[styles.guideOverlay, tipoSeleccionado === 'pasaporte' ? styles.guidePassport : styles.guideCard]}>
            <View style={styles.guideCornerTL} />
            <View style={styles.guideCornerTR} />
            <View style={styles.guideCornerBL} />
            <View style={styles.guideCornerBR} />
            <Text style={styles.guideText}>
              {tipoSeleccionado === 'pasaporte' ? 'Pasaporte' : tipoSeleccionado === 'documento' ? 'Documento' : 'Tarjeta'}
            </Text>
          </View>
        </View>

        {/* Capture buttons */}
        <View style={styles.captureButtons}>
          {captures.map(capture => {
            const captured = images.find(img => img.label === capture.label);
            return (
              <View key={capture.label} style={{ gap: 8 }}>
                <TouchableOpacity
                  style={[styles.captureBtn, captured && styles.captureBtnDone]}
                  onPress={() => handleCaptureSingle(capture.label)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.captureBtnIcon}>{captured ? '✅' : '📷'}</Text>
                  <Text style={[styles.captureBtnText, captured && styles.captureBtnTextDone, !captured && { color: colors.text }]}>
                    {captured ? `${capture.label} ✓` : `Tomar foto: ${capture.label}`}
                  </Text>
                </TouchableOpacity>
                {!captured && (
                  <TouchableOpacity
                    style={styles.galleryBtn}
                    onPress={() => pickFromGallery(capture.label)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.captureBtnIcon}>🖼️</Text>
                    <Text style={styles.galleryBtnText}>Elegir de galería: {capture.label}</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {images.length > 0 && (
          <TouchableOpacity
            style={styles.previewBtn}
            onPress={() => setStep('preview')}
            activeOpacity={0.7}
          >
            <Text style={styles.previewBtnText}>Ver vista previa ({images.length} imagen{images.length > 1 ? 'es' : ''})</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => { setStep('tipo'); setImages([]); setTipoSeleccionado(null); }}
          activeOpacity={0.7}
        >
          <Text style={styles.backBtnText}>← Cambiar tipo de documento</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderPreview = () => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>Vista previa</Text>
      <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>Revisa que las imágenes sean legibles antes de enviar</Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.previewScroll}>
        {images.map((img, index) => (
          <View key={index} style={styles.previewCard}>
            <Image source={{ uri: img.uri }} style={styles.previewImage} resizeMode="cover" />
            <View style={styles.previewCardFooter}>
              <Text style={[styles.previewLabel, { color: colors.text }]}>{img.label}</Text>
              <TouchableOpacity onPress={() => handleRemoveImage(index)}>
                <Text style={styles.removeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[styles.uploadBtn, uploading && styles.uploadBtnDisabled]}
        onPress={handleUpload}
        disabled={uploading}
        activeOpacity={0.7}
      >
        {uploading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.uploadBtnText}>📤 Subir documentos</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backBtn}
        onPress={() => setStep('captura')}
        activeOpacity={0.7}
      >
        <Text style={styles.backBtnText}>← Volver a captura</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid]} style={styles.gradient}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBack}>
              <Text style={styles.headerBackText}>←</Text>
            </TouchableOpacity>
            <View>
              <Text style={[styles.headerTitle, { color: colors.text }]}>Subir documento</Text>
              <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>Captura y envía tus documentos</Text>
            </View>
          </View>

          {step === 'tipo' && renderTipoSelector()}
          {step === 'captura' && renderCaptura()}
          {step === 'preview' && renderPreview()}
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 24, paddingTop: Platform.OS === 'ios' ? 50 : 20 },
  headerBack: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#171717', borderWidth: 1, borderColor: '#3a3a3a', alignItems: 'center', justifyContent: 'center' },
  headerBackText: { fontSize: 18, color: '#fff' },
  headerTitle: { fontSize: 22, fontWeight: '700' },
  headerSubtitle: { fontSize: 13, marginTop: 2 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: '700', marginBottom: 6 },
  sectionSubtitle: { fontSize: 13, marginBottom: 16 },
  tiposGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tipoCard: {
    width: '47%',
    backgroundColor: '#171717',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#3a3a3a',
    alignItems: 'center',
  },
  tipoCardSelected: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.08)' },
  tipoIcon: { fontSize: 32, marginBottom: 8 },
  tipoLabel: { fontSize: 14, fontWeight: '700', marginBottom: 4 },
  tipoDesc: { fontSize: 11, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },
  guideContainer: { alignItems: 'center', marginVertical: 20 },
  guideOverlay: {
    borderWidth: 2,
    borderColor: '#f59e0b',
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(245,158,11,0.05)',
  },
  guideCard: { width: 260, height: 160 },
  guidePassport: { width: 200, height: 280 },
  guideCornerTL: { position: 'absolute', top: -2, left: -2, width: 20, height: 20, borderTopWidth: 3, borderLeftWidth: 3, borderColor: '#f59e0b', borderTopLeftRadius: 8 },
  guideCornerTR: { position: 'absolute', top: -2, right: -2, width: 20, height: 20, borderTopWidth: 3, borderRightWidth: 3, borderColor: '#f59e0b', borderTopRightRadius: 8 },
  guideCornerBL: { position: 'absolute', bottom: -2, left: -2, width: 20, height: 20, borderBottomWidth: 3, borderLeftWidth: 3, borderColor: '#f59e0b', borderBottomLeftRadius: 8 },
  guideCornerBR: { position: 'absolute', bottom: -2, right: -2, width: 20, height: 20, borderBottomWidth: 3, borderRightWidth: 3, borderColor: '#f59e0b', borderBottomRightRadius: 8 },
  guideText: { fontSize: 13, color: 'rgba(245,158,11,0.7)', fontWeight: '600' },
  captureButtons: { gap: 12 },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#171717',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  captureBtnDone: { borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.05)' },
  captureBtnIcon: { fontSize: 20 },
  captureBtnText: { fontSize: 14, fontWeight: '600' },
  captureBtnTextDone: { color: '#22c55e' },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: 'rgba(245,158,11,0.06)',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  galleryBtnText: { fontSize: 14, fontWeight: '500', color: '#f59e0b' },
  previewBtn: {
    marginTop: 16,
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  previewBtnText: { fontSize: 14, fontWeight: '700', color: '#fff' },
  backBtn: { marginTop: 12, padding: 12, alignItems: 'center' },
  backBtnText: { fontSize: 13, color: 'rgba(255,255,255,0.5)' },
  previewScroll: { marginBottom: 20 },
  previewCard: {
    width: 200,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#171717',
    borderWidth: 1,
    borderColor: '#3a3a3a',
  },
  previewImage: { width: '100%', height: 140 },
  previewCardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 10 },
  previewLabel: { fontSize: 12, fontWeight: '600' },
  removeBtn: { fontSize: 16, color: '#ef4444', fontWeight: '700', padding: 4 },
  uploadBtn: {
    backgroundColor: '#f59e0b',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.6 },
  uploadBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },
});
