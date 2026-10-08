// =============================================================================
// CHECKOUT — Estado en memoria entre Detalle → Pasarela de pago → Comprobante
// (equivalente a reserva-checkout.service de la web)
// =============================================================================

export interface BorradorReserva {
  fincaId: number;
  fincaNombre: string;
  municipio: string;
  fincaImagen: string | null;
  precioNoche: number;
  fechaEntrada: string; // YYYY-MM-DD
  fechaSalida: string; // YYYY-MM-DD
  noches: number;
  huespedes: number;
  montoTotal: number;
}

export interface ResultadoReserva {
  borrador: BorradorReserva;
  idReserva: number;
  idFactura: number | null;
  idPago: number | null;
  metodoPago: string;
  fechaPago: string; // ISO
  aNombreDe: string;
}

let borrador: BorradorReserva | null = null;
let resultado: ResultadoReserva | null = null;

export const checkout = {
  getBorrador: () => borrador,
  setBorrador: (b: BorradorReserva | null) => {
    borrador = b;
  },
  getResultado: () => resultado,
  setResultado: (r: ResultadoReserva | null) => {
    resultado = r;
  },
};
