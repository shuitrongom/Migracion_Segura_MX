import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, Image } from 'react-native';
import { useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
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
  const [processing, setProcessing] = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const takePhoto = async () => {
    if (processing) return;

    // Mostrar opciones: tomar foto o elegir de galería
    Alert.alert(
      '📷 Escanear pasaporte',
      '¿Cómo deseas capturar tu pasaporte?',
      [
        {
          text: '📷 Tomar foto',
          onPress: () => captureFromCamera(),
        },
        {
          text: '🖼️ Elegir de galería',
          onPress: () => pickFromGallery(),
        },
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
      allowsEditing: false,
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
      allowsEditing: false,
    });

    if (result.canceled || !result.assets?.[0]) return;
    processPhoto(result.assets[0].uri);
  };

  const processPhoto = async (uri: string) => {
    setPhotoUri(uri);
    setProcessing(true);

    try {
      // Intentar OCR con MLKit
      let passportData: PassportData | null = null;

      try {
        const ocrResult = await TextRecognition.recognize(uri);
        const allText = ocrResult.text || '';
        const lines = allText.split('\n').map((l: string) => l.trim()).filter(Boolean);

        // Buscar MRZ
        const mrzLines = lines.filter((line: string) => {
          const cleaned = line.replace(/\s/g, '');
          return cleaned.length >= 30 && /^[A-Z0-9<]+$/.test(cleaned);
        });

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
              photoUri: uri,
            };
          }
        } catch {
          // MRZ parsing failed, try alternative extraction
        }
      }

      // Si MRZ no funcionó, intentar extraer datos por patrones del texto OCR
      if (!passportData) {
        passportData = extractFromOCRText(lines, uri);
      }

      } catch (ocrError) {
        // OCR falló (módulo nativo no disponible o error de procesamiento)
        // La foto se guardó, continuar sin datos pre-llenados
        console.log('[PassportScanner] OCR no disponible:', ocrError);
      }

      if (passportData && (passportData.nombre || passportData.apellidos || passportData.numeroDocumento)) {
        onScanComplete(passportData);
      } else {
        // OCR no pudo leer o no está disponible — guardar foto y continuar
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
      }
    } catch (error) {
      Alert.alert('Error', 'No se pudo tomar la foto. Verifica que la cámara funcione correctamente.');
      setPhotoUri(null);
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

  scanContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  scanTitle: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginBottom: 8 },
  scanSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 12 },
  scanHint: { fontSize: 11, textAlign: 'center', lineHeight: 16, marginBottom: 24, paddingHorizontal: 16 },
  scanBtn: { backgroundColor: '#f59e0b', paddingVertical: 16, paddingHorizontal: 32, borderRadius: 16, width: '100%', alignItems: 'center' },
  scanBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  processingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  previewImage: { width: '90%', height: 250, borderRadius: 12 },
  processingText: { fontSize: 16, fontWeight: '600', marginTop: 12 },

  skipBtn: { marginTop: 20 },
  skipBtnText: { fontSize: 14 },
});
