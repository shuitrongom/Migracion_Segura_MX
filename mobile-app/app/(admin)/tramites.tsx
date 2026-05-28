import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, RefreshControl, ActivityIndicator, Linking, Alert, Modal } from 'react-native';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { ADMIN_PANEL_URL } from '@/lib/config';

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
  const [search, setSearch] = useState('');
  const [tramites, setTramites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTramite, setSelectedTramite] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [updatingEstatus, setUpdatingEstatus] = useState(false);

  useEffect(() => { loadTramites(); }, []);

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

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#C4A265" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchInput} value={search} onChangeText={setSearch}
          placeholder="Buscar por cliente, tipo o pieza..." placeholderTextColor="#9CA3AF" />
      </View>

      <FlatList
        data={filtered}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4A265" />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyText}>No hay trámites</Text></View>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.card} onPress={() => { setSelectedTramite(item); setShowDetail(true); }}>
            <View style={styles.cardHeader}>
              <Text style={styles.cardTipo}>{(item.tipo || '').replace(/_/g, ' ')}</Text>
              <View style={[styles.badge, { backgroundColor: (estatusColors[item.estatus] || '#9CA3AF') + '20' }]}>
                <Text style={[styles.badgeText, { color: estatusColors[item.estatus] || '#9CA3AF' }]}>
                  {estatusLabels[item.estatus] || item.estatus}
                </Text>
              </View>
            </View>
            <Text style={styles.cardCliente}>👤 {item.cliente?.nombreCompleto || item.datosFormulario?.nombre || 'Sin cliente'}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.cardFecha}>📅 {item.createdAt?.slice(0, 10)}</Text>
              {item.numeroPieza && <Text style={styles.cardPieza}>#{item.numeroPieza}</Text>}
            </View>
          </TouchableOpacity>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/tramites/nuevo`)}>
        <Text style={styles.fabText}>+ Nuevo</Text>
      </TouchableOpacity>

      {/* Modal de detalle */}
      <Modal visible={showDetail} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Detalle del Trámite</Text>
            <TouchableOpacity onPress={() => setShowDetail(false)}><Text style={styles.modalClose}>✕</Text></TouchableOpacity>
          </View>
          {selectedTramite && (
            <View style={styles.modalContent}>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Tipo</Text>
                <Text style={styles.detailValue}>{(selectedTramite.tipo || '').replace(/_/g, ' ')}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Cliente</Text>
                <Text style={styles.detailValue}>{selectedTramite.cliente?.nombreCompleto || selectedTramite.datosFormulario?.nombre || '—'}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Nº Pieza</Text>
                <Text style={styles.detailValue}>{selectedTramite.numeroPieza || '—'}</Text>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Estatus actual</Text>
                <View style={[styles.badge, { backgroundColor: (estatusColors[selectedTramite.estatus] || '#9CA3AF') + '20', alignSelf: 'flex-start' }]}>
                  <Text style={[styles.badgeText, { color: estatusColors[selectedTramite.estatus] }]}>{estatusLabels[selectedTramite.estatus]}</Text>
                </View>
              </View>
              <View style={styles.detailSection}>
                <Text style={styles.detailLabel}>Email</Text>
                <Text style={styles.detailValue}>{selectedTramite.datosFormulario?.solicitanteEmail || selectedTramite.datosFormulario?.email || '—'}</Text>
              </View>

              {/* Cambiar estatus */}
              <Text style={styles.sectionTitle}>Cambiar estatus</Text>
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

              {/* Acciones */}
              <Text style={styles.sectionTitle}>Acciones</Text>
              <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/tramites/continuar/${selectedTramite.id}`)}>
                <Text style={styles.actionButtonText}>📋 Continuar en panel web</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionButton} onPress={() => Linking.openURL(`${ADMIN_PANEL_URL}/tramites/${selectedTramite.id}`)}>
                <Text style={styles.actionButtonText}>👁️ Ver detalle completo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' },
  searchContainer: { padding: 16 },
  searchInput: { backgroundColor: '#FFFFFF', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 15, borderWidth: 1, borderColor: '#E8DFD3', color: '#2C1810' },
  list: { paddingHorizontal: 16, paddingBottom: 80, gap: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, padding: 16, gap: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTipo: { fontSize: 15, fontWeight: '600', color: '#2C1810', textTransform: 'capitalize', flex: 1 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  cardCliente: { fontSize: 14, color: '#6B5B4F' },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardFecha: { fontSize: 12, color: '#8B7B6F' },
  cardPieza: { fontSize: 12, color: '#3498DB', fontWeight: '500', fontFamily: 'monospace' },
  empty: { alignItems: 'center', paddingVertical: 40 },
  emptyText: { fontSize: 15, color: '#8B7B6F' },
  fab: { position: 'absolute', bottom: 20, right: 20, backgroundColor: '#C4A265', borderRadius: 24, paddingHorizontal: 20, paddingVertical: 14, elevation: 4 },
  fabText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600' },

  modalContainer: { flex: 1, backgroundColor: '#F5F0E8' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E8DFD3' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#2C1810' },
  modalClose: { fontSize: 20, color: '#6B5B4F', padding: 4 },
  modalContent: { padding: 20 },
  detailSection: { marginBottom: 14 },
  detailLabel: { fontSize: 11, fontWeight: '600', color: '#8B7B6F', textTransform: 'uppercase', marginBottom: 4 },
  detailValue: { fontSize: 15, color: '#2C1810', fontWeight: '500' },
  sectionTitle: { fontSize: 14, fontWeight: '700', color: '#2C1810', marginTop: 20, marginBottom: 10, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E8DFD3' },
  estatusGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  estatusBtn: { borderWidth: 1.5, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8 },
  estatusBtnText: { fontSize: 12, fontWeight: '600' },
  actionButton: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#E8DFD3' },
  actionButtonText: { fontSize: 14, color: '#2C1810', fontWeight: '500' },
});
