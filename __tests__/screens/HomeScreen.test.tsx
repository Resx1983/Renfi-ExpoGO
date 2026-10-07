import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import HomeScreen from '../../src/app/(main)/home';
import { listarFincasDisponibles } from '../../src/services/fincas.service';
import { AuthProvider } from '../../src/context/AuthContext';

jest.mock('../../src/services/fincas.service', () => ({
  listarFincasDisponibles: jest.fn(),
}));

describe('<HomeScreen /> (con Mocks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFincas = [
    {
      IdFinca: 1,
      NombreFinca: 'Finca Campestre El Paraíso',
      Direccion: 'Guatapé',
      InformacionAdicional: 'Hermosa finca colonial',
      Capacidad: 16,
      Precio: 850000,
      Estado: 'Disponible',
      Calificacion: 5,
      IdMunicipio: 2,
      NombreMunicipio: 'Guatapé',
      NumeroDocumentoUsuario: 1,
      NombrePropietario: 'Admin',
      ApellidoPropietario: 'Renfi',
      Imagenes: [],
    },
    {
      IdFinca: 2,
      NombreFinca: 'Hacienda La Cordillera',
      Direccion: 'Rionegro',
      InformacionAdicional: 'Vista a la cordillera',
      Capacidad: 12,
      Precio: 950000,
      Estado: 'Disponible',
      Calificacion: 5,
      IdMunicipio: 6,
      NombreMunicipio: 'Rionegro',
      NumeroDocumentoUsuario: 1,
      NombrePropietario: 'Admin',
      ApellidoPropietario: 'Renfi',
      Imagenes: [],
    },
  ];

  test('debe mostrar la lista de fincas disponibles recuperadas del servicio', async () => {
    (listarFincasDisponibles as jest.Mock).mockResolvedValueOnce({
      data: mockFincas,
      error: null,
    });

    const { getByText } = await render(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Finca Campestre El Paraíso')).toBeTruthy();
      expect(getByText('Hacienda La Cordillera')).toBeTruthy();
      expect(getByText('2 encontradas')).toBeTruthy();
    });
  });

  test('debe mostrar estado vacío cuando no hay fincas disponibles', async () => {
    (listarFincasDisponibles as jest.Mock).mockResolvedValueOnce({
      data: [],
      error: null,
    });

    const { getByText } = await render(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Sin fincas disponibles')).toBeTruthy();
    });
  });

  test('debe mostrar mensaje de error si el servicio falla', async () => {
    (listarFincasDisponibles as jest.Mock).mockResolvedValueOnce({
      data: null,
      error: 'Error de conexión con la base de datos',
    });

    const { getByText } = await render(
      <AuthProvider>
        <HomeScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Error al cargar')).toBeTruthy();
      expect(getByText('Error de conexión con la base de datos')).toBeTruthy();
    });
  });
});

