import { iniciarSesion, registrarUsuario, correoExiste } from '../../src/services/auth.service';
import { supabase } from '../../src/services/supabase';

// Mock de la instancia de Supabase
jest.mock('../../src/services/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(),
  },
}));

describe('Auth Service (con Mocks)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('iniciarSesion', () => {
    test('debe iniciar sesión exitosamente usando el procedimiento almacenado SP_IniciarSesion (RPC)', async () => {
      const mockUsuario = {
        NumeroDocumento: 1,
        IdRol: 1,
        NombreUsuario: 'Admin',
        ApellidoUsuario: 'Renfi',
        Telefono: '3001234567',
        Correo: 'admin@renfi.com',
        Estado: 'Activo',
        NombreRol: 'Administrador',
      };

      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: [mockUsuario],
        error: null,
      });

      const res = await iniciarSesion('admin@renfi.com', 'admin123');

      expect(supabase.rpc).toHaveBeenCalledWith('SP_IniciarSesion', {
        p_Correo: 'admin@renfi.com',
        p_Contrasena: 'admin123',
      });
      expect(res.error).toBeNull();
      expect(res.data).toEqual(mockUsuario);
    });

    test('debe rechazar credenciales si el SP no devuelve registros', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: [],
        error: null,
      });

      const res = await iniciarSesion('desconocido@renfi.com', 'claveErronea');

      expect(res.data).toBeNull();
      expect(res.error).toContain('incorrectos');
    });

    test('debe hacer fallback a la tabla Usuario si el RPC no existe (PGRST202)', async () => {
      // 1. RPC falla porque no existe la función
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST202', message: 'Function not found' },
      });

      // 2. Consulta a tabla directa responde con el usuario
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValueOnce({
          data: {
            NumeroDocumento: 2,
            IdRol: 2,
            NombreUsuario: 'Juan',
            ApellidoUsuario: 'Pérez',
            Telefono: '3109876543',
            Correo: 'juan.perez@example.com',
            Estado: 'Activo',
            Rol: { IdRol: 2, NombreRol: 'Cliente' },
          },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockChain);

      const res = await iniciarSesion('juan.perez@example.com', 'cliente123');

      expect(res.error).toBeNull();
      expect(res.data?.NombreUsuario).toBe('Juan');
      expect(res.data?.NombreRol).toBe('Cliente');
    });

    test('debe informar claramente si hay un error de permisos 42501', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: '42501', message: 'permission denied for table Usuario' },
      });

      const res = await iniciarSesion('alguien@test.com', '123');

      expect(res.data).toBeNull();
      expect(res.error).toContain('Permisos denegados en Supabase (42501)');
    });
  });

  describe('registrarUsuario', () => {
    test('debe registrar un usuario con éxito vía RPC', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: 1005,
        error: null,
      });

      const res = await registrarUsuario({
        nombre: 'Nuevo',
        apellido: 'Usuario',
        telefono: '3000000000',
        correo: 'nuevo@correo.com',
        contrasena: 'claveSegura1',
        idRol: 2,
      });

      expect(supabase.rpc).toHaveBeenCalledWith('SP_RegistrarUsuario', {
        p_IdRol: 2,
        p_NombreUsuario: 'Nuevo',
        p_ApellidoUsuario: 'Usuario',
        p_Telefono: '3000000000',
        p_Correo: 'nuevo@correo.com',
        p_Contrasena: 'claveSegura1',
        p_Estado: 'Activo',
      });
      expect(res.error).toBeNull();
      expect(res.numeroDocumento).toBe(1005);
    });

    test('debe detectar correo duplicado y advertir al usuario', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint' },
      });

      const res = await registrarUsuario({
        nombre: 'Pedro',
        apellido: 'Gómez',
        telefono: '3111111111',
        correo: 'yaexiste@correo.com',
        contrasena: 'pass123',
      });

      expect(res.numeroDocumento).toBeNull();
      expect(res.error).toContain('ya está registrado');
    });

    test('debe hacer fallback a inserción directa si el RPC falla con PGRST202', async () => {
      (supabase.rpc as jest.Mock).mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST202', message: 'Function not found' },
      });

      const mockInsertChain = {
        insert: jest.fn().mockReturnThis(),
        select: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValueOnce({
          data: { NumeroDocumento: 777 },
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockInsertChain);

      const res = await registrarUsuario({
        nombre: 'Maria',
        apellido: 'Lopez',
        telefono: '3200000000',
        correo: 'maria@test.com',
        contrasena: 'pass123',
      });

      expect(res.error).toBeNull();
      expect(res.numeroDocumento).toBe(777);
    });
  });

  describe('correoExiste', () => {
    test('debe retornar true si el correo ya existe en la base de datos', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce({
          data: [{ Correo: 'existente@test.com' }],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockChain);

      const existe = await correoExiste('existente@test.com');
      expect(existe).toBe(true);
    });

    test('debe retornar false si el correo no existe o hay error', async () => {
      const mockChain = {
        select: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValueOnce({
          data: [],
          error: null,
        }),
      };
      (supabase.from as jest.Mock).mockReturnValueOnce(mockChain);

      const existe = await correoExiste('noexiste@test.com');
      expect(existe).toBe(false);
    });
  });
});

