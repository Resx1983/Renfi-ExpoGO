import { api } from './api';
import { Reserva, MetodoDePago, CrearReservaDTO, EstadoReserva } from '../types';

// =============================================================================
// RESERVAS SERVICE — Reservas, pagos y facturación sobre API-Renfi.
// La API valida fechas, capacidad y cruces, calcula el monto (noches x precio)
// y solo deja operar sobre reservas propias.
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
    NombreFinca: row.NombreFinca ?? 'Finca Renfi',
    NombreMunicipio: row.NombreMunicipio ?? 'Antioquia',
    NombreCliente: row.NombreCliente ?? 'Cliente',
    ApellidoCliente: row.ApellidoCliente ?? '',
  };
}

/**
 * Obtiene los métodos de pago disponibles (requiere sesión).
 */
export async function listarMetodosDePago(): Promise<MetodosPagoResult> {
  const r = await api.get<MetodoDePago[]>('/api/metododepago');
  return r.error || !r.data ? { data: null, error: r.error } : { data: r.data, error: null };
}

const ESTADOS_INACTIVOS = ['cancelada', 'cancelado', 'anulada', 'anulado'];
export const esInactiva = (estado: string | null | undefined) => ESTADOS_INACTIVOS.includes((estado ?? '').trim().toLowerCase());

/**
 * Realiza una nueva reserva a nombre del usuario con sesión iniciada:
 * 1. La API registra la reserva y su factura (validando fechas, capacidad y cruces).
 * 2. Se registra el pago de la factura.
 *    Si el pago falla, se cancela la reserva para no dejarla a medias.
 */
export async function crearReserva(dto: CrearReservaDTO): Promise<CrearReservaResult> {
  const reserva = await api.post<any>('/api/reserva', {
    IdFinca: dto.IdFinca,
    FechaEntrada: dto.FechaEntrada,
    FechaSalida: dto.FechaSalida,
    MontoReserva: dto.MontoReserva,
    Huespedes: dto.Huespedes,
  });
  if (reserva.error || !reserva.data) return { data: null, error: reserva.error };

  const idReserva = Number(reserva.data.IdReserva);
  const idFactura = Number(reserva.data.IdFactura);

  const pago = await api.post<any>('/api/pago', {
    IdFactura: idFactura,
    IdMetodoDePago: dto.IdMetodoDePago,
    Monto: Math.round(dto.MontoReserva),
    EstadoPago: 'Pagado',
  });
  if (pago.error || !pago.data) {
    await api.put(`/api/reserva/${idReserva}`, { Estado: 'Cancelada' });
    return { data: null, error: pago.error };
  }

  return {
    data: normalizarReserva(reserva.data.reserva ?? reserva.data),
    idFactura,
    idPago: Number(pago.data.IdPago ?? pago.data.id),
    error: null,
  };
}

/**
 * Lista todas las reservas (panel de Administrador).
 */
export async function listarReservas(): Promise<ReservasResult> {
  const r = await api.get<any[]>('/api/reserva');
  return r.error || !r.data ? { data: null, error: r.error } : { data: r.data.map(normalizarReserva), error: null };
}

/**
 * Lista las reservas de un usuario (para "Mis Reservas"). Solo puede pedir las propias.
 */
export async function listarReservasPorUsuario(numeroDocumento: number): Promise<ReservasResult> {
  const r = await api.get<any[]>(`/api/reserva/usuario/${numeroDocumento}`);
  return r.error || !r.data ? { data: null, error: r.error } : { data: r.data.map(normalizarReserva), error: null };
}

/**
 * Cambia el estado de una reserva. Un cliente solo puede cancelar la suya.
 */
export async function actualizarEstadoReserva(
  idReserva: number,
  nuevoEstado: EstadoReserva
): Promise<OperacionReservaResult> {
  const r = await api.put(`/api/reserva/${idReserva}`, { Estado: nuevoEstado });
  return { success: !r.error, error: r.error };
}

/**
 * Reservas activas de una finca, para marcar los días ocupados en el calendario.
 * La API solo devuelve las fechas, sin datos personales.
 */
export async function listarReservasPorFinca(idFinca: number): Promise<ReservasResult> {
  const r = await api.get<{ IdFinca: number; FechaEntrada: string; FechaSalida: string }[]>(`/api/reserva/finca/${idFinca}/ocupadas`);
  if (r.error || !r.data) return { data: null, error: r.error };
  return {
    data: r.data.map((o, i) =>
      normalizarReserva({ ...o, IdReserva: -(i + 1), Estado: 'Activa', NumeroDocumentoUsuario: null })
    ),
    error: null,
  };
}
