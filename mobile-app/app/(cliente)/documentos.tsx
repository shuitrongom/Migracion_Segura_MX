import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { EstatusDocumento } from '@/types';

interface MiDocumento {
  id: string;
  nombre: string;
  categoria: string;
  estatus: EstatusDocumento;
  fechaSubida: string;
  tamano: string;
}

const MOCK_DOCUMENTOS: MiDocumento[] = [
  {
    id: '1',
    nombre: 'Pasaporte.pdf',
    categoria: 'Identificación',
    estatus: EstatusDocumento.APROBADO,
    fechaSubida: '2025-05-10',
    tamano: '2.3 MB',
  },
  {
    id: '2',
    nombre: 'Comprobante_domicilio.pdf',
    categoria: 'Domicilio',
    estatus: EstatusDocumento.EN_REVISION,
    fechaSubida: '2025-05-15',
    tamano: '1.1 MB',
  },
  {
    id: '3',
    nombre: 'Foto_INE.jpg',
    categoria: 'Identificación',
    estatus: EstatusDocumento.RECHAZADO,
    fechaSubida: '2025-05-12',
    tamano: '3.5 MB',
  },
];

const estatusConfig: Record<string, { color: string; icon: string; label: string }> = {
  pendiente: { color: '#9CA3AF', icon: '⏳', label: 'Pendiente' },
  recibido: { color: '#3498DB', icon: '📥', label: 'Recibido' },
  en_revision: { color: '#E67E22', icon: '🔍', label: 'En revisión' },
  aprobado: { color: '#27AE60', icon: '✅', label: 'Aprobado' },
  rechazado: { color: '#E74C3C', icon: '❌', label: 'Rechazado' },
};

export default function DocumentosScreen() {
  const [documentos] = useState<MiDocumento[]>(MOCK_DOCUMENTOS);

  const handleUpload = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets.length > 0) {
        const file = result.assets[0];
        Alert.alert(
          'Documento seleccionado',
          `${file.name}\nTamaño: ${((file.size || 0) / 1024 / 1024).toFixed(1)} MB\n\nSe subirá al expediente.`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Subir', onPress: () => {
              // TODO: Subir al backend
              Alert.alert('Éxito', 'Documento subido correctamente');
            }},
          ],
        );
      }
    } catch {
      Alert.alert('Error', 'No se pudo seleccionar el documento');
    }
  };

  const renderDocumento = ({ item }: { item: MiDocumento }) => {
    const config = estatusConfig[item.estatus];
    return (
      <View style={styles.card}>
        <View style={styles.cardIcon}>
          <Text style={styles.cardIconText}>📄</Text>
        </View>
        <View style={styles.cardContent}>
          <Text style={styles.cardNombre}>{item.nombre}</Text>
          <Text style={styles.cardCategoria}>{item.categoria}</Text>
          <View style={styles.cardMeta}>
            <Text style={styles.cardFecha}>{item.fechaSubida}</Text>
            <Text style={styles.cardTamano}>{item.tamano}</Text>
          </View>
        </View>
        <View style={[styles.estatusBadge, { backgroundColor: config.color + '15' }]}>
          <Text style={styles.estatusIcon}>{config.icon}</Text>
          <Text style={[styles.estatusText, { color: config.color }]}>{config.label}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={documentos}
        renderItem={renderDocumento}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.uploadSection}>
            <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
              <Text style={styles.uploadEmoji}>📤</Text>
              <Text style={styles.uploadText}>Subir documento</Text>
              <Text style={styles.uploadHint}>PDF, JPG, PNG (máx. 10MB)</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>📂</Text>
            <Text style={styles.emptyText}>No tienes documentos subidos</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
  },
  list: {
    padding: 16,
    gap: 10,
  },
  uploadSection: {
    marginBottom: 16,
  },
  uploadButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#C4A265',
    borderStyle: 'dashed',
    gap: 6,
  },
  uploadEmoji: {
    fontSize: 32,
  },
  uploadText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2C1810',
  },
  uploadHint: {
    fontSize: 12,
    color: '#8B7B6F',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F5F0E8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardIconText: {
    fontSize: 22,
  },
  cardContent: {
    flex: 1,
    gap: 2,
  },
  cardNombre: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C1810',
  },
  cardCategoria: {
    fontSize: 12,
    color: '#6B5B4F',
  },
  cardMeta: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  cardFecha: {
    fontSize: 11,
    color: '#8B7B6F',
  },
  cardTamano: {
    fontSize: 11,
    color: '#8B7B6F',
  },
  estatusBadge: {
    alignItems: 'center',
    borderRadius: 8,
    padding: 8,
    gap: 2,
  },
  estatusIcon: {
    fontSize: 16,
  },
  estatusText: {
    fontSize: 10,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyEmoji: {
    fontSize: 40,
  },
  emptyText: {
    fontSize: 15,
    color: '#8B7B6F',
  },
});
