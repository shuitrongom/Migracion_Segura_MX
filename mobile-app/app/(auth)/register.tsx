import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre completo');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Error', 'Ingresa un correo electrónico válido');
      return;
    }
    if (!phone.trim() || phone.replace(/\s/g, '').replace('+', '').length < 10) {
      Alert.alert('Error', 'Ingresa un número de WhatsApp válido con código de país (ej: +5215512345678)');
      return;
    }
    if (password.length < 8) {
      Alert.alert('Error', 'La contraseña debe tener al menos 8 caracteres, una mayúscula, una minúscula y un número');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(
        'https://backend-production-79ed.up.railway.app/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            phone: phone.trim().startsWith('+') ? phone.trim() : '+' + phone.trim().replace(/\s/g, ''),
            password,
          }),
        },
      );
      const data = await response.json();
      setIsLoading(false);

      if (!response.ok) {
        const msg = Array.isArray(data.message) ? data.message.join('\n') : (data.message || 'Error al registrarse');
        Alert.alert('Error', msg);
        return;
      }

      // Si el backend devuelve el código (modo dev), mostrarlo
      const codeMsg = data.verificationCode
        ? `\n\nTu código es: ${data.verificationCode}`
        : '\n\nRevisa tu correo.';

      Alert.alert(
        'Registro exitoso',
        'Cuenta creada.' + codeMsg + '\n\nInicia sesión después de verificar.',
        [{ text: 'OK', onPress: () => router.replace('/(auth)/login') }],
        { cancelable: false },
      );
    } catch (err: any) {
      setIsLoading(false);
      Alert.alert('Error de conexión', 'No se pudo conectar al servidor. Verifica tu internet.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>
            Registro para extranjeros{'\n'}Gestiona tus trámites migratorios
          </Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo *</Text>
            <TextInput
              style={styles.input}
              value={fullName}
              onChangeText={setFullName}
              placeholder="Ej: Juan Pérez García"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico *</Text>
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
            <Text style={styles.label}>WhatsApp (con código de país) *</Text>
            <TextInput
              style={styles.input}
              value={phone}
              onChangeText={setPhone}
              placeholder="+52 55 1234 5678"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
            />
            <Text style={styles.hint}>
              Te contactaremos por WhatsApp para actualizaciones
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña *</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Mínimo 8 caracteres"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña *</Text>
            <TextInput
              style={styles.input}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repite tu contraseña"
              placeholderTextColor="#9CA3AF"
              secureTextEntry
            />
          </View>

          <TouchableOpacity
            style={[styles.button, isLoading && { opacity: 0.6 }]}
            onPress={handleRegister}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F0E8' },
  content: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 50 },
  header: { alignItems: 'center', marginBottom: 28 },
  title: { fontSize: 26, fontWeight: '700', color: '#2C1810' },
  subtitle: { fontSize: 15, color: '#6B5B4F', marginTop: 8, textAlign: 'center', lineHeight: 22 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 14, fontWeight: '600', color: '#2C1810' },
  hint: { fontSize: 12, color: '#8B7B6F', marginTop: 2 },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DFD3',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C1810',
  },
  button: {
    backgroundColor: '#3D2B1F',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#C4A265', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 16 },
});
