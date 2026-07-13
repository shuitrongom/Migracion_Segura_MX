import { Alert, Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { router } from 'expo-router';
import { storage } from './storage';
import { BASE_URL } from './api';

/**
 * Iniciar sesión con Apple
 */
export async function signInWithApple(): Promise<boolean> {
  if (Platform.OS !== 'ios') {
    Alert.alert('No disponible', 'Sign in with Apple solo está disponible en iOS');
    return false;
  }

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });

    const { user: appleId, email, fullName, identityToken } = credential;

    // Construir nombre completo
    let displayName = '';
    if (fullName?.givenName || fullName?.familyName) {
      displayName = `${fullName.givenName || ''} ${fullName.familyName || ''}`.trim();
    }

    const res = await fetch(`${BASE_URL}/auth/apple`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        appleId,
        email: email || undefined,
        fullName: displayName || undefined,
        identityToken,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      Alert.alert('Error', data.message || 'No se pudo iniciar sesión con Apple');
      return false;
    }

    await storage.setItem('access_token', data.accessToken);
    await storage.setItem('refresh_token', data.refreshToken);
    await storage.setItem('user_data', JSON.stringify(data.user));

    if (data.user.role === 'administrador' || data.user.role === 'asesor') {
      router.replace('/(admin)/dashboard');
    } else {
      router.replace('/(cliente)/mis-tramites');
    }

    return true;
  } catch (error: any) {
    if (error.code === 'ERR_REQUEST_CANCELED') {
      return false;
    }
    console.warn('Apple Sign-In error:', error);
    Alert.alert('Error', 'No se pudo conectar con Apple. Intenta de nuevo.');
    return false;
  }
}
