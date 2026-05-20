import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useState, useEffect } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { apiFetch } from '@/lib/api';

export default function DocumentosScreen() {
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => { loadDocs(); }, []);

  const loadDocs = async () => {
    // TODO: endpoint de documentos del cliente cuando esté disponible
    setLoading(false);
  };

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert('Documento seleccionado', `${file.name}\n\nSe enviará a tu gestor para revisión.`);
        // TODO: subir al backend
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis documentos</Text>
        <Text style={styles.subtitle}>Consulta los documentos requeridos para tu trámite.</Text>
      </View>

      <TouchableOpacity style={styles.uploadBtn} onPress={handleUpload}>
        <Text style={styles.uploadIcon}>📤</Text>
        <View>
          <Text style={styles.uploadText}>Subir documento</Text>
          <Text style={styles.uploadHint}>PDF, JPG, PNG (máx. 10MB)</Text>
        </View>
      </TouchableOpacity>

      {documentos.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📂</Text>
          <Text style={styles.emptyText}>No hay documentos aún</Text>
          <Text style={styles.emptyHint}>Cuando inicies un trámite, aquí verás los documentos requeridos y su estatus.</Text>
        </View>
      ) : (
        <FlatList
          data={documentos}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16 }}
          renderItem={({ item }) => (
            <View style={styles.docCard}>
              <Text>{item.nombre}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8', paddingTop: 56 },
  header: { paddingHorizontal: 16, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#2C1810' },
  subtitle: { fontSize: 14, color: '#6B5B4F', marginTop: 4 },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', marginHorizontal: 16, borderRadius: 14, padding: 16, gap: 14, borderWidth: 2, borderColor: '#C4A265', borderStyle: 'dashed', marginBottom: 20 },
  uploadIcon: { fontSize: 28 },
  uploadText: { fontSize: 15, fontWeight: '600', color: '#2C1810' },
  uploadHint: { fontSize: 12, color: '#8B7B6F' },
  emptyState: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 32 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#2C1810' },
  emptyHint: { fontSize: 13, color: '#6B5B4F', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  docCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 14, marginBottom: 8 },
});
