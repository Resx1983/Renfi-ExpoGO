import {
  crearReserva,
  listarReservas,
  listarReservasPorUsuario,
  actualizarEstadoReserva,
  listarMetodosDePago,
} from '../../src/services/reservas.service';
import { supabase } from '../../src/services/supabase';

jest.mock('../../src/services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

describe('Reservas Service (con Mocks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── 1. Metodos de pago ─────────────────────────────────────────────────────
  describe('listarMetodosDePago()', () => {
    test('debe retornar lista de métodos de pago vía RPC exitoso', async () => {
      const mockMetodos = [
        { IdMetodoDePago: 1, NombreMetodoDePago: 'Efectivo', PagoMixto: false },
        { IdMetodoDePago: 4, NombreMetodoDePago: 'Nequi / Daviplata', PagoMixto: true },
      ];

      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: mockMetodos,
        error: null,
      });

      const { data, error } = await listarMetodosDePago();

      expect(supabase.rpc).toHaveBeenCalledWith('SP_ListarMetodosDePago');
      expect(error).toBeNull();
      expect(data).toHaveLength(2);
      expect(data?.[1].NombreMetodoDePago).toBe('Nequi / Daviplata');
    });

    test('debe usar fallback a tabla MetodoDePago si el RPC no está disponible', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST202', message: 'Function not found' },
      });

      const mockFrom = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: [{ IdMetodoDePago: 1, NombreMetodoDePago: 'Efectivo', PagoMixto: false }],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { data, error } = await listarMetodosDePago();

      expect(supabase.from).toHaveBeenCalledWith('MetodoDePago');
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  });

  // ── 2. Crear reserva ───────────────────────────────────────────────────────
  describe('crearReserva()', () => {
    // Cadena PostgREST simulada: thenable para consultas de lista, terminales para single/maybeSingle
    const query = (result: { data: any; error: any }) => {
      const chain: any = { then: (ok: any, ko: any) => Promise.resolve(result).then(ok, ko) };
      for (const m of ['select', 'insert', 'delete', 'eq', 'lt', 'gt']) chain[m] = jest.fn(() => chain);
      chain.single = jest.fn().mockResolvedValue(result);
      chain.maybeSingle = jest.fn().mockResolvedValue(result);
      return chain;
    };

    const dto = {
      IdFinca: 1,
      NumeroDocumentoUsuario: 2,
      FechaEntrada: '2026-10-10',
      FechaSalida: '2026-10-12',
      MontoReserva: 1700000,
      IdMetodoDePago: 4,
      Huespedes: 4,
    };

    const reservaDB = {
      IdReserva: 101,
      IdFinca: 1,
      NumeroDocumentoUsuario: 2,
      FechaReserva: '2026-10-06T18:00:00Z',
      FechaEntrada: '2026-10-10',
      FechaSalida: '2026-10-12',
      Estado: 'Activa',
      MontoReserva: 1700000,
      Finca: { NombreFinca: 'Finca Campestre El Paraíso', IdMunicipio: 2, Municipio: { NombreMunicipio: 'Guatapé' } },
      Usuario: { NombreUsuario: 'Cliente', ApellidoUsuario: 'Demo' },
    };

    // Reserva: 1ª llamada = consulta de cruces, 2ª = insert, 3ª = rollback (delete)
    const montar = (opts: { cruces?: any[]; pago?: any; capacidad?: number }) => {
      const reservaCalls = [
        query({ data: opts.cruces ?? [], error: null }),
        query({ data: reservaDB, error: null }),
        query({ data: null, error: null }),
      ];
      const rollback = reservaCalls[2];
      const tablas: Record<string, any> = {
        Finca: query({ data: { Capacidad: opts.capacidad ?? 10 }, error: null }),
        Factura: query({ data: { IdFactura: 501 }, error: null }),
        Pago: query(opts.pago ?? { data: { IdPago: 801 }, error: null }),
      };
      (supabase.from as jest.Mock).mockImplementation((t: string) => (t === 'Reserva' ? reservaCalls.shift() : tablas[t]));
      return { rollback };
    };

    test('inserta reserva Activa, factura y pago', async () => {
      montar({});
      const { data, idFactura, idPago, error } = await crearReserva(dto);
      expect(error).toBeNull();
      expect(data?.IdReserva).toBe(101);
      expect(data?.Estado).toBe('Activa');
      expect(data?.NombreMunicipio).toBe('Guatapé');
      expect(idFactura).toBe(501);
      expect(idPago).toBe(801);
    });

    test('ignora reservas canceladas o anuladas al validar cruces', async () => {
      montar({ cruces: [{ Estado: 'Cancelada' }, { Estado: 'anulado' }] });
      const { error } = await crearReserva(dto);
      expect(error).toBeNull();
    });

    test('rechaza fechas que se cruzan con otra reserva activa', async () => {
      montar({ cruces: [{ Estado: 'Activa' }] });
      const { data, error } = await crearReserva(dto);
      expect(data).toBeNull();
      expect(error).toBe('La finca ya tiene una reserva en las fechas seleccionadas.');
    });

    test('rechaza más huéspedes que la capacidad', async () => {
      montar({ capacidad: 3 });
      const { error } = await crearReserva(dto);
      expect(error).toBe('El número de huéspedes (4) supera la capacidad de la finca (3).');
    });

    test('rechaza salida anterior o igual a la entrada', async () => {
      const { error } = await crearReserva({ ...dto, FechaSalida: '2026-10-10' });
      expect(error).toBe('La fecha de salida debe ser posterior a la fecha de entrada.');
      expect(supabase.from).not.toHaveBeenCalled();
    });

    test('revierte la reserva si el pago falla', async () => {
      const { rollback } = montar({ pago: { data: null, error: { message: 'pago rechazado' } } });
      const { data, error } = await crearReserva(dto);
      expect(data).toBeNull();
      expect(error).toBe('pago rechazado');
      expect(rollback.delete).toHaveBeenCalled();
      expect(rollback.eq).toHaveBeenCalledWith('IdReserva', 101);
    });
  });

  // ── 3. Listar reservas ─────────────────────────────────────────────────────
  describe('listarReservas() y listarReservasPorUsuario()', () => {
    test('debe listar todas las reservas para panel de Administrador', async () => {
      const mockReservas = [
        {
          IdReserva: 1,
          IdFinca: 1,
          NumeroDocumentoUsuario: 2,
          FechaReserva: '2026-10-01',
          FechaEntrada: '2026-10-05',
          FechaSalida: '2026-10-07',
          Estado: 'Confirmada',
          MontoReserva: 1700000,
          NombreFinca: 'Finca Campestre El Paraíso',
          NombreMunicipio: 'Guatapé',
          NombreCliente: 'Juan',
          ApellidoCliente: 'Pérez',
        },
      ];

      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: mockReservas,
        error: null,
      });

      const { data, error } = await listarReservas();

      expect(supabase.rpc).toHaveBeenCalledWith('SP_ListarReservas');
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
      expect(data?.[0].NombreFinca).toBe('Finca Campestre El Paraíso');
    });

    test('debe listar las reservas de un usuario específico', async () => {
      const mockReservas = [
        {
          IdReserva: 10,
          IdFinca: 2,
          NumeroDocumentoUsuario: 3,
          FechaReserva: '2026-10-02',
          FechaEntrada: '2026-10-15',
          FechaSalida: '2026-10-18',
          Estado: 'Confirmada',
          MontoReserva: 3600000,
          NombreFinca: 'Villa Los Samanes',
          NombreMunicipio: 'Santa Fe de Antioquia',
          NombreCliente: 'Cliente',
          ApellidoCliente: 'Demo',
        },
      ];

      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: mockReservas,
        error: null,
      });

      const { data, error } = await listarReservasPorUsuario(3);

      expect(supabase.rpc).toHaveBeenCalledWith('SP_ListarReservasPorUsuario', {
        p_NumeroDocumentoUsuario: 3,
      });
      expect(error).toBeNull();
      expect(data).toHaveLength(1);
    });
  });

  // ── 4. Actualizar estado de reserva ────────────────────────────────────────
  describe('actualizarEstadoReserva()', () => {
    test('debe actualizar el estado de una reserva exitosamente', async () => {
      const mockFrom = {
        update: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const { success, error } = await actualizarEstadoReserva(101, 'Cancelada');

      expect(supabase.from).toHaveBeenCalledWith('Reserva');
      expect(mockFrom.update).toHaveBeenCalledWith({ Estado: 'Cancelada' });
      expect(mockFrom.eq).toHaveBeenCalledWith('IdReserva', 101);
      expect(success).toBe(true);
      expect(error).toBeNull();
    });
  });
});

