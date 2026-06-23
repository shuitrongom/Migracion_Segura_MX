import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import * as Clipboard from 'expo-clipboard';
import { apiFetch } from '@/lib/api';
import { useTheme } from '@/lib/theme';

interface CuentaBancaria {
  banco: string;
  clabe: string;
  tarjeta: string | null;
}

interface DatosBancarios {
  titular: string;
  cuentas: CuentaBancaria[];
  crypto: { red: string; email: string; wallet: string }[];
}

export default function PagosScreen() {
  const { colors } = useTheme();
  const [datos, setDatos] = useState<DatosBancarios | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await apiFetch('/financiero/datos-bancarios');
      if (res.ok) setDatos(await res.json());
    } catch {}
    setLoading(false);
    setRefreshing(false);
  };

  const onRefresh = useCallback(() => { setRefreshing(true); loadData(); }, []);

  const copy = async (text: string, label: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert('✅ Copiado', `${label} copiada al portapapeles`);
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
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>💰 Datos para pago</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Usa estas cuentas para realizar tus pagos por transferencia
          </Text>
        </View>

        {/* Aviso importante */}
        <View style={[styles.warningBox, { borderColor: 'rgba(245,158,11,0.3)' }]}>
          <Text style={styles.warningTitle}>⚠️ Importante</Text>
          <Text style={[styles.warningText, { color: colors.textMuted }]}>
            Transfiere el monto EXACTO que se te indica en tu trámite. Después de transferir, sube tu comprobante desde la sección de Seguimiento para que se verifique tu pago.
          </Text>
        </View>

        {/* Titular */}
        {datos && (
          <View style={[styles.titularBox, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
            <Text style={[styles.titularLabel, { color: colors.textMuted }]}>Titular de las cuentas</Text>
            <Text style={[styles.titularName, { color: colors.text }]}>{datos.titular}</Text>
          </View>
        )}

        {/* Cuentas bancarias */}
        {datos?.cuentas.map((cuenta, i) => (
          <View key={i} style={[styles.cuentaCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
            <Text style={[styles.bancoName, { color: colors.text }]}>🏦 {cuenta.banco}</Text>
            
            <TouchableOpacity onPress={() => copy(cuenta.clabe, 'CLABE')} style={styles.dataRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dataLabel, { color: colors.textMuted }]}>CLABE Interbancaria</Text>
                <Text style={styles.dataValue}>{cuenta.clabe}</Text>
              </View>
              <Text style={styles.copyBtn}>📋</Text>
            </TouchableOpacity>

            {cuenta.tarjeta && (
              <TouchableOpacity onPress={() => copy(cuenta.tarjeta!, 'Tarjeta')} style={styles.dataRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Tarjeta</Text>
                  <Text style={styles.dataValue}>{cuenta.tarjeta}</Text>
                </View>
                <Text style={styles.copyBtn}>📋</Text>
              </TouchableOpacity>
            )}
          </View>
        ))}

        {/* Crypto */}
        {datos?.crypto.map((c, i) => (
          <View key={i} style={[styles.cuentaCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
            <Text style={[styles.bancoName, { color: colors.text }]}>₿ {c.red}</Text>
            
            <TouchableOpacity onPress={() => copy(c.email, 'Email Binance')} style={styles.dataRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Email</Text>
                <Text style={styles.dataValue}>{c.email}</Text>
              </View>
              <Text style={styles.copyBtn}>📋</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => copy(c.wallet, 'Wallet')} style={styles.dataRow}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.dataLabel, { color: colors.textMuted }]}>Wallet (USDT)</Text>
                <Text style={[styles.dataValue, { fontSize: 11 }]}>{c.wallet}</Text>
              </View>
              <Text style={styles.copyBtn}>📋</Text>
            </TouchableOpacity>
          </View>
        ))}

        {/* Instrucciones */}
        <View style={[styles.instructionsBox, { borderColor: colors.borderLight }]}>
          <Text style={[styles.instructionsTitle, { color: colors.text }]}>📝 Pasos para pagar</Text>
          <Text style={[styles.instructionStep, { color: colors.textMuted }]}>1. Transfiere el monto exacto a cualquiera de las cuentas de arriba</Text>
          <Text style={[styles.instructionStep, { color: colors.textMuted }]}>2. Toma captura de pantalla del comprobante</Text>
          <Text style={[styles.instructionStep, { color: colors.textMuted }]}>3. Ve a Seguimiento → tu trámite → botón Pagar</Text>
          <Text style={[styles.instructionStep, { color: colors.textMuted }]}>4. Selecciona "Transferencia" y sube tu comprobante</Text>
          <Text style={[styles.instructionStep, { color: colors.textMuted }]}>5. El sistema verificará tu pago y te notificará ✅</Text>
        </View>

        <View style={{ height: 30 }} />
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 16, paddingTop: 56, paddingBottom: 30 },
  header: { marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4 },

  warningBox: { backgroundColor: 'rgba(245,158,11,0.06)', borderWidth: 1, borderRadius: 14, padding: 14, marginBottom: 16 },
  warningTitle: { fontSize: 13, fontWeight: '700', color: '#f59e0b', marginBottom: 4 },
  warningText: { fontSize: 12, lineHeight: 18 },

  titularBox: { borderRadius: 14, padding: 14, marginBottom: 12, borderWidth: 1 },
  titularLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  titularName: { fontSize: 18, fontWeight: '700', marginTop: 4 },

  cuentaCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1 },
  bancoName: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  dataRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
  dataLabel: { fontSize: 10, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  dataValue: { fontSize: 15, fontWeight: '700', color: '#f59e0b', fontFamily: 'monospace', marginTop: 2 },
  copyBtn: { fontSize: 20, paddingLeft: 12 },

  instructionsBox: { borderRadius: 14, padding: 16, borderWidth: 1, marginTop: 8 },
  instructionsTitle: { fontSize: 14, fontWeight: '700', marginBottom: 10 },
  instructionStep: { fontSize: 12, lineHeight: 20, marginBottom: 4 },
});
