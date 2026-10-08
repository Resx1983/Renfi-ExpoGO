import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { useLocalSearchParams } from 'expo-router';
import RecursoScreen from '../../src/app/administrador/[recurso]';
import { listarRegistros, eliminarRegistro } from '../../src/services/admin.service';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null })); // expo-asset no está instalado en este entorno
jest.mock('../../src/services/admin.service', () => ({
  listarRegistros: jest.fn(),
  cargarOpciones: jest.fn(() => Promise.resolve({ data: [], error: null })),
  crearRegistro: jest.fn(),
  actualizarRegistro: jest.fn(),
  eliminarRegistro: jest.fn(),
}));

describe('Admin [recurso] (municipios)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useLocalSearchParams as jest.Mock).mockReturnValue({ recurso: 'municipios' });
    (listarRegistros as jest.Mock).mockResolvedValue({
      data: [{ IdMunicipio: 1, NombreMunicipio: 'Medellín' }, { IdMunicipio: 2, NombreMunicipio: 'Guatapé' }],
      error: null,
    });
  });

  test('renderiza los registros', async () => {
    await render(<RecursoScreen />);
    expect(await screen.findByText('Medellín')).toBeTruthy();
    expect(screen.getByText('Guatapé')).toBeTruthy();
    expect(screen.getByText('2', { exact: true })).toBeTruthy();
    expect(listarRegistros).toHaveBeenCalledWith('Municipio', 'IdMunicipio');
  });

  test('"＋ Nuevo registro" abre el formulario', async () => {
    await render(<RecursoScreen />);
    await screen.findByText('Medellín');
    await fireEvent.press(screen.getByText('Nuevo registro'));
    expect(await screen.findByText('Crear nuevo registro')).toBeTruthy();
    expect(screen.getByText('Completa los campos del registro. Los marcados con * son obligatorios.')).toBeTruthy();
  });

  test('"Eliminar" pide confirmación antes de borrar', async () => {
    (eliminarRegistro as jest.Mock).mockResolvedValue({ error: null });
    await render(<RecursoScreen />);
    await screen.findByText('Medellín');
    await fireEvent.press(screen.getAllByText('Eliminar')[0]);
    expect(await screen.findByText('¿Eliminar el registro 1?')).toBeTruthy();
    expect(eliminarRegistro).not.toHaveBeenCalled();
    await fireEvent.press(screen.getAllByText('Eliminar')[screen.getAllByText('Eliminar').length - 1]);
    await waitFor(() => expect(eliminarRegistro).toHaveBeenCalledWith('Municipio', 'IdMunicipio', 1));
  });

  test('recurso desconocido muestra "Recurso no encontrado"', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ recurso: 'nada' });
    await render(<RecursoScreen />);
    expect(screen.getByText('Recurso no encontrado')).toBeTruthy();
  });
});
