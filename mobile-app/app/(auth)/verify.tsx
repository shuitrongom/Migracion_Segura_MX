import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

export default function VerifyScreen() {
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async () => {
    setIsLoading(true);
    // TODO: Verificar código con API
    setIsLoading(false);
    router.replace('/(tabs)/dashboard');
  };

  const handleResend = async () => {
    // TODO: Reenviar código
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Verificación</Text>
        <Text style={styles.subtitle}>
          Ingresa el código de 6 dígitos que enviamos a tu correo o teléfono
        </Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.codeInput}
          value={code}
          onChangeText={setCode}
          placeholder="000000"
          keyboardType="number-pad"
          maxLength={6}
          textAlign="center"
          accessibilityLabel="Código de verificación"
        />

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleVerify}
          disabled={isLoading || code.length !== 6}
          accessibilityRole="button"
        >
          <Text style={styles.buttonText}>
            {isLoading ? 'Verificando...' : 'Verificar'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={handleResend}
          accessibilityRole="button"
        >
          <Text style={styles.linkText}>Reenviar código</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  codeInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#2563eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 18,
    fontSize: 32,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 12,
  },
  button: {
    backgroundColor: '#2563eb',
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  linkText: {
    color: '#2563eb',
    fontSize: 14,
    fontWeight: '500',
  },
});
