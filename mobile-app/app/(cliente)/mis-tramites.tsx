import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Linking, Modal, Alert } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';
import { WHATSAPP_URL } from '@/lib/config';
import { useTheme } from '@/lib/theme';

const estatusColors: Record<string, string> = {
  borrador: '#6b7280', recibido: '#3b82f6', en_revision: '#f59e0b',
  en_espera_resolucion: '#a855f7', aprobado: '#22c55e', rechazado: '#ef4444', cancelado: '#6b7280',
};
const estatusLabels: Record<string, string> = {
  borrador: 'Borrador', recibido: 'Recibido', en_revision: 'En revisión',
  en_espera_resolucion: 'En espera', aprobado: 'Aprobado', rechazado: 'Rechazado', cancelado: 'Cancelado',
};

export default function MisTramitesScreen() {
  const { colors, mode } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [tramites, setTramites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showWelcomePopup, setShowWelcomePopup] = useState(true); // Siempre mostrar al entrar
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const loadData = async () => {
    const userData = await storage.getItem('user_data');
    if (userData) setUser(JSON.parse(userData));
    try {
      const res = await apiFetch('/tramites?page=1&limit=50');
      if (res.ok) { const data = await res.json(); setTramites(data.data || []); }
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);

  if (loading) return (
    <View style={styles.loadingContainer}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientStart]} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color={colors.accent} />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />

      {/* Pop-up de bienvenida - Contactar asesor */}
      <Modal visible={showWelcomePopup} animationType="fade" transparent>
        <View style={styles.popupOverlay}>
          <View style={[styles.popupCard, { backgroundColor: colors.bgModal }]}>
            <Text style={styles.popupEmoji}>💬</Text>
            <Text style={[styles.popupTitle, { color: colors.text }]}>¡Bienvenido a Migración Segura MX!</Text>
            <Text style={[styles.popupText, { color: colors.textSecondary }]}>
              ¿Tienes dudas sobre la aplicación o sobre tu trámite?{'\n\n'}
              Ve al botón de <Text style={{ color: '#f59e0b', fontWeight: '700' }}>Contactar asesor</Text> para mayor información y asistencia personalizada.
            </Text>
            <TouchableOpacity
              style={styles.popupBtn}
              onPress={() => setShowWelcomePopup(false)}
              activeOpacity={0.85}
            >
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.popupBtnGradient}>
                <Text style={styles.popupBtnText}>Entendido</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Header */}
          <LinearGradient colors={[mode === 'dark' ? 'rgba(245,158,11,0.1)' : 'rgba(245,158,11,0.06)', 'transparent']} style={styles.headerGradient}>
            <View style={styles.headerTop}>
              <View>
                <Text style={[styles.brand, { color: colors.text }]}>MIGRACIÓN <Text style={styles.brandAccent}>SEGURA</Text></Text>
                <Text style={[styles.brandSub, { color: colors.textMuted }]}>MX · CLIENTE</Text>
              </View>
              <View style={styles.versionBadge}>
                <View style={styles.versionDot} />
                <Text style={styles.versionText}>ACTIVO</Text>
              </View>
            </View>
            <Text style={[styles.welcome, { color: colors.text }]}>¡Bienvenido{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!</Text>
            <Text style={[styles.welcomeSub, { color: colors.textMuted }]}>Gestiona tu trámite migratorio de forma segura.</Text>
          </LinearGradient>

          {/* Acciones principales */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]} onPress={() => router.push('/(cliente)/solicitud-nueva')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>📝</Text>
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Solicitud y Escritos</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]} onPress={() => router.push('/(cliente)/tramite-nuevo')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(168,85,247,0.12)', 'rgba(168,85,247,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>📄</Text>
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Trámite</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]} onPress={() => router.push('/(cliente)/beneficiarios')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(34,197,94,0.12)', 'rgba(34,197,94,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>👥</Text>
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Mis extranjeros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]} onPress={() => router.push('/(cliente)/consulta')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>🔍</Text>
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Consultar trámite</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]} onPress={() => {
              Alert.alert('Contactar asesor', '¿Cómo deseas comunicarte?', [
                { text: 'Chat en la app', onPress: () => router.push('/(cliente)/chat') },
                { text: 'WhatsApp', onPress: () => Linking.openURL(WHATSAPP_URL) },
                { text: 'Cancelar', style: 'cancel' },
              ]);
            }} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(37,211,102,0.12)', 'rgba(37,211,102,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>💬</Text>
              </LinearGradient>
              <Text style={[styles.actionLabel, { color: colors.textSecondary }]}>Contactar asesor</Text>
            </TouchableOpacity>
          </View>

          {/* Mis trámites */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Mis trámites</Text>
            {tramites.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
                <View style={styles.emptyIcon}>
                  <Text style={{ fontSize: 32 }}>📋</Text>
                </View>
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No tienes trámites activos aún</Text>
                <Text style={[styles.emptyHint, { color: colors.textMuted }]}>Inicia uno desde "Iniciar trámite"</Text>
              </View>
            ) : (
              tramites.map((tramite) => (
                <View key={tramite.id} style={[styles.tramiteCard, { backgroundColor: colors.bgCard, borderColor: colors.borderLight }]}>
                  <View style={styles.tramiteHeader}>
                    <View style={styles.tramiteIconBg}>
                      <Text style={{ fontSize: 14 }}>📄</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.tramiteTipo, { color: colors.text }]}>{(tramite.tipo || '').replace(/_/g, ' ')}</Text>
                      {tramite.numeroPieza && <Text style={styles.tramitePieza}>#{tramite.numeroPieza}</Text>}
                    </View>
                    <View style={[styles.badge, { backgroundColor: (estatusColors[tramite.estatus] || '#6b7280') + '20' }]}>
                      <Text style={[styles.badgeText, { color: estatusColors[tramite.estatus] || '#6b7280' }]}>
                        {estatusLabels[tramite.estatus] || tramite.estatus}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.tramiteFecha, { color: colors.textMuted }]}>Creado: {tramite.createdAt?.slice(0, 10)}</Text>
                </View>
              ))
            )}
          </View>

          <View style={{ height: 30 }} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  headerGradient: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  brand: { fontSize: 18, fontWeight: '800', letterSpacing: 0.5 },
  brandAccent: { color: '#f59e0b' },
  brandSub: { fontSize: 11, fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  versionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  versionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  versionText: { fontSize: 9, color: '#22c55e', fontWeight: '700', letterSpacing: 0.5 },
  welcome: { fontSize: 22, fontWeight: '700', marginBottom: 4 },
  welcomeSub: { fontSize: 14, lineHeight: 20 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  actionCard: { width: '47%', borderRadius: 16, padding: 18, alignItems: 'center', gap: 12, borderWidth: 1 },
  actionIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', textAlign: 'center' },

  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', marginBottom: 12 },

  emptyCard: { borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1 },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(245,158,11,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, fontWeight: '500' },
  emptyHint: { fontSize: 12, marginTop: 4 },

  tramiteCard: { borderRadius: 16, padding: 16, marginBottom: 10, gap: 8, borderWidth: 1 },
  tramiteHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tramiteIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.1)', justifyContent: 'center', alignItems: 'center' },
  tramiteTipo: { fontSize: 14, fontWeight: '600', textTransform: 'capitalize' },
  tramitePieza: { fontSize: 11, color: '#f59e0b', fontWeight: '500', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  tramiteFecha: { fontSize: 11, paddingLeft: 48 },

  // Pop-up de bienvenida
  popupOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  popupCard: { borderRadius: 24, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(245,158,11,0.2)', maxWidth: 340, width: '100%' },
  popupEmoji: { fontSize: 48, marginBottom: 12 },
  popupTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center', marginBottom: 12 },
  popupText: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 20 },
  popupBtn: { borderRadius: 14, overflow: 'hidden', width: '100%' },
  popupBtnGradient: { paddingVertical: 14, alignItems: 'center' },
  popupBtnText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
});
