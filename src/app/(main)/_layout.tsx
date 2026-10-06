import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

// Layout del grupo (main) — sin header, la pantalla maneja su propio header
export default function MainLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surfaceBase } }} />
  );
}
