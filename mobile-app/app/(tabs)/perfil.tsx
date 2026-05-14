import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PerfilScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Mi Perfil</Text>

        {/* Avatar placeholder */}
        <View style={styles.avatarContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>C</Text>
          </View>
          <Text style={styles.name}>Cliente</Text>
          <Text style={styles.email}>cliente@ejemplo.com</Text>
        </View>

        {/* Opciones */}
        <View style={styles.options}>
          <TouchableOpacity style={styles.option} accessibilityRole="button">
            <Text style={styles.optionText}>Editar perfil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} accessibilityRole="button">
            <Text style={styles.optionText}>Preferencias de notificación</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.option} accessibilityRole="button">
            <Text style={styles.optionText}>Soporte</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.option, styles.logoutOption]} accessibilityRole="button">
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 20 },
  title: { fontSize: 24, fontWeight: '700', color: '#111827', marginBottom: 24 },
  avatarContainer: { alignItems: 'center', marginBottom: 32 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#2563eb' },
  name: { fontSize: 18, fontWeight: '600', color: '#111827' },
  email: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  options: { gap: 2 },
  option: {
    backgroundColor: '#ffffff',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  optionText: { fontSize: 15, color: '#374151' },
  logoutOption: { marginTop: 20, borderRadius: 10, borderBottomWidth: 0 },
  logoutText: { fontSize: 15, color: '#ef4444', fontWeight: '500' },
});
