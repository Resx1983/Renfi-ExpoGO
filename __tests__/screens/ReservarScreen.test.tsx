import React from 'react';
import { render, waitFor, userEvent } from '@testing-library/react-native';
import ReservarScreen from '../../src/app/(main)/reservar/[id]';
import { obtenerFincaPorId } from '../../src/services/fincas.service';
import { listarMetodosDePago, crearReserva } from '../../src/services/reservas.service';
import { AuthProvider } from '../../src/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../../src/services/fincas.service', () => ({
  obtenerFincaPorId: jest.fn(),
}));

jest.mock('../../src/services/reservas.service', () => ({
  listarMetodosDePago: jest.fn(),
  crearReserva: jest.fn(),
}));

describe('<ReservarScreen /> (con Mocks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.setItem(
      '@renfi_usuario_sesion',
      JSON.stringify({
        NumeroDocumento: 2,
        NombreUsuario: 'Cliente',
        ApellidoUsuario: 'Demo',
        Correo: 'cliente@renfi.com',
        IdRol: 2,
        NombreRol: 'Cliente',
        Estado: 'Activo',
      })
    );
  });

  const mockFinca = {
    IdFinca: 1,
    NombreFinca: 'Finca Campestre El Paraíso',
    IdMunicipio: 2,
    NombreMunicipio: 'Guatapé',
    Direccion: 'Km 5 Vía El Peñol',
    Capacidad: 16,
    Precio: 850000,
    Estado: 'Disponible',
    Calificacion: 5,
    Imagenes: [],
  };

  const mockMetodos = [
    { IdMetodoDePago: 1, NombreMetodoDePago: 'Efectivo', PagoMixto: false },
    { IdMetodoDePago: 4, NombreMetodoDePago: 'Nequi / Daviplata', PagoMixto: true },
  ];

  test('debe cargar la finca, métodos de pago y permitir confirmar la reserva', async () => {
    const user = userEvent.setup();

    (obtenerFincaPorId as jest.Mock).mockResolvedValueOnce({
      data: mockFinca,
      error: null,
    });
    (listarMetodosDePago as jest.Mock).mockResolvedValueOnce({
      data: mockMetodos,
      error: null,
    });
    (crearReserva as jest.Mock).mockResolvedValueOnce({
      data: {
        IdReserva: 99,
        IdFinca: 1,
        NombreFinca: 'Finca Campestre El Paraíso',
        MontoReserva: 1700000,
        Estado: 'Confirmada',
        FechaReserva: '2026-10-06',
        FechaEntrada: '2026-10-08',
        FechaSalida: '2026-10-10',
      },
      idFactura: 55,
      idPago: 33,
      error: null,
    });

    const screen = await render(
      <AuthProvider>
        <ReservarScreen />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Confirmar Reserva')).toBeTruthy();
      expect(screen.getByText('Finca Campestre El Paraíso')).toBeTruthy();
      expect(screen.getByText('Nequi / Daviplata')).toBeTruthy();
    });

    const botonConfirmar = screen.getByText('Confirmar y Pagar');
    await user.press(botonConfirmar);

    await waitFor(() => {
      expect(crearReserva).toHaveBeenCalled();
      expect(screen.getByText('¡Reserva Confirmada!')).toBeTruthy();
      expect(screen.getByText('Ver mis reservas')).toBeTruthy();
    });
  });
});

