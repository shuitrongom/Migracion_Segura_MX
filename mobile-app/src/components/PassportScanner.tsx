import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState, useRef } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { TextRecognition } from '@infinitered/react-native-mlkit-text-recognition';
import { parse as parseMRZ } from 'mrz';
import { useTheme } from '@/lib/theme';

// Mapeo de códigos de país ISO a nacionalidades en español (las más comunes en MX)
const PAIS_CODES: Record<string, string> = {
  AFG: 'Afgana', ALB: 'Albanesa', DEU: 'Alemana', AND: 'Andorrana', AGO: 'Angoleña',
  SAU: 'Arabe Saudita', DZA: 'Argelina', ARG: 'Argentina', ARM: 'Armenia', AUS: 'Australiana',
  AUT: 'Austriaca', AZE: 'Azerbaiyana', BHS: 'Bahamesa', BRB: 'Barbadense', BLR: 'Belarusa',
  BEL: 'Belga', BLZ: 'Beliceña', BOL: 'Boliviana', BRA: 'Brasileña', GBR: 'Britanica',
  BGR: 'Bulgara', CAN: 'Canadiense', CHL: 'Chilena', CHN: 'China', COL: 'Colombiana',
  CRI: 'Costarricense', CUB: 'Cubana', DNK: 'Danesa', ECU: 'Ecuatoriana', EGY: 'Egipcia',
  SLV: 'Salvadoreña', ESP: 'Española', USA: 'Estadounidense', FRA: 'Francesa', GTM: 'Guatemalteca',
  HTI: 'Haitiana', HND: 'Hondureña', IND: 'India', IDN: 'Indonesia', ITA: 'Italiana',
  JAM: 'Jamaiquina', JPN: 'Japonesa', MEX: 'Mexicana', NIC: 'Nicaragüense', NLD: 'Neerlandesa',
  NGA: 'Nigeriana', NOR: 'Noruega', PAN: 'Panameña', PRY: 'Paraguaya', PER: 'Peruana',
  PHL: 'Filipina', POL: 'Polaca', PRT: 'Portuguesa', DOM: 'Dominicana', ROU: 'Rumana',
  RUS: 'Rusa', SWE: 'Sueca', CHE: 'Suiza', TUR: 'Turca', UKR: 'Ucraniana',
  URY: 'Uruguaya', VEN: 'Venezolana', VNM: 'Vietnamita',
};

const PAIS_CODES_NOMBRE: Record<string, string> = {
  AFG: 'Afganistan', ALB: 'Albania', DEU: 'Alemania', ARG: 'Argentina', AUS: 'Australia',
  AUT: 'Austria', BEL: 'Belgica', BOL: 'Bolivia', BRA: 'Brasil', CAN: 'Canada',
  CHL: 'Chile', CHN: 'China', COL: 'Colombia', CRI: 'Costa Rica', CUB: 'Cuba',
  DNK: 'Dinamarca', ECU: 'Ecuador', EGY: 'Egipto', SLV: 'El Salvador', ESP: 'España',
  USA: 'Estados Unidos de America', FRA: 'Francia', GTM: 'Guatemala', HTI: 'Haiti',
  HND: 'Honduras', IND: 'India', IDN: 'Indonesia', ITA: 'Italia', JAM: 'Jamaica',
  JPN: 'Japon', MEX: 'Mexico', NIC: 'Nicaragua', NLD: 'Paises Bajos', NGA: 'Nigeria',
  NOR: 'Noruega', PAN: 'Panama', PRY: 'Paraguay', PER: 'Peru', PHL: 'Filipinas',
  POL: 'Polonia', PRT: 'Portugal', DOM: 'Republica Dominicana', ROU: 'Rumania',
  RUS: 'Federacion De Rusia', SWE: 'Suecia', CHE: 'Suiza', TUR: 'Turquia',
  UKR: 'Ucrania', URY: 'Uruguay', VEN: 'Venezuela', VNM: 'Vietnam', GBR: 'Reino Unido',
};

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
  photoUri: string; // URI de la foto tomada para el expediente
}

interface PassportScannerProps {
  onScanComplete: (data: PassportData) => void;
  onSkip: () => void;
}

export default function PassportScanner({ onScanComplete, onSkip }: PassportScannerProps) {
  const { colors } = useTheme();
  const [permission, requestPermission] = useCameraPermissions();
  const [processing, setProcessing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  // Solicitar permisos si no los tiene
  if (!permission) {
    return <ActivityIndicator size="large" color="#f59e0b" style={{ flex: 1 }} />;
  }

  if (!permission.granted) {
    return (
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.permissionContainer}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📷</Text>
          <Text style={[styles.permissionTitle, { color: colors.text }]}>Permiso de cámara</Text>
          <Text style={[styles.permissionText, { color: colors.textMuted }]}>
            Necesitamos acceso a tu cámara para escanear tu pasaporte y llenar los datos automáticamente.
          </Text>
          <TouchableOpacity onPress={requestPermission} style={styles.permissionBtn}>
            <Text style={styles.permissionBtnText}>Permitir cámara</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
            <Text style={[styles.skipBtnText, { color: colors.textMuted }]}>Omitir y llenar manualmente</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const takePhoto = async () => {
    if (!cameraRef.current || processing) return;
    setProcessing(true);

    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });

      if (!photo?.uri) {
        Alert.alert('Error', 'No se pudo tomar la foto. Intenta de nuevo.');
        setProcessing(false);
        return;
      }

      setPhotoUri(photo.uri);

      // OCR con MLKit
      const result = await TextRecognition.recognize(photo.uri);
      const allText = result.text || '';
      const lines = allText.split('\n').map(l => l.trim()).filter(Boolean);

      // Buscar MRZ (las últimas 2-3 líneas con formato especial: solo mayúsculas, <, y dígitos)
      const mrzLines = lines.filter(line => {
        const cleaned = line.replace(/\s/g, '');
        return cleaned.length >= 30 && /^[A-Z0-9<]+$/.test(cleaned);
      });

      let passportData: PassportData | null = null;

      if (mrzLines.length >= 2) {
        // Intentar parsear MRZ
        try {
          const mrzString = mrzLines.slice(-2).map(l => l.replace(/\s/g, ''));
          const parsed = parseMRZ(mrzString);

          if (parsed && parsed.valid) {
            const fields = parsed.fields;
            const sexo = fields.sex === 'male' ? 'H' : fields.sex === 'female' ? 'M' : '';
            const fechaNac = fields.birthDate
              ? `${fields.birthDate.slice(0, 4)}-${fields.birthDate.slice(4, 6)}-${fields.birthDate.slice(6, 8)}`
              : '';
            const fechaVenc = fields.expirationDate
              ? `${fields.expirationDate.slice(0, 4)}-${fields.expirationDate.slice(4, 6)}-${fields.expirationDate.slice(6, 8)}`
              : '';

            passportData = {
              nombre: fields.firstName || '',
              apellidos: fields.lastName || '',
              sexo,
              fechaNacimiento: fechaNac,
              nacionalidad: PAIS_CODES[fields.nationality || ''] || fields.nationality || '',
              numeroDocumento: fields.documentNumber || '',
              paisExpedicion: PAIS_CODES_NOMBRE[fields.issuingState || ''] || fields.issuingState || '',
              fechaVencimiento: fechaVenc,
              documentoIdentificacion: 'Pasaporte',
              photoUri: photo.uri,
            };
          }
        } catch {
          // MRZ parsing failed, try alternative extraction
        }
      }

      // Si MRZ no funcionó, intentar extraer datos por patrones del texto OCR
      if (!passportData) {
        passportData = extractFromOCRText(lines, photo.uri);
      }

      if (passportData && (passportData.nombre || passportData.apellidos || passportData.numeroDocumento)) {
        onScanComplete(passportData);
      } else {
        Alert.alert(
          'No se pudieron leer los datos',
          'Asegúrate de que la zona inferior del pasaporte (las 2 líneas con letras y números) esté visible y bien iluminada.\n\n¿Deseas intentar de nuevo o llenar manualmente?',
          [
            { text: 'Intentar de nuevo', onPress: () => { setPhotoUri(null); setProcessing(false); } },
            { text: 'Llenar manualmente', onPress: () => onSkip() },
          ],
        );
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo procesar la imagen. Intenta de nuevo.');
      setPhotoUri(null);
    }

    setProcessing(false);
  };

  return (
    <View style={styles.container}>
      {!photoUri ? (
        <>
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing="back"
          >
            {/* Overlay con guía */}
            <View style={styles.overlay}>
              <View style={styles.topOverlay}>
                <Text style={styles.instruction}>📷 Escanear pasaporte</Text>
                <Text style={styles.subInstruction}>
                  Coloca la página de datos de tu pasaporte dentro del recuadro
                </Text>
              </View>

              {/* Marco guía */}
              <View style={styles.frameContainer}>
                <View style={styles.frame}>
                  <View style={[styles.corner, styles.topLeft]} />
                  <View style={[styles.corner, styles.topRight]} />
                  <View style={[styles.corner, styles.bottomLeft]} />
                  <View style={[styles.corner, styles.bottomRight]} />
                </View>
                <Text style={styles.mrzHint}>↓ Asegúrate de incluir estas 2 líneas de abajo ↓</Text>
              </View>

              <View style={styles.bottomOverlay}>
                <TouchableOpacity onPress={takePhoto} style={styles.captureBtn} disabled={processing}>
                  {processing ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <View style={styles.captureBtnInner} />
                  )}
                </TouchableOpacity>
                <TouchableOpacity onPress={onSkip} style={styles.skipCameraBtn}>
                  <Text style={styles.skipCameraText}>Omitir → Llenar manualmente</Text>
                </TouchableOpacity>
              </View>
            </View>
          </CameraView>
        </>
      ) : (
        <View style={[styles.processingContainer, { backgroundColor: colors.bg }]}>
          <Image source={{ uri: photoUri }} style={styles.previewImage} resizeMode="contain" />
          <ActivityIndicator size="large" color="#f59e0b" style={{ marginTop: 20 }} />
          <Text style={[styles.processingText, { color: colors.text }]}>Leyendo datos del pasaporte...</Text>
        </View>
      )}
    </View>
  );
}

/**
 * Extracción alternativa por patrones cuando MRZ no se puede parsear
 */
function extractFromOCRText(lines: string[], photoUri: string): PassportData | null {
  let nombre = '';
  let apellidos = '';
  let numeroDoc = '';
  let nacionalidad = '';
  let sexo = '';
  let fechaNacimiento = '';
  let fechaVencimiento = '';
  let paisExpedicion = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toUpperCase();
    const nextLine = (lines[i + 1] || '').toUpperCase();

    // Buscar número de pasaporte (patrón: letras + números, 6-9 caracteres)
    if (/PASSPORT|PASAPORTE|NO\.?\s*\//.test(line) || /^[A-Z]{1,3}\d{6,8}$/.test(line.replace(/\s/g, ''))) {
      const match = line.match(/[A-Z]{0,3}\d{6,9}/);
      if (match) numeroDoc = match[0];
    }

    // Buscar nombre/apellidos después de "SURNAME" o "GIVEN NAME"
    if (/SURNAME|APELLIDO/.test(line)) {
      apellidos = nextLine.replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '').trim();
    }
    if (/GIVEN|NOMBRE/.test(line)) {
      nombre = nextLine.replace(/[^A-ZÁÉÍÓÚÑ\s]/g, '').trim();
    }

    // Sexo
    if (/^[MF]$/.test(line.trim()) || /MALE|FEMALE|MASCULINO|FEMENINO/.test(line)) {
      if (line.includes('F') || line.includes('FEMALE') || line.includes('FEMENINO')) sexo = 'M';
      else sexo = 'H';
    }

    // Fechas (formato DD/MM/YYYY o DD MMM YYYY)
    const dateMatch = line.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
    if (dateMatch) {
      const dateStr = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      if (/BIRTH|NACIMIENTO|DATE OF BIRTH/.test(lines[Math.max(0, i - 1)].toUpperCase())) {
        fechaNacimiento = dateStr;
      } else if (/EXPIR|VENCIMIENTO|DATE OF EXPIRY/.test(lines[Math.max(0, i - 1)].toUpperCase())) {
        fechaVencimiento = dateStr;
      }
    }
  }

  if (!nombre && !apellidos && !numeroDoc) return null;

  return {
    nombre,
    apellidos,
    sexo,
    fechaNacimiento,
    nacionalidad,
    numeroDocumento: numeroDoc,
    paisExpedicion,
    fechaVencimiento,
    documentoIdentificacion: 'Pasaporte',
    photoUri,
  };
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  camera: { flex: 1 },
  overlay: { flex: 1, justifyContent: 'space-between' },
  topOverlay: { paddingTop: 60, paddingHorizontal: 20, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.6)', paddingBottom: 16 },
  instruction: { color: '#fff', fontSize: 20, fontWeight: '700' },
  subInstruction: { color: 'rgba(255,255,255,0.8)', fontSize: 13, textAlign: 'center', marginTop: 6 },

  frameContainer: { alignItems: 'center', justifyContent: 'center' },
  frame: { width: '88%', aspectRatio: 1.42, borderWidth: 0, position: 'relative' },
  corner: { position: 'absolute', width: 30, height: 30, borderColor: '#f59e0b', borderWidth: 3 },
  topLeft: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0 },
  topRight: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0 },
  bottomLeft: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0 },
  bottomRight: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0 },
  mrzHint: { color: '#f59e0b', fontSize: 11, fontWeight: '600', marginTop: 8, textAlign: 'center' },

  bottomOverlay: { alignItems: 'center', paddingBottom: 40, backgroundColor: 'rgba(0,0,0,0.6)', paddingTop: 20 },
  captureBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff' },
  captureBtnInner: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#fff' },
  skipCameraBtn: { marginTop: 16 },
  skipCameraText: { color: 'rgba(255,255,255,0.7)', fontSize: 14, fontWeight: '500' },

  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  previewImage: { width: '90%', height: 250, borderRadius: 12 },
  processingText: { fontSize: 16, fontWeight: '600', marginTop: 12 },

  permissionContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  permissionTitle: { fontSize: 20, fontWeight: '700', marginBottom: 8 },
  permissionText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  permissionBtn: { backgroundColor: '#f59e0b', paddingVertical: 14, paddingHorizontal: 32, borderRadius: 14 },
  permissionBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  skipBtn: { marginTop: 16 },
  skipBtnText: { fontSize: 14 },
});
