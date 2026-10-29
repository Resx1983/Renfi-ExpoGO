import { estadoReserva, puedeCambiar, esPagado } from '../../src/services/dueno.service';
import { esDueno } from '../../src/context/AuthContext';

jest.mock('@react-native-async-storage/async-storage', () => ({ getItem: jest.fn(), setItem: jest.fn(), removeItem: jest.fn() }));

describe('panel del dueño', () => {
  test('puedeCambiar respeta el flujo Activa → Confirmada → Finalizada', () => {
    const activa = { Estado: 'Activa' };
    const confirmada = { Estado: 'Confirmada' };
    expect(puedeCambiar(activa, 'Confirmada')).toBe(true);
    expect(puedeCambiar(activa, 'Finalizada')).toBe(false);
    expect(puedeCambiar(confirmada, 'Finalizada')).toBe(true);
    expect(puedeCambiar({ Estado: 'Cancelado' }, 'Cancelada')).toBe(false);
  });

  test('normaliza estados y pagos', () => {
    expect(estadoReserva({ Estado: 'anulada' })).toBe('Cancelada');
    expect(estadoReserva({ Estado: null })).toBe('Activa');
    expect(esPagado({ EstadoPago: 'Pagado' })).toBe(true);
  });

  test('esDueno reconoce el rol por nombre, con o sin tilde', () => {
    expect(esDueno({ NombreRol: 'Dueño de finca' } as any)).toBe(true);
    expect(esDueno({ NombreRol: 'Propietario' } as any)).toBe(true);
    expect(esDueno({ NombreRol: 'Cliente' } as any)).toBe(false);
    expect(esDueno(null)).toBe(false);
  });
});
