import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PassportOcrResult {
  success: boolean;
  data: {
    nombre: string;
    apellidos: string;
    sexo: string;
    fechaNacimiento: string;
    nacionalidad: string;
    numeroDocumento: string;
    paisExpedicion: string;
    fechaVencimiento: string;
  } | null;
  rawText?: string;
}

// Mapeo de códigos de país ISO3 a nacionalidades en español
const NACIONALIDADES: Record<string, string> = {
  AFG: 'Afgana', ALB: 'Albanesa', DEU: 'Alemana', ARG: 'Argentina', AUS: 'Australiana',
  AUT: 'Austriaca', BEL: 'Belga', BOL: 'Boliviana', BRA: 'Brasileña', GBR: 'Britanica',
  CAN: 'Canadiense', CHL: 'Chilena', CHN: 'China', COL: 'Colombiana', CRI: 'Costarricense',
  CUB: 'Cubana', DNK: 'Danesa', ECU: 'Ecuatoriana', EGY: 'Egipcia', SLV: 'Salvadoreña',
  ESP: 'Española', USA: 'Estadounidense', FRA: 'Francesa', GTM: 'Guatemalteca',
  HTI: 'Haitiana', HND: 'Hondureña', IND: 'India', IDN: 'Indonesia', ITA: 'Italiana',
  JAM: 'Jamaiquina', JPN: 'Japonesa', MEX: 'Mexicana', NIC: 'Nicaragüense', NLD: 'Neerlandesa',
  NGA: 'Nigeriana', NOR: 'Noruega', PAN: 'Panameña', PRY: 'Paraguaya', PER: 'Peruana',
  PHL: 'Filipina', POL: 'Polaca', PRT: 'Portuguesa', DOM: 'Dominicana', ROU: 'Rumana',
  RUS: 'Rusa', SWE: 'Sueca', CHE: 'Suiza', TUR: 'Turca', UKR: 'Ucraniana',
  URY: 'Uruguaya', VEN: 'Venezolana', VNM: 'Vietnamita',
};

const PAISES: Record<string, string> = {
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

@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Extrae datos del pasaporte usando Google Cloud Vision API
   */
  async extractPassportData(imageBuffer: Buffer): Promise<PassportOcrResult> {
    try {
      const apiKey = this.configService.get<string>('GOOGLE_CLOUD_VISION_API_KEY');

      if (!apiKey) {
        this.logger.warn('GOOGLE_CLOUD_VISION_API_KEY no configurada, usando OCR básico');
        return { success: false, data: null };
      }

      // Llamar a Google Cloud Vision API
      const base64Image = imageBuffer.toString('base64');
      const response = await fetch(
        `https://vision.googleapis.com/v1/images:annotate?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            requests: [{
              image: { content: base64Image },
              features: [{ type: 'TEXT_DETECTION', maxResults: 1 }],
            }],
          }),
        },
      );

      if (!response.ok) {
        this.logger.error(`Google Vision API error: ${response.status}`);
        return { success: false, data: null };
      }

      const result = await response.json();
      const textAnnotation = result.responses?.[0]?.textAnnotations?.[0];

      if (!textAnnotation?.description) {
        return { success: false, data: null, rawText: '' };
      }

      const fullText = textAnnotation.description;
      const lines = fullText.split('\n').map((l: string) => l.trim()).filter(Boolean);

      // Intentar extraer datos de MRZ
      const passportData = this.parseMRZ(lines) || this.extractFromText(lines);

      return {
        success: !!passportData,
        data: passportData,
        rawText: fullText,
      };
    } catch (error) {
      this.logger.error('OCR processing error:', error);
      return { success: false, data: null };
    }
  }

  /**
   * Parsear zona MRZ del pasaporte (las 2 líneas de código al fondo)
   */
  private parseMRZ(lines: string[]): PassportOcrResult['data'] | null {
    // Buscar líneas MRZ (44 caracteres, solo A-Z, 0-9, <)
    const mrzCandidates = lines
      .map(l => l.replace(/\s/g, ''))
      .filter(l => l.length >= 42 && l.length <= 46 && /^[A-Z0-9<]+$/.test(l));

    if (mrzCandidates.length < 2) return null;

    const line1 = mrzCandidates[mrzCandidates.length - 2].padEnd(44, '<');
    const line2 = mrzCandidates[mrzCandidates.length - 1].padEnd(44, '<');

    // Validar que line1 empieza con P (passport)
    if (!line1.startsWith('P')) return null;

    try {
      // Line 1: P<ISSUING_STATE<LAST_NAME<<FIRST_NAME<<<...
      const issuingState = line1.substring(2, 5).replace(/</g, '');
      const namesSection = line1.substring(5);
      const namesParts = namesSection.split('<<');
      const apellidos = (namesParts[0] || '').replace(/</g, ' ').trim();
      const nombre = (namesParts[1] || '').replace(/</g, ' ').trim();

      // Line 2: DOC_NUMBER<CHECK NATIONALITY DOB<CHECK SEX EXPIRY<CHECK PERSONAL<CHECK
      const numeroDocumento = line2.substring(0, 9).replace(/</g, '');
      const nacionalidadCode = line2.substring(10, 13).replace(/</g, '');
      const dobRaw = line2.substring(13, 19); // YYMMDD
      const sexoRaw = line2.substring(20, 21);
      const expiryRaw = line2.substring(21, 27); // YYMMDD

      // Convertir fechas YYMMDD → YYYY-MM-DD
      const fechaNacimiento = this.parseDate(dobRaw);
      const fechaVencimiento = this.parseDate(expiryRaw, true);

      const sexo = sexoRaw === 'F' ? 'M' : sexoRaw === 'M' ? 'H' : '';

      return {
        nombre: this.capitalizeWords(nombre),
        apellidos: this.capitalizeWords(apellidos),
        sexo,
        fechaNacimiento,
        nacionalidad: NACIONALIDADES[nacionalidadCode] || nacionalidadCode,
        numeroDocumento,
        paisExpedicion: PAISES[issuingState] || issuingState,
        fechaVencimiento,
      };
    } catch {
      return null;
    }
  }

  /**
   * Extracción alternativa por patrones de texto cuando MRZ no es legible
   */
  private extractFromText(lines: string[]): PassportOcrResult['data'] | null {
    let nombre = '';
    let apellidos = '';
    let numeroDoc = '';
    let sexo = '';
    let fechaNacimiento = '';
    let fechaVencimiento = '';

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toUpperCase();
      const nextLine = (lines[i + 1] || '').trim();

      if (/PASSPORT\s*N|NO\.\s*\/|DOCUMENT/.test(line)) {
        const match = (line + ' ' + nextLine).match(/[A-Z]{0,3}\d{6,9}/);
        if (match) numeroDoc = match[0];
      }

      if (/SURNAME|APELLIDO/.test(line) && nextLine) {
        apellidos = nextLine.replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, '').trim();
      }
      if (/GIVEN\s*NAME|NOMBRE/.test(line) && nextLine) {
        nombre = nextLine.replace(/[^A-ZÁÉÍÓÚÑ\s]/gi, '').trim();
      }

      if (/\b(MALE|FEMALE|MASCULINO|FEMENINO|^[MF]$)\b/.test(line)) {
        sexo = /F|FEMALE|FEMENINO/.test(line) ? 'M' : 'H';
      }

      const dateMatch = line.match(/(\d{2})[\/\-\.](\d{2})[\/\-\.](\d{4})/);
      if (dateMatch) {
        const dateStr = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
        if (/BIRTH|NACIMIENTO/.test(lines[Math.max(0, i - 1)].toUpperCase())) {
          fechaNacimiento = dateStr;
        } else if (/EXPIR|VENCIMIENTO/.test(lines[Math.max(0, i - 1)].toUpperCase())) {
          fechaVencimiento = dateStr;
        }
      }
    }

    if (!nombre && !apellidos && !numeroDoc) return null;

    return {
      nombre: this.capitalizeWords(nombre),
      apellidos: this.capitalizeWords(apellidos),
      sexo,
      fechaNacimiento,
      nacionalidad: '',
      numeroDocumento: numeroDoc,
      paisExpedicion: '',
      fechaVencimiento,
    };
  }

  private parseDate(raw: string, isFuture = false): string {
    if (!raw || raw.length !== 6) return '';
    const yy = parseInt(raw.substring(0, 2), 10);
    const mm = raw.substring(2, 4);
    const dd = raw.substring(4, 6);
    // Para fechas futuras (vencimiento): 20XX, para pasadas (nacimiento): depende
    const year = isFuture
      ? 2000 + yy
      : yy > 50 ? 1900 + yy : 2000 + yy;
    return `${year}-${mm}-${dd}`;
  }

  private capitalizeWords(str: string): string {
    return str.toLowerCase().replace(/\b\w/g, c => c.toUpperCase());
  }
}
