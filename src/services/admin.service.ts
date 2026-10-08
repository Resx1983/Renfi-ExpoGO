import { supabase } from './supabase';
import type { OptionsSource } from '../constants/adminResources';

// CRUD genérico del panel admin sobre supabase.from(tabla). Siempre devuelve { data, error }.

export type Row = Record<string, any>;
export interface Result<T> {
  data: T | null;
  error: string | null;
}

function mensaje(err: any, fallback: string, eliminando = false): string {
  if (err?.code === '23503') {
    return eliminando
      ? 'No se puede eliminar: hay registros relacionados que dependen de este.'
      : 'El valor elegido hace referencia a un registro que no existe.';
  }
  if (err?.code === '23505') return 'Ya existe un registro con esos datos.';
  return err?.message ? `${fallback} ${err.message}` : fallback;
}

async function run<T>(op: () => PromiseLike<{ data: T | null; error: any }>, fallback: string, eliminando = false): Promise<Result<T>> {
  try {
    const { data, error } = await op();
    return error ? { data: null, error: mensaje(error, fallback, eliminando) } : { data, error: null };
  } catch (e) {
    return { data: null, error: mensaje(e, fallback, eliminando) };
  }
}

export const listarRegistros = (table: string, idField: string) =>
  run<Row[]>(() => supabase.from(table).select('*').order(idField, { ascending: false }), 'No fue posible cargar los datos.');

export const crearRegistro = (table: string, values: Row) =>
  run<Row[]>(() => supabase.from(table).insert(values).select(), 'Ocurrió un error al guardar los cambios.');

export const actualizarRegistro = (table: string, idField: string, id: string | number, values: Row) =>
  run<Row[]>(() => supabase.from(table).update(values).eq(idField, id).select(), 'Ocurrió un error al guardar los cambios.');

// Igual que API-Renfi (develop): estos catálogos tienen FK ON DELETE SET NULL,
// así que se bloquea el borrado si están en uso para no dejar registros huérfanos.
const REFERENCIAS: Record<string, { table: string; column: string; mensaje: string }> = {
  Rol: { table: 'Usuario', column: 'IdRol', mensaje: 'No se puede eliminar el rol: tiene usuarios asociados.' },
  Municipio: { table: 'Finca', column: 'IdMunicipio', mensaje: 'No se puede eliminar el municipio: tiene fincas asociadas.' },
  MetodoDePago: { table: 'Pago', column: 'IdMetodoDePago', mensaje: 'No se puede eliminar el método de pago: tiene pagos asociados.' },
};

export async function eliminarRegistro(table: string, idField: string, id: string | number): Promise<Result<Row[]>> {
  const ref = REFERENCIAS[table];
  if (ref) {
    const { count, error } = await supabase.from(ref.table).select('*', { count: 'exact', head: true }).eq(ref.column, id);
    if (error) return { data: null, error: mensaje(error, 'No fue posible eliminar el registro.', true) };
    if (count) return { data: null, error: ref.mensaje };
  }
  return run<Row[]>(() => supabase.from(table).delete().eq(idField, id).select(), 'No fue posible eliminar el registro.', true);
}

export async function contarRegistros(table: string): Promise<Result<number>> {
  try {
    const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
    return error ? { data: null, error: mensaje(error, 'No fue posible cargar los datos.') } : { data: count ?? 0, error: null };
  } catch (e) {
    return { data: null, error: mensaje(e, 'No fue posible cargar los datos.') };
  }
}

/** Opciones {label, value} para un select alimentado por otra tabla. */
export async function cargarOpciones(source: OptionsSource): Promise<Result<{ label: string; value: any }[]>> {
  const r = await run<Row[]>(
    () => supabase.from(source.table).select([source.value, ...source.label].join(',')),
    'No fue posible cargar las opciones.'
  );
  if (!r.data) return { data: null, error: r.error };
  return {
    data: r.data.map((row) => ({ value: row[source.value], label: source.label.map((c) => row[c]).join(' ') })),
    error: null,
  };
}
