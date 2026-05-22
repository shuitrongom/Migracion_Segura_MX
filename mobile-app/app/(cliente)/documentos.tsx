import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { apiFetch } from '@/lib/api';

export default function DocumentosScreen() {
  const [notificaciones, setNotificaciones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const res = await apiFetch('/notificaciones?page=1&limit=30');
      if (res.ok) {
        const data = await res.json();
        setNotificaciones(data.data || []);
      }
    } catch {}
    setLoading(false);
  };

  const onRefresh = useCallback(async () => { setRefreshing(true); await loadData(); setRefreshing(false); }, []);

  const markAsRead = async (id: string) => {
    await apiFetch(`/notificaciones/${id}/read`, { method: 'PATCH' });
    setNotificaciones(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert('Documento seleccionado', `${file.name}\n\nSe enviará a tu gestor para revisión.\n\n(Funcionalidad de subida en desarrollo)`);
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  if (loading) return <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#C4A265" /></View>;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Notificaciones y Documentos</Text>
      </View>

      {/* Botón subir documento */}
      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
        <Text style={styles.uploadIcon}>📤</Text>
        <View>
          <Text style={styles.uploadText}>Subir documento</Text>
          <Text style={styles.uploadHint}>PDF, JPG, PNG (máx. 10MB)</Text>
        </View>
      </TouchableOpacity>

      {/* Notificaciones */}
      {notificaciones.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={{ fontSize: 40 }}>🔔</Text>
          <Text style={styles.emptyTitle}>Sin notificaciones</Text>
          <Text style={styles.emptyText}>Aquí recibirás avisos sobre tus trámites, documentos y pagos.</Text>
        </View>
      ) : (
        <FlatList
          data={notificaciones}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#C4A265" />}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifCard, !item.leida && styles.notifUnread]}
              onPress={() => markAsRead(item.id)}
            >
              <View style={styles.notifHeader}>
                <Text style={styles.notifTitle}>{item.titulo}</Text>
                {!item.leida && <View style={styles.unreadDot} />}
              </View>
              <Text style={styles.notifContent}>{item.contenido}</Text>
              <Text style={styles.notifDate}>{item.createdAt?.slice(0, 10)} · {item.createdAt?.slice(11, 16)}</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8', paddingTop: 56 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' },
  header: { paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#2C1810' },

  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 12, padding: 14, gap: 12, borderWidth: 2, borderColor: '#C4A265', borderStyle: 'dashed', marginBottom: 16 },
  uploadIcon: { fontSize: 24 },
  uploadText: { fontSize: 14, fontWeight: '600', color: '#2C1810' },
  uploadHint: { fontSize: 11, color: '#8B7B6F' },

  list: { paddingHorizontal: 16, paddingBottom: 20 },
  notifCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 3, elevation: 1 },
  notifUnread: { borderLeftWidth: 3, borderLeftColor: '#C4A265' },
  notifHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  notifTitle: { fontSize: 14, fontWeight: '600', color: '#2C1810', flex: 1 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#C4A265' },
  notifContent: { fontSize: 13, color: '#6B5B4F', lineHeight: 18 },
  notifDate: { fontSize: 11, color: '#8B7B6F', marginTop: 6 },

  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: '600', color: '#2C1810' },
  emptyText: { fontSize: 13, color: '#6B5B4F', textAlign: 'center', lineHeight: 20 },
});
