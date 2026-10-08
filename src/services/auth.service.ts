import * as Crypto from 'expo-crypto';
import { supabase } from './supabase';
import { SesionUsuario } from '../types';

// =============================================================================
// AUTH SERVICE — Mismas reglas que API-Renfi (develop): las contraseñas se
// guardan en SHA-512 y el login acepta tanto texto plano (usuarios antiguos)
// como hash, comparando en el servidor sin traer la contraseña al cliente.
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
  /** IdRol: 1 = Admin, 2 = Cliente, 3 = Propietario — por defecto Cliente (2) */
  idRol?: number;
}

/** SHA-512 en hex minúsculas (igual que CryptoService de la web). */
export function hashSHA512(valor: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA512, valor);
}

function formatearErrorSupabase(err: any): string {
  if (!err) return 'Error desconocido.';
  const code = err.code ?? '';
  const msg = err.message ?? String(err);

  if (code === '42501' || msg.includes('permission denied')) {
    return 'Permisos denegados en Supabase (42501). Ejecuta el script "supabase/setup_renfi_database.sql" en el SQL Editor de tu proyecto Supabase.';
  }
  if (code === '23505' || msg.includes('duplicate')) {
    return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
  }
  if (msg.includes('fetch') || msg.includes('Network request failed')) {
    return 'No fue posible conectar con el servidor. Intenta nuevamente en unos instantes.';
  }
  return msg;
}

// ─── Iniciar Sesión ───────────────────────────────────────────────────────────

export async function iniciarSesion(correo: string, contrasena: string): Promise<LoginResult> {
  try {
    const hash = await hashSHA512(contrasena);
    const { data: usuario, error } = await supabase
      .from('Usuario')
      .select('NumeroDocumento, IdRol, NombreUsuario, ApellidoUsuario, Telefono, Correo, Estado, Rol:IdRol (NombreRol)')
      .ilike('Correo', correo.trim().toLowerCase())
      .in('Contrasena', [contrasena, hash])
      .limit(1)
      .maybeSingle();

    if (error) return { data: null, error: formatearErrorSupabase(error) };
    if (!usuario) return { data: null, error: 'Credenciales incorrectas. Verifica tu correo y contraseña.' };

    if (usuario.Estado && usuario.Estado.toLowerCase() !== 'activo') {
      return { data: null, error: 'Tu cuenta se encuentra inactiva. Contacta al administrador.' };
    }

    return {
      data: {
        NumeroDocumento: Number(usuario.NumeroDocumento),
        IdRol: usuario.IdRol ?? 2,
        NombreUsuario: usuario.NombreUsuario,
        ApellidoUsuario: usuario.ApellidoUsuario,
        Telefono: usuario.Telefono,
        Correo: usuario.Correo,
        Estado: usuario.Estado ?? 'Activo',
        NombreRol: (usuario.Rol as any)?.NombreRol ?? 'Cliente',
      },
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

// ─── Registrar Usuario ────────────────────────────────────────────────────────

export async function registrarUsuario(params: RegistroParams): Promise<RegisterResult> {
  try {
    const { data, error } = await supabase
      .from('Usuario')
      .insert({
        IdRol: params.idRol ?? 2,
        NombreUsuario: params.nombre.trim(),
        ApellidoUsuario: params.apellido.trim(),
        Telefono: params.telefono.trim() || null,
        Correo: params.correo.trim().toLowerCase(),
        Contrasena: await hashSHA512(params.contrasena),
        Estado: 'Activo',
      })
      .select('NumeroDocumento')
      .single();

    if (error) return { numeroDocumento: null, error: formatearErrorSupabase(error) };
    return { numeroDocumento: Number(data.NumeroDocumento), error: null };
  } catch (err: any) {
    return { numeroDocumento: null, error: formatearErrorSupabase(err) };
  }
}

// ─── Actualizar perfil ────────────────────────────────────────────────────────

export interface ActualizarPerfilParams {
  NombreUsuario: string;
  ApellidoUsuario: string;
  Telefono: string | null;
}

/**
 * Actualiza los datos personales del usuario (el correo no se modifica).
 */
export async function actualizarUsuario(
  numeroDocumento: number,
  params: ActualizarPerfilParams
): Promise<{ error: string | null }> {
  try {
    const { error } = await supabase.from('Usuario').update(params).eq('NumeroDocumento', numeroDocumento);
    return { error: error ? formatearErrorSupabase(error) : null };
  } catch (err: any) {
    return { error: formatearErrorSupabase(err) };
  }
}
