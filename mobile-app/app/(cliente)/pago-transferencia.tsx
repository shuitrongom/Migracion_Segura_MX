import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import * as DocumentPicker from 'expo-document-picker';
import * as Clipboard from 'expo-clipboard';
import { apiFetch, BASE_URL } from '@/lib/api';
import { storage } from '@/lib/storage';
import { useTheme } from '@/lib/theme';

interface CuentaBancaria {
  banco: string;
  clabe: string;
  tarjeta: string | null;
}

interface CryptoData {
  red: string;
  email: string;
  wallet: string;
}

interface DatosBancarios {
  titular: string;
  cuentas: CuentaBancaria[];
  crypto: CryptoData[];
}

export default function PagoTransferenciaScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ pagoId: string; monto: string; concepto: string; tramiteId: string; origen?: string }>();
  const { pagoId, monto, concepto, tramiteId, origen } = params;

  const [datos, setDatos] = useState<DatosBancarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [voucherFile, setVoucherFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [metodoPago, setMetodoPago] = useState<'transferencia' | 'crypto'>('transferencia');

  useEffect(() => {
    loadDatosBancarios();
  }, []);

  const loadDatosBancarios = async () => {
    try {
      const res = await apiFetch('/financiero/datos-bancarios');
      if (res.ok) {
        const data = await res.json();
        setDatos(data);
      }
    } catch {}
    setLoading(false);
  };

  const copyToClipboard = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('Copiado', `${label} copiada al portapapeles`);
  };

  const selectVoucher = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets?.[0]) return;
      const file = result.assets[0];
      setVoucherFile({ uri: file.uri, name: file.name || 'voucher.jpg', type: file.mimeType || 'image/jpeg' });
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el archivo.');
    }
  };

  const submitPago = async () => {
    // El monto es fijo — viene del pago generado
    const montoNum = parseFloat(monto || '0');
    if (!montoNum || montoNum <= 0) {
      Alert.alert('Error', 'No se encontró el monto del pago. Regresa e intenta de nuevo.');
      return;
    }

    if (!voucherFile) {
      Alert.alert('Error', 'Debes subir la captura o voucher de tu transferencia. Sin comprobante no se registra el pago.');
      return;
    }

    setSubmitting(true);
    try {
      // 1. Subir el archivo del voucher
      const formData = new FormData();
      formData.append('file', {
        uri: voucherFile.uri,
        name: voucherFile.name,
        type: voucherFile.type,
      } as any);
      formData.append('nombre', `Voucher pago - ${concepto || 'trámite'}`);
      formData.append('categoria', 'voucher_pago');
      // Solo pasar tramiteId si es UUID válido (no tiene -sol ni otros sufijos)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (tramiteId && uuidRegex.test(tramiteId)) {
        formData.append('tramiteId', tramiteId);
      }

      const token = await storage.getItem('access_token');
      const uploadRes = await fetch(`${BASE_URL}/documentos/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      let voucherUrl = `voucher-${pagoId}-${Date.now()}`;
      if (uploadRes.ok) {
        const uploadData = await uploadRes.json().catch(() => ({}));
        voucherUrl = uploadData.storageKey || uploadData.id || uploadData.url || uploadData.fileUrl || voucherUrl;
      }
      // Si falla el upload del documento, continuamos igual — el voucher se identifica por el id del pago

      // 2. Registrar el voucher en el pago
      // Si es una solicitud, usar endpoint de solicitudes; si es un trámite/pago, usar financiero
      const voucherEndpoint = origen === 'solicitud'
        ? `/solicitudes/${pagoId}/voucher`
        : `/financiero/pagos/${pagoId}/voucher`;

      const res = await apiFetch(voucherEndpoint, {
        method: 'POST',
        body: JSON.stringify({
          montoDeclarado: montoNum,  // ya es número parseado arriba
          voucherUrl,
          metodoPago: metodoPago === 'crypto' ? 'crypto' : 'transferencia_bancaria',
        }),
      });

      if (res.ok) {
        Alert.alert(
          '✅ Comprobante enviado',
          'Tu pago está en revisión. El administrador verificará tu transferencia y te notificará cuando sea aprobado.\n\nNo se desbloquea nada hasta que se confirme.',
          [{ text: 'Entendido', onPress: () => router.replace('/(cliente)/estatus') }],
        );
      } else {
        const errData = await res.json().catch(() => ({}));
        Alert.alert('Error', errData.message || 'No se pudo registrar el pago. Verifica los datos.');
      }
    } catch {
      Alert.alert('Error', 'Ocurrió un error de conexión. Intenta de nuevo.');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[colors.gradientStart, colors.gradientMid || colors.gradientEnd, colors.gradientEnd]} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backBtn, { color: colors.textMuted }]}>← Regresar</Text>
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Pagar por transferencia</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Monto a pagar: <Text style={{ color: '#f59e0b', fontWeight: '700' }}>${monto || '---'} MXN</Text>
          </Text>
          {concepto && <Text style={[styles.concepto, { color: colors.textMuted }]}>{concepto}</Text>}
        </View>

        {/* Selector método */}
        <View style={styles.metodoRow}>
          <TouchableOpacity
            style={[styles.metodoBtn, metodoPago === 'transferencia' && styles.metodoBtnActive]}
            onPress={() => setMetodoPago('transferencia')}
          >
            <Text style={[styles.metodoBtnText, metodoPago === 'transferencia' && styles.metodoBtnTextActive]}>🏦 Transferencia</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.metodoBtn, metodoPago === 'crypto' && styles.metodoBtnActive]}
            onPress={() => setMetodoPago('crypto')}
          >
            <Text style={[styles.metodoBtnText, metodoPago === 'crypto' && styles.metodoBtnTextActive]}>₿ Crypto (USDT)</Text>
          </TouchableOpacity>
        </View>

        {/* Datos bancarios */}
        {metodoPago === 'transferencia' && datos && (
          <View style={[styles.section, { borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Datos para transferencia</Text>
            <Text style={[styles.titular, { color: colors.textMuted }]}>Titular: <Text style={{ fontWeight: '700', color: colors.text }}>{datos.titular}</Text></Text>

            {datos.cuentas.map((cuenta, i) => (
              <View key={i} style={[styles.cuentaCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
                <Text style={[styles.bancoName, { color: colors.text }]}>{cuenta.banco}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(cuenta.clabe, 'CLABE')}>
                  <View style={styles.clabeRow}>
                    <Text style={[styles.clabeLabel, { color: colors.textMuted }]}>CLABE:</Text>
                    <Text style={styles.clabeValue}>{cuenta.clabe}</Text>
                    <Text style={styles.copyIcon}>📋</Text>
                  </View>
                </TouchableOpacity>
                {cuenta.tarjeta && (
                  <TouchableOpacity onPress={() => copyToClipboard(cuenta.tarjeta!, 'Tarjeta')}>
                    <View style={styles.clabeRow}>
                      <Text style={[styles.clabeLabel, { color: colors.textMuted }]}>Tarjeta:</Text>
                      <Text style={styles.clabeValue}>{cuenta.tarjeta}</Text>
                      <Text style={styles.copyIcon}>📋</Text>
                    </View>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Datos crypto */}
        {metodoPago === 'crypto' && datos && (
          <View style={[styles.section, { borderColor: colors.borderLight }]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Datos para pago en Crypto</Text>
            {datos.crypto.map((c, i) => (
              <View key={i} style={[styles.cuentaCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
                <Text style={[styles.bancoName, { color: colors.text }]}>{c.red}</Text>
                <TouchableOpacity onPress={() => copyToClipboard(c.email, 'Email')}>
                  <View style={styles.clabeRow}>
                    <Text style={[styles.clabeLabel, { color: colors.textMuted }]}>Email:</Text>
                    <Text style={styles.clabeValue}>{c.email}</Text>
                    <Text style={styles.copyIcon}>📋</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => copyToClipboard(c.wallet, 'Wallet')}>
                  <View style={styles.clabeRow}>
                    <Text style={[styles.clabeLabel, { color: colors.textMuted }]}>Wallet:</Text>
                    <Text style={[styles.clabeValue, { fontSize: 10 }]}>{c.wallet}</Text>
                    <Text style={styles.copyIcon}>📋</Text>
                  </View>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Formulario de comprobante */}
        <View style={[styles.section, { borderColor: colors.borderLight }]}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Registrar tu pago</Text>
          <Text style={[styles.warningText, { color: '#E74C3C' }]}>
            ⚠️ Debes transferir EXACTAMENTE ${monto || '---'} MXN. Si el monto no coincide con tu voucher, será rechazado automáticamente.
          </Text>

          {/* Monto - pre-llenado y no editable */}
          <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Monto a transferir (MXN) *</Text>
          <View style={[styles.input, { backgroundColor: colors.bgInput, borderColor: '#f59e0b', borderWidth: 2, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }]}>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>${monto || '---'} MXN</Text>
            <Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: '600' }}>MONTO EXACTO</Text>
          </View>
          <Text style={{ color: colors.textMuted, fontSize: 10, marginTop: 4 }}>
            Este es el monto que debes transferir. No se acepta más ni menos.
          </Text>

          {/* Voucher */}
          <Text style={[styles.fieldLabel, { color: colors.textMuted, marginTop: 14 }]}>Comprobante de transferencia *</Text>
          <TouchableOpacity
            style={[styles.uploadBtn, { borderColor: voucherFile ? '#27AE60' : colors.border }]}
            onPress={selectVoucher}
          >
            <Text style={{ color: voucherFile ? '#27AE60' : colors.textMuted, fontSize: 14, fontWeight: '600' }}>
              {voucherFile ? `✅ ${voucherFile.name}` : '📎 Seleccionar captura o PDF'}
            </Text>
          </TouchableOpacity>
          {voucherFile && (
            <TouchableOpacity onPress={() => setVoucherFile(null)}>
              <Text style={{ color: '#E74C3C', fontSize: 12, marginTop: 6 }}>✕ Quitar archivo</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Botón enviar */}
        <TouchableOpacity
          onPress={submitPago}
          disabled={submitting}
          activeOpacity={0.85}
          style={{ marginHorizontal: 16, marginTop: 10, marginBottom: 30 }}
        >
          <LinearGradient
            colors={submitting ? ['#6B7280', '#4B5563'] : ['#f59e0b', '#d97706']}
            style={styles.submitBtn}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitBtnText}>Enviar comprobante para revisión</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <Text style={[styles.footerNote, { color: colors.textMuted }]}>
          Tu pago será revisado por el administrador. Recibirás una notificación cuando sea aprobado. Nada se desbloquea hasta que se confirme el pago.
        </Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  scrollContent: { paddingBottom: 40 },
  header: { paddingHorizontal: 16, paddingTop: 56, paddingBottom: 16 },
  backBtn: { fontSize: 14, marginBottom: 12 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 14, marginTop: 6 },
  concepto: { fontSize: 12, marginTop: 4 },

  metodoRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  metodoBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center' },
  metodoBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245,158,11,0.1)' },
  metodoBtnText: { fontSize: 14, fontWeight: '600', color: '#9CA3AF' },
  metodoBtnTextActive: { color: '#f59e0b' },

  section: { marginHorizontal: 16, marginBottom: 16, padding: 16, borderRadius: 16, borderWidth: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  titular: { fontSize: 13, marginBottom: 12 },

  cuentaCard: { borderRadius: 12, padding: 12, marginBottom: 10, borderWidth: 1 },
  bancoName: { fontSize: 14, fontWeight: '700', marginBottom: 8 },
  clabeRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4, gap: 6 },
  clabeLabel: { fontSize: 11, fontWeight: '600', width: 50 },
  clabeValue: { fontSize: 13, fontWeight: '600', color: '#f59e0b', fontFamily: 'monospace', flex: 1 },
  copyIcon: { fontSize: 14 },

  warningText: { fontSize: 12, fontWeight: '600', marginBottom: 14, lineHeight: 18 },
  fieldLabel: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, fontWeight: '600' },
  uploadBtn: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 12, paddingVertical: 16, alignItems: 'center' },

  submitBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footerNote: { fontSize: 11, textAlign: 'center', paddingHorizontal: 24, lineHeight: 16, marginBottom: 20 },
});
