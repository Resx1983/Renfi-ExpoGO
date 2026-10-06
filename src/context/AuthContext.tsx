import React, { createContext, useContext, useState, ReactNode } from 'react';
import { SesionUsuario } from '../types';

// =============================================================================
// CONTEXTO DE SESIÓN — Usuario autenticado
// =============================================================================

interface AuthContextType {
  usuario: SesionUsuario | null;
  setUsuario: (u: SesionUsuario | null) => void;
  cerrarSesion: () => void;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  setUsuario: () => {},
  cerrarSesion: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<SesionUsuario | null>(null);

  const cerrarSesion = () => {
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
