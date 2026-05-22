import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, AppState, AppStateStatus, Platform } from 'react-native';

interface BiometricLockProps {
  children: React.ReactNode;
}

export default function BiometricLock({ children }: BiometricLockProps) {
  // Biometric lock disabled for now until stable in production builds
  // Will be re-enabled after testing
  return <>{children}</>;
}
