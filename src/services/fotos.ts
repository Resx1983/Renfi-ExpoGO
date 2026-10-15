import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { ArchivoSubida } from './api';

// =============================================================================
// FOTOS — Elegir una foto de la galería y reducirla antes de subirla.
// La API vuelve a validar y optimizar; aquí solo se evita enviar fotos de 12 MP.
// =============================================================================

const LADO_MAXIMO = 1600;

export interface FotoElegida {
  archivo: ArchivoSubida;
  vista: string;
}

export type ResultadoFoto =
  | { foto: FotoElegida; cancelado?: false; error?: undefined }
  | { foto?: undefined; cancelado: true; error?: undefined }
  | { foto?: undefined; cancelado?: false; error: string };

/** Pide permiso, deja elegir una foto y la devuelve reducida (JPEG ≤ 1600 px). */
export async function elegirFoto(): Promise<ResultadoFoto> {
  const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permiso.granted) {
    return { error: 'Necesitas permitir el acceso a tus fotos para subir imágenes.' };
  }

  const elegida = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    quality: 1,
  });
  if (elegida.canceled || !elegida.assets?.[0]) return { cancelado: true };

  const original = elegida.assets[0];
  try {
    const contexto = ImageManipulator.manipulate(original.uri);
    // Solo se reduce el lado mayor; nunca se agranda
    const masAncha = (original.width || 0) >= (original.height || 0);
    const hayQueReducir = Math.max(original.width || 0, original.height || 0) > LADO_MAXIMO;
    if (hayQueReducir) contexto.resize(masAncha ? { width: LADO_MAXIMO } : { height: LADO_MAXIMO });
    const imagen = await contexto.renderAsync();
    const resultado = await imagen.saveAsync({ compress: 0.85, format: SaveFormat.JPEG });
    return {
      foto: { archivo: { uri: resultado.uri, nombre: `finca-${Date.now()}.jpg`, tipo: 'image/jpeg' }, vista: resultado.uri },
    };
  } catch {
    return { error: 'No se pudo preparar la foto. Prueba con otra imagen.' };
  }
}
