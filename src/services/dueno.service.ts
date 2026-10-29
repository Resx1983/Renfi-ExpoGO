import { api } from './api';

// Lo que reciben las fincas del dueño autenticado (panel "Mi finca"). La API valida rol y propiedad.

export type Result<T> = { data: T | null; error: string | null };

export interface ReservaDueno {
  IdReserva: number;
  IdFinca: number;
  NombreFinca: string | null;
  NombreMunicipio: string | null;
  FechaEntrada: string;
  FechaSalida: string;
  MontoReserva: number;
  Estado: string | null;
  NombreCliente: string | null;
  ApellidoCliente: string | null;
  TelefonoCliente: string | null;
  CorreoCliente: string | null;
}

export interface PagoDueno {
  IdPago: number;
  IdReserva: number | null;
  NombreFinca: string | null;
  Monto: number;
  FechaPago: string | null;
  EstadoPago: string | null;
  NombreMetodoDePago: string | null;
}

export type EstadoGestion = 'Confirmada' | 'Finalizada' | 'Cancelada';

/** Estado normalizado: la API puede devolver "Cancelado"/"Anulada". */
export function estadoReserva(r: Pick<ReservaDueno, 'Estado'>): string {
  const e = String(r.Estado ?? 'Activa').trim().toLowerCase();
  return e.startsWith('cancel') || e.startsWith('anul') ? 'Cancelada' : e.charAt(0).toUpperCase() + e.slice(1);
}

export const etiquetaReserva = (r: Pick<ReservaDueno, 'Estado'>) => (estadoReserva(r) === 'Activa' ? 'Por confirmar' : estadoReserva(r));

/** Qué cambios de estado admite cada reserva. */
export function puedeCambiar(r: Pick<ReservaDueno, 'Estado'>, a: EstadoGestion): boolean {
  const e = estadoReserva(r);
  if (a === 'Confirmada') return e === 'Activa';
  if (a === 'Finalizada') return e === 'Confirmada';
  return e === 'Activa' || e === 'Confirmada';
}

export const esPagado = (p: Pick<PagoDueno, 'EstadoPago'>) => String(p.EstadoPago ?? '').toLowerCase() === 'pagado';

export async function listarMisReservas(): Promise<Result<ReservaDueno[]>> {
  const r = await api.get<ReservaDueno[]>('/api/reserva/mis-fincas');
  return r.error || !Array.isArray(r.data) ? { data: null, error: r.error ?? 'No fue posible cargar las reservas.' } : { data: r.data, error: null };
}

export async function listarMisPagos(): Promise<Result<PagoDueno[]>> {
  const r = await api.get<PagoDueno[]>('/api/pago/mis-fincas');
  return r.error || !Array.isArray(r.data) ? { data: null, error: r.error ?? 'No fue posible cargar los pagos.' } : { data: r.data, error: null };
}

export async function cambiarEstadoReserva(idReserva: number, estado: EstadoGestion): Promise<{ error: string | null }> {
  const r = await api.put(`/api/reserva/${idReserva}/estado`, { Estado: estado });
  return { error: r.error };
}
