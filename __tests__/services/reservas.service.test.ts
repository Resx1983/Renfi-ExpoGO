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
    test('debe insertar la reserva, generar factura y registrar el pago exitosamente', async () => {
      const dto = {
        IdFinca: 1,
        NumeroDocumentoUsuario: 2,
        FechaEntrada: '2026-10-10T12:00:00Z',
        FechaSalida: '2026-10-12T12:00:00Z',
        MontoReserva: 1700000,
        IdMetodoDePago: 4,
        Estado: 'Confirmada' as const,
      };

      const mockReservaDB = {
        IdReserva: 101,
        IdFinca: 1,
        NumeroDocumentoUsuario: 2,
        FechaReserva: '2026-10-06T18:00:00Z',
        FechaEntrada: '2026-10-10T12:00:00Z',
        FechaSalida: '2026-10-12T12:00:00Z',
        Estado: 'Confirmada',
        MontoReserva: 1700000,
        Finca: {
          NombreFinca: 'Finca Campestre El Paraíso',
          IdMunicipio: 2,
          Municipio: { NombreMunicipio: 'Guatapé' },
        },
        Usuario: {
          NombreUsuario: 'Cliente',
          ApellidoUsuario: 'Demo',
        },
      };

      // Mock de supabase.from('Reserva')
      const mockReservaQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: mockReservaDB, error: null }),
      };

      // Mock de supabase.from('Factura')
      const mockFacturaQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { IdFactura: 501 }, error: null }),
      };

      // Mock de supabase.from('Pago')
      const mockPagoQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({ data: { IdPago: 801 }, error: null }),
      };

      (supabase.from as jest.Mock).mockImplementation((tabla: string) => {
        if (tabla === 'Reserva') return mockReservaQuery;
        if (tabla === 'Factura') return mockFacturaQuery;
        if (tabla === 'Pago') return mockPagoQuery;
        return {};
      });

      const { data, idFactura, idPago, error } = await crearReserva(dto);

      expect(error).toBeNull();
      expect(data?.IdReserva).toBe(101);
      expect(data?.NombreFinca).toBe('Finca Campestre El Paraíso');
      expect(data?.NombreMunicipio).toBe('Guatapé');
      expect(idFactura).toBe(501);
      expect(idPago).toBe(801);
    });

    test('debe retornar error si la inserción de la reserva falla', async () => {
      const mockReservaQuery = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: null,
          error: { message: 'Capacidad excedida' },
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockReservaQuery);

      const { data, error } = await crearReserva({
        IdFinca: 1,
        NumeroDocumentoUsuario: 2,
        FechaEntrada: '2026-10-10',
        FechaSalida: '2026-10-12',
        MontoReserva: 1700000,
        IdMetodoDePago: 1,
      });

      expect(data).toBeNull();
      expect(error).toBe('Capacidad excedida');
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

