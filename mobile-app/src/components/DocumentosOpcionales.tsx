import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '@/lib/theme';

export interface DocumentoOpcional {
  tipo: 'comprobante_domicilio' | 'ine_residencia';
  uri: string;
  name: string;
  mimeType: string;
}

interface DocumentosOpcionalesProps {
  onComplete: (docs: DocumentoOpcional[]) => void;
}

export default function DocumentosOpcionales({ onComplete }: DocumentosOpcionalesProps) {
  const { colors } = useTheme();
  const [comprobante, setComprobante] = useState<DocumentoOpcional | null>(null);
  const [ine, setIne] = useState<DocumentoOpcional | null>(null);

  const pickDocument = async (tipo: 'comprobante_domicilio' | 'ine_residencia') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      const doc: DocumentoOpcional = {
        tipo,
        uri: file.uri,
        name: file.name || `${tipo}.jpg`,
        mimeType: file.mimeType || 'image/jpeg',
      };
      if (tipo === 'comprobante_domicilio') setComprobante(doc);
      else setIne(doc);
    } catch {}
  };

  const handleContinue = () => {
    const docs: DocumentoOpcional[] = [];
    if (comprobante) docs.push(comprobante);
    if (ine) docs.push(ine);
    onComplete(docs);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={styles.content}>
        <Text style={{ fontSize: 48, textAlign: 'center', marginBottom: 12 }}>📎</Text>
        <Text style={[styles.title, { color: colors.text }]}>Documentos adicionales</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          Si tienes estos documentos a la mano, súbelos ahora. Son opcionales — puedes continuar sin ellos.
        </Text>

        {/* Comprobante de domicilio */}
        <TouchableOpacity
          style={[styles.docCard, { borderColor: comprobante ? '#22c55e' : colors.borderLight }]}
          onPress={() => pickDocument('comprobante_domicilio')}
        >
          <Text style={{ fontSize: 24 }}>{comprobante ? '✅' : '🏠'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.docTitle, { color: colors.text }]}>Comprobante de domicilio</Text>
            <Text style={[styles.docHint, { color: colors.textMuted }]}>
              {comprobante ? comprobante.name : 'Recibo de luz, agua, teléfono o estado de cuenta'}
            </Text>
          </View>
          {comprobante && (
            <TouchableOpacity onPress={() => setComprobante(null)}>
              <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* INE o Residencia */}
        <TouchableOpacity
          style={[styles.docCard, { borderColor: ine ? '#22c55e' : colors.borderLight }]}
          onPress={() => pickDocument('ine_residencia')}
        >
          <Text style={{ fontSize: 24 }}>{ine ? '✅' : '🪪'}</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.docTitle, { color: colors.text }]}>INE o tarjeta de residencia</Text>
            <Text style={[styles.docHint, { color: colors.textMuted }]}>
              {ine ? ine.name : 'Credencial INE/IFE o tarjeta de residente (si la tienes)'}
            </Text>
          </View>
          {ine && (
            <TouchableOpacity onPress={() => setIne(null)}>
              <Text style={{ color: '#ef4444', fontSize: 12, fontWeight: '600' }}>✕</Text>
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {/* Botón continuar */}
        <TouchableOpacity onPress={handleContinue} style={styles.continueBtn} activeOpacity={0.85}>
          <Text style={styles.continueBtnText}>
            {comprobante || ine ? 'Continuar con documentos →' : 'Continuar sin documentos →'}
          </Text>
        </TouchableOpacity>

        <Text style={[styles.note, { color: colors.textMuted }]}>
          💡 Tu asesor te pedirá estos documentos después si son necesarios para tu trámite.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  content: { padding: 24 },
  title: { fontSize: 20, fontWeight: '700', textAlign: 'center', marginBottom: 6 },
  subtitle: { fontSize: 13, textAlign: 'center', lineHeight: 20, marginBottom: 24 },

  docCard: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: 14, borderWidth: 1.5, marginBottom: 12 },
  docTitle: { fontSize: 14, fontWeight: '600' },
  docHint: { fontSize: 11, marginTop: 2 },

  continueBtn: { backgroundColor: '#f59e0b', paddingVertical: 16, borderRadius: 14, alignItems: 'center', marginTop: 20 },
  continueBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  note: { fontSize: 11, textAlign: 'center', marginTop: 16, lineHeight: 16 },
});
