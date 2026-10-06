import { Stack } from 'expo-router';
import { AuthProvider } from '../context/AuthContext';

// =============================================================================
// ROOT LAYOUT — Expo Router entry point
// Envuelve toda la app con el AuthProvider
// =============================================================================

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  );
}
