import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Animated } from 'react-native';
import { useState, useRef, useEffect } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { WebView } from 'react-native-webview';
import { useTheme } from '@/lib/theme';

const INM_URL = 'https://www.inm.gob.mx/tramites/publico/seguimiento-tramite.html';

export default function ConsultaTramiteScreen() {
  const { colors } = useTheme();
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
    <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={styles.container}>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>Consultar mi trámite</Text>
          <Text style={[styles.subtitle, { color: colors.textMuted }]}>
            Consulta el estatus de tu trámite directamente en el portal oficial del INM
          </Text>
        </View>
      </Animated.View>

      <View style={styles.webviewContainer}>
        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#f59e0b" />
            <Text style={[styles.loadingText, { color: colors.textMuted }]}>Cargando portal del INM...</Text>
          </View>
        )}

        {error ? (
          <View style={styles.errorContainer}>
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            <Text style={[styles.errorText, { color: colors.text }]}>No se pudo cargar el portal del INM</Text>
            <Text style={[styles.errorHint, { color: colors.textMuted }]}>Verifica tu conexión a internet</Text>
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
          <Text style={[styles.inmText, { color: colors.textMuted }]}>🇲🇽 Portal oficial del Instituto Nacional de Migración</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 56 },
  header: { paddingHorizontal: 16, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700' },
  subtitle: { fontSize: 13, marginTop: 4, lineHeight: 18 },

  webviewContainer: { flex: 1, marginHorizontal: 12, borderRadius: 12, overflow: 'hidden', backgroundColor: 'rgba(128,128,128,0.06)', borderWidth: 1, borderColor: 'rgba(128,128,128,0.12)' },
  webview: { flex: 1 },

  loadingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 10 },
  loadingText: { fontSize: 13, marginTop: 12 },

  errorContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  errorIconContainer: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(128,128,128,0.06)', justifyContent: 'center', alignItems: 'center', marginBottom: 12, borderWidth: 1, borderColor: 'rgba(128,128,128,0.12)' },
  errorIcon: { fontSize: 40 },
  errorText: { fontSize: 15, fontWeight: '600' },
  errorHint: { fontSize: 13, marginTop: 4 },
  retryBtn: { marginTop: 16, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10, shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 },
  retryText: { color: '#ffffff', fontSize: 14, fontWeight: '600' },

  footer: { padding: 12 },
  inmBadge: { backgroundColor: 'rgba(128,128,128,0.06)', borderRadius: 8, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(128,128,128,0.12)' },
  inmText: { fontSize: 11, textAlign: 'center' },
});
