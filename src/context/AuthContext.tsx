import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SesionUsuario } from '../types';
import { alExpirarSesion, cargarToken, guardarToken } from '../services/api';

// Igual que la web: admin si el rol contiene "admin" o IdRol === 1
export function esAdmin(u: SesionUsuario | null): boolean {
  if (!u) return false;
  return (u.NombreRol ?? '').toLowerCase().includes('admin') || Number(u.IdRol) === 1;
}

// =============================================================================
// CONTEXTO DE SESIÓN — Usuario autenticado con persistencia en AsyncStorage
// =============================================================================

const STORAGE_KEY = '@renfi_usuario_sesion';

interface AuthContextType {
  usuario: SesionUsuario | null;
  cargando: boolean;
  setUsuario: (u: SesionUsuario | null) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  cargando: true,
  setUsuario: () => {},
  cerrarSesion: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuarioState] = useState<SesionUsuario | null>(null);
  const [cargando, setCargando] = useState<boolean>(true);

  useEffect(() => {
    // Si la API responde 401 (token vencido), se cierra la sesión local
    alExpirarSesion(() => setUsuarioState(null));
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(STORAGE_KEY);
        const tokenGuardado = await cargarToken();
        if (guardado && tokenGuardado) {
          const parsed = JSON.parse(guardado) as SesionUsuario;
          setUsuarioState(parsed);
        } else if (guardado) {
          // Sesión de una versión anterior sin token: hay que volver a iniciar sesión
          await AsyncStorage.removeItem(STORAGE_KEY);
        }
      } catch (err) {
        console.warn('[AuthContext] No se pudo leer la sesión guardada:', err);
      } finally {
        setCargando(false);
      }
    })();
    return () => alExpirarSesion(null);
  }, []);

  const setUsuario = (u: SesionUsuario | null) => {
    setUsuarioState(u);
    if (u) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)).catch((err) =>
        console.warn('[AuthContext] Error guardando sesión:', err)
      );
    } else {
      guardarToken(null);
      AsyncStorage.removeItem(STORAGE_KEY).catch((err) =>
        console.warn('[AuthContext] Error eliminando sesión:', err)
      );
    }
  };

  const cerrarSesion = () => {
    setUsuarioState(null);
    guardarToken(null);
    AsyncStorage.removeItem(STORAGE_KEY).catch((err) =>
      console.warn('[AuthContext] Error al cerrar sesión:', err)
    );
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, setUsuario, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
