import { api } from './api';
import { Finca, Municipio } from '../types';

// =============================================================================
// FINCAS SERVICE — Catálogo público y CRUD de administrador sobre API-Renfi
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

export interface FincaOperacionResult {
  data: Finca | null;
  error: string | null;
}

export interface EliminarFincaResult {
  success: boolean;
  error: string | null;
}

/**
 * Normaliza una finca devuelta por la API (ya viene aplanada con municipio, propietario e imágenes).
 */
function normalizarFinca(row: any): Finca {
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
    NombreMunicipio: row.NombreMunicipio ?? 'Antioquia',
    NombrePropietario: row.NombrePropietario ?? 'Anfitrión',
    ApellidoPropietario: row.ApellidoPropietario ?? 'Renfi',
    TelefonoPropietario: row.TelefonoPropietario ?? null,
    CorreoPropietario: row.CorreoPropietario ?? null,
    Imagenes: Array.isArray(row.Imagenes) ? row.Imagenes : [],
  };
}

/**
 * Lista todas las fincas.
 */
export async function listarFincas(): Promise<FincasResult> {
  const r = await api.get<any[]>('/api/finca');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: r.data.map(normalizarFinca), error: null };
}

/**
 * Lista únicamente las fincas en estado 'Disponible'.
 */
export async function listarFincasDisponibles(): Promise<FincasResult> {
  const { data, error } = await listarFincas();
  if (error) return { data: null, error };
  return {
    data: (data || []).filter((f) => (f.Estado || '').trim().toLowerCase() === 'disponible'),
    error: null,
  };
}

/**
 * Obtiene el detalle de una finca específica por su ID.
 */
export async function obtenerFincaPorId(idFinca: number): Promise<FincaDetalleResult> {
  const r = await api.get<any>(`/api/finca/${idFinca}`);
  if (r.status === 404) return { data: null, error: 'Finca no encontrada.' };
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: normalizarFinca(r.data), error: null };
}

/**
 * Lista todos los municipios registrados para filtros y selección.
 */
export async function listarMunicipios(): Promise<MunicipiosResult> {
  const r = await api.get<Municipio[]>('/api/municipio');
  if (r.error || !r.data) return { data: null, error: r.error };
  return { data: [...r.data].sort((a, b) => a.NombreMunicipio.localeCompare(b.NombreMunicipio)), error: null };
}

// ─── CRUD DE FINCAS (ADMINISTRADOR) ───────────────────────────────────────────

/**
 * Crea una nueva finca y asocia su imagen si se provee.
 */
export async function crearFinca(dto: import('../types').CrearFincaDTO): Promise<FincaOperacionResult> {
  const r = await api.post<{ id: number }>('/api/finca', {
    IdMunicipio: dto.IdMunicipio,
    NumeroDocumentoUsuario: dto.NumeroDocumentoUsuario ?? 1,
    NombreFinca: dto.NombreFinca,
    Direccion: dto.Direccion ?? '',
    InformacionAdicional: dto.InformacionAdicional ?? '',
    Capacidad: dto.Capacidad,
    Precio: dto.Precio,
    Estado: dto.Estado ?? 'Disponible',
    Calificacion: dto.Calificacion ?? 5,
  });
  if (r.error || !r.data) return { data: null, error: r.error };
  const idGenerado = Number(r.data.id);
  if (!idGenerado) return { data: null, error: 'No se pudo obtener el identificador de la nueva finca.' };

  if (dto.UrlImagen && dto.UrlImagen.trim()) {
    await api.post('/api/imagen', { IdFinca: idGenerado, UrlImagen: dto.UrlImagen.trim() });
  }
  return obtenerFincaPorId(idGenerado);
}

/**
 * Modifica una finca existente por su ID.
 */
export async function modificarFinca(
  idFinca: number,
  dto: import('../types').ModificarFincaDTO
): Promise<FincaOperacionResult> {
  const { UrlImagen, ...campos } = dto;
  const payload = Object.fromEntries(Object.entries(campos).filter(([, v]) => v !== undefined));

  const r = await api.put(`/api/finca/${idFinca}`, payload);
  if (r.error) return { data: null, error: r.error };

  if (UrlImagen && UrlImagen.trim()) {
    const existentes = await api.get<{ IdImagen: number }[]>(`/api/imagen/finca/${idFinca}`);
    const primera = existentes.data?.[0];
    if (primera) {
      await api.put(`/api/imagen/${primera.IdImagen}`, { UrlImagen: UrlImagen.trim(), IdFinca: idFinca });
    } else {
      await api.post('/api/imagen', { IdFinca: idFinca, UrlImagen: UrlImagen.trim() });
    }
  }
  return obtenerFincaPorId(idFinca);
}

/**
 * Elimina una finca por su ID.
 */
export async function eliminarFinca(idFinca: number): Promise<EliminarFincaResult> {
  const r = await api.delete(`/api/finca/${idFinca}`);
  return { success: !r.error, error: r.error };
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
