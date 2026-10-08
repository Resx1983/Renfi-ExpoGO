import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react-native';
import { construirMes, diasOcupados, sumarDias, hayConflicto, fechaLarga } from '../../src/components/ReservaCalendar';
import Pago from '../../src/app/reserva/pago';
import { checkout } from '../../src/services/checkout';
import { crearReserva } from '../../src/services/reservas.service';

jest.mock('@expo/vector-icons', () => ({ Ionicons: () => null }));

jest.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({
    usuario: { NumeroDocumento: 1, IdRol: 2, NombreUsuario: 'Ana', ApellidoUsuario: 'Gómez', Telefono: null, Correo: 'a@b.co', Estado: 'Activo', NombreRol: 'Cliente' },
    setUsuario: jest.fn(),
    cerrarSesion: jest.fn(),
  }),
  esAdmin: () => false,
}));

jest.mock('../../src/services/reservas.service', () => ({
  listarMetodosDePago: jest.fn(async () => ({ data: [{ IdMetodoDePago: 1, NombreMetodoDePago: 'Nequi', PagoMixto: false }], error: null })),
  crearReserva: jest.fn(),
}));

describe('helpers del calendario', () => {
  it('ocupa [entrada, salida)', () => {
    const s = diasOcupados([{ FechaEntrada: '2026-10-30', FechaSalida: '2026-11-02T00:00:00' }]);
    expect([...s]).toEqual(['2026-10-30', '2026-10-31', '2026-11-01']);
    expect(hayConflicto('2026-11-02', 2, s)).toBe(false);
    expect(hayConflicto('2026-10-29', 2, s)).toBe(true);
  });

  it('sumarDias cruza mes/año', () => {
    expect(sumarDias('2026-12-31', 1)).toBe('2027-01-01');
    expect(sumarDias('2026-03-01', -1)).toBe('2026-02-28');
  });

  it('el mes empieza en lunes', () => {
    const c = construirMes(2026, 9); // oct 2026: jueves 1
    expect(c).toHaveLength(35);
    expect(c[0].ymd).toBe('2026-09-28');
    expect(c[3]).toMatchObject({ ymd: '2026-10-01', delMes: true });
    expect(c[0].delMes).toBe(false);
  });

  it('fecha larga en español', () => {
    expect(fechaLarga('2026-10-12')).toBe('lunes, 12 de octubre de 2026');
  });
});

describe('Pasarela de pago', () => {
  beforeEach(() => {
    checkout.setBorrador({
      fincaId: 5, fincaNombre: 'Finca Real', municipio: 'Guatapé', fincaImagen: null, precioNoche: 100000,
      fechaEntrada: '2026-10-12', fechaSalida: '2026-10-14', noches: 2, huespedes: 3, montoTotal: 200000,
    });
  });

  it('muestra resumen y confirma con Huespedes sin Estado', async () => {
    (crearReserva as jest.Mock).mockResolvedValue({ data: { IdReserva: 9 }, idFactura: 3, idPago: 4, error: null });
    await render(<Pago />);
    expect(screen.getByText('Confirma y paga tu reserva')).toBeTruthy();
    expect(screen.getByText('Finca Real')).toBeTruthy();
    expect(screen.getAllByText(/200.000/).length).toBeGreaterThan(0);
    await waitFor(() => expect(screen.getByText('Nequi')).toBeTruthy());
    await fireEvent.press(screen.getByText('Confirmar reserva'));
    expect(crearReserva).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByText('Acepto los términos y condiciones del servicio de reserva'));
    await fireEvent.press(screen.getByText('Confirmar reserva'));
    await waitFor(() => expect(crearReserva).toHaveBeenCalled());
    const dto = (crearReserva as jest.Mock).mock.calls[0][0];
    expect(dto.Huespedes).toBe(3);
    expect(dto).not.toHaveProperty('Estado');
  });
});
