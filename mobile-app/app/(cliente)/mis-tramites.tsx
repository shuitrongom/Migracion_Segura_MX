import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator, Animated, Linking } from 'react-native';
import { useState, useEffect, useCallback, useRef } from 'react';
import { router } from 'expo-router';
import { apiFetch } from '@/lib/api';
import { storage } from '@/lib/storage';
import { WHATSAPP_URL } from '@/lib/config';

const estatusColors: Record<string, string> = {
  borrador: '#9CA3AF', recibido: '#3498DB', en_revision: '#E67E22',
  en_espera_resolucion: '#9B59B6', aprobado: '#27AE60', rechazado: '#E74C3C', cancelado: '#6B7280',
};
const estatusLabels: Record<string, string> = {
  borrador: 'Borrador', recibido: 'Recibido', en_revision: 'En revisión',
  en_espera_resolucion: 'En espera', aprobado: 'Aprobado', rechazado: 'Rechazado', cancelado: 'Cancelado',
};

export default function MisTramitesScreen() {
  const [user, setUser] = useState<any>(null);
  const [tramites, setTramites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (!loading) Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [loading]);

  const loadData = async () => {
    const userData = await storage.getItem('user_data');
    if (userData) setUser(JSON.parse(userData));
    try {
      const res = await apiFetch('/tramites?page=1&limit=50');
      if (res.ok) {
        const data = await res.json();
        setTramites(data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#C4A265" /></View>;

  return (
    <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4A265" />}>
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.brand}>MIGRACIÓN</Text>
              <Text style={styles.brandSub}>SEGURA MX</Text>
            </View>
            <View style={styles.versionBadge}>
              <Text style={styles.versionText}>VERSIÓN CLIENTE</Text>
            </View>
          </View>
          <Text style={styles.welcome}>¡Bienvenido{user?.fullName ? `, ${user.fullName.split(' ')[0]}` : ''}!</Text>
          <Text style={styles.welcomeSub}>Gestiona tu trámite migratorio de forma segura y sencilla.</Text>
        </View>

        {/* Acciones principales */}
        <View style={styles.actionsGrid}>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(cliente)/tramite-nuevo')}>
            <View style={[styles.actionIcon, { backgroundColor: '#C4A26520' }]}>
              <Text style={styles.actionEmoji}>📄</Text>
            </View>
            <Text style={styles.actionLabel}>Iniciar trámite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(cliente)/consulta')}>
            <View style={[styles.actionIcon, { backgroundColor: '#3498DB20' }]}>
              <Text style={styles.actionEmoji}>🔍</Text>
            </View>
            <Text style={styles.actionLabel}>Consultar mi trámite</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => router.push('/(cliente)/documentos')}>
            <View style={[styles.actionIcon, { backgroundColor: '#27AE6020' }]}>
              <Text style={styles.actionEmoji}>📂</Text>
            </View>
            <Text style={styles.actionLabel}>Mis documentos</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} onPress={() => Linking.openURL(WHATSAPP_URL)}>
            <View style={[styles.actionIcon, { backgroundColor: '#25D36620' }]}>
              <Text style={styles.actionEmoji}>💬</Text>
            </View>
            <Text style={styles.actionLabel}>Contactar asesor</Text>
          </TouchableOpacity>
        </View>

        {/* Mis trámites activos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mis trámites</Text>
          {tramites.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No tienes trámites activos aún.</Text>
              <Text style={styles.emptyHint}>Inicia uno desde el botón "Iniciar trámite"</Text>
            </View>
          ) : (
            tramites.map((tramite) => (
              <View key={tramite.id} style={styles.tramiteCard}>
                <View style={styles.tramiteHeader}>
                  <Text style={styles.tramiteTipo}>{(tramite.tipo || '').replace(/_/g, ' ')}</Text>
                  <View style={[styles.badge, { backgroundColor: (estatusColors[tramite.estatus] || '#9CA3AF') + '20' }]}>
                    <Text style={[styles.badgeText, { color: estatusColors[tramite.estatus] || '#9CA3AF' }]}>
                      {estatusLabels[tramite.estatus] || tramite.estatus}
                    </Text>
                  </View>
                </View>
                {tramite.numeroPieza && (
                  <Text style={styles.tramitePieza}>Nº Pieza: {tramite.numeroPieza}</Text>
                )}
                <Text style={styles.tramiteFecha}>Creado: {tramite.createdAt?.slice(0, 10)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 30 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' },

  header: { backgroundColor: '#3D2B1F', padding: 24, paddingTop: 56, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  brand: { fontSize: 18, fontWeight: '800', color: '#C4A265' },
  brandSub: { fontSize: 12, color: '#A89070', fontWeight: '600', letterSpacing: 1 },
  versionBadge: { backgroundColor: '#C4A26520', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: '#C4A26540' },
  versionText: { fontSize: 9, color: '#C4A265', fontWeight: '700', letterSpacing: 0.5 },
  welcome: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  welcomeSub: { fontSize: 14, color: '#BDB0A0', lineHeight: 20 },

  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12 },
  actionCard: { width: '47%', backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, alignItems: 'center', gap: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
  actionEmoji: { fontSize: 22 },
  actionLabel: { fontSize: 12, fontWeight: '600', color: '#2C1810', textAlign: 'center' },

  section: { paddingHorizontal: 16, marginTop: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#2C1810', marginBottom: 12 },

  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#6B5B4F', fontWeight: '500' },
  emptyHint: { fontSize: 12, color: '#8B7B6F', marginTop: 4 },

  tramiteCard: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, marginBottom: 10, gap: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  tramiteHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tramiteTipo: { fontSize: 14, fontWeight: '600', color: '#2C1810', textTransform: 'capitalize', flex: 1 },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  tramitePieza: { fontSize: 12, color: '#3498DB', fontWeight: '500' },
  tramiteFecha: { fontSize: 11, color: '#8B7B6F' },
});
