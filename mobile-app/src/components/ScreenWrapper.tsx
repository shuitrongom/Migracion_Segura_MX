import { View, StyleSheet, StatusBar } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/lib/theme';

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: any;
}

/**
 * Wrapper que aplica el fondo con gradiente del tema actual (dark/light)
 * Usar en vez de <LinearGradient colors={['#0a0a0a', ...]}> en cada pantalla
 */
export default function ScreenWrapper({ children, style }: ScreenWrapperProps) {
  const { colors, mode } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <LinearGradient
        colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
});
