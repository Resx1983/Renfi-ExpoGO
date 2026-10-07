import {
  listarFincas,
  listarFincasDisponibles,
  obtenerFincaPorId,
  listarMunicipios,
  crearFinca,
  modificarFinca,
  eliminarFinca,
  cambiarEstadoFinca,
} from '../../src/services/fincas.service';
import { supabase } from '../../src/services/supabase';

// Mock de la instancia de Supabase
jest.mock('../../src/services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

describe('Fincas Service (con Mocks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockFincaRpc = {
    IdFinca: 1,
    NombreFinca: 'Finca Campestre El Paraíso',
    Direccion: 'Km 5 Guatapé',
    InformacionAdicional: 'Hermosa finca colonial',
    Capacidad: 16,
    Precio: 850000,
    Estado: 'Disponible',
    Calificacion: 5,
    IdMunicipio: 2,
    NombreMunicipio: 'Guatapé',
    IdPropietario: 1,
    NombrePropietario: 'Admin',
    ApellidoPropietario: 'Renfi',
    TelefonoPropietario: '3001234567',
    CorreoPropietario: 'admin@renfi.com',
  };

  describe('listarFincas', () => {
    test('debe listar fincas usando el procedimiento almacenado SP_ListarFincas (RPC)', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: [mockFincaRpc],
        error: null,
      });

      const res = await listarFincas();

      expect(supabase.rpc).toHaveBeenCalledWith('SP_ListarFincas');
      expect(res.error).toBeNull();
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].NombreFinca).toBe('Finca Campestre El Paraíso');
      expect(res.data?.[0].NombreMunicipio).toBe('Guatapé');
    });

    test('debe realizar fallback a la tabla Finca con relaciones si el RPC no existe', async () => {
      // 1. RPC no encontrado
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST202', message: 'Function not found' },
      });

      // 2. Fallback a tabla
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        order: jest.fn().mockResolvedValueOnce({
          data: [
            {
              IdFinca: 2,
              NombreFinca: 'Villa Los Samanes',
              Direccion: 'Santa Fe',
              InformacionAdicional: 'Clima cálido',
              Capacidad: 20,
              Precio: 1200000,
              Estado: 'Disponible',
              Calificacion: 5,
              IdMunicipio: 3,
              Municipio: { IdMunicipio: 3, NombreMunicipio: 'Santa Fe de Antioquia' },
              NumeroDocumentoUsuario: 1,
              Usuario: {
                NumeroDocumento: 1,
                NombreUsuario: 'Admin',
                ApellidoUsuario: 'Renfi',
                Telefono: '3001234567',
                Correo: 'admin@renfi.com',
              },
              Imagenes: [
                { IdImagen: 1, UrlImagen: 'https://ejemplo.com/finca2.jpg', IdFinca: 2 },
              ],
            },
          ],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockChain);

      const res = await listarFincas();

      expect(res.error).toBeNull();
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].NombreFinca).toBe('Villa Los Samanes');
      expect(res.data?.[0].NombreMunicipio).toBe('Santa Fe de Antioquia');
      expect(res.data?.[0].Imagenes).toHaveLength(1);
    });

    test('debe devolver mensaje explicativo ante error de permisos 42501', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: '42501', message: 'permission denied for table Finca' },
      });

      const res = await listarFincas();

      expect(res.data).toBeNull();
      expect(res.error).toContain('Permisos denegados en Supabase (42501)');
    });
  });

  describe('listarFincasDisponibles', () => {
    test('debe filtrar y devolver únicamente las fincas con Estado = Disponible', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: [
          { ...mockFincaRpc, IdFinca: 1, Estado: 'Disponible' },
          { ...mockFincaRpc, IdFinca: 2, Estado: 'Ocupada' },
          { ...mockFincaRpc, IdFinca: 3, Estado: 'Mantenimiento' },
        ],
        error: null,
      });

      const res = await listarFincasDisponibles();

      expect(res.error).toBeNull();
      expect(res.data).toHaveLength(1);
      expect(res.data?.[0].IdFinca).toBe(1);
    });
  });

  describe('obtenerFincaPorId', () => {
    test('debe obtener los detalles de una finca por su identificador', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValueOnce({
          data: {
            IdFinca: 1,
            NombreFinca: 'Finca Campestre El Paraíso',
            Precio: 850000,
            Capacidad: 16,
            Estado: 'Disponible',
            Calificacion: 5,
            Municipio: { NombreMunicipio: 'Guatapé' },
          },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockChain);

      const res = await obtenerFincaPorId(1);

      expect(res.error).toBeNull();
      expect(res.data?.IdFinca).toBe(1);
      expect(res.data?.NombreMunicipio).toBe('Guatapé');
    });

    test('debe retornar error si la finca no existe', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValueOnce({
          data: null,
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockChain);

      const res = await obtenerFincaPorId(999);

      expect(res.data).toBeNull();
      expect(res.error).toBe('Finca no encontrada.');
    });
  });

  describe('listarMunicipios', () => {
    test('debe listar los municipios registrados', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: [
          { IdMunicipio: 1, NombreMunicipio: 'Medellín' },
          { IdMunicipio: 2, NombreMunicipio: 'Guatapé' },
        ],
        error: null,
      });

      const res = await listarMunicipios();

      expect(res.error).toBeNull();
      expect(res.data).toHaveLength(2);
      expect(res.data?.[1].NombreMunicipio).toBe('Guatapé');
    });
  });

  describe('crearFinca()', () => {
    test('debe crear una finca vía RPC e insertar imagen asociada', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: 77,
        error: null,
      });

      const mockFrom = {
        insert: jest.fn().mockResolvedValueOnce({ error: null }),
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValueOnce({
          data: {
            IdFinca: 77,
            NombreFinca: 'Finca Nueva',
            Capacidad: 10,
            Precio: 500000,
            Estado: 'Disponible',
          },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const res = await crearFinca({
        NombreFinca: 'Finca Nueva',
        IdMunicipio: 2,
        Capacidad: 10,
        Precio: 500000,
        UrlImagen: 'https://images.unsplash.com/test.jpg',
      });

      expect(supabase.rpc).toHaveBeenCalledWith(
        'SP_InsertarFinca',
        expect.objectContaining({ p_NombreFinca: 'Finca Nueva' })
      );
      expect(supabase.from).toHaveBeenCalledWith('Imagen');
      expect(res.error).toBeNull();
      expect(res.data?.IdFinca).toBe(77);
    });
  });

  describe('modificarFinca() y cambiarEstadoFinca()', () => {
    test('debe modificar atributos de la finca y actualizar su estado', async () => {
      const mockUpdateQuery = {
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockSelectQuery = {
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              IdFinca: 1,
              NombreFinca: 'Finca Modificada',
              Estado: 'Ocupada',
              Precio: 500000,
              Capacidad: 10,
              Municipio: { NombreMunicipio: 'Guatapé' },
              Usuario: {
                Nombre: 'Admin',
                Apellido: 'Renfi',
                Telefono: '3001234567',
                CorreoElectronico: 'admin@renfi.com',
              },
              Imagen: [],
            },
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'Finca') {
          return {
            update: jest.fn().mockReturnValue(mockUpdateQuery),
            select: jest.fn().mockReturnValue(mockSelectQuery),
          };
        }
        return {};
      });

      const res = await cambiarEstadoFinca(1, 'Ocupada');

      expect(supabase.from).toHaveBeenCalledWith('Finca');
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('IdFinca', 1);
      expect(res.error).toBeNull();
      expect(res.data?.Estado).toBe('Ocupada');
    });

    test('debe modificar los datos de una finca mediante modificarFinca', async () => {
      const mockUpdateQuery = {
        eq: jest.fn().mockResolvedValue({ error: null }),
      };
      const mockSelectQuery = {
        eq: jest.fn().mockReturnValue({
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              IdFinca: 2,
              NombreFinca: 'Finca Actualizada',
              Estado: 'Disponible',
              Precio: 650000,
              Capacidad: 12,
              Municipio: { NombreMunicipio: 'Medellín' },
              Usuario: { Nombre: 'Dueño' },
              Imagen: [],
            },
            error: null,
          }),
        }),
      };

      (supabase.from as jest.Mock).mockImplementation((table: string) => {
        if (table === 'Finca') {
          return {
            update: jest.fn().mockReturnValue(mockUpdateQuery),
            select: jest.fn().mockReturnValue(mockSelectQuery),
          };
        }
        return {};
      });

      const res = await modificarFinca(2, {
        NombreFinca: 'Finca Actualizada',
        Precio: 650000,
        Capacidad: 12,
      });

      expect(supabase.from).toHaveBeenCalledWith('Finca');
      expect(mockUpdateQuery.eq).toHaveBeenCalledWith('IdFinca', 2);
      expect(res.error).toBeNull();
      expect(res.data?.NombreFinca).toBe('Finca Actualizada');
      expect(res.data?.Precio).toBe(650000);
    });
  });

  describe('eliminarFinca()', () => {
    test('debe eliminar la finca por ID', async () => {
      const mockFrom = {
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockResolvedValueOnce({ error: null }),
      };
      (supabase.from as jest.Mock).mockReturnValue(mockFrom);

      const res = await eliminarFinca(1);

      expect(supabase.from).toHaveBeenCalledWith('Finca');
      expect(mockFrom.delete).toHaveBeenCalled();
      expect(mockFrom.eq).toHaveBeenCalledWith('IdFinca', 1);
      expect(res.success).toBe(true);
      expect(res.error).toBeNull();
    });
  });
});

