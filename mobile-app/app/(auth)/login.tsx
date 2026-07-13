import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
  KeyboardAvoidingView, Platform, ScrollView, TouchableWithoutFeedback,
  Keyboard, Image, Animated, Dimensions, ActivityIndicator,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router } from 'expo-router';
import { storage } from '@/lib/storage';
import { BASE_URL } from '@/lib/api';
import { signInWithGoogle } from '@/lib/google-auth';
import { signInWithApple } from '@/lib/apple-auth';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path, Circle } from 'react-native-svg';
import { useTheme } from '@/lib/theme';

const { width, height } = Dimensions.get('window');

export default function LoginScreen() {
  const { colors, mode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Ingresa correo y contraseña');
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch(
        `${BASE_URL}/auth/login`,
        { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: email.trim(), password }) },
      );
      const data = await response.json();
      if (!response.ok) { Alert.alert('Error', data.message || 'Credenciales inválidas'); return; }

      await storage.setItem('access_token', data.accessToken);
      await storage.setItem('refresh_token', data.refreshToken);
      await storage.setItem('user_data', JSON.stringify(data.user));

      if (data.user.role === 'administrador' || data.user.role === 'asesor') {
        router.replace('/(admin)/dashboard');
      } else {
        router.replace('/(cliente)/mis-tramites');
      }
    } catch { Alert.alert('Error', 'No se pudo conectar al servidor'); }
    finally { setIsLoading(false); }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    await signInWithGoogle();
    setIsGoogleLoading(false);
  };

  const handleAppleSignIn = async () => {
    setIsAppleLoading(true);
    await signInWithApple();
    setIsAppleLoading(false);
  };

  // Colores dinámicos según tema
  const isDark = mode === 'dark';
  const inputBg = isDark ? 'rgba(255,255,255,0.04)' : colors.bgInput;
  const inputBorder = isDark ? 'rgba(255,255,255,0.08)' : colors.border;
  const inputBgFocused = isDark ? 'rgba(255,255,255,0.06)' : colors.bgInput;
  const placeholderColor = colors.textMuted;
  const labelColor = colors.textMuted;
  const orbColor1 = isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.06)';
  const orbColor2 = isDark ? 'rgba(217,119,6,0.06)' : 'rgba(217,119,6,0.04)';
  const orbColor3 = isDark ? 'rgba(245,158,11,0.03)' : 'rgba(245,158,11,0.02)';
  const formCardBg = isDark ? 'rgba(23,23,23,0.9)' : colors.bgCard;
  const googleBtnBg = isDark ? 'rgba(255,255,255,0.05)' : colors.bgInput;
  const googleBtnBorder = isDark ? 'rgba(255,255,255,0.1)' : colors.border;
  const dividerColor = isDark ? 'rgba(255,255,255,0.06)' : colors.borderLight;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <LinearGradient colors={[colors.gradientStart, colors.gradientMid, colors.gradientEnd]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {/* Orbes de fondo animados */}
      <Animated.View style={[styles.orb1, { opacity: glowAnim, backgroundColor: orbColor1 }]} />
      <Animated.View style={[styles.orb2, { opacity: glowAnim, backgroundColor: orbColor2 }]} />
      <Animated.View style={[styles.orb3, { backgroundColor: orbColor3 }]} />

      {/* Grid sutil */}
      <View style={[styles.gridOverlay, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.03)' }]} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* Logo y branding */}
            <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }, { scale: logoScale }] }]}>
              <View style={styles.logoContainer}>
                <View style={styles.logoGlow} />
                <Image source={require('../../assets/logo_splash_1024.png')} style={styles.logoImage} resizeMode="contain" />
              </View>
              <Text style={[styles.title, { color: colors.text }]}>MIGRACIÓN <Text style={styles.titleAccent}>SEGURA</Text> MX</Text>
              <Text style={[styles.subtitle, { color: colors.textMuted }]}>Gestión migratoria inteligente</Text>
            </Animated.View>

            {/* Card del formulario */}
            <Animated.View style={[styles.formCard, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
              {/* Borde glow */}
              <LinearGradient colors={['rgba(245,158,11,0.15)', 'rgba(245,158,11,0.05)', 'rgba(245,158,11,0.15)']} style={styles.formCardBorder} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

              <View style={[styles.formInner, { backgroundColor: formCardBg }]}>
                {/* Google button */}
                <TouchableOpacity
                  style={[styles.googleButton, { backgroundColor: googleBtnBg, borderColor: googleBtnBorder }, isGoogleLoading && { opacity: 0.6 }]}
                  onPress={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                  activeOpacity={0.8}
                >
                  <Text style={styles.googleIcon}>G</Text>
                  <Text style={[styles.googleText, { color: colors.textSecondary }]}>{isGoogleLoading ? 'Conectando...' : 'Continuar con Google'}</Text>
                </TouchableOpacity>

                {/* Apple Sign-In button - solo iOS */}
                {Platform.OS === 'ios' && (
                  <TouchableOpacity
                    style={[styles.appleButton, isAppleLoading && { opacity: 0.6 }]}
                    onPress={handleAppleSignIn}
                    disabled={isAppleLoading}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.appleIcon}></Text>
                    <Text style={styles.appleText}>{isAppleLoading ? 'Conectando...' : 'Continuar con Apple'}</Text>
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View style={styles.divider}>
                  <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
                  <Text style={[styles.dividerText, { color: colors.textMuted }]}>o con tu correo</Text>
                  <View style={[styles.dividerLine, { backgroundColor: dividerColor }]} />
                </View>

                {/* Email input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: labelColor }]}>CORREO ELECTRÓNICO</Text>
                  <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor: inputBorder }, emailFocused && { borderColor: 'rgba(245,158,11,0.4)', backgroundColor: inputBgFocused }]}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={emailFocused ? '#f59e0b' : colors.textMuted} strokeWidth={1.8}>
                      <Path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <Path d="M22 6l-10 7L2 6" />
                    </Svg>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={email}
                      onChangeText={setEmail}
                      placeholder="tu@email.com"
                      placeholderTextColor={placeholderColor}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      onFocus={() => setEmailFocused(true)}
                      onBlur={() => setEmailFocused(false)}
                    />
                  </View>
                </View>

                {/* Password input */}
                <View style={styles.inputGroup}>
                  <Text style={[styles.label, { color: labelColor }]}>CONTRASEÑA</Text>
                  <View style={[styles.inputContainer, { backgroundColor: inputBg, borderColor: inputBorder }, passwordFocused && { borderColor: 'rgba(245,158,11,0.4)', backgroundColor: inputBgFocused }]}>
                    <Svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke={passwordFocused ? '#f59e0b' : colors.textMuted} strokeWidth={1.8}>
                      <Path d="M19 11H5a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2z" />
                      <Path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </Svg>
                    <TextInput
                      style={[styles.input, { color: colors.text }]}
                      value={password}
                      onChangeText={setPassword}
                      placeholder="••••••••"
                      placeholderTextColor={placeholderColor}
                      secureTextEntry={!showPassword}
                      autoCapitalize="none"
                      onFocus={() => setPasswordFocused(true)}
                      onBlur={() => setPasswordFocused(false)}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={showPassword ? '#f59e0b' : colors.textMuted} strokeWidth={1.8}>
                        {showPassword ? (
                          <>
                            <Path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                            <Circle cx="12" cy="12" r="3" />
                          </>
                        ) : (
                          <>
                            <Path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
                            <Path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
                            <Path d="M1 1l22 22" />
                          </>
                        )}
                      </Svg>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Submit button */}
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && { opacity: 0.7 }]}
                  onPress={handleLogin}
                  disabled={isLoading}
                  activeOpacity={0.85}
                >
                  <LinearGradient colors={['#f59e0b', '#d97706']} style={styles.submitGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    {isLoading ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Text style={styles.submitText}>Acceder</Text>
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
                  <Text style={[styles.securityText, { color: colors.textMuted }]}>Conexión cifrada de extremo a extremo</Text>
                </View>
              </View>
            </Animated.View>

            {/* Register link */}
            <Animated.View style={{ opacity: fadeAnim }}>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.registerLink}>
                <Text style={[styles.registerText, { color: colors.textMuted }]}>¿No tienes cuenta? <Text style={styles.registerAccent}>Regístrate</Text></Text>
              </TouchableOpacity>
            </Animated.View>

          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 24, paddingVertical: 50 },

  // Orbes de fondo
  orb1: { position: 'absolute', top: height * 0.15, left: -50, width: 250, height: 250, borderRadius: 125 },
  orb2: { position: 'absolute', bottom: height * 0.1, right: -80, width: 300, height: 300, borderRadius: 150 },
  orb3: { position: 'absolute', top: height * 0.4, left: width * 0.3, width: 200, height: 200, borderRadius: 100 },
  gridOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0.02, borderWidth: 1 },

  // Header / Logo
  header: { alignItems: 'center', marginBottom: 32 },
  logoContainer: { position: 'relative', marginBottom: 16 },
  logoGlow: { position: 'absolute', top: -10, left: -10, right: -10, bottom: -10, borderRadius: 50, backgroundColor: 'rgba(245,158,11,0.15)' },
  logoImage: { width: 80, height: 80, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(245,158,11,0.3)' },
  title: { fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  titleAccent: { color: '#f59e0b' },
  subtitle: { fontSize: 14, marginTop: 4, fontWeight: '300' },

  // Form card
  formCard: { position: 'relative', borderRadius: 24, overflow: 'hidden' },
  formCardBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 24 },
  formInner: { margin: 1, borderRadius: 23, paddingHorizontal: 24, paddingVertical: 28 },

  // Google button
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 14, paddingVertical: 14, gap: 10,
  },
  googleIcon: { fontSize: 18, fontWeight: '700', color: '#4285F4' },
  googleText: { fontSize: 15, fontWeight: '500' },

  // Apple button
  appleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#000000',
    borderRadius: 14, paddingVertical: 14, gap: 8, marginTop: 10,
  },
  appleIcon: { fontSize: 18, color: '#ffffff' },
  appleText: { fontSize: 15, fontWeight: '500', color: '#ffffff' },

  // Divider
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 12, fontWeight: '500' },

  // Inputs
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 10, fontWeight: '600', letterSpacing: 1.5, marginBottom: 8 },
  inputContainer: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14, paddingHorizontal: 16, gap: 12,
  },
  input: { flex: 1, paddingVertical: 16, fontSize: 15 },
  eyeButton: { padding: 4 },

  // Submit
  submitButton: { marginTop: 8, borderRadius: 14, overflow: 'hidden', shadowColor: '#f59e0b', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 8 },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8 },
  submitText: { color: '#ffffff', fontSize: 16, fontWeight: '700' },

  // Security
  securityBadge: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 20, gap: 6 },
  securityDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#22c55e' },
  securityText: { fontSize: 11, fontWeight: '500' },

  // Register
  registerLink: { marginTop: 24, alignItems: 'center' },
  registerText: { fontSize: 14 },
  registerAccent: { color: '#f59e0b', fontWeight: '600' },
});
