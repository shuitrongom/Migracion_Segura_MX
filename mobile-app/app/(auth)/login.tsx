import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import PasswordInput from '@/components/PasswordInput';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Ingresa correo y contraseña');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        'https://backend-production-79ed.up.railway.app/api/v1/auth/login',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim(), password }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.message || 'Credenciales inválidas');
        return;
      }

      await storage.setItem('access_token', data.accessToken);
      await storage.setItem('user_data', JSON.stringify(data.user));

      if (data.user.role === 'administrador' || data.user.role === 'asesor') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(cliente)/mis-tramites');
      }
    } catch {
      Alert.alert('Error', 'No se pudo conectar al servidor');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}>🇲🇽</Text>
          <Text style={styles.title}>Migración Segura MX</Text>
          <Text style={styles.subtitle}>Gestión migratoria inteligente</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="tu@email.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña</Text>
            <PasswordInput value={password} onChangeText={setPassword} placeholder="••••••••" />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>{isLoading ? 'Iniciando...' : 'Iniciar sesión'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>¿No tienes cuenta? Regístrate</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 40 },
  header: { alignItems: 'center', marginBottom: 36 },
  logo: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 24, fontWeight: '700', color: '#2C1810' },
  subtitle: { fontSize: 14, color: '#6B5B4F', marginTop: 4 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#2C1810' },
  input: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DFD3',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#2C1810',
  },
  button: { backgroundColor: '#3D2B1F', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#C4A265', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 16 },
});
