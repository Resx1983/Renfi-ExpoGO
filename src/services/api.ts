import AsyncStorage from '@react-native-async-storage/async-storage';

// =============================================================================
// CLIENTE HTTP DE API-RENFI
// La app no habla con la base de datos: todo pasa por la API, que valida la
// sesión (JWT) y los permisos. Aquí no hay ninguna clave de Supabase.
// =============================================================================

const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '');
const TOKEN_KEY = '@renfi_token';
const TIMEOUT_MS = 15000;

if (!/^https:\/\//i.test(BASE_URL) && !/^http:\/\/(localhost|127\.0\.0\.1|10\.0\.2\.2|192\.168\.)/i.test(BASE_URL)) {
  console.warn('[api] EXPO_PUBLIC_API_URL debería usar https:// fuera del entorno de desarrollo.');
}

export interface ApiResult<T> {
  data: T | null;
  error: string | null;
  status: number;
}

let token: string | null = null;
let alExpirar: (() => void) | null = null;

/** Lee el token guardado (llamar al arrancar la app). */
export async function cargarToken(): Promise<string | null> {
  try {
    token = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    token = null;
  }
  return token;
}

/** Guarda (o borra, con null) el token de sesión. */
export async function guardarToken(nuevo: string | null): Promise<void> {
  token = nuevo;
  try {
    if (nuevo) await AsyncStorage.setItem(TOKEN_KEY, nuevo);
    else await AsyncStorage.removeItem(TOKEN_KEY);
  } catch (err) {
    console.warn('[api] No se pudo persistir el token:', err);
  }
}

/** Registra qué hacer cuando la API responde 401 con una sesión activa (token vencido). */
export function alExpirarSesion(cb: (() => void) | null): void {
  alExpirar = cb;
}

async function peticion<T>(metodo: string, ruta: string, cuerpo?: unknown): Promise<ApiResult<T>> {
  const controlador = new AbortController();
  const temporizador = setTimeout(() => controlador.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${BASE_URL}${ruta}`, {
      method: metodo,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
      signal: controlador.signal,
    });
    const json: any = await res.json().catch(() => null);

    if (res.ok) return { data: json as T, error: null, status: res.status };

    if (res.status === 401 && token && !ruta.startsWith('/api/usuario/login')) {
      await guardarToken(null);
      alExpirar?.();
    }
    return { data: null, error: json?.message || `Error ${res.status} del servidor.`, status: res.status };
  } catch (err: any) {
    const abortado = err?.name === 'AbortError';
    return {
      data: null,
      error: abortado
        ? 'El servidor tardó demasiado en responder. Intenta nuevamente.'
        : 'No fue posible conectar con el servidor. Revisa tu conexión a internet.',
      status: 0,
    };
  } finally {
    clearTimeout(temporizador);
  }
}

export const api = {
  get: <T = any>(ruta: string) => peticion<T>('GET', ruta),
  post: <T = any>(ruta: string, cuerpo?: unknown) => peticion<T>('POST', ruta, cuerpo ?? {}),
  put: <T = any>(ruta: string, cuerpo?: unknown) => peticion<T>('PUT', ruta, cuerpo ?? {}),
  delete: <T = any>(ruta: string) => peticion<T>('DELETE', ruta),
};
