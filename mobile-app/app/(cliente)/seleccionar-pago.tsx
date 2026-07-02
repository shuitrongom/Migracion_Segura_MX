import { View, Text, StyleSheet, TouchableOpacity, Linking, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';

export default function SeleccionarPagoScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    pagoId: string;
    monto: string;
    concepto: string;
    tramiteId: string;
    initPoint: string;
  }>();

  const { pagoId, monto, concepto, tramiteId, initPoint } = params;
  const montoNum = Number(monto || 0);

  const handleMercadoPago = async () => {
    if (!initPoint) {
      Alert.alert('Sin link disponible', 'No hay link de pago disponible. Usa transferencia bancaria.');
      return;
    }
    await Linking.openURL(initPoint);
  };

  const handleTransferencia = () => {
    router.push({
      pathname: '/(cliente)/pago-transferencia',
      params: { pagoId, monto, concepto, tramiteId },
    });
  };

  return (
    <LinearGradient
      colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
      style={styles.container}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={{ color: '#f59e0b', fontSize: 15, fontWeight: '600' }}>← Volver</Text>
        </TouchableOpacity>

        <View style={styles.montoBox}>
          <Text style={[styles.montoLabel, { color: colors.textMuted }]}>Monto a pagar</Text>
          <Text style={styles.montoValor}>${montoNum.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</Text>
          {concepto ? <Text style={[styles.concepto, { color: colors.textMuted }]}>{concepto}</Text> : null}
        </View>
      </View>

      {/* Título */}
      <Text style={[styles.titulo, { color: colors.text }]}>¿Cómo deseas pagar?</Text>
      <Text style={[styles.subtitulo, { color: colors.textMuted }]}>
        Elige el método que más te convenga
      </Text>

      {/* Opción 1: MercadoPago */}
      <TouchableOpacity
        style={[styles.opcionCard, { backgroundColor: colors.bgCard, borderColor: initPoint ? 'rgba(0,156,222,0.4)' : colors.borderLight }]}
        onPress={handleMercadoPago}
        activeOpacity={0.85}
      >
        <View style={[styles.opcionIcono, { backgroundColor: 'rgba(0,156,222,0.12)' }]}>
          <Text style={styles.emoji}>💳</Text>
        </View>
        <View style={styles.opcionInfo}>
          <Text style={[styles.opcionTitulo, { color: colors.text }]}>Mercado Pago</Text>
          <Text style={[styles.opcionDesc, { color: colors.textMuted }]}>
            Paga con tarjeta de crédito o débito. El pago se confirma automáticamente al instante.
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badgeGreen}>
              <Text style={styles.badgeGreenText}>✓ Aprobación automática</Text>
            </View>
            <View style={styles.badgeBlue}>
              <Text style={styles.badgeBlueText}>Más rápido</Text>
            </View>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Opción 2: Transferencia */}
      <TouchableOpacity
        style={[styles.opcionCard, { backgroundColor: colors.bgCard, borderColor: 'rgba(245,158,11,0.3)' }]}
        onPress={handleTransferencia}
        activeOpacity={0.85}
      >
        <View style={[styles.opcionIcono, { backgroundColor: 'rgba(245,158,11,0.1)' }]}>
          <Text style={styles.emoji}>🏦</Text>
        </View>
        <View style={styles.opcionInfo}>
          <Text style={[styles.opcionTitulo, { color: colors.text }]}>Transferencia / OXXO / Crypto</Text>
          <Text style={[styles.opcionDesc, { color: colors.textMuted }]}>
            Transfiere a nuestras cuentas bancarias y sube tu comprobante. El administrador verificará y aprobará tu pago.
          </Text>
          <View style={styles.badgeRow}>
            <View style={styles.badgeAmber}>
              <Text style={styles.badgeAmberText}>⏳ Revisión manual</Text>
            </View>
          </View>
        </View>
        <Text style={styles.chevron}>›</Text>
      </TouchableOpacity>

      {/* Nota de seguridad */}
      <View style={[styles.nota, { borderColor: colors.borderLight }]}>
        <Text style={[styles.notaText, { color: colors.textMuted }]}>
          🔒 Tus pagos están protegidos. Nada se desbloquea hasta que se confirme tu pago.
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56, paddingHorizontal: 20 },
  backBtn: { marginBottom: 20 },
  header: { marginBottom: 8 },
  montoBox: {
    backgroundColor: 'rgba(245,158,11,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    marginBottom: 24,
  },
  montoLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  montoValor: { fontSize: 32, fontWeight: '800', color: '#f59e0b', marginTop: 4 },
  concepto: { fontSize: 12, marginTop: 4, textAlign: 'center' },
  titulo: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  subtitulo: { fontSize: 14, marginBottom: 20 },
  opcionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  opcionIcono: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  emoji: { fontSize: 24 },
  opcionInfo: { flex: 1 },
  opcionTitulo: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  opcionDesc: { fontSize: 12, lineHeight: 17 },
  badgeRow: { flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' },
  badgeGreen: { backgroundColor: 'rgba(39,174,96,0.12)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(39,174,96,0.3)' },
  badgeGreenText: { fontSize: 10, fontWeight: '700', color: '#27AE60' },
  badgeBlue: { backgroundColor: 'rgba(0,156,222,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(0,156,222,0.25)' },
  badgeBlueText: { fontSize: 10, fontWeight: '700', color: '#009CDE' },
  badgeAmber: { backgroundColor: 'rgba(245,158,11,0.1)', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  badgeAmberText: { fontSize: 10, fontWeight: '700', color: '#f59e0b' },
  chevron: { fontSize: 26, color: '#f59e0b', paddingLeft: 4 },
  nota: { borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 8 },
  notaText: { fontSize: 12, lineHeight: 17, textAlign: 'center' },
});
