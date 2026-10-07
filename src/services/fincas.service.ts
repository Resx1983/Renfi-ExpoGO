import { supabase } from './supabase';
import { Finca, Municipio } from '../types';

// =============================================================================
// FINCAS SERVICE — Compatible con RPC (SP_ListarFincas) y PostgREST Directo
// =============================================================================

export interface FincasResult {
  data: Finca[] | null;
  error: string | null;
}

export interface FincaDetalleResult {
  data: Finca | null;
  error: string | null;
}

export interface MunicipiosResult {
  data: Municipio[] | null;
  error: string | null;
}

/**
 * Normaliza y formatea un objeto devuelto por consulta directa a la tabla Finca
 */
function normalizarFincaDesdeTabla(row: any): Finca {
  return {
    IdFinca: Number(row.IdFinca),
    IdMunicipio: row.IdMunicipio ? Number(row.IdMunicipio) : null,
    NumeroDocumentoUsuario: (row.NumeroDocumentoUsuario ?? row.IdPropietario)
      ? Number(row.NumeroDocumentoUsuario ?? row.IdPropietario)
      : null,
    NombreFinca: row.NombreFinca ?? 'Finca sin nombre',
    Direccion: row.Direccion ?? null,
    InformacionAdicional: row.InformacionAdicional ?? null,
    Capacidad: Number(row.Capacidad ?? 1),
    Precio: Number(row.Precio ?? 0),
    Estado: row.Estado ?? 'Disponible',
    Calificacion: Number(row.Calificacion ?? 5),
    NombreMunicipio:
      row.Municipio?.NombreMunicipio ?? row.NombreMunicipio ?? 'Antioquia',
    NombrePropietario:
      row.Usuario?.NombreUsuario ?? row.NombrePropietario ?? 'Anfitrión',
    ApellidoPropietario:
      row.Usuario?.ApellidoUsuario ?? row.ApellidoPropietario ?? 'Renfi',
    TelefonoPropietario:
      row.Usuario?.Telefono ?? row.TelefonoPropietario ?? null,
    CorreoPropietario:
      row.Usuario?.Correo ?? row.CorreoPropietario ?? null,
    Imagenes: Array.isArray(row.Imagenes) ? row.Imagenes : [],
  };
}

/**
 * Mensaje de error amigable para errores comunes de Supabase
 */
function formatearErrorSupabase(err: any): string {
  if (!err) return 'Error desconocido.';
  const code = err.code ?? '';
  const msg = err.message ?? String(err);

  if (code === '42501' || msg.includes('permission denied')) {
    return 'Permisos denegados en Supabase (42501). Ejecuta el script "supabase/setup_renfi_database.sql" en el SQL Editor de tu proyecto Supabase.';
  }
  if (code === 'PGRST301' || msg.includes('JWT')) {
    return 'Error de autenticación con la clave de Supabase. Revisa tu archivo .env.';
  }
  if (msg.includes('fetch') || msg.includes('Network request failed')) {
    return 'No se pudo conectar a Supabase. Revisa tu conexión a internet o la URL del proyecto.';
  }
  return msg;
}

/**
 * Lista todas las fincas.
 * 1. Intenta llamar al procedimiento almacenado SP_ListarFincas (RPC).
 * 2. Si el RPC no existe (PGRST202), consulta directamente la tabla Finca con relaciones.
 */
export async function listarFincas(): Promise<FincasResult> {
  try {
    // Intento 1: Procedimiento Almacenado RPC
    const rpcRes = await supabase.rpc('SP_ListarFincas');

    if (!rpcRes.error && rpcRes.data) {
      return { data: (rpcRes.data as any[]).map(normalizarFincaDesdeTabla), error: null };
    }

    // Si el error es de permisos, informarlo de inmediato
    if (rpcRes.error?.code === '42501') {
      return { data: null, error: formatearErrorSupabase(rpcRes.error) };
    }

    // Intento 2: Consulta directa a la tabla Finca (Fallback resiliente)
    const tableRes = await supabase
      .from('Finca')
      .select(`
        IdFinca,
        IdMunicipio,
        NumeroDocumentoUsuario,
        NombreFinca,
        Direccion,
        InformacionAdicional,
        Capacidad,
        Precio,
        Estado,
        Calificacion,
        Municipio:IdMunicipio (
          IdMunicipio,
          NombreMunicipio
        ),
        Usuario:NumeroDocumentoUsuario (
          NumeroDocumento,
          NombreUsuario,
          ApellidoUsuario,
          Telefono,
          Correo
        ),
        Imagenes:Imagen (
          IdImagen,
          UrlImagen,
          IdFinca
        )
      `)
      .order('IdFinca', { ascending: true });

    if (tableRes.error) {
      return { data: null, error: formatearErrorSupabase(tableRes.error) };
    }

    const fincas = (tableRes.data || []).map(normalizarFincaDesdeTabla);
    return { data: fincas, error: null };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

/**
 * Lista únicamente las fincas en estado 'Disponible'.
 */
export async function listarFincasDisponibles(): Promise<FincasResult> {
  try {
    const { data, error } = await listarFincas();

    if (error) {
      return { data: null, error };
    }

    const disponibles = (data || []).filter(
      (f) => (f.Estado || '').trim().toLowerCase() === 'disponible'
    );

    return { data: disponibles, error: null };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

/**
 * Obtiene el detalle de una finca específica por su ID.
 */
export async function obtenerFincaPorId(idFinca: number): Promise<FincaDetalleResult> {
  try {
    const { data, error } = await supabase
      .from('Finca')
      .select(`
        IdFinca,
        IdMunicipio,
        NumeroDocumentoUsuario,
        NombreFinca,
        Direccion,
        InformacionAdicional,
        Capacidad,
        Precio,
        Estado,
        Calificacion,
        Municipio:IdMunicipio (
          IdMunicipio,
          NombreMunicipio
        ),
        Usuario:NumeroDocumentoUsuario (
          NumeroDocumento,
          NombreUsuario,
          ApellidoUsuario,
          Telefono,
          Correo
        ),
        Imagenes:Imagen (
          IdImagen,
          UrlImagen,
          IdFinca
        )
      `)
      .eq('IdFinca', idFinca)
      .maybeSingle();

    if (error) {
      return { data: null, error: formatearErrorSupabase(error) };
    }

    if (!data) {
      return { data: null, error: 'Finca no encontrada.' };
    }

    return { data: normalizarFincaDesdeTabla(data), error: null };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

/**
 * Lista todos los municipios registrados para filtros y selección.
 */
export async function listarMunicipios(): Promise<MunicipiosResult> {
  try {
    // Intento 1: RPC
    const rpcRes = await supabase.rpc('SP_ListarMunicipios');
    if (!rpcRes.error && rpcRes.data) {
      return { data: rpcRes.data as Municipio[], error: null };
    }

    // Intento 2: Tabla directa
    const { data, error } = await supabase
      .from('Municipio')
      .select('IdMunicipio, NombreMunicipio')
      .order('NombreMunicipio', { ascending: true });

    if (error) {
      return { data: null, error: formatearErrorSupabase(error) };
    }

    return { data: (data as Municipio[]) || [], error: null };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

// ─── CRUD DE FINCAS (ADMINISTRADOR / PROPIETARIO) ─────────────────────────────

export interface FincaOperacionResult {
  data: Finca | null;
  error: string | null;
}

export interface EliminarFincaResult {
  success: boolean;
  error: string | null;
}

/**
 * Crea una nueva finca en Supabase (soporta RPC y PostgREST directo)
 * y asocia su imagen si se provee.
 */
export async function crearFinca(
  dto: import('../types').CrearFincaDTO
): Promise<FincaOperacionResult> {
  try {
    let idGenerado: number | null = null;

    // Intento 1: Procedimiento Almacenado RPC
    const rpcRes = await supabase.rpc('SP_InsertarFinca', {
      p_IdMunicipio: dto.IdMunicipio,
      p_NumeroDocumentoUsuario: dto.NumeroDocumentoUsuario ?? 1,
      p_NombreFinca: dto.NombreFinca,
      p_Direccion: dto.Direccion ?? '',
      p_InformacionAdicional: dto.InformacionAdicional ?? '',
      p_Capacidad: dto.Capacidad,
      p_Precio: dto.Precio,
      p_Estado: dto.Estado ?? 'Disponible',
      p_Calificacion: dto.Calificacion ?? 5,
    });

    if (!rpcRes.error && rpcRes.data) {
      idGenerado = Number(rpcRes.data);
    } else {
      // Intento 2: Inserción directa en tabla Finca (Fallback)
      const { data: insertData, error: insertError } = await supabase
        .from('Finca')
        .insert({
          IdMunicipio: dto.IdMunicipio,
          NumeroDocumentoUsuario: dto.NumeroDocumentoUsuario ?? 1,
          NombreFinca: dto.NombreFinca,
          Direccion: dto.Direccion ?? null,
          InformacionAdicional: dto.InformacionAdicional ?? null,
          Capacidad: dto.Capacidad,
          Precio: dto.Precio,
          Estado: dto.Estado ?? 'Disponible',
          Calificacion: dto.Calificacion ?? 5,
        })
        .select('IdFinca')
        .single();

      if (insertError) {
        return { data: null, error: formatearErrorSupabase(insertError) };
      }
      idGenerado = Number(insertData.IdFinca);
    }

    if (!idGenerado) {
      return { data: null, error: 'No se pudo obtener el identificador de la nueva finca.' };
    }

    // Registrar imagen en la tabla Imagen si fue especificada
    if (dto.UrlImagen && dto.UrlImagen.trim()) {
      await supabase.from('Imagen').insert({
        IdFinca: idGenerado,
        UrlImagen: dto.UrlImagen.trim(),
      });
    }

    // Obtener la finca completa recién creada
    return await obtenerFincaPorId(idGenerado);
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

/**
 * Modifica una finca existente por su ID.
 */
export async function modificarFinca(
  idFinca: number,
  dto: import('../types').ModificarFincaDTO
): Promise<FincaOperacionResult> {
  try {
    const updatePayload: Record<string, any> = {};
    if (dto.NombreFinca !== undefined) updatePayload.NombreFinca = dto.NombreFinca;
    if (dto.IdMunicipio !== undefined) updatePayload.IdMunicipio = dto.IdMunicipio;
    if (dto.NumeroDocumentoUsuario !== undefined) updatePayload.NumeroDocumentoUsuario = dto.NumeroDocumentoUsuario;
    if (dto.Direccion !== undefined) updatePayload.Direccion = dto.Direccion;
    if (dto.InformacionAdicional !== undefined) updatePayload.InformacionAdicional = dto.InformacionAdicional;
    if (dto.Capacidad !== undefined) updatePayload.Capacidad = dto.Capacidad;
    if (dto.Precio !== undefined) updatePayload.Precio = dto.Precio;
    if (dto.Estado !== undefined) updatePayload.Estado = dto.Estado;
    if (dto.Calificacion !== undefined) updatePayload.Calificacion = dto.Calificacion;

    const { error: updateError } = await supabase
      .from('Finca')
      .update(updatePayload)
      .eq('IdFinca', idFinca);

    if (updateError) {
      return { data: null, error: formatearErrorSupabase(updateError) };
    }

    // Si se especificó una nueva imagen, actualizar o insertar en Imagen
    if (dto.UrlImagen && dto.UrlImagen.trim()) {
      const { data: imgExistente } = await supabase
        .from('Imagen')
        .select('IdImagen')
        .eq('IdFinca', idFinca)
        .limit(1);

      if (imgExistente && imgExistente.length > 0) {
        await supabase
          .from('Imagen')
          .update({ UrlImagen: dto.UrlImagen.trim() })
          .eq('IdImagen', imgExistente[0].IdImagen);
      } else {
        await supabase.from('Imagen').insert({
          IdFinca: idFinca,
          UrlImagen: dto.UrlImagen.trim(),
        });
      }
    }

    return await obtenerFincaPorId(idFinca);
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

/**
 * Elimina una finca de la base de datos por su ID.
 */
export async function eliminarFinca(idFinca: number): Promise<EliminarFincaResult> {
  try {
    const { error } = await supabase
      .from('Finca')
      .delete()
      .eq('IdFinca', idFinca);

    if (error) {
      return { success: false, error: formatearErrorSupabase(error) };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: formatearErrorSupabase(err) };
  }
}

/**
 * Cambia el estado de una finca ('Disponible', 'Ocupada', 'Mantenimiento').
 */
export async function cambiarEstadoFinca(
  idFinca: number,
  nuevoEstado: import('../types').EstadoFinca
): Promise<FincaOperacionResult> {
  return modificarFinca(idFinca, { Estado: nuevoEstado });
}
