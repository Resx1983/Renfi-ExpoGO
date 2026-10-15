import * as Crypto from 'expo-crypto';
import { api, guardarToken } from './api';
import { SesionUsuario } from '../types';

// =============================================================================
// AUTH SERVICE — Inicia sesión contra API-Renfi. La API verifica la contraseña
// (bcrypt) y devuelve un JWT que el cliente HTTP adjunta a cada petición.
// =============================================================================

export interface LoginResult {
  data: SesionUsuario | null;
  error: string | null;
}

export interface RegisterResult {
  numeroDocumento: number | null;
  error: string | null;
}

export interface RegistroParams {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  contrasena: string;
}

/** SHA-512 en hex minúsculas; la API acepta contraseñas en claro o en este formato. */
export function hashSHA512(valor: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, valor);
}

// ─── Iniciar Sesión ───────────────────────────────────────────────────────────

export async function iniciarSesion(correo: string, contrasena: string): Promise<LoginResult> {
  const r = await api.post<{ token: string; usuario: any }>('/api/usuario/login', {
    Correo: correo.trim().toLowerCase(),
    Contrasena: contrasena,
  });
  if (r.error || !r.data) {
    return {
      data: null,
      error: r.status === 401 ? 'Credenciales incorrectas. Verifica tu correo y contraseña.' : r.error,
    };
  }

  const u = r.data.usuario;
  await guardarToken(r.data.token);
  return {
    data: {
      NumeroDocumento: Number(u.NumeroDocumento),
      IdRol: u.IdRol ?? 2,
      NombreUsuario: u.NombreUsuario,
      ApellidoUsuario: u.ApellidoUsuario,
      Telefono: u.Telefono || null,
      Correo: u.Correo,
      Estado: u.Estado ?? 'Activo',
      NombreRol: u.NombreRol ?? 'Cliente',
    },
    error: null,
  };
}

// ─── Registrar Usuario ────────────────────────────────────────────────────────

/** El registro público siempre crea una cuenta de Cliente (la API ignora cualquier rol enviado). */
export async function registrarUsuario(params: RegistroParams): Promise<RegisterResult> {
  const r = await api.post<{ id: number; NumeroDocumento?: number }>('/api/usuario', {
    NombreUsuario: params.nombre.trim(),
    ApellidoUsuario: params.apellido.trim(),
    Telefono: params.telefono.trim() || null,
    Correo: params.correo.trim().toLowerCase(),
    Contrasena: params.contrasena,
  });
  if (r.error || !r.data) {
    return {
      numeroDocumento: null,
      error: r.status === 409 ? 'Este correo electrónico ya está registrado. Intenta iniciar sesión.' : r.error,
    };
  }
  return { numeroDocumento: Number(r.data.NumeroDocumento ?? r.data.id), error: null };
}

// ─── Actualizar perfil ────────────────────────────────────────────────────────

export interface ActualizarPerfilParams {
  NombreUsuario: string;
  ApellidoUsuario: string;
  Telefono: string | null;
}

/**
 * Actualiza los datos personales del usuario (el correo, el rol y el estado no se modifican desde la app).
 */
export async function actualizarUsuario(
  numeroDocumento: number,
  params: ActualizarPerfilParams
): Promise<{ error: string | null }> {
  const r = await api.put(`/api/usuario/${numeroDocumento}`, {
    NombreUsuario: params.NombreUsuario,
    ApellidoUsuario: params.ApellidoUsuario,
    Telefono: params.Telefono ?? '',
  });
  return { error: r.error };
}
