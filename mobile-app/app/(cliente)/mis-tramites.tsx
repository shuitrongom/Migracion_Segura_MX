import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Linking, Dimensions } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';
import { WHATSAPP_URL } from '@/lib/config';
import { useTheme } from '@/lib/theme';

const { width } = Dimensions.get('window');

const estatusColors: Record<string, string> = {
  borrador: '#6b7280', recibido: '#3b82f6', en_revision: '#f59e0b',
  en_espera_resolucion: '#a855f7', aprobado: '#22c55e', rechazado: '#ef4444', cancelado: '#6b7280',
};
const estatusLabels: Record<string, string> = {
  borrador: 'Borrador', recibido: 'Recibido', en_revision: 'En revisión',
  en_espera_resolucion: 'En espera', aprobado: 'Aprobado', rechazado: 'Rechazado', cancelado: 'Cancelado',
};

export default function MisTramitesScreen() {
  const { colors } = useTheme();
  const [user, setUser] = useState<any>(null);
  const [tramites, setTramites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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
    <View style={styles.container}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <ScrollView showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* Header */}
          <LinearGradient colors={['rgba(245,158,11,0.1)', 'transparent']} style={styles.headerGradient}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.brand}>MIGRACIÓN <Text style={styles.brandAccent}>SEGURA</Text></Text>
                <Text style={styles.brandSub}>MX · CLIENTE</Text>
              </View>
              <View style={styles.versionBadge}>
                <View style={styles.versionDot} />
                <Text style={styles.versionText}>ACTIVO</Text>
              </View>
            </View>
            <Text style={styles.welcome}>¡Bienvenido{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!</Text>
            <Text style={styles.welcomeSub}>Gestiona tu trámite migratorio de forma segura.</Text>
          </LinearGradient>

          {/* Acciones principales */}
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(cliente)/solicitud-nueva')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(245,158,11,0.12)', 'rgba(245,158,11,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>📝</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Generar Solicitud</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(cliente)/tramite-nuevo')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(168,85,247,0.12)', 'rgba(168,85,247,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>📄</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Trámite completo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(cliente)/beneficiarios')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(34,197,94,0.12)', 'rgba(34,197,94,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>👥</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Mis extranjeros</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(cliente)/consulta')} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(59,130,246,0.12)', 'rgba(59,130,246,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>🔍</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Consultar trámite</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCard} onPress={() => {
              const { Alert } = require('react-native');
              Alert.alert('Contactar asesor', '¿Cómo deseas comunicarte?', [
                { text: 'Chat en la app', onPress: () => router.push('/(cliente)/chat') },
                { text: 'WhatsApp', onPress: () => Linking.openURL(WHATSAPP_URL) },
                { text: 'Cancelar', style: 'cancel' },
              ]);
            }} activeOpacity={0.8}>
              <LinearGradient colors={['rgba(37,211,102,0.12)', 'rgba(37,211,102,0.03)']} style={styles.actionIconBg}>
                <Text style={{ fontSize: 22 }}>💬</Text>
              </LinearGradient>
              <Text style={styles.actionLabel}>Contactar asesor</Text>
            </TouchableOpacity>
          </View>

          {/* Mis trámites */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Mis trámites</Text>
            {tramites.length === 0 ? (
              <View style={styles.emptyCard}>
                <View style={styles.emptyIcon}>
                  <Text style={{ fontSize: 32 }}>📋</Text>
                </View>
                <Text style={styles.emptyText}>No tienes trámites activos aún</Text>
                <Text style={styles.emptyHint}>Inicia uno desde "Iniciar trámite"</Text>
              </View>
            ) : (
              tramites.map((tramite) => (
                <View key={tramite.id} style={styles.tramiteCard}>
                  <View style={styles.tramiteHeader}>
                    <View style={styles.tramiteIconBg}>
                      <Text style={{ fontSize: 14 }}>📄</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.tramiteTipo}>{(tramite.tipo || '').replace(/_/g, ' ')}</Text>
                      {tramite.numeroPieza && <Text style={styles.tramitePieza}>#{tramite.numeroPieza}</Text>}
                    </View>
                    <View style={[styles.badge, { backgroundColor: (estatusColors[tramite.estatus] || '#6b7280') + '20' }]}>
                      <Text style={[styles.badgeText, { color: estatusColors[tramite.estatus] || '#6b7280' }]}>
                        {estatusLabels[tramite.estatus] || tramite.estatus}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.tramiteFecha}>Creado: {tramite.createdAt?.slice(0, 10)}</Text>
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
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a' },

  headerGradient: { paddingTop: 56, paddingBottom: 24, paddingHorizontal: 20 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  brand: { fontSize: 18, fontWeight: '800', color: '#ffffff', letterSpacing: 0.5 },
  brandAccent: { color: '#f59e0b' },
  brandSub: { fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: '600', letterSpacing: 1, marginTop: 2 },
  versionBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(34,197,94,0.1)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)' },
  versionDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  versionText: { fontSize: 9, color: '#22c55e', fontWeight: '700', letterSpacing: 0.5 },
  welcome: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 4 },
  welcomeSub: { fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 20 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 10, marginBottom: 16 },
  actionCard: { width: '47%', backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 18, alignItems: 'center', gap: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  actionIconBg: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionLabel: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', textAlign: 'center' },

  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#ffffff', marginBottom: 12 },

  emptyCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 20, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  emptyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(245,158,11,0.1)', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  emptyHint: { fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 },

  tramiteCard: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 16, padding: 16, marginBottom: 10, gap: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  tramiteHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  tramiteIconBg: { width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(245,158,11,0.1)', justifyContent: 'center', alignItems: 'center' },
  tramiteTipo: { fontSize: 14, fontWeight: '600', color: '#ffffff', textTransform: 'capitalize' },
  tramitePieza: { fontSize: 11, color: '#f59e0b', fontWeight: '500', marginTop: 2 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  tramiteFecha: { fontSize: 11, color: 'rgba(255,255,255,0.3)', paddingLeft: 48 },
});
