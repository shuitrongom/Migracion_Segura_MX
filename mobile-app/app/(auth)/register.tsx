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
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import PasswordInput from '@/components/PasswordInput';
import PhoneInput from '@/components/PhoneInput';

export default function RegisterScreen() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Estado para verificación
  const [showVerify, setShowVerify] = useState(false);
  const [userId, setUserId] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const handleRegister = async () => {
    if (!fullName.trim()) { Alert.alert('Error', 'Ingresa tu nombre completo'); return; }
    if (!email.trim() || !email.includes('@')) { Alert.alert('Error', 'Ingresa un correo válido'); return; }
    if (!phone || phone.replace(/\D/g, '').length < 12) {
      Alert.alert('Error', 'Ingresa un número de WhatsApp válido');
      return;
    }
    if (password.length < 8 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      Alert.alert('Error', 'La contraseña necesita mínimo 8 caracteres, una mayúscula, una minúscula y un número');
      return;
    }
    if (password !== confirmPassword) { Alert.alert('Error', 'Las contraseñas no coinciden'); return; }

    setIsLoading(true);
    try {
      const response = await fetch(
        'https://backend-production-79ed.up.railway.app/api/v1/auth/register',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email.trim(),
            phone: phone,
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

      // Si el backend devuelve el código (modo dev), auto-verificar
      if (data.verificationCode) {
        setUserId(data.userId);
        setVerifyCode(data.verificationCode);
        handleVerify(data.userId, data.verificationCode);
        return;
      }

      // Si no, mostrar pantalla de verificación manual
      setUserId(data.userId);
      setShowVerify(true);
    } catch {
      setIsLoading(false);
      Alert.alert('Error', 'No se pudo conectar al servidor');
    }
  };

  const handleVerify = async (uid?: string, code?: string) => {
    const finalUserId = uid || userId;
    const finalCode = code || verifyCode;
    if (!finalCode || finalCode.length !== 6) {
      Alert.alert('Error', 'Ingresa el código de 6 dígitos');
      return;
    }
    setIsVerifying(true);
    try {
      const res = await fetch(
        'https://backend-production-79ed.up.railway.app/api/v1/auth/verify',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: finalUserId, code: finalCode }),
        },
      );
      const result = await res.json();
      setIsVerifying(false);
      if (res.ok) {
        Alert.alert('¡Cuenta verificada!', 'Ya puedes iniciar sesión.', [
          { text: 'Ir a Login', onPress: () => router.replace('/(auth)/login') },
        ]);
      } else {
        Alert.alert('Error', result.message || 'Código inválido');
      }
    } catch {
      setIsVerifying(false);
      Alert.alert('Error', 'No se pudo verificar');
    }
  };

  // Pantalla de verificación
  if (showVerify) {
    return (
      <View style={styles.container}>
        <View style={[styles.content, { justifyContent: 'center' }]}>
          <View style={styles.header}>
            <Text style={{ fontSize: 48 }}>📧</Text>
            <Text style={styles.title}>Verificar cuenta</Text>
            <Text style={styles.subtitle}>
              Ingresa el código de 6 dígitos enviado a {email}
            </Text>
          </View>
          <TextInput
            style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 6, fontWeight: '700' }]}
            value={verifyCode}
            onChangeText={(t) => setVerifyCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
            placeholder="000000"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            maxLength={6}
          />
          <TouchableOpacity
            style={[styles.button, isVerifying && { opacity: 0.6 }]}
            onPress={() => handleVerify()}
            disabled={isVerifying}
          >
            <Text style={styles.buttonText}>{isVerifying ? 'Verificando...' : 'Verificar'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setShowVerify(false); router.replace('/(auth)/login'); }}>
            <Text style={styles.linkText}>Ir al login</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Registro para extranjeros{'\n'}Gestiona tus trámites migratorios</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre completo *</Text>
            <TextInput style={styles.input} value={fullName} onChangeText={setFullName}
              placeholder="Ej: Juan Pérez García" placeholderTextColor="#9CA3AF" autoCapitalize="words" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Correo electrónico *</Text>
            <TextInput style={styles.input} value={email} onChangeText={setEmail}
              placeholder="tu@email.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>WhatsApp *</Text>
            <PhoneInput value={phone} onChangeText={setPhone} />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Contraseña *</Text>
            <PasswordInput value={password} onChangeText={setPassword} placeholder="Mayúscula, minúscula y número" />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirmar contraseña *</Text>
            <PasswordInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repite tu contraseña" />
          </View>

          <TouchableOpacity style={[styles.button, isLoading && { opacity: 0.6 }]} onPress={handleRegister} disabled={isLoading}>
            <Text style={styles.buttonText}>{isLoading ? 'Creando cuenta...' : 'Crear cuenta'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.linkText}>¿Ya tienes cuenta? Inicia sesión</Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>
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
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E8DFD3',
    borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, color: '#2C1810',
  },
  button: { backgroundColor: '#3D2B1F', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
  linkText: { color: '#C4A265', fontSize: 14, fontWeight: '600', textAlign: 'center', marginTop: 16 },
});
