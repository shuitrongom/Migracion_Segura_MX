import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth.store';
import { Alert } from 'react-native';
import { router } from 'expo-router';
import { UserRole } from '@/types';

WebBrowser.maybeCompleteAuthSession();

const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || '';

export function useGoogleAuth() {
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: GOOGLE_WEB_CLIENT_ID,
    // androidClientId: 'YOUR_ANDROID_CLIENT_ID', // Agregar para producción
    // iosClientId: 'YOUR_IOS_CLIENT_ID', // Agregar para producción
  });

  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleResponse(response.authentication?.accessToken);
    }
  }, [response]);

  const handleGoogleResponse = async (accessToken: string | undefined) => {
    if (!accessToken) return;

    try {
      // Obtener info del usuario de Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );
      const userInfo = await userInfoResponse.json();

      await loginWithGoogle({
        googleId: userInfo.id,
        email: userInfo.email,
        fullName: userInfo.name,
        profilePhotoUrl: userInfo.picture,
      });

      const user = useAuthStore.getState().user;
      if (user?.role === UserRole.CLIENTE) {
        router.replace('/(cliente)/mis-tramites');
      } else {
        router.replace('/(admin)/dashboard');
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || 'Error al iniciar sesión con Google';
      Alert.alert('Error', message);
    }
  };

  const signInWithGoogle = async () => {
    if (!GOOGLE_WEB_CLIENT_ID) {
      Alert.alert(
        'Configuración requerida',
        'Configura EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID en el archivo .env para habilitar Google Sign-In',
      );
      return;
    }
    await promptAsync();
  };

  return {
    signInWithGoogle,
    isReady: !!request,
  };
}
