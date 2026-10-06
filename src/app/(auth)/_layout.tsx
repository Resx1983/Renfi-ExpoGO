import { Stack } from 'expo-router';
import { Colors } from '../../constants/theme';

// Layout del grupo (auth) — sin header visible
export default function AuthLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.surfaceBase } }} />
  );
}
