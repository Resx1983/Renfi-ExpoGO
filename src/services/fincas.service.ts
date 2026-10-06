import { supabase } from './supabase';
import { Finca } from '../types';

// =============================================================================
// FINCAS SERVICE — usa SP_ListarFincas (RPC) del esquema SQL
// =============================================================================

export interface FincasResult {
  data: Finca[] | null;
  error: string | null;
}

/**
 * Lista todas las fincas con datos de municipio y propietario.
 * Llama al stored procedure SP_ListarFincas.
 */
export async function listarFincas(): Promise<FincasResult> {
  try {
    const { data, error } = await supabase.rpc('SP_ListarFincas');

    if (error) {
      return { data: null, error: error.message };
    }

    return { data: data as Finca[], error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? 'Error desconocido.' };
  }
}

/**
 * Lista fincas disponibles filtrando por estado 'Disponible'.
 */
export async function listarFincasDisponibles(): Promise<FincasResult> {
  try {
    const { data, error } = await supabase.rpc('SP_ListarFincas');

    if (error) {
      return { data: null, error: error.message };
    }

    const disponibles = (data as Finca[]).filter(
      (f) => f.Estado === 'Disponible'
    );
    return { data: disponibles, error: null };
  } catch (err: any) {
    return { data: null, error: err.message ?? 'Error desconocido.' };
  }
}
