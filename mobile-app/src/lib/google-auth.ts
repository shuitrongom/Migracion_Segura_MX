import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { storage } from './storage';

// Configurar Google Sign-In
GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  offlineAccess: true,
});

/**
 * Iniciar sesión con Google - un solo toque
 */
export async function signInWithGoogle(): Promise<boolean> {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();

    if (!userInfo?.data?.user) {
      Alert.alert('Error', 'No se pudo obtener la información de Google');
      return false;
    }

    const { id: googleId, email, name: fullName, photo: profilePhotoUrl } = userInfo.data.user;

    // Enviar al backend para login/registro automático
    const res = await fetch(
      'https://backend-production-79ed.up.railway.app/api/v1/auth/google',
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

    // Guardar tokens y datos
    await storage.setItem('access_token', data.accessToken);
    await storage.setItem('refresh_token', data.refreshToken);
    await storage.setItem('user_data', JSON.stringify(data.user));

    // Navegar según rol
    if (data.user.role === 'administrador' || data.user.role === 'asesor') {
      router.replace('/(admin)/dashboard');
    } else {
      router.replace('/(cliente)/mis-tramites');
    }

    return true;
  } catch (error: any) {
    if (error.code === statusCodes.SIGN_IN_CANCELLED) {
      // Usuario canceló — no mostrar error
      return false;
    }
    if (error.code === statusCodes.IN_PROGRESS) {
      return false;
    }
    if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
      Alert.alert('Error', 'Google Play Services no está disponible en este dispositivo');
      return false;
    }
    Alert.alert('Error', 'No se pudo conectar con Google. Intenta de nuevo.');
    return false;
  }
}

/**
 * Cerrar sesión de Google
 */
export async function signOutGoogle(): Promise<void> {
  try {
    await GoogleSignin.signOut();
  } catch {
    // Silently fail
  }
}
