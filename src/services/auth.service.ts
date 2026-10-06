import { supabase } from './supabase';
import { SesionUsuario } from '../types';

// =============================================================================
// AUTH SERVICE — SP_IniciarSesion + SP_RegistrarUsuario (RPC)
// =============================================================================

export interface LoginResult {
  data: SesionUsuario | null;
  error: string | null;
}

export interface RegisterResult {
  numeroDocumento: number | null;
  error: string | null;
}

// ─── Iniciar Sesión ───────────────────────────────────────────────────────────

/**
 * Inicia sesión llamando al stored procedure SP_IniciarSesion.
 * Retorna el usuario si correo + contraseña son válidos y estado = 'Activo'.
 */
export async function iniciarSesion(
  correo: string,
  contrasena: string
): Promise<LoginResult> {
  try {
    const { data, error } = await supabase.rpc('SP_IniciarSesion', {
      p_Correo: correo,
      p_Contrasena: contrasena,
    });

    if (error) {
      return { data: null, error: error.message };
    }

    if (!data || data.length === 0) {
      return {
        data: null,
        error: 'Correo o contraseña incorrectos, o cuenta inactiva.',
      };
    }

    return { data: data[0] as SesionUsuario, error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? 'Error desconocido.' };
  }
}

// ─── Verificar correo duplicado ───────────────────────────────────────────────

/**
 * Verifica si un correo ya existe en la tabla Usuario.
 * Se hace directo a la tabla porque no hay SP para esto.
 */
export async function correoExiste(correo: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('Usuario')
      .select('Correo')
      .ilike('Correo', correo)
      .limit(1);

    if (error || !data) return false;
    return data.length > 0;
  } catch {
    return false;
  }
}

// ─── Registrar Usuario ────────────────────────────────────────────────────────

export interface RegistroParams {
  nombre: string;
  apellido: string;
  telefono: string;
  correo: string;
  contrasena: string;
  /** IdRol: 1 = Admin, 2 = Propietario, 3 = Cliente — por defecto Cliente (3) */
  idRol?: number;
}

/**
 * Registra un nuevo usuario via SP_RegistrarUsuario.
 * Retorna el NumeroDocumento generado o un mensaje de error.
 */
export async function registrarUsuario(
  params: RegistroParams
): Promise<RegisterResult> {
  try {
    const { data, error } = await supabase.rpc('SP_RegistrarUsuario', {
      p_IdRol: params.idRol ?? 3,
      p_NombreUsuario: params.nombre.trim(),
      p_ApellidoUsuario: params.apellido.trim(),
      p_Telefono: params.telefono.trim() || null,
      p_Correo: params.correo.trim().toLowerCase(),
      p_Contrasena: params.contrasena,
      p_Estado: 'Activo',
    });

    if (error) {
      // Detectar correo duplicado (unique constraint de Supabase)
      if (
        error.message.includes('unique') ||
        error.message.includes('duplicate') ||
        error.message.includes('Correo')
      ) {
        return {
          numeroDocumento: null,
          error: 'Este correo ya está registrado. Intenta iniciar sesión.',
        };
      }
      return { numeroDocumento: null, error: error.message };
    }

    return { numeroDocumento: data as number, error: null };
  } catch (err: any) {
    return { numeroDocumento: null, error: err.message ?? 'Error desconocido.' };
  }
}
