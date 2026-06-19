import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Linking, Alert, Modal, Animated, ScrollView } from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { apiFetch } from '@/lib/api';
import { ADMIN_PANEL_URL } from '@/lib/config';
import { useTheme } from '@/lib/theme';

const estatusColors: Record<string, string> = {
  borrador: '#9CA3AF', recibido: '#3498DB', en_revision: '#E67E22',
  en_espera_resolucion: '#9B59B6', aprobado: '#27AE60', rechazado: '#E74C3C', cancelado: '#6B7280',
};
const estatusLabels: Record<string, string> = {
  borrador: 'Borrador', recibido: 'Recibido', en_revision: 'En revisión',
  en_espera_resolucion: 'En espera', aprobado: 'Aprobado', rechazado: 'Rechazado', cancelado: 'Cancelado',
};
const ESTATUS_OPTIONS = ['recibido', 'en_revision', 'en_espera_resolucion', 'aprobado', 'rechazado', 'cancelado'];

export default function AdminTramitesScreen() {
  const { colors, mode } = useTheme();
  const isDark = mode === 'dark';
  const [search, setSearch] = useState('');
  const [tramites, setTramites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTramite, setSelectedTramite] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updatingEstatus, setUpdatingEstatus] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => { loadTramites(); }, []);
  useEffect(() => {
    if (!loading) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  const loadTramites = async () => {
    try {
      const res = await apiFetch('/tramites?page=1&limit=50');
      if (res.ok) { const data = await res.json(); setTramites(data.data || []); }
    } catch {}
    setLoading(false);
  };

  const onRefresh = async () => { setRefreshing(true); await loadTramites(); setRefreshing(false); };

  const handleChangeEstatus = async (tramiteId: string, nuevoEstatus: string) => {
    setUpdatingEstatus(true);
    try {
      const res = await apiFetch(`/tramites/${tramiteId}/estatus`, {
        method: 'PATCH',
        body: JSON.stringify({ estatus: nuevoEstatus }),
      });
      if (res.ok) {
        Alert.alert('Éxito', `Estatus actualizado a: ${estatusLabels[nuevoEstatus]}`);
        await loadTramites();
        setShowDetail(false);
      } else {
        const data = await res.json();
        Alert.alert('Error', data.message || 'No se pudo actualizar');
      }
    } catch { Alert.alert('Error', 'No se pudo conectar'); }
    setUpdatingEstatus(false);
  };

  const filtered = tramites.filter((t) =>
    (t.cliente?.nombreCompleto || t.datosFormulario?.nombre || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.tipo || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.numeroPieza || '').includes(search),
  );

  // Colores dinámicos
  const cardBg = isDark ? 'rgba(255,255,255,0.03)' : colors.bgCard;
  const cardBorder = isDark ? 'rgba(255,255,255,0.06)' : colors.border;
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : colors.bgInput;
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : colors.border;

  if (loading) return (
    <View style={[styles.loadingContainer, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <ActivityIndicator size="large" color="#f59e0b" />
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} />
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.searchContainer}>
          <TextInput style={[styles.searchInput, { backgroundColor: inputBg, borderColor: inputBorder, color: colors.text }]} value={search} onChangeText={setSearch}
            placeholder="Buscar por cliente, tipo o pieza..." placeholderTextColor={colors.textMuted} />
        </View>

        <FlatList
          data={filtered}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f59e0b" />}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)']} style={styles.emptyIconBg}>
                <Text style={styles.emptyEmoji}>📋</Text>
              </LinearGradient>
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>No hay trámites</Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={[styles.card, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => { setSelectedTramite(item); setShowDetail(true); }}>
              <View style={styles.cardHeader}>
                <Text style={[styles.cardTipo, { color: colors.text }]}>{(item.tipo || '').replace(/_/g, ' ')}</Text>
                <View style={[styles.badge, { backgroundColor: (estatusColors[item.estatus] || '#9CA3AF') + '20' }]}>
                  <Text style={[styles.badgeText, { color: estatusColors[item.estatus] || '#9CA3AF' }]}>
                    {estatusLabels[item.estatus] || item.estatus}
                  </Text>
                </View>
              </View>
              <Text style={[styles.cardCliente, { color: colors.textSecondary }]}>👤 {item.cliente?.nombreCompleto || item.datosFormulario?.nombre || 'Sin cliente'}</Text>
              <View style={styles.cardFooter}>
                <Text style={[styles.cardFecha, { color: colors.textMuted }]}>📅 {item.createdAt?.slice(0, 10)}</Text>
                {item.numeroPieza && <Text style={styles.cardPieza}>#{item.numeroPieza}</Text>}
              </View>
            </TouchableOpacity>
          )}
        />

        <TouchableOpacity style={styles.fab} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/tramites/nuevo`)}>
          <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.fabGradient}>
            <Text style={styles.fabText}>+ Nuevo</Text>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>

      {/* Modal de detalle */}
      <Modal visible={showDetail} animationType="slide" presentationStyle="pageSheet">
        <View style={[styles.modalContainer, { backgroundColor: colors.bg }]}>
          <View style={[styles.modalHeader, { backgroundColor: colors.bgSecondary, borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Detalle del Trámite</Text>
            <TouchableOpacity onPress={() => setShowDetail(false)}><Text style={[styles.modalClose, { color: colors.textMuted }]}>✕</Text></TouchableOpacity>
          </View>
          {selectedTramite && (
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Tipo</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{(selectedTramite.tipo || '').replace(/_/g, ' ')}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Cliente</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedTramite.cliente?.nombreCompleto || selectedTramite.datosFormulario?.nombre || '—'}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Nº Pieza</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedTramite.numeroPieza || '—'}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Estatus actual</Text>
                <View style={[styles.badge, { backgroundColor: (estatusColors[selectedTramite.estatus] || '#9CA3AF') + '20', alignSelf: 'flex-start' }]}>
                  <Text style={[styles.badgeText, { color: estatusColors[selectedTramite.estatus] }]}>{estatusLabels[selectedTramite.estatus]}</Text>
                </View>
              </View>
              <View style={styles.detailSection}>
                <Text style={[styles.detailLabel, { color: colors.textMuted }]}>Email</Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>{selectedTramite.datosFormulario?.solicitanteEmail || selectedTramite.datosFormulario?.email || '—'}</Text>
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text, borderTopColor: colors.border }]}>Cambiar estatus</Text>
              <View style={styles.estatusGrid}>
                {ESTATUS_OPTIONS.filter(e => e !== selectedTramite.estatus).map(estatus => (
                  <TouchableOpacity key={estatus} style={[styles.estatusBtn, { borderColor: estatusColors[estatus] }]}
                    onPress={() => Alert.alert('Cambiar estatus', `¿Cambiar a "${estatusLabels[estatus]}"?`, [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Confirmar', onPress: () => handleChangeEstatus(selectedTramite.id, estatus) },
                    ])}
                    disabled={updatingEstatus}
                  >
                    <Text style={[styles.estatusBtnText, { color: estatusColors[estatus] }]}>{estatusLabels[estatus]}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.text, borderTopColor: colors.border }]}>Acciones</Text>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/tramites/continuar/${selectedTramite.id}`)}>
                <Text style={[styles.actionButtonText, { color: colors.text }]}>📋 Continuar en panel web</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionButton, { backgroundColor: cardBg, borderColor: cardBorder }]} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/tramites/${selectedTramite.id}`)}>
                <Text style={[styles.actionButtonText, { color: colors.text }]}>👁️ Ver detalle completo</Text>
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  searchContainer: { padding: 16 },
  searchInput: { borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1 },
  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 10 },
  card: { borderRadius: 16, padding: 16, gap: 8, borderWidth: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTipo: { fontSize: 15, fontWeight: '600', textTransform: 'capitalize', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardCliente: { fontSize: 14 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFecha: { fontSize: 12 },
  cardPieza: { fontSize: 12, color: '#3498DB', fontWeight: '500', fontFamily: 'monospace' },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 12 },
  emptyIconBg: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center' },
  emptyEmoji: { fontSize: 32 },
  emptyText: { fontSize: 15 },
  fab: { position: 'absolute', bottom: 20, right: 20, borderRadius: 24, elevation: 8, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  fabGradient: { borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14 },
  fabText: { color: '#ffffff', fontSize: 15, fontWeight: '600' },

  modalContainer: { flex: 1 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1 },
  modalTitle: { fontSize: 18, fontWeight: '700' },
  modalClose: { fontSize: 20, padding: 4 },
  modalContent: { padding: 20 },
  detailSection: { marginBottom: 14 },
  detailLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 15, fontWeight: '500' },
  sectionTitle: { fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 10, paddingTop: 12, borderTopWidth: 1 },
  estatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estatusBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  estatusBtnText: { fontSize: 12, fontWeight: '600' },
  actionButton: { borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1 },
  actionButtonText: { fontSize: 14, fontWeight: '500' },
});
