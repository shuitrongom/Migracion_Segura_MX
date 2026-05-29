import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';

const INM_URL = 'https://www.inm.gob.mx/tramites/publico/seguimiento-tramite.html';

export default function ConsultaTramiteScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <LinearGradient colors={['#0a0a0a', '#1c1917', '#0f0f0f']} style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Text style={styles.title}>Consultar mi trámite</Text>
          <Text style={styles.subtitle}>
            Consulta el estatus de tu trámite directamente en el portal oficial del INM
          </Text>
        </View>
      </Animated.View>

      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={styles.loadingText}>Cargando portal del INM...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            <Text style={styles.errorText}>No se pudo cargar el portal del INM</Text>
            <Text style={styles.errorHint}>Verifica tu conexión a internet</Text>
            <TouchableOpacity onPress={() => { setError(false); setLoading(true); }}>
              <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.retryBtn}>
                <Text style={styles.retryText}>Reintentar</Text>
              </LinearGradient>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  header: { paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#ffffff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4, lineHeight: 18 },

  webviewContainer: { flex: 1, marginHorizontal: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  webview: { flex: 1 },

  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0a0a0a', zIndex: 10 },
  loadingText: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 12 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorIconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.03)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  errorIcon: { fontSize: 40 },
  errorText: { fontSize: 15, fontWeight: '600', color: '#ffffff' },
  errorHint: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4 },
  retryBtn: { marginTop: 16, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  retryText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

  footer: { padding: 12 },
  inmBadge: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  inmText: { fontSize: 11, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
});
