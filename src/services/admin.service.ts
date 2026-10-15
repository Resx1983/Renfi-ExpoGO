import { api } from './api';
import type { OptionsSource } from '../constants/adminResources';

// CRUD genérico del panel admin sobre la API (cada tabla tiene su ruta). Siempre devuelve { data, error }.
// La API exige rol de administrador en todas estas rutas.

export type Row = Record<string, any>;
export interface Result<T> {
  data: T | null;
  error: string | null;
}

const RUTAS: Record<string, string> = {
  Usuario: '/api/usuario',
  Finca: '/api/finca',
  Reserva: '/api/reserva',
  Pago: '/api/pago',
  Factura: '/api/factura',
  MetodoDePago: '/api/metododepago',
  Imagen: '/api/imagen',
  Municipio: '/api/municipio',
  Rol: '/api/rol',
};

function ruta(table: string): string {
  const r = RUTAS[table];
  if (!r) throw new Error(`Recurso desconocido: ${table}`);
  return r;
}

export async function listarRegistros(table: string, idField: string): Promise<Result<Row[]>> {
  const r = await api.get<Row[]>(ruta(table));
  if (r.error || !r.data) return { data: null, error: r.error || 'No fue posible cargar los datos.' };
  // Más recientes primero (los listados de la API no tienen un orden común)
  return { data: [...r.data].sort((a, b) => Number(b[idField]) - Number(a[idField])), error: null };
}

export async function crearRegistro(table: string, values: Row): Promise<Result<Row[]>> {
  const r = await api.post(ruta(table), values);
  return r.error ? { data: null, error: r.error } : { data: [r.data], error: null };
}

export async function actualizarRegistro(table: string, _idField: string, id: string | number, values: Row): Promise<Result<Row[]>> {
  const r = await api.put(`${ruta(table)}/${id}`, values);
  return r.error ? { data: null, error: r.error } : { data: [r.data], error: null };
}

// La API ya impide borrar roles, municipios o métodos de pago que están en uso.
export async function eliminarRegistro(table: string, _idField: string, id: string | number): Promise<Result<Row[]>> {
  const r = await api.delete(`${ruta(table)}/${id}`);
  return r.error ? { data: null, error: r.error } : { data: [], error: null };
}

export async function contarRegistros(table: string): Promise<Result<number>> {
  const r = await api.get<Row[]>(ruta(table));
  return r.error || !r.data ? { data: null, error: r.error || 'No fue posible cargar los datos.' } : { data: r.data.length, error: null };
}

/** Opciones {label, value} para un select alimentado por otra tabla. */
export async function cargarOpciones(source: OptionsSource): Promise<Result<{ label: string; value: any }[]>> {
  const r = await api.get<Row[]>(ruta(source.table));
  if (r.error || !r.data) return { data: null, error: r.error || 'No fue posible cargar las opciones.' };
  return {
    data: r.data.map((row) => ({ value: row[source.value], label: source.label.map((c) => row[c]).join(' ') })),
    error: null,
  };
}
