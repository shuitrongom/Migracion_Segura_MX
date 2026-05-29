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
  Image,
  Animated,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import PasswordInput from '@/components/PasswordInput';
import PhoneInput from '@/components/PhoneInput';

const { width, height } = Dimensions.get('window');

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

  // Focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [verifyFocused, setVerifyFocused] = useState(false);

  // Animaciones
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const glowAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.spring(logoScale, { toValue: 1, friction: 8, tension: 40, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

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
        'https://api.migracionseguramx.com/api/v1/auth/register',
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
        'https://api.migracionseguramx.com/api/v1/auth/verify',
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

  // Pantalla de verificación - Dark themed
  if (showVerify) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={['#0a0a0a', '#1c1917', '#0a0a0a']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <Animated.View style={[styles.orb1, { opacity: glowAnim }]} />
        <Animated.View style={[styles.orb2, { opacity: glowAnim }]} />
        <Animated.View style={styles.orb3} />

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={[styles.content, { justifyContent: 'center' }]}>
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: logoScale }] }]}>
              <View style={styles.verifyIconContainer}>
                <Svg width={48} height={48} viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth={1.5}>
                  <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <Path d="M22 6l-10 7L2 6" />
                </Svg>
              </View>
              <Text style={styles.title}>VERIFICAR <Text style={styles.titleAccent}>CUENTA</Text></Text>
              <Text style={styles.subtitle}>Ingresa el código de 6 dígitos{'\n'}(usa 000000 para pruebas)</Text>
            </Animated.View>

            <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)', 'rgba(245,158,11,0.15)']} style={styles.formCardBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
              <View style={styles.formInner}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CÓDIGO DE VERIFICACIÓN</Text>
                  <View style={[styles.inputContainer, verifyFocused && styles.inputFocused]}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={verifyFocused ? '#f59e0b' : '#6b7280'} strokeWidth={1.8}>
                      <Path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" />
                    </Svg>
                    <TextInput
                      style={[styles.input, { textAlign: 'center', fontSize: 24, letterSpacing: 6, fontWeight: '700' }]}
                      value={verifyCode}
                      onChangeText={(t) => setVerifyCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                      placeholder="000000"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="number-pad"
                      maxLength={6}
                      onFocus={() => setVerifyFocused(true)}
                      onBlur={() => setVerifyFocused(false)}
                    />
                  </View>
                </View>

                <TouchableOpacity
                  style={[styles.submitButton, isVerifying && { opacity: 0.7 }]}
                  onPress={() => handleVerify()}
                  disabled={isVerifying}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {isVerifying ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>Verificar</Text>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                          <Path d="M5 12h14M12 5l7 7-7 7" />
                        </Svg>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => { setShowVerify(false); router.replace('/(auth)/login'); }} style={styles.loginLink}>
                  <Text style={styles.loginText}>Ir al <Text style={styles.loginAccent}>login</Text></Text>
                </TouchableOpacity>

                <View style={styles.securityBadge}>
                  <View style={styles.securityDot} />
                  <Text style={styles.securityText}>Verificación segura de identidad</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0a0a0a', '#1c1917', '#0a0a0a']} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {/* Orbes de fondo animados */}
      <Animated.View style={[styles.orb1, { opacity: glowAnim }]} />
      <Animated.View style={[styles.orb2, { opacity: glowAnim }]} />
      <Animated.View style={styles.orb3} />

      {/* Grid sutil */}
      <View style={styles.gridOverlay} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Logo y branding */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: logoScale }] }]}>
              <View style={styles.logoContainer}>
                <View style={styles.logoGlow} />
                <Image source={require('../../assets/logo_splash_1024.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={styles.title}>CREAR <Text style={styles.titleAccent}>CUENTA</Text></Text>
              <Text style={styles.subtitle}>Registro para extranjeros{'\n'}Gestiona tus trámites migratorios</Text>
            </Animated.View>

            {/* Card del formulario */}
            <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              {/* Borde glow */}
              <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)', 'rgba(245,158,11,0.15)']} style={styles.formCardBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

              <View style={styles.formInner}>
                {/* Nombre completo */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>NOMBRE COMPLETO</Text>
                  <View style={[styles.inputContainer, nameFocused && styles.inputFocused]}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={nameFocused ? '#f59e0b' : '#6b7280'} strokeWidth={1.8}>
                      <Path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <Circle cx="12" cy="7" r="4" />
                    </Svg>
                    <TextInput
                      style={styles.input}
                      value={fullName}
                      onChangeText={setFullName}
                      placeholder="Ej: Juan Pérez García"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      autoCapitalize="words"
                      onFocus={() => setNameFocused(true)}
                      onBlur={() => setNameFocused(false)}
                    />
                  </View>
                </View>

                {/* Correo electrónico */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CORREO ELECTRÓNICO</Text>
                  <View style={[styles.inputContainer, emailFocused && styles.inputFocused]}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={emailFocused ? '#f59e0b' : '#6b7280'} strokeWidth={1.8}>
                      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <Path d="M22 6l-10 7L2 6" />
                    </Svg>
                    <TextInput
                      style={styles.input}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="tu@email.com"
                      placeholderTextColor="rgba(255,255,255,0.2)"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>

                {/* WhatsApp */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>WHATSAPP</Text>
                  <PhoneInput value={phone} onChangeText={setPhone} />
                </View>

                {/* Contraseña */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONTRASEÑA</Text>
                  <PasswordInput value={password} onChangeText={setPassword} placeholder="Mayúscula, minúscula y número" />
                </View>

                {/* Confirmar contraseña */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONFIRMAR CONTRASEÑA</Text>
                  <PasswordInput value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repite tu contraseña" />
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
                  onPress={handleRegister}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>Crear cuenta</Text>
                        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.5}>
                          <Path d="M5 12h14M12 5l7 7-7 7" />
                        </Svg>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>

                {/* Security badge */}
                <View style={styles.securityBadge}>
                  <View style={styles.securityDot} />
                  <Text style={styles.securityText}>Conexión cifrada de extremo a extremo</Text>
                </View>
              </View>
            </Animated.View>

            {/* Login link */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity onPress={() => router.back()} style={styles.loginLink}>
                <Text style={styles.loginText}>¿Ya tienes cuenta? <Text style={styles.loginAccent}>Inicia sesión</Text></Text>
              </TouchableOpacity>
            </Animated.View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0a0a0a' },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 50 },

  // Orbes de fondo
  orb1: { position: 'absolute', top: height * 0.08, left: -50, width: 250, height: 250, borderRadius: 125, backgroundColor: 'rgba(245,158,11,0.08)' },
  orb2: { position: 'absolute', bottom: height * 0.05, right: -80, width: 300, height: 300, borderRadius: 150, backgroundColor: 'rgba(217,119,6,0.06)' },
  orb3: { position: 'absolute', top: height * 0.5, left: width * 0.3, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(245,158,11,0.03)' },
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },

  // Header / Logo
  header: { alignItems: 'center', marginBottom: 24 },
  logoContainer: { position: 'relative', marginBottom: 16 },
  logoGlow: { position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, borderRadius: 50, backgroundColor: 'rgba(245,158,11,0.15)' },
  logoImage: { width: 70, height: 70, borderRadius: 18, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  title: { fontSize: 26, fontWeight: '800', color: '#ffffff', letterSpacing: 1 },
  titleAccent: { color: '#f59e0b' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: '300', textAlign: 'center', lineHeight: 20 },

  // Verify icon
  verifyIconContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(245,158,11,0.1)', borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },

  // Form card
  formCard: { position: 'relative', borderRadius: 24, overflow: 'hidden' },
  formCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  formInner: { margin: 1, borderRadius: 23, backgroundColor: 'rgba(23,23,23,0.9)', paddingHorizontal: 24, paddingVertical: 24 },

  // Inputs
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 10, fontWeight: '600', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 8, textTransform: 'uppercase' },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 14, paddingHorizontal: 16, gap: 12,
  },
  inputFocused: { borderColor: 'rgba(245,158,11,0.4)', backgroundColor: 'rgba(255,255,255,0.06)' },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#ffffff' },

  // Submit
  submitButton: { marginTop: 8, borderRadius: 14, overflow: 'hidden', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  // Security
  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18, gap: 6 },
  securityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  securityText: { fontSize: 11, color: 'rgba(255,255,255,0.2)', fontWeight: '500' },

  // Login link
  loginLink: { marginTop: 24, alignItems: 'center' },
  loginText: { fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  loginAccent: { color: '#f59e0b', fontWeight: '600' },
});
