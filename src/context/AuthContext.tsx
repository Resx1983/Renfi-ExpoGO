import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SesionUsuario } from '../types';

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
    (async () => {
      try {
        const guardado = await AsyncStorage.getItem(STORAGE_KEY);
        if (guardado) {
          const parsed = JSON.parse(guardado) as SesionUsuario;
          setUsuarioState(parsed);
        }
      } catch (err) {
        console.warn('[AuthContext] No se pudo leer la sesión guardada:', err);
      } finally {
        setCargando(false);
      }
    })();
  }, []);

  const setUsuario = (u: SesionUsuario | null) => {
    setUsuarioState(u);
    if (u) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(u)).catch((err) =>
        console.warn('[AuthContext] Error guardando sesión:', err)
      );
    } else {
      AsyncStorage.removeItem(STORAGE_KEY).catch((err) =>
        console.warn('[AuthContext] Error eliminando sesión:', err)
      );
    }
  };

  const cerrarSesion = () => {
    setUsuarioState(null);
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
