import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert } from 'react-native';
import { storage } from './storage';

const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';
const BIOMETRIC_LAST_AUTH_KEY = 'biometric_last_auth';
const LOCK_TIMEOUT_MS = 2 * 60 * 1000; // 2 minutos de inactividad → pedir biometría

/**
 * Verifica si el dispositivo soporta biometría
 */
export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

/**
 * Obtiene el tipo de biometría disponible
 */
export async function getBiometricType(): Promise<string> {
  const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return Platform.OS === 'ios' ? 'Face ID' : 'Reconocimiento facial';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return 'Huella digital';
  }
  return 'Biometría';
}

/**
 * Solicita autenticación biométrica
 */
export async function authenticateWithBiometrics(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Verifica tu identidad',
    cancelLabel: 'Cancelar',
    disableDeviceFallback: false, // Permite PIN como fallback
    fallbackLabel: 'Usar contraseña del dispositivo',
  });

  if (result.success) {
    await storage.setItem(BIOMETRIC_LAST_AUTH_KEY, Date.now().toString());
  }

  return result.success;
}

/**
 * Verifica si la biometría está habilitada por el usuario
 */
export async function isBiometricEnabled(): Promise<boolean> {
  const enabled = await storage.getItem(BIOMETRIC_ENABLED_KEY);
  return enabled === 'true';
}

/**
 * Habilita/deshabilita biometría
 */
export async function setBiometricEnabled(enabled: boolean): Promise<void> {
  await storage.setItem(BIOMETRIC_ENABLED_KEY, enabled ? 'true' : 'false');
}

/**
 * Verifica si necesita re-autenticación (por timeout de inactividad)
 */
export async function needsReauth(): Promise<boolean> {
  const enabled = await isBiometricEnabled();
  if (!enabled) return false;

  const lastAuth = await storage.getItem(BIOMETRIC_LAST_AUTH_KEY);
  if (!lastAuth) return true;

  const elapsed = Date.now() - parseInt(lastAuth, 10);
  return elapsed > LOCK_TIMEOUT_MS;
}

/**
 * Marca la última actividad (para resetear el timeout)
 */
export async function markActivity(): Promise<void> {
  await storage.setItem(BIOMETRIC_LAST_AUTH_KEY, Date.now().toString());
}
