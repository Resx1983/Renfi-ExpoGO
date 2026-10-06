import { Redirect } from 'expo-router';
import { useAuth } from '../context/AuthContext';

// Punto de entrada: redirige a login o home según sesión
export default function Index() {
  const { usuario } = useAuth();
  return <Redirect href={usuario ? '/(main)/home' : '/(auth)/login'} />;
}
