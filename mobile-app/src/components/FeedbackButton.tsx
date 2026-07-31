/**
 * FeedbackButton — Botón flotante discreto para reportes / sugerencias.
 * Posicionado en la esquina inferior izquierda, semi-transparente,
 * para no interferir con la navegación principal.
 */
import { useState, useRef } from 'react';
import { TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/lib/theme';
import FeedbackModal from '@/components/FeedbackModal';

interface FeedbackButtonProps {
  /** Offset bottom extra (para no superponerse con la tab bar) */
  tabBarHeight?: number;
}

export default function FeedbackButton({ tabBarHeight = 80 }: FeedbackButtonProps) {
  const { colors, mode } = useTheme();
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);

  // Animación sutil de escala al presionar
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.88,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 200,
      friction: 8,
    }).start();
  };

  const bottomOffset = tabBarHeight + insets.bottom + 12;

  return (
    <>
      <Animated.View
        style={[
          styles.container,
          {
            bottom: bottomOffset,
            transform: [{ scale: scaleAnim }],
          },
        ]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={[
            styles.button,
            {
              backgroundColor: mode === 'dark'
                ? 'rgba(30,30,30,0.82)'
                : 'rgba(255,255,255,0.82)',
              borderColor: mode === 'dark'
                ? 'rgba(255,255,255,0.08)'
                : 'rgba(0,0,0,0.08)',
              shadowColor: mode === 'dark' ? '#000' : '#666',
            },
          ]}
          onPress={() => setModalVisible(true)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          activeOpacity={1}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityLabel="Reportar problema o sugerencia"
          accessibilityRole="button"
        >
          <Animated.Text style={styles.icon}>🐞</Animated.Text>
        </TouchableOpacity>
      </Animated.View>

      <FeedbackModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    zIndex: 999,
  },
  button: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.65,
    // Sombra sutil
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
    // Backdropfilter solo iOS — fallback via opacity
    ...(Platform.OS === 'ios' ? {} : {}),
  },
  icon: {
    fontSize: 17,
  },
});
