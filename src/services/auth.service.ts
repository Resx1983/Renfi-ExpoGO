import { supabase } from './supabase';
import { SesionUsuario } from '../types';

// =============================================================================
// AUTH SERVICE — Compatible con RPC (SP_IniciarSesion / SP_RegistrarUsuario)
// y PostgREST Directo
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

function formatearErrorSupabase(err: any): string {
  if (!err) return 'Error desconocido.';
  const code = err.code ?? '';
  const msg = err.message ?? String(err);

  if (code === '42501' || msg.includes('permission denied')) {
    return 'Permisos denegados en Supabase (42501). Ejecuta el script "supabase/setup_renfi_database.sql" en el SQL Editor de tu proyecto Supabase.';
  }
  if (code === '23505' || msg.includes('unique') || msg.includes('duplicate') || msg.includes('Correo')) {
    return 'Este correo electrónico ya está registrado. Intenta iniciar sesión.';
  }
  if (msg.includes('fetch') || msg.includes('Network request failed')) {
    return 'No se pudo conectar a Supabase. Revisa tu conexión a internet o la URL del proyecto.';
  }
  return msg;
}

// ─── Iniciar Sesión ───────────────────────────────────────────────────────────

/**
 * Inicia sesión intentando primero el RPC SP_IniciarSesion y como alternativa
 * consultando la tabla Usuario directamente.
 */
export async function iniciarSesion(
  correo: string,
  contrasena: string
): Promise<LoginResult> {
  const correoLimpio = correo.trim().toLowerCase();

  try {
    // Intento 1: Procedimiento Almacenado RPC
    const rpcRes = await supabase.rpc('SP_IniciarSesion', {
      p_Correo: correoLimpio,
      p_Contrasena: contrasena,
    });

    if (!rpcRes.error) {
      const filas = Array.isArray(rpcRes.data) ? rpcRes.data : [];
      if (filas.length > 0) {
        return { data: filas[0] as SesionUsuario, error: null };
      }
      // El SP solo devuelve usuarios activos con credenciales válidas
      return { data: null, error: 'Correo o contraseña incorrectos, o cuenta inactiva.' };
    }

    if (rpcRes.error.code === '42501') {
      return { data: null, error: formatearErrorSupabase(rpcRes.error) };
    }

    // Intento 2: Consulta directa a la tabla Usuario (Fallback)
    const { data: usuario, error: tableError } = await supabase
      .from('Usuario')
      .select(`
        NumeroDocumento,
        IdRol,
        NombreUsuario,
        ApellidoUsuario,
        Telefono,
        Correo,
        Estado,
        Rol:IdRol (
          IdRol,
          NombreRol
        )
      `)
      .ilike('Correo', correoLimpio)
      .eq('Contrasena', contrasena)
      .maybeSingle();

    if (tableError) {
      return { data: null, error: formatearErrorSupabase(tableError) };
    }

    if (!usuario) {
      return {
        data: null,
        error: 'Correo o contraseña incorrectos.',
      };
    }

    if (usuario.Estado && usuario.Estado.toLowerCase() !== 'activo') {
      return {
        data: null,
        error: 'Tu cuenta se encuentra inactiva. Contacta al administrador.',
      };
    }

    const sesion: SesionUsuario = {
      NumeroDocumento: usuario.NumeroDocumento,
      IdRol: usuario.IdRol ?? 2,
      NombreUsuario: usuario.NombreUsuario,
      ApellidoUsuario: usuario.ApellidoUsuario,
      Telefono: usuario.Telefono,
      Correo: usuario.Correo,
      Estado: usuario.Estado ?? 'Activo',
      NombreRol: (usuario.Rol as any)?.NombreRol ?? 'Cliente',
    };

    return { data: sesion, error: null };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

// ─── Verificar correo duplicado ───────────────────────────────────────────────

/**
 * Verifica si un correo ya existe en la tabla Usuario.
 */
export async function correoExiste(correo: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('Usuario')
      .select('Correo')
      .ilike('Correo', correo.trim())
      .limit(1);

    if (error || !data) return false;
    return data.length > 0;
  } catch {
    return false;
  }
}

// ─── Registrar Usuario ────────────────────────────────────────────────────────

/**
 * Registra un nuevo usuario via RPC o inserción directa en la tabla Usuario.
 */
export async function registrarUsuario(
  params: RegistroParams
): Promise<RegisterResult> {
  const correoLimpio = params.correo.trim().toLowerCase();
  const idRol = params.idRol ?? 2; // 2 = Cliente

  try {
    // Intento 1: Procedimiento Almacenado RPC
    const rpcRes = await supabase.rpc('SP_RegistrarUsuario', {
      p_IdRol: idRol,
      p_NombreUsuario: params.nombre.trim(),
      p_ApellidoUsuario: params.apellido.trim(),
      p_Telefono: params.telefono.trim() || null,
      p_Correo: correoLimpio,
      p_Contrasena: params.contrasena,
      p_Estado: 'Activo',
    });

    if (!rpcRes.error && rpcRes.data) {
      return { numeroDocumento: Number(rpcRes.data), error: null };
    }

    if (rpcRes.error && (rpcRes.error.code === '42501' || rpcRes.error.code === '23505')) {
      return { numeroDocumento: null, error: formatearErrorSupabase(rpcRes.error) };
    }

    // Intento 2: Inserción directa en la tabla Usuario (Fallback)
    const { data: nuevo, error: insertError } = await supabase
      .from('Usuario')
      .insert({
        IdRol: idRol,
        NombreUsuario: params.nombre.trim(),
        ApellidoUsuario: params.apellido.trim(),
        Telefono: params.telefono.trim() || null,
        Correo: correoLimpio,
        Contrasena: params.contrasena,
        Estado: 'Activo',
      })
      .select('NumeroDocumento')
      .single();

    if (insertError) {
      return { numeroDocumento: null, error: formatearErrorSupabase(insertError) };
    }

    return { numeroDocumento: nuevo ? Number(nuevo.NumeroDocumento) : null, error: null };
  } catch (err: any) {
    return { numeroDocumento: null, error: formatearErrorSupabase(err) };
  }
}
