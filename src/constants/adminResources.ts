// Configuración de los módulos CRUD del panel de administración (slug -> tabla Supabase).

export type FieldType = 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea' | 'select' | 'boolean';

export interface OptionsSource {
  table: string;
  value: string;
  /** Columnas que forman la etiqueta (se unen con espacio). */
  label: string[];
}

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  /** Opciones fijas para selects. */
  options?: { label: string; value: string }[];
  /** Opciones cargadas de otra tabla. */
  source?: OptionsSource;
}

export interface Recurso {
  slug: string;
  table: string;
  idField: string;
  title: string;
  description: string;
  fields: Field[];
}

const estados = (...v: string[]) => v.map((s) => ({ label: s, value: s }));
const src = (table: string, value: string, ...label: string[]): OptionsSource => ({ table, value, label });

export const RECURSOS: Recurso[] = [
  {
    slug: 'usuarios', table: 'Usuario', idField: 'NumeroDocumento', title: 'Usuarios',
    description: 'Gestiona clientes y administradores',
    fields: [
      { name: 'NombreUsuario', label: 'Nombre', type: 'text', required: true },
      { name: 'ApellidoUsuario', label: 'Apellido', type: 'text', required: true },
      { name: 'Correo', label: 'Correo', type: 'email', required: true },
      { name: 'Contrasena', label: 'Contraseña', type: 'password', required: true },
      { name: 'Telefono', label: 'Teléfono', type: 'text' },
      { name: 'IdRol', label: 'Rol', type: 'select', required: true, source: src('Rol', 'IdRol', 'NombreRol') },
      { name: 'Estado', label: 'Estado', type: 'select', required: true, options: estados('Activo', 'Inactivo') },
    ],
  },
  {
    slug: 'fincas', table: 'Finca', idField: 'IdFinca', title: 'Fincas',
    description: 'Administra la información de las fincas',
    fields: [
      { name: 'NombreFinca', label: 'Nombre de la finca', type: 'text', required: true },
      { name: 'Direccion', label: 'Dirección', type: 'text', required: true },
      { name: 'IdMunicipio', label: 'Municipio', type: 'select', source: src('Municipio', 'IdMunicipio', 'NombreMunicipio') },
      {
        name: 'NumeroDocumentoUsuario', label: 'Propietario', type: 'select',
        source: src('Usuario', 'NumeroDocumento', 'NombreUsuario', 'ApellidoUsuario'),
      },
      { name: 'Precio', label: 'Precio por noche', type: 'number' },
      { name: 'Capacidad', label: 'Capacidad', type: 'number' },
      { name: 'Estado', label: 'Estado', type: 'select', options: estados('Disponible', 'Ocupada', 'Mantenimiento', 'No disponible') },
      { name: 'InformacionAdicional', label: 'Información adicional', type: 'textarea' },
      { name: 'Calificacion', label: 'Calificación', type: 'number' },
    ],
  },
  {
    slug: 'reservas', table: 'Reserva', idField: 'IdReserva', title: 'Reservas',
    description: 'Control de reservas y estados',
    fields: [
      {
        name: 'NumeroDocumentoUsuario', label: 'Usuario', type: 'select', required: true,
        source: src('Usuario', 'NumeroDocumento', 'NombreUsuario', 'ApellidoUsuario'),
      },
      { name: 'IdFinca', label: 'Finca', type: 'select', required: true, source: src('Finca', 'IdFinca', 'NombreFinca') },
      { name: 'FechaEntrada', label: 'Fecha de entrada', type: 'date', required: true },
      { name: 'FechaSalida', label: 'Fecha de salida', type: 'date', required: true },
      { name: 'MontoReserva', label: 'Monto de la reserva', type: 'number', required: true },
      { name: 'Estado', label: 'Estado', type: 'select', options: estados('Pendiente', 'Confirmada', 'Completada', 'Cancelada') },
    ],
  },
  {
    slug: 'pagos', table: 'Pago', idField: 'IdPago', title: 'Pagos',
    description: 'Pagos recibidos y pendientes',
    fields: [
      { name: 'IdFactura', label: 'Factura (ID)', type: 'number', required: true },
      {
        name: 'IdMetodoDePago', label: 'Método de pago', type: 'select', required: true,
        source: src('MetodoDePago', 'IdMetodoDePago', 'NombreMetodoDePago'),
      },
      { name: 'Monto', label: 'Monto del pago', type: 'number', required: true },
      { name: 'FechaPago', label: 'Fecha de pago', type: 'date' },
      { name: 'EstadoPago', label: 'Estado del pago', type: 'select', options: estados('Pendiente', 'Pagado', 'Rechazado') },
    ],
  },
  {
    slug: 'facturas', table: 'Factura', idField: 'IdFactura', title: 'Facturas',
    description: 'Emisión y seguimiento de facturas',
    fields: [
      { name: 'IdReserva', label: 'ID Reserva', type: 'number', required: true },
      { name: 'FechaFactura', label: 'Fecha de factura', type: 'date' },
      { name: 'Total', label: 'Total facturado', type: 'number', required: true },
    ],
  },
  {
    slug: 'metodos-de-pago', table: 'MetodoDePago', idField: 'IdMetodoDePago', title: 'Métodos de pago',
    description: 'Configura los métodos de pago disponibles',
    fields: [
      { name: 'NombreMetodoDePago', label: 'Nombre del método', type: 'text', required: true },
      {
        name: 'PagoMixto', label: 'Permite pago mixto', type: 'boolean',
        options: [{ label: 'Sí', value: 'true' }, { label: 'No', value: 'false' }],
      },
    ],
  },
  {
    slug: 'imagenes', table: 'Imagen', idField: 'IdImagen', title: 'Imágenes',
    description: 'Gestiona galerías y material multimedia',
    fields: [
      { name: 'UrlImagen', label: 'URL de la imagen', type: 'text', required: true },
      { name: 'IdFinca', label: 'Finca', type: 'select', required: true, source: src('Finca', 'IdFinca', 'NombreFinca') },
    ],
  },
  {
    slug: 'municipios', table: 'Municipio', idField: 'IdMunicipio', title: 'Municipios',
    description: 'Cobertura y estadísticas por municipio',
    fields: [{ name: 'NombreMunicipio', label: 'Nombre del municipio', type: 'text', required: true }],
  },
  {
    slug: 'roles', table: 'Rol', idField: 'IdRol', title: 'Roles',
    description: 'Permisos y roles habilitados en Renfi',
    fields: [{ name: 'NombreRol', label: 'Nombre del rol', type: 'text', required: true }],
  },
];

export const getRecurso = (slug?: string) => RECURSOS.find((r) => r.slug === slug);

/** Ítems del drawer: Inicio + cada recurso. */
export const ADMIN_NAV = [
  { slug: '', title: 'Inicio', description: 'Resumen general y reportes clave' },
  ...RECURSOS.map(({ slug, title, description }) => ({ slug, title, description })),
];
