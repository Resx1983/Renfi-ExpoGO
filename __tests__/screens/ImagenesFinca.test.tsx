import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import ImagenesFincaScreen from '../../src/app/administrador/imagenes-finca/[id]';
import {
  listarImagenesFinca, obtenerFincaPorId, subirImagenFinca, establecerPortada, eliminarImagen,
} from '../../src/services/fincas.service';
import { elegirFoto } from '../../src/services/fotos';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));
jest.mock('../../src/services/fincas.service', () => ({
  listarImagenesFinca: jest.fn(),
  obtenerFincaPorId: jest.fn(),
  subirImagenFinca: jest.fn(),
  establecerPortada: jest.fn(),
  eliminarImagen: jest.fn(),
}));
jest.mock('../../src/services/fotos', () => ({ elegirFoto: jest.fn() }));

const img = (id: number, extra: object = {}) => ({ IdImagen: id, UrlImagen: `https://cdn/${id}.webp`, IdFinca: 5, Orden: id, EsPortada: false, ...extra });

describe('Admin · Imágenes de la finca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: '5' });
    (obtenerFincaPorId as jest.Mock).mockResolvedValue({ data: { NombreFinca: 'Finca El Paraíso' }, error: null });
    (listarImagenesFinca as jest.Mock).mockResolvedValue({ data: [img(1, { EsPortada: true }), img(2)], error: null });
  });

  test('muestra la finca, el contador y marca la portada', async () => {
    await render(<ImagenesFincaScreen />);
    expect(await screen.findByText('Finca El Paraíso')).toBeTruthy();
    expect(screen.getByText(/2 de 10 imágenes/)).toBeTruthy();
    expect(screen.getByText('Portada')).toBeTruthy();
    expect(screen.getAllByText('Hacer portada')).toHaveLength(1); // solo la que no es portada
    expect(listarImagenesFinca).toHaveBeenCalledWith(5);
  });

  test('sin imágenes invita a agregar la primera', async () => {
    (listarImagenesFinca as jest.Mock).mockResolvedValue({ data: [], error: null });
    await render(<ImagenesFincaScreen />);
    expect(await screen.findByText('Esta finca todavía no tiene imágenes')).toBeTruthy();
  });

  test('agregar foto: elige, sube y recarga la galería', async () => {
    const archivo = { uri: 'file:///f.jpg', nombre: 'f.jpg', tipo: 'image/jpeg' };
    (elegirFoto as jest.Mock).mockResolvedValue({ foto: { archivo, vista: archivo.uri } });
    (subirImagenFinca as jest.Mock).mockResolvedValue({ data: img(3), error: null });
    await render(<ImagenesFincaScreen />);
    await screen.findByText('Finca El Paraíso');

    await fireEvent.press(screen.getByText('Agregar foto'));

    await waitFor(() => expect(subirImagenFinca).toHaveBeenCalledWith(5, archivo));
    await waitFor(() => expect(listarImagenesFinca).toHaveBeenCalledTimes(2));
  });

  test('si el usuario cancela la selección no se sube nada', async () => {
    (elegirFoto as jest.Mock).mockResolvedValue({ cancelado: true });
    await render(<ImagenesFincaScreen />);
    await screen.findByText('Finca El Paraíso');
    await fireEvent.press(screen.getByText('Agregar foto'));
    await waitFor(() => expect(elegirFoto).toHaveBeenCalled());
    expect(subirImagenFinca).not.toHaveBeenCalled();
  });

  test('muestra el error de la API al subir (p. ej. imagen demasiado grande)', async () => {
    (elegirFoto as jest.Mock).mockResolvedValue({ foto: { archivo: { uri: 'u', nombre: 'n', tipo: 't' }, vista: 'u' } });
    (subirImagenFinca as jest.Mock).mockResolvedValue({ data: null, error: 'La imagen supera el tamaño máximo de 5 MB.' });
    await render(<ImagenesFincaScreen />);
    await screen.findByText('Finca El Paraíso');
    await fireEvent.press(screen.getByText('Agregar foto'));
    expect(await screen.findByText('La imagen supera el tamaño máximo de 5 MB.')).toBeTruthy();
  });

  test('con 10 imágenes avisa del límite y deshabilita agregar', async () => {
    (listarImagenesFinca as jest.Mock).mockResolvedValue({
      data: Array.from({ length: 10 }, (_, i) => img(i + 1, { EsPortada: i === 0 })),
      error: null,
    });
    await render(<ImagenesFincaScreen />);
    expect(await screen.findByText(/Alcanzaste el máximo de 10 imágenes/)).toBeTruthy();
    await fireEvent.press(screen.getByText('Agregar foto'));
    expect(elegirFoto).not.toHaveBeenCalled();
  });

  test('hacer portada llama a la API y recarga', async () => {
    (establecerPortada as jest.Mock).mockResolvedValue({ data: img(2, { EsPortada: true }), error: null });
    await render(<ImagenesFincaScreen />);
    await fireEvent.press(await screen.findByText('Hacer portada'));
    await waitFor(() => expect(establecerPortada).toHaveBeenCalledWith(2));
    await waitFor(() => expect(listarImagenesFinca).toHaveBeenCalledTimes(2));
  });

  test('eliminar pide confirmación antes de borrar', async () => {
    (eliminarImagen as jest.Mock).mockResolvedValue({ success: true, error: null });
    await render(<ImagenesFincaScreen />);
    await screen.findByText('Finca El Paraíso');
    await fireEvent.press(screen.getAllByText('Eliminar')[1]); // la segunda (no portada)
    expect(await screen.findByText('¿Eliminar esta imagen?')).toBeTruthy();
    expect(eliminarImagen).not.toHaveBeenCalled();
    const botones = screen.getAllByText('Eliminar');
    await fireEvent.press(botones[botones.length - 1]);
    await waitFor(() => expect(eliminarImagen).toHaveBeenCalledWith(2));
  });

  test('un id inválido muestra "Finca no válida" sin llamar a la API', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'abc' });
    await render(<ImagenesFincaScreen />);
    expect(screen.getByText('Finca no válida')).toBeTruthy();
    expect(listarImagenesFinca).not.toHaveBeenCalled();
  });
});
