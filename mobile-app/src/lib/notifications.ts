import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { apiFetch } from './api';
import { storage } from './storage';

// Configurar cómo se muestran las notificaciones cuando la app está en primer plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

/**
 * Registrar el dispositivo para push notifications y enviar el token al backend
 */
export async function registerForPushNotifications(): Promise<string | null> {
  if (!Device.isDevice) {
    console.log('Push notifications solo funcionan en dispositivos físicos');
    return null;
  }

  // Verificar/solicitar permisos
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Permiso de notificaciones denegado');
    return null;
  }

  // Configurar canal de Android
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Migración Segura MX',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#f59e0b',
    });
  }

  // Obtener el token de Expo Push
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: '429519f6-9f00-4a9a-84b3-67a1d30dbbe8',
    });
    const pushToken = tokenData.data;

    // Guardar localmente
    await storage.setItem('push_token', pushToken);

    // Enviar al backend
    await sendTokenToBackend(pushToken);

    return pushToken;
  } catch (error) {
    console.error('Error obteniendo push token:', error);
    return null;
  }
}

/**
 * Enviar el push token al backend para asociarlo al usuario
 */
async function sendTokenToBackend(token: string): Promise<void> {
  try {
    await apiFetch('/notificaciones/register-device', {
      method: 'POST',
      body: JSON.stringify({ pushToken: token, platform: Platform.OS }),
    });
  } catch (error) {
    console.error('Error registrando push token en backend:', error);
  }
}

/**
 * Listener para cuando se recibe una notificación (app en primer plano)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Listener para cuando el usuario toca una notificación
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
