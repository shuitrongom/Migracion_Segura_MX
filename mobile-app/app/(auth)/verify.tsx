import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';

export default function VerifyScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    if (code.length !== 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        'https://backend-production-79ed.up.railway.app/api/v1/auth/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, code }),
        },
      );
      const data = await response.json();

      if (!response.ok) {
        Alert.alert('Error', data.message || 'Código inválido');
        return;
      }

      Alert.alert('Cuenta verificada', 'Tu cuenta ha sido activada.', [
        { text: 'Continuar', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch {
      Alert.alert('Error', 'No se pudo verificar. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.emoji}>📧</Text>
        <Text style={styles.title}>Verificar cuenta</Text>
        <Text style={styles.subtitle}>
          Ingresa el código de 6 dígitos que enviamos a tu correo
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={(text) => setCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
          placeholder="000000"
          placeholderTextColor="#9CA3AF"
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Verificando...' : 'Verificar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>← Volver</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E8',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: { alignItems: 'center', marginBottom: 32 },
  emoji: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 24, fontWeight: '700', color: '#2C1810' },
  subtitle: { fontSize: 15, color: '#6B5B4F', marginTop: 8, textAlign: 'center' },
  form: { gap: 20 },
  codeInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#C4A265',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 28,
    fontWeight: '700',
    color: '#2C1810',
    letterSpacing: 8,
  },
  button: {
    backgroundColor: '#3D2B1F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  backButton: { alignItems: 'center', paddingVertical: 8 },
  backText: { color: '#6B5B4F', fontSize: 14 },
});
