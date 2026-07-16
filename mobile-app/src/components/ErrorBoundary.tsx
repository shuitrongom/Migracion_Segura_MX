import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Global — Captura crashes de React y muestra pantalla de recuperación.
 * Evita que la app se cierre abruptamente por errores de renderizado.
 */
export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] App crash captured:', error.message);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <LinearGradient colors={['#0a0a0a', '#1a1a1a', '#0a0a0a']} style={styles.container}>
          <View style={styles.card}>
            <Text style={styles.icon}>⚠️</Text>
            <Text style={styles.title}>Algo salió mal</Text>
            <Text style={styles.message}>
              Ocurrió un error inesperado. No te preocupes, tus datos están seguros.
            </Text>
            <TouchableOpacity style={styles.retryBtn} onPress={this.handleReset}>
              <Text style={styles.retryText}>Reintentar</Text>
            </TouchableOpacity>
            {__DEV__ && this.state.error && (
              <Text style={styles.debugText}>{this.state.error.message}</Text>
            )}
          </View>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  card: { backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 24, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)', width: '100%', maxWidth: 340 },
  icon: { fontSize: 56, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#ffffff', marginBottom: 12, textAlign: 'center' },
  message: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  retryBtn: { paddingVertical: 14, paddingHorizontal: 32, borderRadius: 12, backgroundColor: '#f59e0b' },
  retryText: { color: '#ffffff', fontSize: 15, fontWeight: '700' },
  debugText: { fontSize: 10, color: 'rgba(255,0,0,0.6)', textAlign: 'center', marginTop: 16, fontFamily: 'monospace' },
});
