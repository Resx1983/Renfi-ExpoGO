import {
  listarMetodosDePago,
  crearReserva,
  listarReservas,
  listarReservasPorUsuario,
  listarReservasPorFinca,
  actualizarEstadoReserva,
} from '../../src/services/reservas.service';
import { api } from '../../src/services/api';

jest.mock('../../src/services/api', () => ({
  api: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const ok = (data: any, status = 200) => ({ data, error: null, status });
const fallo = (error: string, status = 500) => ({ data: null, error, status });

const reservaApi = {
  IdReserva: 10,
  IdFinca: 1,
  NumeroDocumentoUsuario: 2,
  FechaReserva: '2030-01-01T10:00:00',
  FechaEntrada: '2030-01-10T00:00:00',
  FechaSalida: '2030-01-12T00:00:00',
  Estado: 'Activa',
  MontoReserva: 1700000,
  NombreFinca: 'Finca El Paraíso',
  NombreMunicipio: 'Guatapé',
  NombreCliente: 'Juan',
  ApellidoCliente: 'Pérez',
};

describe('Reservas Service (contra la API)', () => {
  beforeEach(() => jest.resetAllMocks());

  test('listarMetodosDePago usa GET /api/metododepago', async () => {
    const metodos = [{ IdMetodoDePago: 1, NombreMetodoDePago: 'Efectivo', PagoMixto: false }];
    (api.get as jest.Mock).mockResolvedValueOnce(ok(metodos));
    const res = await listarMetodosDePago();
    expect(api.get).toHaveBeenCalledWith('/api/metododepago');
    expect(res.data).toEqual(metodos);
  });

  describe('crearReserva', () => {
    const dto: any = {
      IdFinca: 1, NumeroDocumentoUsuario: 2, FechaEntrada: '2030-01-10', FechaSalida: '2030-01-12',
      MontoReserva: 1700000, IdMetodoDePago: 1, Huespedes: 4,
    };

    test('crea reserva y pago; no envía el documento ni el estado (los fija la API)', async () => {
      (api.post as jest.Mock)
        .mockResolvedValueOnce(ok({ IdReserva: 10, IdFactura: 20, reserva: reservaApi }, 201))
        .mockResolvedValueOnce(ok({ IdPago: 30 }, 201));

      const res = await crearReserva(dto);

      const reservaEnviada = (api.post as jest.Mock).mock.calls[0][1];
      expect(reservaEnviada).toEqual({
        IdFinca: 1, FechaEntrada: '2030-01-10', FechaSalida: '2030-01-12', MontoReserva: 1700000, Huespedes: 4,
      });
      expect(api.post).toHaveBeenNthCalledWith(2, '/api/pago', { IdFactura: 20, IdMetodoDePago: 1, Monto: 1700000, EstadoPago: 'Pagado' });
      expect(res).toMatchObject({ error: null, idFactura: 20, idPago: 30 });
      expect(res.data?.IdReserva).toBe(10);
    });

    test('muestra el error de la API (cruce de fechas, capacidad...) y no intenta pagar', async () => {
      (api.post as jest.Mock).mockResolvedValueOnce(fallo('La finca ya tiene una reserva en las fechas seleccionadas', 409));
      const res = await crearReserva(dto);
      expect(res.data).toBeNull();
      expect(res.error).toBe('La finca ya tiene una reserva en las fechas seleccionadas');
      expect(api.post).toHaveBeenCalledTimes(1);
    });

    test('cancela la reserva si el pago falla', async () => {
      (api.post as jest.Mock)
        .mockResolvedValueOnce(ok({ IdReserva: 10, IdFactura: 20, reserva: reservaApi }, 201))
        .mockResolvedValueOnce(fallo('No tienes permisos para pagar esta factura.', 403));
      (api.put as jest.Mock).mockResolvedValueOnce(ok({}));

      const res = await crearReserva(dto);

      expect(res.data).toBeNull();
      expect(res.error).toBe('No tienes permisos para pagar esta factura.');
      expect(api.put).toHaveBeenCalledWith('/api/reserva/10', { Estado: 'Cancelada' });
    });
  });

  test('listarReservas (administrador) usa GET /api/reserva', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce(ok([reservaApi]));
    const res = await listarReservas();
    expect(api.get).toHaveBeenCalledWith('/api/reserva');
    expect(res.data![0]).toMatchObject({ IdReserva: 10, NombreFinca: 'Finca El Paraíso', NombreCliente: 'Juan' });
  });

  test('listarReservasPorUsuario usa la ruta del usuario', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce(ok([reservaApi]));
    const res = await listarReservasPorUsuario(2);
    expect(api.get).toHaveBeenCalledWith('/api/reserva/usuario/2');
    expect(res.data).toHaveLength(1);
  });

  test('listarReservasPorFinca devuelve solo fechas ocupadas (sin datos personales)', async () => {
    (api.get as jest.Mock).mockResolvedValueOnce(ok([
      { IdFinca: 1, FechaEntrada: '2030-01-10T00:00:00', FechaSalida: '2030-01-12T00:00:00' },
    ]));
    const res = await listarReservasPorFinca(1);
    expect(api.get).toHaveBeenCalledWith('/api/reserva/finca/1/ocupadas');
    expect(res.data![0]).toMatchObject({ Estado: 'Activa', NumeroDocumentoUsuario: null, FechaEntrada: '2030-01-10T00:00:00' });
  });

  test('actualizarEstadoReserva envía el nuevo estado', async () => {
    (api.put as jest.Mock).mockResolvedValueOnce(ok({}));
    const res = await actualizarEstadoReserva(10, 'Cancelada');
    expect(api.put).toHaveBeenCalledWith('/api/reserva/10', { Estado: 'Cancelada' });
    expect(res).toEqual({ success: true, error: null });
  });

  test('actualizarEstadoReserva devuelve el error (p. ej. reserva ajena)', async () => {
    (api.put as jest.Mock).mockResolvedValueOnce(fallo('No tienes permisos para acceder a este recurso.', 403));
    expect(await actualizarEstadoReserva(10, 'Cancelada')).toEqual({ success: false, error: 'No tienes permisos para acceder a este recurso.' });
  });
});
