// =============================================================================
// TIPOS - RENFI MOBILE
// Modelo de datos según esquema Supabase
// =============================================================================

export interface Rol {
  IdRol: number;
  NombreRol: string;
}

export interface Usuario {
  NumeroDocumento: number;
  IdRol: number | null;
  NombreUsuario: string;
  ApellidoUsuario: string;
  Telefono: string | null;
  Contrasena: string;
  Correo: string;
  Estado: string;
  // Join
  NombreRol?: string;
}

export interface Municipio {
  IdMunicipio: number;
  NombreMunicipio: string;
}

export interface Finca {
  IdFinca: number;
  IdMunicipio: number | null;
  NumeroDocumentoUsuario: number | null;
  NombreFinca: string;
  Direccion: string | null;
  InformacionAdicional: string | null;
  Capacidad: number;
  Precio: number;
  Estado: string;
  Calificacion: number;
  // Joins
  NombreMunicipio?: string;
  NombrePropietario?: string;
  ApellidoPropietario?: string;
  TelefonoPropietario?: string;
  CorreoPropietario?: string;
  Imagenes?: Imagen[];
}

export interface Imagen {
  IdImagen: number;
  UrlImagen: string;
  IdFinca: number;
}

export interface MetodoDePago {
  IdMetodoDePago: number;
  NombreMetodoDePago: string;
  PagoMixto: boolean;
}

export interface Reserva {
  IdReserva: number;
  IdFinca: number;
  NumeroDocumentoUsuario: number | null;
  FechaReserva: string;
  FechaEntrada: string | null;
  FechaSalida: string | null;
  Estado: string;
  MontoReserva: number;
  // Joins
  NombreFinca?: string;
  NombreMunicipio?: string;
  NombreCliente?: string;
  ApellidoCliente?: string;
}

export interface Factura {
  IdFactura: number;
  IdReserva: number;
  FechaFactura: string;
  Total: number;
}

export interface Pago {
  IdPago: number;
  IdFactura: number;
  IdMetodoDePago: number | null;
  Monto: number;
  FechaPago: string;
  EstadoPago: string;
}

// =============================================================================
// TIPOS DE CONTEXTO / SESIÓN
// =============================================================================

export interface SesionUsuario {
  NumeroDocumento: number;
  IdRol: number;
  NombreUsuario: string;
  ApellidoUsuario: string;
  Telefono: string | null;
  Correo: string;
  Estado: string;
  NombreRol: string;
}

export type EstadoFinca = 'Disponible' | 'Ocupada' | 'Mantenimiento';
export type EstadoReserva = 'Activa' | 'Pendiente' | 'Confirmada' | 'Cancelada' | 'Completada';
export type EstadoPago = 'Pendiente' | 'Pagado' | 'Rechazado';

// =============================================================================
// PARÁMETROS / DTOs
// =============================================================================

export interface CrearFincaDTO {
  NombreFinca: string;
  IdMunicipio: number;
  NumeroDocumentoUsuario?: number | null;
  Direccion?: string | null;
  InformacionAdicional?: string | null;
  Capacidad: number;
  Precio: number;
  Estado?: EstadoFinca;
  Calificacion?: number;
  UrlImagen?: string | null;
}

export interface ModificarFincaDTO {
  NombreFinca?: string;
  IdMunicipio?: number;
  NumeroDocumentoUsuario?: number | null;
  Direccion?: string | null;
  InformacionAdicional?: string | null;
  Capacidad?: number;
  Precio?: number;
  Estado?: EstadoFinca;
  Calificacion?: number;
  UrlImagen?: string | null;
}

export interface CrearReservaDTO {
  IdFinca: number;
  NumeroDocumentoUsuario: number;
  FechaEntrada: string;
  FechaSalida: string;
  MontoReserva: number;
  IdMetodoDePago: number;
  Huespedes?: number;
  Estado?: EstadoReserva;
}
