import React from 'react';
import { render, waitFor, userEvent } from '@testing-library/react-native';
import AdminFincasScreen from '../../src/app/(main)/admin/fincas';
import {
  listarFincas,
  cambiarEstadoFinca,
  eliminarFinca,
} from '../../src/services/fincas.service';
import { AuthProvider } from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../src/services/fincas.service', () => ({
  listarFincas: jest.fn(),
  cambiarEstadoFinca: jest.fn(),
  eliminarFinca: jest.fn(),
}));

describe('<AdminFincasScreen /> (con Mocks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.setItem(
      '@renfi_usuario_sesion',
      JSON.stringify({
        NumeroDocumento: 1,
        NombreUsuario: 'Admin',
        ApellidoUsuario: 'Renfi',
        Correo: 'admin@renfi.com',
        IdRol: 1,
        NombreRol: 'Administrador',
        Estado: 'Activo',
      })
    );
  });

  const mockFincas = [
    {
      IdFinca: 1,
      NombreFinca: 'Finca Campestre El Paraíso',
      IdMunicipio: 2,
      NombreMunicipio: 'Guatapé',
      Capacidad: 16,
      Precio: 850000,
      Estado: 'Disponible',
      Calificacion: 5,
      Imagenes: [],
    },
    {
      IdFinca: 2,
      NombreFinca: 'Villa Los Samanes',
      IdMunicipio: 3,
      NombreMunicipio: 'Santa Fe de Antioquia',
      Capacidad: 20,
      Precio: 1200000,
      Estado: 'Ocupada',
      Calificacion: 5,
      Imagenes: [],
    },
  ];

  test('debe listar todas las fincas en modo administración y mostrar opciones CRUD', async () => {
    (listarFincas as jest.Mock).mockResolvedValueOnce({
      data: mockFincas,
      error: null,
    });

    const screen = await render(
      <AuthProvider>
        <AdminFincasScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Gestión de Fincas')).toBeTruthy();
      expect(screen.getByText('+ Nueva')).toBeTruthy();
      expect(screen.getByText('Finca Campestre El Paraíso')).toBeTruthy();
      expect(screen.getByText('Villa Los Samanes')).toBeTruthy();
      expect(screen.getByText('2 fincas en catálogo')).toBeTruthy();
    });
  });

  test('debe llamar a cambiarEstadoFinca al presionar el badge de estado', async () => {
    const user = userEvent.setup();
    (listarFincas as jest.Mock).mockResolvedValue({
      data: mockFincas,
      error: null,
    });
    (cambiarEstadoFinca as jest.Mock).mockResolvedValueOnce({
      data: { ...mockFincas[0], Estado: 'Ocupada' },
      error: null,
    });

    const screen = await render(
      <AuthProvider>
        <AdminFincasScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Disponible')).toBeTruthy();
    });

    const badgeDisponible = screen.getByText('Disponible');
    await user.press(badgeDisponible);

    await waitFor(() => {
      expect(cambiarEstadoFinca).toHaveBeenCalledWith(1, 'Ocupada');
    });
  });
});

