import { View, Text, StyleSheet } from 'react-native';
import { useNetwork } from '../hooks/use-network';

export function OfflineBanner() {
  const { isOffline } = useNetwork();

  if (!isOffline) return null;

  return (
    <View style={styles.banner} accessibilityRole="alert">
      <Text style={styles.text}>📡 Sin conexión — Mostrando datos guardados</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#fef3c7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
    color: '#92400e',
  },
});
