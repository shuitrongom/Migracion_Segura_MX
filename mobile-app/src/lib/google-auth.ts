import { Alert } from 'react-native';
import { router } from 'expo-router';
import { storage } from './storage';
import { BASE_URL } from './api';

let GoogleSignin: any = null;
let statusCodes: any = null;
let configured = false;

function ensureConfigured() {
  if (configured) return;
  try {
    const module = require('@react-native-google-signin/google-signin');
    GoogleSignin = module.GoogleSignin;
    statusCodes = module.statusCodes;
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '727892370313-hv7u63nnnir1pqa7qpbatdn1vc1pc1ll.apps.googleusercontent.com',
      offlineAccess: true,
    });
    configured = true;
  } catch (e: any) {
    console.warn('Google Sign-In not available:', e);
  }
}

/**
 * Iniciar sesión con Google
 */
export async function signInWithGoogle(): Promise<boolean> {
  try {
    ensureConfigured();
    if (!GoogleSignin) {
      Alert.alert('No disponible', 'Google Sign-In no está disponible en este dispositivo');
      return false;
    }

    await GoogleSignin.hasPlayServices();
    // Siempre cerrar sesión previa para mostrar selector de cuentas
    try { await GoogleSignin.signOut(); } catch {}
    const userInfo = await GoogleSignin.signIn();

    if (!userInfo?.data?.user) {
      Alert.alert('Error', 'No se pudo obtener la información de Google');
      return false;
    }

    const { id: googleId, email, name: fullName, photo: profilePhotoUrl } = userInfo.data.user;

    const res = await fetch(
      `${BASE_URL}/auth/google`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          googleId,
          email,
          fullName: fullName || email.split('@')[0],
          profilePhotoUrl,
        }),
      },
    );

    const data = await res.json();

    if (!res.ok) {
      Alert.alert('Error', data.message || 'No se pudo iniciar sesión con Google');
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
    if (statusCodes && error.code === statusCodes.SIGN_IN_CANCELLED) {
      return false;
    }
    if (statusCodes && error.code === statusCodes.IN_PROGRESS) {
      return false;
    }
    if (statusCodes && error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('Error', 'Google Play Services no disponible');
      return false;
    }
    console.warn('Google Sign-In error:', error);
    Alert.alert('Error', 'No se pudo conectar con Google. Intenta de nuevo.');
    return false;
  }
}

export async function signOutGoogle(): Promise<void> {
  try {
    ensureConfigured();
    if (GoogleSignin) await GoogleSignin.signOut();
  } catch {}
}
