import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';

export default function IndexScreen() {
  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const token = await storage.getItem('access_token');
      const userData = await storage.getItem('user_data');

      if (token && userData) {
        const user = JSON.parse(userData);
        if (user.role === 'administrador' || user.role === 'asesor') {
          router.replace('/(admin)/dashboard');
        } else {
          router.replace('/(cliente)/mis-tramites');
        }
      } else {
        router.replace('/(auth)/login');
      }
    } catch {
      router.replace('/(auth)/login');
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🇲🇽</Text>
      <Text style={styles.title}>Migración Segura MX</Text>
      <ActivityIndicator size="large" color="#C4A265" style={{ marginTop: 20 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F0E8' },
  logo: { fontSize: 64, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: '700', color: '#2C1810' },
});
