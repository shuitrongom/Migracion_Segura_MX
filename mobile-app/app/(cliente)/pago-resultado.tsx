import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { useEffect, useRef } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';

export default function PagoResultadoScreen() {
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ status: string; resultado: string; tramiteId: string }>();
  // Soportar tanto "status" (nuevo) como "resultado" (legacy deep link)
  const status = params.status || params.resultado || 'desconocido';
  const tramiteId = params.tramiteId || '';

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, tension: 40, useNativeDriver: true }),
      Animated.timing(opacityAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const config: Record<string, {
    icon: string;
    title: string;
    subtitle: string;
    message: string;
    color: string;
    bg: string;
    btnText: string;
    infoItems?: string[];
  }> = {
    exitoso: {
      icon: '🎉',
      title: '¡Pago confirmado!',
      subtitle: 'Tu pago fue procesado exitosamente.',
      message: 'En breve recibirás tu solicitud INM con el número de pieza y contraseña. Revisa tus notificaciones.',
      color: '#27AE60',
      bg: 'rgba(39,174,96,0.08)',
      btnText: 'Ver mis solicitudes',
      infoItems: [
        '✓ Pago procesado por Mercado Pago',
        '✓ Notificación enviada al gestor',
        '✓ Recibirás tu comprobante por correo',
      ],
    },
    fallido: {
      icon: '❌',
      title: 'Pago no procesado',
      subtitle: 'No se pudo completar el pago.',
      message: 'Puedes intentarlo de nuevo con otra tarjeta. El link de pago sigue activo.',
      color: '#E74C3C',
      bg: 'rgba(231,76,60,0.08)',
      btnText: 'Volver',
      infoItems: [
        '• Verifica que los datos son correctos',
        '• Asegúrate de tener fondos suficientes',
        '• Intenta con otra tarjeta si persiste',
      ],
    },
    pendiente: {
      icon: '⏳',
      title: 'Pago en revisión',
      subtitle: 'Tu pago está siendo procesado.',
      message: 'Mercado Pago está verificando tu pago. Te notificaremos cuando se confirme.',
      color: '#E67E22',
      bg: 'rgba(230,126,34,0.08)',
      btnText: 'Ver mis solicitudes',
      infoItems: [
        '⏳ Tiempo estimado: 1-5 minutos',
        '📱 Recibirás una notificación push',
        '📧 Y un correo de confirmación',
      ],
    },
  };

  const cfg = config[status] || {
    icon: '❓',
    title: 'Estado desconocido',
    subtitle: '',
    message: 'Verifica tu solicitud.',
    color: '#9CA3AF',
    bg: 'rgba(156,163,175,0.08)',
    btnText: 'Volver',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientEnd]} style={StyleSheet.absoluteFill} />

      <Animated.View style={[styles.content, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={[styles.iconContainer, { backgroundColor: cfg.bg }]}>
          <Text style={styles.icon}>{cfg.icon}</Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]}>{cfg.title}</Text>
        <Text style={[styles.subtitle, { color: cfg.color }]}>{cfg.subtitle}</Text>
        <Text style={[styles.message, { color: colors.textMuted }]}>{cfg.message}</Text>

        {cfg.infoItems && (
          <View style={styles.infoBox}>
            {cfg.infoItems.map((item, i) => (
              <Text key={i} style={[styles.infoText, { color: colors.textMuted }]}>{item}</Text>
            ))}
          </View>
        )}

        <TouchableOpacity
          style={[styles.btn, { borderColor: cfg.color }]}
          onPress={() => router.replace('/(cliente)/estatus')}
          activeOpacity={0.8}
        >
          <Text style={[styles.btnText, { color: cfg.color }]}>{cfg.btnText}</Text>
        </TouchableOpacity>

        {status === 'fallido' && (
          <TouchableOpacity style={styles.retryBtn} onPress={() => router.back()}>
            <Text style={[styles.retryText, { color: colors.textMuted }]}>← Regresar</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => router.replace('/(cliente)/mis-tramites')}
        >
          <Text style={[styles.retryText, { color: colors.textMuted }]}>Ir al inicio</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { alignItems: 'center', padding: 32, maxWidth: 360, width: '100%' },
  iconContainer: { width: 100, height: 100, borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  icon: { fontSize: 52 },
  title: { fontSize: 26, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  subtitle: { fontSize: 16, fontWeight: '600', textAlign: 'center', marginBottom: 16 },
  message: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  infoBox: { width: '100%', gap: 8, marginBottom: 24 },
  infoText: { fontSize: 13, paddingLeft: 4 },
  btn: { width: '100%', paddingVertical: 16, borderRadius: 14, borderWidth: 1.5, alignItems: 'center', marginBottom: 12 },
  btnText: { fontSize: 16, fontWeight: '700' },
  retryBtn: { paddingVertical: 10, paddingHorizontal: 20 },
  retryText: { fontSize: 14 },
});
