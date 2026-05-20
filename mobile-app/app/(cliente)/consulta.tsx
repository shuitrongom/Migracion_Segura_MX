import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { WebView } from 'react-native-webview';

const INM_URL = 'https://www.inm.gob.mx/tramites/publico/seguimiento-tramite.html';

export default function ConsultaTramiteScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Consultar mi trámite</Text>
        <Text style={styles.subtitle}>
          Consulta el estatus de tu trámite directamente en el portal oficial del INM
        </Text>
      </View>

      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#C4A265" />
            <Text style={styles.loadingText}>Cargando portal del INM...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorText}>No se pudo cargar el portal del INM</Text>
            <Text style={styles.errorHint}>Verifica tu conexión a internet</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => { setError(false); setLoading(true); }}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <WebView
            source={{ uri: INM_URL }}
            style={styles.webview}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => { setLoading(false); setError(true); }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={false}
            scalesPageToFit={true}
            allowsInlineMediaPlayback={true}
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.inmBadge}>
          <Text style={styles.inmText}>🇲🇽 Portal oficial del Instituto Nacional de Migración</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8', paddingTop: 56 },
  header: { paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#2C1810' },
  subtitle: { fontSize: 13, color: '#6B5B4F', marginTop: 4, lineHeight: 18 },

  webviewContainer: { flex: 1, marginHorizontal: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DFD3' },
  webview: { flex: 1 },

  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF', zIndex: 10 },
  loadingText: { fontSize: 13, color: '#6B5B4F', marginTop: 12 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorIcon: { fontSize: 40, marginBottom: 12 },
  errorText: { fontSize: 15, fontWeight: '600', color: '#2C1810' },
  errorHint: { fontSize: 13, color: '#6B5B4F', marginTop: 4 },
  retryBtn: { marginTop: 16, backgroundColor: '#3D2B1F', borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  retryText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },

  footer: { padding: 12 },
  inmBadge: { backgroundColor: '#FFFFFF', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#E8DFD3' },
  inmText: { fontSize: 11, color: '#6B5B4F', textAlign: 'center' },
});
