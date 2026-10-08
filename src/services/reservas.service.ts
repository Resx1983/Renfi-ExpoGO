import { supabase } from './supabase';
import { Reserva, MetodoDePago, CrearReservaDTO, EstadoReserva } from '../types';

// =============================================================================
// RESERVAS SERVICE — Creación y Gestión de Reservas, Pagos y Facturación
// =============================================================================

export interface ReservasResult {
  data: Reserva[] | null;
  error: string | null;
}

export interface MetodosPagoResult {
  data: MetodoDePago[] | null;
  error: string | null;
}

export interface CrearReservaResult {
  data: Reserva | null;
  idFactura?: number | null;
  idPago?: number | null;
  error: string | null;
}

export interface OperacionReservaResult {
  success: boolean;
  error: string | null;
}

function formatearErrorSupabase(err: any): string {
  if (!err) return 'Error desconocido.';
  const code = err.code ?? '';
  const msg = err.message ?? String(err);

  if (code === '42501' || msg.includes('permission denied')) {
    return 'Permisos denegados en Supabase (42501).';
  }
  if (msg.includes('fetch') || msg.includes('Network request failed')) {
    return 'No se pudo conectar a Supabase. Revisa tu conexión a internet.';
  }
  return msg;
}

function normalizarReserva(row: any): Reserva {
  return {
    IdReserva: Number(row.IdReserva),
    IdFinca: Number(row.IdFinca),
    NumeroDocumentoUsuario: row.NumeroDocumentoUsuario ? Number(row.NumeroDocumentoUsuario) : null,
    FechaReserva: row.FechaReserva ? String(row.FechaReserva) : new Date().toISOString(),
    FechaEntrada: row.FechaEntrada ? String(row.FechaEntrada) : null,
    FechaSalida: row.FechaSalida ? String(row.FechaSalida) : null,
    Estado: row.Estado ?? 'Pendiente',
    MontoReserva: Number(row.MontoReserva ?? 0),
    NombreFinca: row.Finca?.NombreFinca ?? row.NombreFinca ?? 'Finca Renfi',
    NombreMunicipio:
      row.Finca?.Municipio?.NombreMunicipio ??
      row.NombreMunicipio ??
      'Antioquia',
    NombreCliente: row.Usuario?.NombreUsuario ?? row.NombreCliente ?? 'Cliente',
    ApellidoCliente: row.Usuario?.ApellidoUsuario ?? row.ApellidoCliente ?? '',
  };
}

/**
 * Obtiene los métodos de pago disponibles (Nequi, Tarjeta, etc.).
 */
export async function listarMetodosDePago(): Promise<MetodosPagoResult> {
  try {
    const rpcRes = await supabase.rpc('SP_ListarMetodosDePago');
    if (!rpcRes.error && rpcRes.data) {
      return { data: rpcRes.data as MetodoDePago[], error: null };
    }

    const { data, error } = await supabase
      .from('MetodoDePago')
      .select('IdMetodoDePago, NombreMetodoDePago, PagoMixto')
      .order('IdMetodoDePago', { ascending: true });

    if (error) {
      return { data: null, error: formatearErrorSupabase(error) };
    }

    return { data: (data as MetodoDePago[]) || [], error: null };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

const ESTADOS_INACTIVOS = ['cancelada', 'cancelado', 'anulada', 'anulado'];
export const esInactiva = (estado: string | null | undefined) => ESTADOS_INACTIVOS.includes((estado ?? '').trim().toLowerCase());

/**
 * Realiza una nueva reserva con las mismas reglas que API-Renfi (develop):
 * 1. Valida fechas, monto, capacidad y que no se cruce con otra reserva activa.
 * 2. Registra la 'Reserva', luego la 'Factura' y el 'Pago'.
 *    Si la factura o el pago fallan, se revierte la reserva.
 */
export async function crearReserva(dto: CrearReservaDTO): Promise<CrearReservaResult> {
  try {
    if (!(Number(dto.MontoReserva) > 0)) {
      return { data: null, error: 'El monto de la reserva debe ser mayor a cero.' };
    }
    if (!dto.FechaEntrada || !dto.FechaSalida || dto.FechaSalida.slice(0, 10) <= dto.FechaEntrada.slice(0, 10)) {
      return { data: null, error: 'La fecha de salida debe ser posterior a la fecha de entrada.' };
    }

    if (dto.Huespedes != null) {
      const { data: finca } = await supabase.from('Finca').select('Capacidad').eq('IdFinca', dto.IdFinca).maybeSingle();
      if (!Number.isInteger(dto.Huespedes) || dto.Huespedes < 1) {
        return { data: null, error: 'El número de huéspedes debe ser al menos 1.' };
      }
      if (finca && dto.Huespedes > Number(finca.Capacidad)) {
        return { data: null, error: `El número de huéspedes (${dto.Huespedes}) supera la capacidad de la finca (${finca.Capacidad}).` };
      }
    }

    // ponytail: check-then-insert sin lock (igual que la API); con concurrencia real usar EXCLUDE constraint en BD
    const { data: cruces, error: crucesError } = await supabase
      .from('Reserva')
      .select('Estado')
      .eq('IdFinca', dto.IdFinca)
      .lt('FechaEntrada', dto.FechaSalida)
      .gt('FechaSalida', dto.FechaEntrada);
    if (crucesError) return { data: null, error: formatearErrorSupabase(crucesError) };
    if ((cruces ?? []).some((r) => !esInactiva(r.Estado))) {
      return { data: null, error: 'La finca ya tiene una reserva en las fechas seleccionadas.' };
    }

    // 1. Crear Reserva
    const { data: reservaData, error: reservaError } = await supabase
      .from('Reserva')
      .insert({
        IdFinca: dto.IdFinca,
        NumeroDocumentoUsuario: dto.NumeroDocumentoUsuario,
        FechaEntrada: dto.FechaEntrada,
        FechaSalida: dto.FechaSalida,
        Estado: dto.Estado ?? 'Activa',
        MontoReserva: dto.MontoReserva,
      })
      .select(`
        IdReserva,
        IdFinca,
        NumeroDocumentoUsuario,
        FechaReserva,
        FechaEntrada,
        FechaSalida,
        Estado,
        MontoReserva,
        Finca:IdFinca (
          NombreFinca,
          IdMunicipio,
          Municipio:IdMunicipio (NombreMunicipio)
        ),
        Usuario:NumeroDocumentoUsuario (
          NombreUsuario,
          ApellidoUsuario
        )
      `)
      .single();

    if (reservaError || !reservaData) {
      return { data: null, error: formatearErrorSupabase(reservaError ?? 'Error al crear reserva.') };
    }

    const idReserva = Number(reservaData.IdReserva);
    const revertir = async (err: any) => {
      await supabase.from('Reserva').delete().eq('IdReserva', idReserva);
      return { data: null, error: formatearErrorSupabase(err ?? 'Error al procesar la reserva.') };
    };

    // 2. Generar Factura
    const { data: facturaData, error: facturaError } = await supabase
      .from('Factura')
      .insert({ IdReserva: idReserva, Total: dto.MontoReserva })
      .select('IdFactura')
      .single();
    if (facturaError || !facturaData) return revertir(facturaError);
    const idFactura = Number(facturaData.IdFactura);

    // 3. Registrar Pago
    const { data: pagoData, error: pagoError } = await supabase
      .from('Pago')
      .insert({
        IdFactura: idFactura,
        IdMetodoDePago: dto.IdMetodoDePago,
        Monto: Math.round(dto.MontoReserva),
        EstadoPago: 'Pagado',
      })
      .select('IdPago')
      .single();
    if (pagoError || !pagoData) return revertir(pagoError);

    return {
      data: normalizarReserva(reservaData),
      idFactura,
      idPago: Number(pagoData.IdPago),
      error: null,
    };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

/**
 * Lista todas las reservas (para panel de Administrador).
 */
export async function listarReservas(): Promise<ReservasResult> {
  try {
    // Intento 1: RPC SP_ListarReservas
    const rpcRes = await supabase.rpc('SP_ListarReservas');
    if (!rpcRes.error && rpcRes.data) {
      return {
        data: (rpcRes.data as any[]).map(normalizarReserva),
        error: null,
      };
    }

    // Intento 2: Consulta directa
    const { data, error } = await supabase
      .from('Reserva')
      .select(`
        IdReserva,
        IdFinca,
        NumeroDocumentoUsuario,
        FechaReserva,
        FechaEntrada,
        FechaSalida,
        Estado,
        MontoReserva,
        Finca:IdFinca (
          NombreFinca,
          IdMunicipio,
          Municipio:IdMunicipio (NombreMunicipio)
        ),
        Usuario:NumeroDocumentoUsuario (
          NombreUsuario,
          ApellidoUsuario
        )
      `)
      .order('IdReserva', { ascending: false });

    if (error) {
      return { data: null, error: formatearErrorSupabase(error) };
    }

    return { data: (data || []).map(normalizarReserva), error: null };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

/**
 * Lista las reservas de un usuario específico (para "Mis Reservas" del cliente).
 */
export async function listarReservasPorUsuario(
  numeroDocumento: number
): Promise<ReservasResult> {
  try {
    // Intento 1: RPC
    const rpcRes = await supabase.rpc('SP_ListarReservasPorUsuario', {
      p_NumeroDocumentoUsuario: numeroDocumento,
    });

    if (!rpcRes.error && rpcRes.data) {
      return {
        data: (rpcRes.data as any[]).map(normalizarReserva),
        error: null,
      };
    }

    // Intento 2: Consulta directa
    const { data, error } = await supabase
      .from('Reserva')
      .select(`
        IdReserva,
        IdFinca,
        NumeroDocumentoUsuario,
        FechaReserva,
        FechaEntrada,
        FechaSalida,
        Estado,
        MontoReserva,
        Finca:IdFinca (
          NombreFinca,
          IdMunicipio,
          Municipio:IdMunicipio (NombreMunicipio)
        ),
        Usuario:NumeroDocumentoUsuario (
          NombreUsuario,
          ApellidoUsuario
        )
      `)
      .eq('NumeroDocumentoUsuario', numeroDocumento)
      .order('IdReserva', { ascending: false });

    if (error) {
      return { data: null, error: formatearErrorSupabase(error) };
    }

    return { data: (data || []).map(normalizarReserva), error: null };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}

/**
 * Permite cambiar el estado de una reserva (Confirmada, Cancelada, Completada).
 */
export async function actualizarEstadoReserva(
  idReserva: number,
  nuevoEstado: EstadoReserva
): Promise<OperacionReservaResult> {
  try {
    const { error } = await supabase
      .from('Reserva')
      .update({ Estado: nuevoEstado })
      .eq('IdReserva', idReserva);

    if (error) {
      return { success: false, error: formatearErrorSupabase(error) };
    }

    return { success: true, error: null };
  } catch (err: any) {
    return { success: false, error: formatearErrorSupabase(err) };
  }
}


/**
 * Lista las reservas activas (no canceladas) de una finca, para marcar
 * los días ocupados en el calendario de reserva.
 */
export async function listarReservasPorFinca(idFinca: number): Promise<ReservasResult> {
  try {
    const { data, error } = await supabase
      .from('Reserva')
      .select('IdReserva, IdFinca, NumeroDocumentoUsuario, FechaReserva, FechaEntrada, FechaSalida, Estado, MontoReserva')
      .eq('IdFinca', idFinca);

    if (error) {
      return { data: null, error: formatearErrorSupabase(error) };
    }

    const activas = (data || [])
      .map(normalizarReserva)
      .filter((r) => !esInactiva(r.Estado));
    return { data: activas, error: null };
  } catch (err: any) {
    return { data: null, error: formatearErrorSupabase(err) };
  }
}
